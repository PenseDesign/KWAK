# 🚀 Intégration Campay - Version Complète (v2.0)

## ✅ Fonctionnalités ajoutées

### 1. **Montant fixe pour abonnement** 
- ✅ Montant fixé à **3 139 XAF** (3 000 XAF service + 139 XAF frais)
- ✅ Composant formulaire mis à jour
- ✅ Détails des frais visibles pour l'utilisateur

### 2. **Gestion des redevances techniques**
- ✅ **75 XAF** crédités par transaction réussie
- ✅ Table `tech_fees_wallet` pour le solde global
- ✅ Table `tech_fees_transactions` pour l'historique
- ✅ Fonction SQL `add_tech_fee()` pour enregistrer les redevances

### 3. **Page d'administration secrète**
- ✅ URL: `/admin-dev-secret` (sécurisée, admin seulement)
- ✅ Affiche:
  - Solde disponible courant
  - Total accumulé depuis le début
  - Total retiré
  - Historique des transactions
- ✅ Bouton de retrait avec confirmation

### 4. **Route API de retrait sécurisé**
- ✅ Endpoint: `POST /api/dev/withdraw`
- ✅ Authentification Bearer token requise
- ✅ Vérification rôle admin
- ✅ Appelle Campay API `/withdraw/` 
- ✅ Enregistre les retraits en base de données

### 5. **Variables d'environnement complètes**
- ✅ `CAMPAY_APP_KEY` - Clé publique Campay
- ✅ `CAMPAY_SECRET_KEY` - Clé secrète Campay
- ✅ `CAMPAY_URL` - URL de l'API Campay
- ✅ `DEV_WITHDRAW_PHONE` - Numéro de téléphone pour les retraits
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Clé service Supabase

---

## 📊 Architecture flux des paiements

```
┌─────────────────┐
│  UTILISATEUR    │
├─────────────────┤
│ Entre numéro    │
│ 3 139 XAF fixe  │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  /api/initiate-payment              │
├─────────────────────────────────────┤
│ ✓ Crée payment_transaction          │
│ ✓ Status: pending → processing      │
│ ✓ Appelle Campay /collect/          │
└────────┬────────────────────────────┘
         │
    SMS/USSD
         │
         ↓
┌─────────────────────────────────────┐
│  USER CONFIRMS ON PHONE             │
├─────────────────────────────────────┤
│ Entre PIN/code secret               │
└────────┬────────────────────────────┘
         │
         ↓ Webhook notification
┌──────────────────────────────────────┐
│  /api/campay/payment-webhook         │
├──────────────────────────────────────┤
│ ✓ Reçoit statut: SUCCESSFUL         │
│ ✓ Met à jour transaction: successful │
│ ✓ Ajoute 75 XAF → tech_fees_wallet  │
│ ✓ Crédite abonnement utilisateur    │
└──────────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  DEVELOPER WALLET                    │
├──────────────────────────────────────┤
│ Balance: +75 XAF                    │
│ Total accumulated: +75 XAF          │
│ Via: /admin-dev-secret              │
└──────────────────────────────────────┘
         │
         ↓ Quand prêt
┌──────────────────────────────────────┐
│  POST /api/dev/withdraw              │
├──────────────────────────────────────┤
│ ✓ Vérifie admin role                 │
│ ✓ Appelle Campay /withdraw/          │
│ ✓ Transfert via Mobile Money        │
│ ✓ Enregistre transaction             │
│ ✓ Balance = 0, total_withdrawn: +75  │
└──────────────────────────────────────┘
```

---

## 📁 Fichiers créés/modifiés

### Migrations Supabase
- ✅ `supabase/migrations/20260604_payment_transactions.sql` - Table paiements
- ✅ `supabase/migrations/20260604_tech_fees_wallet.sql` - **NOUVEAU** Wallet développeur

### Routes API
- ✅ `src/app/api/campay/initiate-payment/route.ts` - Initier paiement
- ✅ `src/app/api/campay/payment-webhook/route.ts` - Webhook (mis à jour avec redevances)
- ✅ `src/app/api/dev/withdraw/route.ts` - **NOUVEAU** Retrait frais techniques

### Pages Frontend
- ✅ `src/components/payment/MobileMoneyPaymentForm.tsx` - Formulaire (montant fixe 3 139)
- ✅ `src/app/(admin)/admin-dev-secret/page.tsx` - **NOUVEAU** Dashboard développeur

### Librairies/Utilitaires
- ✅ `src/lib/campay/api.ts` - Client API (ajout méthode `initiateWithdraw`)
- ✅ `src/lib/types/database.ts` - Types TypeScript

### Configuration
- ✅ `.env.local` - Variables d'environnement (complètes)
- ✅ `.env.example` - Modèle documentation

---

## 🔑 Configuration requise

### 1. Clés Campay
```bash
# Depuis https://campay.net/dashboard → Settings → API Keys
CAMPAY_APP_KEY=YOUR_APP_KEY
CAMPAY_SECRET_KEY=YOUR_SECRET_KEY
```

