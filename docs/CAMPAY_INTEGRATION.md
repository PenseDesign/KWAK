# 🚀 Intégration Campay - Paiement Mobile Money

## 📋 Architecture mise en place

### 1. **Base de données (Supabase)**
- **Table:** `payment_transactions`
  - Enregistre toutes les tentatives de paiement
  - Statuts: `pending` → `processing` → `successful`/`failed`/`cancelled`
  - Liée à la table `demandes_abonnement` pour le suivi des abonnements

### 2. **Frontend**
- **Composant:** `src/components/payment/MobileMoneyPaymentForm.tsx`
  - Formulaire avec saisie du numéro de téléphone
  - Sélecteur d'opérateur (MTN MoMo / Orange Money)
  - Indicatif pays automatique
  - États de chargement et messages d'erreur

### 3. **Backend - Routes API**
- **`/api/campay/initiate-payment` (POST)**
  - Reçoit: `phone_number`, `operator`, `amount`, (`demande_abonnement_id` optionnel)
  - Crée une transaction en `pending`
  - Appelle l'API Campay pour initier le débit
  - Retourne: `reference` et `campaign_id` (pour suivi)

- **`/api/campay/payment-webhook` (POST)**
  - Reçoit les notifications de Campay
  - Valide la signature (optionnel)
  - Met à jour le statut de la transaction
  - Si `status === SUCCESSFUL` : libère le service pour l'utilisateur

### 4. **Intégration Campay**
- **Classe:** `src/lib/campay/api.ts`
  - Gère l'authentification (signatures HMAC)
  - Appellelle `/collect/` pour initier le débit
  - Permet de vérifier le statut des transactions
  - Valide les signatures des webhooks

---

## ⚙️ Configuration - Clés API

### Obtenir vos clés de test Campay

