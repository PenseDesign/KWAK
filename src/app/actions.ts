'use server'

import { createClient } from '../lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Passage, Tournee, ClientMission } from '../lib/types/database'

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
    .select('date_prevue')
    .eq('client_id', clientId)
    .eq('status', 'en_attente')
    .order('date_prevue', { ascending: true })
    .limit(1)
    .single()

  // Récupérer l'historique des passages validés
  const { data: historique } = await supabase
    .from('passages')
    .select('*')
    .eq('client_id', clientId)
    .eq('status', 'valide')
    .order('heure_passage', { ascending: false })
    .limit(5)

  // Récupérer le profil pour vérifier si l'adresse est remplie
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', clientId)
    .single()

  return { 
    abonnement, 
    profile,
    nextPassageDate: nextPassage?.date_prevue || null,
    historique: historique || []
  }
}

export async function reportIssue(clientId: string, message: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('signalements')
    .insert({
      client_id: clientId,
      message,
      status: 'ouvert',
    })

  if (error) return { success: false, error: error.message }
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
  const login = formData.get('login') as string // Peut être email ou téléphone
  const password = formData.get('password') as string
  const supabase = await createClient()

  let authParams: any = { password }
  if (login.includes('@')) {
    authParams.email = login
  } else {
    authParams.phone = login
  }

  const { data, error } = await supabase.auth.signInWithPassword(authParams)

  if (error) {
    return { success: false, error: error.message }
  }

  const user = data.user
  if (user) {
    // Lire le rôle via la fonction RPC (contourne la récursion RLS)
    const { data: role, error: rpcError } = await supabase.rpc('get_user_role')

    // Si le rôle n'est pas défini (profil manquant), créer le profil
    if (rpcError || !role) {
      await supabase.from('profiles').insert({ id: user.id, role: 'client' }).select().single()
    }

    if (role === 'admin') redirect('/admin')
    if (role === 'agent') redirect('/agent')
    if (role === 'pending_agent') redirect('/agent/pending')
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
      .upsert({ id: data.user.id, role, phone }) 

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

export async function getPendingAbonnements() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('demandes_abonnement')
    .select('*, profiles:client_id(id, phone, repere_textuel)')
    .eq('status', 'en_attente')
    .order('created_at', { ascending: false })

  return { success: !error, demandes: data || [] }
}

export async function createDemandeAbonnement(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const typeForfait = formData.get('type_forfait') as string
  const operateur = formData.get('operateur') as string
  const phonePayment = formData.get('phone_payment') as string

  // Check if already has a pending or active demand
  const { data: existing } = await supabase
    .from('demandes_abonnement')
    .select('id, status')
    .eq('client_id', user.id)
    .in('status', ['en_attente', 'actif'])
    .maybeSingle()

  if (existing) {
    return { success: false, error: 'Vous avez déjà une demande en cours ou un abonnement actif.' }
  }

  const { error } = await supabase
    .from('demandes_abonnement')
    .insert({
      client_id: user.id,
      type_forfait: typeForfait,
      operateur_paiement: operateur,
      phone_paiement: phonePayment,
      status: 'en_attente',
    })

  if (error) return { success: false, error: error.message }

  redirect('/dashboard?subscribed=pending')
}

export async function activateAbonnement(demandeId: string) {
  const supabase = await createClient()

  const { data: demande, error: fetchError } = await supabase
    .from('demandes_abonnement')
    .select('*')
    .eq('id', demandeId)
    .single()

  if (fetchError || !demande) return { success: false, error: 'Demande introuvable' }

  // Determine subscription duration
  const now = new Date()
  const dateDebut = now.toISOString().split('T')[0]
  const dateFin = new Date(now)
  if (demande.type_forfait === 'Hebdomadaire') {
    dateFin.setDate(dateFin.getDate() + 7)
  } else if (demande.type_forfait === 'Mensuel Basique' || demande.type_forfait === 'Mensuel Pro') {
    dateFin.setMonth(dateFin.getMonth() + 1)
  }

  // Determine default pickup days
  // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 0=Sun
  let joursPassage = [1, 4] // Default: Mon, Thu
  if (demande.type_forfait === 'Mensuel Pro') {
    joursPassage = [1, 3, 5] // Pro: Mon, Wed, Fri
  }

  // Upsert the abonnement
  const { error: abonnementError } = await supabase
    .from('abonnements')
    .upsert({
      client_id: demande.client_id,
      type_forfait: demande.type_forfait,
      status: 'actif',
      date_debut: dateDebut,
      date_fin: dateFin.toISOString().split('T')[0],
      jours_passage: joursPassage,
    }, { onConflict: 'client_id' })

  if (abonnementError) return { success: false, error: abonnementError.message }

  // Mark demand as activated
  await supabase
    .from('demandes_abonnement')
    .update({ status: 'actif' })
    .eq('id', demandeId)

  revalidatePath('/admin')
  return { success: true }
}

// ================================================================
// PHASE 2 ACTIONS
// ================================================================

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const repere_textuel = formData.get('repere_textuel') as string
  const phone = formData.get('phone') as string
  const lat = formData.get('lat') as string
  const lng = formData.get('lng') as string

  const updates: Record<string, unknown> = { repere_textuel, phone }
  if (lat && lng) {
    updates.coords_gps = { lat: parseFloat(lat), lng: parseFloat(lng) }
  }

  // Handle photo upload
  const photo = formData.get('photo') as File | null
  if (photo && photo.size > 0) {
    const buffer = Buffer.from(await photo.arrayBuffer())
    const fileName = `facades/${user.id}-${Date.now()}.jpg`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('kwak_bucket')
      .upload(fileName, buffer, { contentType: photo.type, upsert: true })
    if (!uploadError && uploadData) {
      const { data: publicUrlData } = supabase.storage.from('kwak_bucket').getPublicUrl(fileName)
      updates.photo_facade_url = publicUrlData.publicUrl
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/profil')
  return { success: true }
}

export async function getAgents() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, phone, repere_textuel')
    .eq('role', 'agent')
    .order('phone')

  return { success: !error, agents: data || [] }
}

export async function createTournee(formData: FormData) {
  const supabase = await createClient()
  const agentId = formData.get('agent_id') as string
  const date = formData.get('date') as string

  // 1. Créer la tournée
  const { data: tournee, error: tourneeError } = await supabase
    .from('tournees')
    .insert({ agent_id: agentId, date, statut: 'prete' })
    .select()
    .single()

  if (tourneeError || !tournee) return { success: false, error: tourneeError?.message }

  // 2. Récupérer les clients abonnés actifs dont c'est le jour de passage
  const dayOfWeek = new Date(date).getDay() // 0 (Sun) to 6 (Sat)
  
  const { data: abonnes, error: abonnesError } = await supabase
    .from('abonnements')
    .select('client_id')
    .eq('status', 'actif')
    .contains('jours_passage', [dayOfWeek])

  if (abonnesError || !abonnes?.length) {
    return { success: false, error: 'Aucun client abonné actif trouvé.' }
  }

  // 3. Générer un passage par client
  const passages = abonnes.map((a) => ({
    tournee_id: tournee.id,
    client_id: a.client_id,
    status: 'en_attente',
    date_prevue: date,
  }))

  const { error: passagesError } = await supabase
    .from('passages')
    .insert(passages)

  if (passagesError) return { success: false, error: passagesError.message }

  revalidatePath('/admin')
  return { success: true, passagesCount: passages.length }
}

export async function getSignalements() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('signalements')
    .select('*, profiles:client_id(phone, repere_textuel)')
    .eq('status', 'ouvert')
    .order('created_at', { ascending: false })

  return { success: !error, signalements: data || [] }
}

export async function resolveSignalement(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('signalements')
    .update({ status: 'traité' })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin')
  return { success: true }
}
