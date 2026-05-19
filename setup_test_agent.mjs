import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://atmrigwfpxuiqybfluhz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0bXJpZ3dmcHh1aXF5YmZsdWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1Nzg5NDYsImV4cCI6MjA5NDE1NDk0Nn0.IEsU1U5y82-VjEYiytCH2IVF2lFWFAQmZcHG3L58r5A'

const ADMIN_EMAIL = 'groupelpcinfo@gmail.com'
const ADMIN_PASSWORD = 'EpLe2002@'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function main() {
  console.log('Logging in as Admin...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  })

  if (authError) {
    console.error('Login error:', authError.message)
    return
  }

  // 1. Trouver le profil pour agent_test@example.com
  console.log('Fetching users via RPC...')
  const { data: users, error: rpcError } = await supabase.rpc('get_users_admin')
  if (rpcError || !users) {
    console.error('Error fetching users:', rpcError)
    return
  }

  const testAgentUser = users.find(u => u.email === 'agent_test@example.com')
  if (!testAgentUser) {
    console.log('\n❌ L\'utilisateur agent_test@example.com n\'a pas encore été créé.')
    console.log('➡️  Veuillez d\'abord l\'inscrire sur la page de register (/register) avec le mot de passe "EpLe2002@".\n')
    return
  }

  const agentId = testAgentUser.id
  console.log(`Found user agent_test@example.com with ID: ${agentId}`)

  // 2. Mettre à jour son profil vers le rôle 'agent'
  console.log('Updating profile role to agent, phone, and repere...')
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      role: 'agent',
      phone: '+237 688 888 888',
      repere_textuel: 'Douala, face Direction Générale'
    })
    .eq('id', agentId)

  if (profileError) {
    console.error('Error updating profile:', profileError.message)
    return
  }
  console.log('✅ Profil mis à jour !')

  // 3. Créer une tournée pour aujourd'hui
  const today = new Date().toISOString().split('T')[0]
  console.log(`Creating tournee for date ${today}...`)
  
  // Vider les anciennes tournees pour cet agent aujourd'hui
  const { data: oldTournees } = await supabase.from('tournees').select('id').eq('agent_id', agentId).eq('date', today)
  if (oldTournees && oldTournees.length > 0) {
    const ids = oldTournees.map(t => t.id)
    await supabase.from('passages').delete().in('tournee_id', ids)
    await supabase.from('tournees').delete().in('id', ids)
  }

  const { data: tournee, error: tourneeError } = await supabase
    .from('tournees')
    .insert({
      agent_id: agentId,
      date: today,
      statut: 'prete'
    })
    .select()
    .single()

  if (tourneeError || !tournee) {
    console.error('Error creating tournee:', tourneeError)
    return
  }
  console.log('✅ Tournée créée avec ID:', tournee.id)

  // 4. Insérer des passages (missions de collectes) pour la simulation
  // On utilise les clients existants dans les profils
  const clientIds = users.filter(u => u.role === 'client').map(u => u.id)
  if (clientIds.length === 0) {
    console.warn('⚠️ Aucun client existant trouvé pour ajouter à la tournée.')
    return
  }

  const passagesToInsert = clientIds.slice(0, 2).map(clientId => ({
    tournee_id: tournee.id,
    client_id: clientId,
    status: 'en_attente',
    date_prevue: today
  }))

  console.log(`Inserting ${passagesToInsert.length} passages...`)
  const { data: insertedPassages, error: passagesError } = await supabase
    .from('passages')
    .insert(passagesToInsert)
    .select()

  if (passagesError) {
    console.error('Error inserting passages:', passagesError)
    return
  }
  console.log('✅ Passages créés avec succès !')
  console.log(JSON.stringify(insertedPassages, null, 2))
  console.log('\n🎉 Simulation prête ! Connectez-vous avec agent_test@example.com sur http://localhost:3000/login.')
}

main().catch(console.error)