1. Accédez à **[https://campay.net/dashboard](https://campay.net/dashboard)**
2. Créez ou connectez-vous à votre compte
3. Allez dans **Settings → API Keys**
4. Copiez:
   - `App Key` (ID public)
   - `Secret Key` (clé privée)

### Configurer les variables d'environnement

Mise à jour du fichier `.env.local`:

```bash
# Mode TEST (recommandé d'abord)
CAMPAY_APP_KEY=your_test_app_key
CAMPAY_SECRET_KEY=your_test_secret_key
CAMPAY_URL=https://api.sandbox.campay.net

# Mode PRODUCTION (après tests)
CAMPAY_URL=https://api.campay.net
```

> ⚠️ **IMPORTANT:** Ne commitez JAMAIS les clés secrètes sur Git. Utilisez uniquement `.env.local` (qui est dans `.gitignore`)

---

## 🧪 Tester localement

### 1. Configurer le webhook local

Pour développer localement, utilisez **ngrok** pour exposer votre serveur :

```bash
# Installez ngrok
brew install ngrok

# Exposez le port 3000
ngrok http 3000

# Exemple de sortie:
# Forwarding  https://abc123.ngrok.io -> localhost:3000
```

### 2. Configurer l'URL du webhook dans Campay

1. Allez à **[https://campay.net/dashboard](https://campay.net/dashboard) → Webhooks**
2. Configurez l'URL:
   - **Success URL:** `https://abc123.ngrok.io/api/campay/payment-webhook`
   - **Failure URL:** `https://abc123.ngrok.io/api/campay/payment-webhook`

### 3. Tester le formulaire

```tsx
// Exemple d'utilisation dans vos pages
import { MobileMoneyPaymentForm } from '@/components/payment/MobileMoneyPaymentForm'

export default function SubscriptionPage() {
  const amount = 50000 // 50 000 XAF

  return (
    <MobileMoneyPaymentForm
      amount={amount}
      customDescription="Abonnement Premium Mensuel"
      onSuccess={(data) => {
        console.log('Paiement lancé:', data)
        // Rediriger ou afficher un message de succès
      }}
      onError={(error) => {
        console.error('Erreur:', error)
      }}
    />
  )
}
```

### 4. Flux de test complet

**Client (Frontend):**
1. Entre son numéro: `6XX XXX XXX`
2. Choisit l'opérateur: **MTN MoMo** ✓
3. Clique sur **Confirmer le paiement**
4. Voit: "⏳ En attente de validation sur votre téléphone..."

**Appareil:**
1. Reçoit un SMS/USSD prompt
2. Saisit son code secret (PIN) sur son téléphone
3. Campay appelle le webhook avec le statut

**Backend (Webhook):**
1. Reçoit la notification avec `status: SUCCESSFUL`
2. Met à jour `payment_transactions` → `status: successful`
3. Met à jour `demandes_abonnement` → `status: actif`

**Frontend (Poll ou WebSocket optional):**
1. Détecte le changement
2. Affiche "✅ Paiement réussi!"
3. Libère l'accès au service

---

## 📊 Flux de données

```
[Frontend]
    ↓ POST /api/initiate-payment
[Backend Initiate]
    ↓ Creates transaction (pending)
[Campay API]
    ↓ /collect/ endpoint
[External]
    ↓ Sends SMS/USSD to phone
[User Device]
    ↓ User approves on phone
[Campay]
    ↓ POST /api/campay/payment-webhook
[Backend Webhook]
    ↓ Validates & updates payment_transactions
[Database]
    ↓ Updates demandes_abonnement → actif
[Service]
    ↓ User gets access
```

---

## 🔒 Sécurité

### Points importants

1. **Signature Webhook:** Campay signe chaque webhook avec `X-SIGNATURE` header
   - Fonction `verifyWebhookSignature()` intégrée
   - À activer une fois en production

2. **Tokens d'authentification:** 
   - Les routes utilisent l'auth Bearer token
   - `/initiate-payment` valide le user avant de créer la transaction

3. **Service Role Key:**
   - Utilisée SEULEMENT dans le webhook (server-side)
   - Ne jamais l'exposer au frontend

4. **Validation des montants:**
   - Min: 100 XAF, Max: 500 000 XAF
   - Validée côté frontend ET backend

---

## 🆘 Troubleshooting

### ❌ Erreur: "Campay credentials are not configured"
```bash
# Vérifiez .env.local
grep CAMPAY .env.local

# Si manquant, ajoutez:
CAMPAY_APP_KEY=...
CAMPAY_SECRET_KEY=...
```

### ❌ Webhook ne reçoit pas les notifications
1. Vérifiez l'URL du webhook dans Campay Dashboard
2. Testez manuellement avec `curl`:
   ```bash
   curl -X POST http://localhost:3000/api/campay/payment-webhook \
     -H "Content-Type: application/json" \
     -d '{"transaction_id":"123","status":"SUCCESSFUL"}'
   ```

### ❌ Erreur 401 "Unauthorized"
- Vérifiez que le header `Authorization: Bearer <token>` est envoyé depuis le frontend
- Token doit être valide dans Supabase

### ❌ Montant rejeté: "Invalid amount"
- Campay Sandbox accepte généralement: 100 XAF à 500 000 XAF
- Testez avec: 1000 XAF

---

## 📚 Ressources

- [Documentation Campay](https://campay.net/docs)
- [Supabase Realtime (pour notifications client)](https://supabase.com/docs/guides/realtime)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## ✅ Checklist avant production

- [ ] Clés Campay en PRODUCTION configurées
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurée
- [ ] Webhook URL configurée dans Campay Dashboard
- [ ] Signature validation activée dans webhook
- [ ] Tests avec vrais nombres (MTN/Orange)
- [ ] SSLLet's Encrypt ou certificat valide
- [ ] Monitoring des erreurs en place (alertes Slack/Email)
- [ ] Rate limiting sur `/api/initiate-payment`
- [ ] Logs des transactions pour l'audit

---

## 🚀 Prochaines étapes optionnelles

1. **WebSocket pour notifications en temps réel** (au lieu de polling)
2. **Retry logic** pour payments échoués
3. **PDF receipts** générés après paiement réussi
4. **SMS de confirmation** au client
5. **Dashboard admin** pour voir l'historique des transactions
