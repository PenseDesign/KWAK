#!/usr/bin/env node

/**
 * Commandes npm utiles pour le projet
 * Lisez ce fichier pour les commandes courantes
 */

console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║               KWAK APP - Commandes npm utiles                         ║
╚═══════════════════════════════════════════════════════════════════════╝

📚 DÉMARRAGE

  npm run dev
  ➜ Démarre le serveur de développement sur http://localhost:3000

  npm run build
  ➜ Build l'application pour la production

  npm start
  ➜ Lance le serveur de production

  npm run lint
  ➜ Vérifie le code avec ESLint


🧪 TESTS & VALIDATION

  node scripts/verify-campay-setup.mjs
  ➜ Vérifie que l'intégration Campay est correctement configurée

  node docs/TEST_INTEGRATION.mjs
  ➜ Affiche les détails pour tester l'intégration Campay

  npm run build  # validate TypeScript
  ➜ Valide tous les types TypeScript


💳 CAMPAY SPÉCIFIQUE

  # Tester le webhook manuellement
  curl -X POST http://localhost:3000/api/campay/payment-webhook \\
    -H "Content-Type: application/json" \\
    -d '{
      "transaction_id": "test_123",
      "status": "SUCCESSFUL",
      "amount": 1000,
      "phone": "+237612345678"
    }'

  # ou avec jq pour formater la réponse
  curl -X POST http://localhost:3000/api/campay/payment-webhook \\
    -H "Content-Type: application/json" \\
    -d '{...}' | jq '.'


🌐 NGROK (pour webhook local)

  brew install ngrok
  ➜ Installe ngrok

  ngrok http 3000
  ➜ Expose votre port 3000 publiquement
  ➜ URL: https://abc123.ngrok.io


🗄️ SUPABASE

  # Ouvrir Supabase Studio
  # 1. Allez à https://app.supabase.com
  # 2. Sélectionnez votre projet
  # 3. Allez à SQL Editor
  # 4. Copy-paste le fichier: supabase/migrations/20260604_payment_transactions.sql
  # 5. Exécutez


📄 DOCUMENTATION

  docs/QUICK_START.md
  ➜ Guide 5 minutes pour démarrer

  docs/CAMPAY_INTEGRATION.md
  ➜ Documentation complète de l'intégration

  docs/WEBHOOK_CONFIG.md
  ➜ Configuration du webhook Campay

  docs/EXAMPLE_USAGE.tsx
  ➜ Exemple d'implémentation complète

  CAMPAY_STATUS.md
  ➜ Statut du projet et checklist


🔑 CONFIGURATION

  .env.local
  ➜ Variables d'environnement locales (NE PAS COMMITTER)

  .env.example
  ➜ Template pour les variables d'environnement


📁 STRUCTURE DU PROJET

  src/
  ├── app/
  │   ├── api/campay/               ← API Routes
  │   │   ├── initiate-payment/
  │   │   └── payment-webhook/
  │   └── (routes principales)
  ├── components/
  │   └── payment/
  │       └── MobileMoneyPaymentForm.tsx  ← Composant UI
  └── lib/
      ├── campay/api.ts             ← Client Campay
      └── types/database.ts          ← Types TypeScript

  supabase/migrations/
  └── 20260604_payment_transactions.sql  ← Table BD


⚡ RACCOURCIS UTILES

  # Voir les fichiers créés pour Campay
  find . -name "*campay*" -o -name "*payment*" | grep -E "src|supabase"

  # Vérifier les erreurs TypeScript
  npm run build 2>&1 | grep error

  # Lancer en verbose
  npm run dev -- --verbose


🐛 DEBUGGING

  # Logs en temps réel du serveur Next.js
  npm run dev

  # Inspectez votre base de données
  # → Supabase Studio → Table Editor → payment_transactions

  # Testez l'API directement
  curl http://localhost:3000/api/campay/initiate-payment \\
    -X POST \\
    -H "Content-Type: application/json" \\
    -H "Authorization: Bearer YOUR_TOKEN"


📊 MONITORING

  # Vérifier le statut du build
  npm run build

  # Vérifier les imports non utilisés
  npm run lint

  # Format du code
  npx eslint --fix


🚀 DÉPLOIEMENT

  # Build pour production
  npm run build

  # Tester le build localement
  npm run build && npm start

  # Déployer sur Vercel
  # (Assurez-vous que CAMPAY_* vars sont dans Vercel Settings)


═══════════════════════════════════════════════════════════════════════

💡 TIPS

  1. Utilisez npm run dev en développement local
  2. Testez avec ngrok pour le webhook
  3. Vérifiez .env.local avant de committer
  4. Les clés API ne doivent JAMAIS être en git
  5. Utilisez .env.example pour la documentation


❓ QUESTIONS?

  📖 Consultez: docs/CAMPAY_INTEGRATION.md
  💬 Support Campay: https://campay.net/docs
  📚 Next.js: https://nextjs.org/docs

═══════════════════════════════════════════════════════════════════════
`)
