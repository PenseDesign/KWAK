'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Passage, Tournee, ClientMission } from '@/lib/types/database'

export async function getAgentTournee(agentId: string) {
  const supabase = await createClient()

  // 1. Trouver la tournée du jour pour cet agent
  const today = new Date().toISOString().split('T')[0]
  
  const { data: tournee, error: tourneeError } = await supabase
    .from('tournees')
    .select('*')
    .eq('agent_id', agentId)
    .eq('date', today)
    .single()

  if (tourneeError || !tournee) {
    // Si pas de tournée, pour l'exemple, on retourne un tableau vide
    return { success: true, missions: [] }
  }

  // 2. Récupérer les passages de cette tournée
  const { data: passages, error: passagesError } = await supabase
    .from('passages')
    .select(`
      id,
      status,
      client_id,
      profiles:client_id (
        id,
        phone,
        repere_textuel,
        photo_facade_url,
        coords_gps
      )
    `)
    .eq('tournee_id', tournee.id)

  if (passagesError) {
    return { success: false, error: passagesError.message }
  }

  // 3. Formater pour le frontend
  const missions: ClientMission[] = passages.map((p: any) => ({
    passage_id: p.id,
    passage_status: p.status,
    id: p.profiles.id,
    phone: p.profiles.phone,
    role: 'client',
    repere_textuel: p.profiles.repere_textuel,
    photo_facade_url: p.profiles.photo_facade_url,
    coords_gps: p.profiles.coords_gps,
  }))

  return { success: true, tournee, missions }
}

export async function validatePassage(passageId: string, status: Passage['status'], photoBase64?: string) {
  const supabase = await createClient()

  let photoUrl = null

  // Si on a une photo base64 (offline sync ou directe), on l'upload sur Supabase Storage
  if (photoBase64 && photoBase64.startsWith('data:image')) {
    const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, 'base64')
    const fileName = `preuves/${passageId}-${Date.now()}.jpg`
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('kwak_bucket')
      .upload(fileName, buffer, { contentType: 'image/jpeg' })

    if (!uploadError && uploadData) {
      const { data: publicUrlData } = supabase.storage.from('kwak_bucket').getPublicUrl(fileName)
      photoUrl = publicUrlData.publicUrl
    }
  }

  const { error } = await supabase
    .from('passages')
    .update({ 
      status, 
      photo_preuve_url: photoUrl,
      heure_passage: new Date().toISOString()
    })
    .eq('id', passageId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/agent')
  revalidatePath('/admin')
  
  return { success: true }
}

export async function syncOfflineData(passagesToSync: Array<{ id: string, status: Passage['status'], photo?: string }>) {
  let successCount = 0
  let failCount = 0

  for (const p of passagesToSync) {
    const res = await validatePassage(p.id, p.status, p.photo)
    if (res.success) successCount++
    else failCount++
  }

  return { success: true, synced: successCount, failed: failCount }
}

export async function getClientStatus(clientId: string) {
  const supabase = await createClient()

  const { data: abonnement } = await supabase
    .from('abonnements')
    .select('*')
    .eq('client_id', clientId)
    .single()

  // Chercher le prochain passage prévu
  const { data: nextPassage } = await supabase
    .from('passages')
    .select('*, tournees(date)')
    .eq('client_id', clientId)
    .eq('status', 'en_attente')
    .order('tournees(date)', { ascending: true })
    .limit(1)
    .single()

  return { 
    abonnement, 
    nextPassageDate: nextPassage?.tournees?.date || null 
  }
}

export async function reportIssue(clientId: string, message: string) {
  // Action factice pour l'exemple
  console.log(`Issue reported by ${clientId}: ${message}`)
  return { success: true }
}

export async function getAdminStats() {
  const supabase = await createClient()
  
  const { count: totalTournees } = await supabase
    .from('tournees')
    .select('*', { count: 'exact', head: true })
    .eq('date', new Date().toISOString().split('T')[0])
    
  const { count: activeAbonnements } = await supabase
    .from('abonnements')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'actif')

  const { count: totalCollectes } = await supabase
    .from('passages')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'valide')

  return {
    tourneesDuJour: totalTournees || 0,
    abonnementsActifs: activeAbonnements || 0,
    totalCollectes: totalCollectes || 0,
    revenusEstimes: (activeAbonnements || 0) * 5000, // Exemple: 5000 FCFA par abonnement
    agentsEnLigne: 5,
  }
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Récupérer le rôle pour savoir où rediriger
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') redirect('/admin')
    if (profile?.role === 'agent') redirect('/agent')
    if (profile?.role === 'pending_agent') redirect('/pending')
  }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string // 'client' ou 'pending_agent'
  const phone = formData.get('phone') as string
  
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) return { success: false, error: error.message }

  if (data.user) {
    // Créer le profil avec le bon rôle et le numéro de téléphone
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role, phone }) 
      .eq('id', data.user.id)

    if (profileError) console.error("Error updating profile:", profileError)
  }

  return { success: true }
}

export async function getPendingAgents() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'pending_agent')

  return { success: !error, agents: data || [] }
}

export async function approveAgent(agentId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'agent' })
    .eq('id', agentId)

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/admin')
  return { success: true }
}
