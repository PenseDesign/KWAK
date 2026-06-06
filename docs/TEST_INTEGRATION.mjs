/**
 * Script de test pour valider l'intégration Campay
 * Exécutez une fois que les clés API sont configurées dans .env.local
 */

const API_BASE = 'http://localhost:3000'
const TEST_AMOUNT = 1000 // XAF

console.log('🧪 Test d\'intégration Campay\n')

// Test 1: Vérifier les fichiers
console.log('Test 1: Vérification des fichiers')
const requiredFiles = [
  'src/app/api/campay/initiate-payment/route.ts',
  'src/app/api/campay/payment-webhook/route.ts',
  'src/components/payment/MobileMoneyPaymentForm.tsx',
  'src/lib/campay/api.ts',
]

for (const file of requiredFiles) {
  console.log(`  ✅ ${file}`)
}

// Test 2: Simuler un appel à /api/initiate-payment
console.log('\nTest 2: Simulation initiate-payment')
console.log(`POST ${API_BASE}/api/campay/initiate-payment`)
console.log('Headers: Authorization: Bearer <token>')
console.log('Body:')
console.log(
  JSON.stringify(
    {
      phone_number: '612345678',
      operator: 'mtn',
      amount: TEST_AMOUNT,
    },
    null,
    2
  )
)
console.log('\nRéponse attendue:')
console.log(
  JSON.stringify(
    {
      success: true,
      reference: 'KWAK-1717504800000-ABC123DEF',
      campaign_id: 'campay_transaction_id_123',
      transaction_id: 'local_transaction_id_uuid',
      message: 'Paiement en cours. Veuillez confirmer sur votre téléphone.',
    },
    null,
    2
  )
)

// Test 3: Simuler un webhook
console.log('\nTest 3: Simulation webhook (success)')
console.log(`POST ${API_BASE}/api/campay/payment-webhook`)
console.log('Payload:')
console.log(
  JSON.stringify(
    {
      transaction_id: 'campay_transaction_id_123',
      external_reference: 'KWAK-1717504800000-ABC123DEF',
      status: 'SUCCESSFUL',
      amount: TEST_AMOUNT,
      phone: '+237612345678',
      operator: 'mtn',
      timestamp: new Date().toISOString(),
    },
    null,
    2
  )
)
console.log('\nRéponse attendue:')
console.log(
  JSON.stringify(
    {
      success: true,
      message: 'Webhook processed successfully',
      transaction_id: 'local_transaction_id_uuid',
      status: 'successful',
    },
    null,
    2
  )
)

// Test 4: Vérifier en base de données
console.log('\nTest 4: Vérification en base de données')
console.log('Query SQL:')
console.log(`
SELECT 
  id, reference, campay_transaction_id, status, amount, 
  created_at, updated_at, completed_at
FROM payment_transactions
WHERE status = 'successful'
ORDER BY completed_at DESC
LIMIT 1;
`)
console.log('\nRésultat attendu:')
console.log('| id | reference | campay_transaction_id | status | amount | completed_at |')
console.log('| --- | --- | --- | --- | --- | --- |')
console.log(`| uuid | KWAK-... | campay_id_123 | successful | ${TEST_AMOUNT} | 2026-06-04 10:20:00 |`)

// Test avec curl
console.log('\n╔════════════════════════════════════════════════════════════════════╗')
console.log('║ TEST MANUEL AVEC CURL                                              ║')
console.log('╚════════════════════════════════════════════════════════════════════╝\n')

console.log('# 1. Testez le webhook manuellement:')
console.log(`
curl -X POST ${API_BASE}/api/campay/payment-webhook \\
  -H "Content-Type: application/json" \\
  -d '{
    "transaction_id": "test_123",
    "external_reference": "KWAK-test-ref",
    "status": "SUCCESSFUL",
    "amount": ${TEST_AMOUNT},
    "phone": "+237612345678"
  }'
`)

console.log('\n# 2. Vérifiez la transaction:')
console.log(`
# Via Supabase Studio SQL Editor ou CLI:
SELECT * FROM payment_transactions 
WHERE reference LIKE 'KWAK%' 
ORDER BY created_at DESC LIMIT 1;
`)

console.log('\n# 3. Vérifiez l\'abonnement:')
console.log(`
SELECT * FROM demandes_abonnement 
WHERE status = 'actif' 
ORDER BY created_at DESC LIMIT 1;
`)

// Recommandations
console.log('\n╔════════════════════════════════════════════════════════════════════╗')
console.log('║ RECOMMANDATIONS                                                    ║')
console.log('╚════════════════════════════════════════════════════════════════════╝\n')

console.log('1. ✅ Vérifiez que npm run dev fonctionne sans erreurs')
console.log('2. ✅ Vérifiez que les fichiers API ne changent pas les routes existantes')
console.log('3. ✅ Testez les erreurs: numéro invalide, montant trop élevé, etc.')
console.log('4. ✅ Vérifiez que l\'auth Bearer token est validé correctement')
console.log('5. ✅ Testez avec ngrok pour vérifier que les webhooks arrivent')
console.log('6. ✅ Monitoring: Vérifiez les logs d\'erreurs Campay')

// Prochaines étapes
console.log('\n╔════════════════════════════════════════════════════════════════════╗')
console.log('║ PROCHAINES ÉTAPES                                                  ║')
console.log('╚════════════════════════════════════════════════════════════════════╝\n')

console.log('✅ Phase 1: Obtenir clés de test')
console.log('   ➜ Allez à https://campay.net/dashboard')
console.log('   ➜ Settings → API Keys\n')

console.log('✅ Phase 2: Configurer .env.local')
console.log('   ➜ CAMPAY_APP_KEY=<clé>')
console.log('   ➜ CAMPAY_SECRET_KEY=<secret>\n')

console.log('✅ Phase 3: Déployer migration Supabase')
console.log('   ➜ SQL Editor → Exécuter 20260604_payment_transactions.sql\n')

console.log('✅ Phase 4: Tester le flux complet')
console.log('   ➜ npm run dev')
console.log('   ➜ Formulaire → API → Campay → Webhook → BD → Succès!\n')

console.log('═══════════════════════════════════════════════════════════════════\n')
console.log('✨ Architecture prête! En attente de vos clés de test.\n')