### 2. Numéro de retrait
```bash
# Votre numéro Mobile Money (format: 6XXXXXXXX)
DEV_WITHDRAW_PHONE=6XXXXXXXX
```

### 3. Service Role Key Supabase
```bash
# https://supabase.com (Settings → API → Service Role Key)
SUPABASE_SERVICE_ROLE_KEY=your_key
```

---

## 🧪 Instructions de test (3 heures)

### Phase 1: Setup (30 min)
```bash
# 1. Obtenir clés Campay sur https://campay.net/dashboard
# 2. Configurer .env.local avec les 3 variables
# 3. Exécuter migration Supabase:
#    - Copier contenu de supabase/migrations/20260604_tech_fees_wallet.sql
#    - Coller dans Supabase SQL Editor
#    - Clicker "Run"
# 4. Démarrer dev server
npm run dev
```

### Phase 2: Test du formulaire (45 min)
```bash
# 1. Naviguer vers page avec formulaire:
#    import { MobileMoneyPaymentForm } from '@/components/payment'
#    <MobileMoneyPaymentForm onSuccess={...} onError={...} />
#
# 2. Remplir:
#    - Numéro: 6XXXXXXXX
#    - Opérateur: MTN ou Orange
#    - Montant: affiché automatiquement 3 139 XAF
#
# 3. Cliquer "Confirmer le paiement"
# 4. Vérifier base de données:
#    - payment_transactions table → statut "processing"
```

### Phase 3: Test webhook + redevances (45 min)
```bash
# 1. Configurer ngrok pour webhook local:
#    ngrok http 3000
#    URL: https://abc123.ngrok.io
#
# 2. Dans Campay Dashboard:
#    Settings → Webhooks
#    URL: https://abc123.ngrok.io/api/campay/payment-webhook
#
# 3. Envoyer webhook de test:
curl -X POST http://localhost:3000/api/campay/payment-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "test123",
    "status": "SUCCESSFUL",
    "amount": 3139,
    "phone": "+237612345678",
    "external_reference": "KWAK-..."
  }'

# 4. Vérifier:
#    - payment_transactions → status: "successful"
#    - tech_fees_wallet → balance_xaf: +75
#    - tech_fees_transactions → type: "fee_credit"
```

### Phase 4: Test page admin + retrait (45 min)
```bash
# 1. Se logger avec compte admin
# 2. Naviguer: http://localhost:3000/admin-dev-secret
# 3. Vérifier affichage:
#    - Solde: 75 XAF (ou plus si autres transactions)
#    - Total accumulé: Total
#    - Historique: Voir transactions
#
# 4. Tester retrait:
#    - Cliquer "Retirer" 
#    - Observe appel API: /api/dev/withdraw
#    - Vérifier réponse avec référence Campay
#
# 5. Vérifier après retrait:
#    - Balance: 0
#    - Total withdrawn: 75
#    - tech_fees_transactions → type: "withdrawal"
```

---

## 🔒 Sécurité - Points importants

### ✅ Implémenté
- Bearer token authentification sur `/api/initiate-payment`
- Admin-only sur `/api/dev/withdraw` (vérification rôle)
- RLS (Row Level Security) sur toutes les tables
- Service Role Key pour opérations sensibles (webhook)
- Validation montants côté backend

### 📋 À faire en production
- [ ] Activer vérification signature webhook
- [ ] Rate limiting sur `/api/initiate-payment`
- [ ] Rate limiting sur `/api/dev/withdraw`
- [ ] Logging/monitoring des retraits (Slack/Email)
- [ ] HTTPS/SSL cert valide
- [ ] Backups Supabase
- [ ] Audit trail des retraits

---

## 📚 Usage dans votre app

### Intégrer le formulaire
```tsx
import { MobileMoneyPaymentForm } from '@/components/payment'

export default function SubscribePage() {
  return (
    <MobileMoneyPaymentForm
      onSuccess={(data) => {
        console.log('✅ Paiement initié:', data)
        // Redirect ou afficher message
      }}
      onError={(error) => {
        console.error('❌ Erreur:', error)
      }}
    />
  )
}
```

### Accéder au dashboard développeur
```
URL: http://localhost:3000/admin-dev-secret
(Visible seulement pour les admins)
```

---

## 🆘 Checklist avant production

- [ ] Clés Campay en PROD configurées
- [ ] DEV_WITHDRAW_PHONE configuré
- [ ] SUPABASE_SERVICE_ROLE_KEY configuré
- [ ] Webhook URL testée et fonctionnelle
- [ ] Tous les tests en mode SANDBOX réussis
- [ ] Admin devrait voir le portefeuille
- [ ] Test retrait complet (jusqu'au Mobile Money)
- [ ] Logs configurés (erreurs Campay, webhooks)
- [ ] SSL/HTTPS en place
- [ ] Monitoring des transactions actif

---

## 📞 Support

- Docs Campay: https://campay.net/docs
- Supabase: https://supabase.com/docs
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

**Status:** ✅ Architecture v2.0 complète - Prêt pour 3h de tests!

Date: 4 Juin 2026
