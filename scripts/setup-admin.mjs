/**
 * Script de diagnostic KWAK — Vérifie la connexion Supabase et crée un admin
 * Usage: node scripts/setup-admin.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://atmrigwfpxuiqybfluhz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0bXJpZ3dmcHh1aXF5YmZsdWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1Nzg5NDYsImV4cCI6MjA5NDE1NDk0Nn0.IEsU1U5y82-VjEYiytCH2IVF2lFWFAQmZcHG3L58r5A'

const ADMIN_EMAIL = 'groupelpcinfo@gmail.com'
const ADMIN_PASSWORD = 'EpLe2002@'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function main() {
  console.log('\n🔍 KWAK — Diagnostic & Setup\n')

  // 1. Test de connectivité basique
  console.log('1️⃣  Test de connexion Supabase...')
  const { data: testData, error: testError } = await supabase
    .from('profiles')
    .select('count', { count: 'exact', head: true })

  if (testError) {
    console.error('❌ Erreur connexion Supabase:', testError.message)
    console.error('   Code:', testError.code)
    console.log('\n   ➡️  Vérifiez que la table "profiles" existe et que les migrations ont été exécutées.')
    process.exit(1)
  } else {
    console.log('✅ Connexion Supabase OK')
  }

  // 2. Vérifier si l'utilisateur existe déjà
  console.log('\n2️⃣  Tentative de connexion avec le compte admin...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  })

  let userId = null

  if (signInError) {
    console.log(`   ⚠️  Connexion échouée (${signInError.message}), tentative d'inscription...`)

    // 3. Créer le compte
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    })

    if (signUpError) {
      console.error('❌ Impossible de créer le compte:', signUpError.message)
      process.exit(1)
    }

    userId = signUpData.user?.id
    console.log(`✅ Compte créé — ID: ${userId}`)

    // Attendre un peu pour le trigger
    await new Promise(r => setTimeout(r, 1500))
  } else {
    userId = signInData.user?.id
    console.log(`✅ Connexion réussie — ID: ${userId}`)
  }

  if (!userId) {
    console.error('❌ Impossible de récupérer l\'ID utilisateur')
    process.exit(1)
  }

  // 4. Vérifier le profil existant
  console.log('\n3️⃣  Vérification du profil dans la table "profiles"...')
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError) {
    console.log(`   ⚠️  Profil non trouvé (${profileError.message})`)
    console.log('   ➡️  Création du profil admin...')

    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ id: userId, role: 'admin', phone: '600000000' })

    if (insertError) {
      console.error('❌ Impossible de créer le profil:', insertError.message)
      console.log('\n   ℹ️  Essayez d\'exécuter manuellement dans Supabase SQL Editor:')
      console.log(`   INSERT INTO profiles (id, role) VALUES ('${userId}', 'admin') ON CONFLICT (id) DO UPDATE SET role = 'admin';`)
    } else {
      console.log('✅ Profil admin créé !')
    }
  } else {
    console.log(`   Profil trouvé — Rôle actuel: "${profile.role}"`)

    if (profile.role !== 'admin') {
      console.log('   ➡️  Mise à jour du rôle vers "admin"...')
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId)

      if (updateError) {
        console.error('❌ Impossible de mettre à jour le rôle:', updateError.message)
        console.log('\n   ℹ️  Essayez manuellement dans Supabase SQL Editor:')
        console.log(`   UPDATE profiles SET role = 'admin' WHERE id = '${userId}';`)
      } else {
        console.log('✅ Rôle mis à jour vers "admin" !')
      }
    } else {
      console.log('✅ Le compte est déjà admin !')
    }
  }

  // 5. Vérification finale
  console.log('\n4️⃣  Vérification finale...')
  const { data: finalProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (finalProfile?.role === 'admin') {
    console.log('🎉 SUCCÈS ! Le compte admin est opérationnel.')
    console.log(`\n   📧 Email:    ${ADMIN_EMAIL}`)
    console.log(`   🔑 Password: ${ADMIN_PASSWORD}`)
    console.log(`   👤 Role:     ${finalProfile.role}`)
    console.log(`   🆔 ID:       ${userId}`)
    console.log('\n   ➡️  Connectez-vous sur http://localhost:3000/login')
  } else {
    console.error('❌ Le profil n\'a pas le rôle admin. Vérifiez les RLS policies dans Supabase.')
    console.log('\n   SQL à exécuter dans Supabase SQL Editor:')
    console.log(`   UPDATE profiles SET role = 'admin' WHERE id = '${userId}';`)
  }
}

main().catch(console.error)
