#!/usr/bin/env node

/**
 * Script de vérification - Intégration Campay
 * Usage: node scripts/verify-campay-setup.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

console.log('\n🔍 Vérification de l\'intégration Campay...\n')

// 1. Vérifier les fichiers essentiels
console.log('📁 Vérification des fichiers créés...')
const requiredFiles = [
  'src/app/api/campay/initiate-payment/route.ts',
  'src/app/api/campay/payment-webhook/route.ts',
  'src/components/payment/MobileMoneyPaymentForm.tsx',
  'src/lib/campay/api.ts',
  'supabase/migrations/20260604_payment_transactions.sql',
  '.env.local',
  '.env.example',
]

let filesOk = true
for (const file of requiredFiles) {
  const filePath = path.join(rootDir, file)
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`)
  } else {
    console.log(`❌ ${file} - MANQUANT`)
    filesOk = false
  }
}

// 2. Vérifier les variables d'environnement
console.log('\n🔐 Vérification des variables d\'environnement...')
const envPath = path.join(rootDir, '.env.local')

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  const envVars = ['CAMPAY_APP_KEY', 'CAMPAY_SECRET_KEY', 'CAMPAY_URL']

  const envConfigured = envVars.find((v) => envContent.includes(`${v}=`) && !envContent.includes(`${v}=YOUR_`))

  for (const envVar of envVars) {
    if (envContent.includes(envVar)) {
      const isConfigured = !envContent.includes(`${envVar}=YOUR_`)
      if (isConfigured) {
        console.log(`✅ ${envVar} - Configuré`)
      } else {
        console.log(`⚠️  ${envVar} - À CONFIGURER avec vos clés de test`)
      }
    } else {
      console.log(`⚠️  ${envVar} - Non trouvé dans .env.local`)
    }
  }
} else {
  console.log('❌ .env.local - MANQUANT')
}

// 3. Vérifier la structure des types
console.log('\n🏗️  Vérification des types TypeScript...')
const typesFile = path.join(rootDir, 'src/lib/types/database.ts')
if (fs.existsSync(typesFile)) {
  const content = fs.readFileSync(typesFile, 'utf-8')
  if (content.includes('PaymentTransaction')) {
    console.log('✅ Type PaymentTransaction défini')
  } else {
    console.log('❌ Type PaymentTransaction - NON DÉFINI')
  }
}

// 4. Afficher les endpoints API créés
console.log('\n🛣️  Endpoints API disponibles:')
console.log('  POST /api/campay/initiate-payment')
console.log('  POST /api/campay/payment-webhook')

// 5. Prochaines étapes
console.log('\n📋 Prochaines étapes:\n')
console.log('1. ✋ Obtenez vos clés de test Campay:')
console.log('   → Visitez https://campay.net/dashboard')
console.log('   → Allez à Settings → API Keys\n')

console.log('2. 🔑 Configurez les variables d\'environnement dans .env.local:')
console.log('   CAMPAY_APP_KEY=<votre_app_key>')
console.log('   CAMPAY_SECRET_KEY=<votre_secret_key>\n')

console.log('3. 🚀 Démarrez le serveur de développement:')
console.log('   npm run dev\n')

console.log('4. 🌐 Configurez le webhook Campay:')
console.log('   → Utilisez ngrok pour exposer votre app')
console.log('   → URL Webhook: https://your-ngrok-url.ngrok.io/api/campay/payment-webhook\n')

console.log('5. 🧪 Testez le formulaire de paiement (exemple):')
console.log('   Rendez-vous sur: http://localhost:3000 et cherchez le composant MobileMoneyPaymentForm\n')

console.log('📚 Documentation: docs/CAMPAY_INTEGRATION.md\n')

// Résumé final
console.log('═'.repeat(50))
if (filesOk && envContent?.includes('CAMPAY')) {
  console.log('✅ La structure de base est prête!')
  console.log('   Remplacez les clés de test pour commencer.\n')
} else {
  console.log('⚠️  Corrigez les erreurs ci-dessus avant de démarrer.\n')
}
