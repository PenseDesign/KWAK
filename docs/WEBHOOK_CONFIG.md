# Configuration du Webhook Campay

## 📋 Étapes de configuration

### 1. Obtenez votre URL publique

Pendant le développement, utilisez **ngrok** pour exposer votre serveur local:

```bash
# Installation
brew install ngrok

# Exposition
ngrok http 3000

# Output example:
# Forwarding     https://abc123.ngrok.io -> localhost:3000
```

### 2. Configurez dans Campay Dashboard

1. Allez à [https://campay.net/dashboard](https://campay.net/dashboard)
2. Settings → Webhooks
3. Configurez les URLs:
   - **Success Webhook URL:** `https://your-domain.com/api/campay/payment-webhook`
   - **Failure Webhook URL:** `https://your-domain.com/api/campay/payment-webhook`

### 3. Test manuel du webhook

```bash
curl -X POST http://localhost:3000/api/campay/payment-webhook \
  -H "Content-Type: application/json" \
  -H "X-Signature: optional-signature" \
  -d '{
    "transaction_id": "1234567890",
    "external_reference": "KWAK-1717504800000-abc123xyz",
    "status": "SUCCESSFUL",
    "amount": 1000,
    "phone": "+237612345678",
    "operator": "mtn",
    "timestamp": "2026-06-04T10:20:00Z"
  }'
```

Expected response 200 OK:
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "transaction_id": "...",
  "status": "successful"
}
```

### 4. Vérification en base de données

```sql
-- Vérifier que la transaction a été mise à jour
SELECT id, reference, campay_transaction_id, status, updated_at
FROM payment_transactions
ORDER BY created_at DESC
LIMIT 5;
```

## 🔐 Sécurité Webhook

### Vérification de signature (optionnel mais recommandé)

Le webhook signe chaque requête avec un header `X-SIGNATURE`:

```typescript
import { createHmac } from 'crypto'

function verifyWebhookSignature(payload: string, signature: string, secretKey: string): boolean {
  const expectedSignature = createHmac('sha256', secretKey)
    .update(payload)
    .digest('hex')
  return expectedSignature === signature
}
```

Pour activer dans le webhook, décommentez:
```typescript
// const signature = request.headers.get('x-signature')
// if (signature && !campay.verifyWebhookSignature(rawBody, signature)) {
//   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
// }
```

## 📊 Payload du webhook Campay

Campay envoie ce payload:

```json
{
  "transaction_id": "string",          // ID unique Campay
  "external_reference": "string",      // Notre référence (KWAK-...)
  "status": "SUCCESSFUL|FAILED|CANCELLED",
  "amount": 1000,
  "phone": "+237612345678",
  "operator": "mtn|orange",
  "timestamp": "2026-06-04T10:20:00Z",
  "message": "Transaction approved" // optionnel
}
```

## 🧪 Test de statuts

### Test réussi
```bash
curl -X POST http://localhost:3000/api/campay/payment-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "123",
    "status": "SUCCESSFUL",
    "amount": 1000,
    "phone": "+237612345678"
  }'
```

### Test échoué
```bash
curl -X POST http://localhost:3000/api/campay/payment-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "124",
    "status": "FAILED",
    "amount": 1000,
    "phone": "+237612345678",
    "message": "Insufficient balance"
  }'
```

## 📝 Logs et monitoring

Les logs sont affichés dans la console Next.js:

```
Received webhook: {
  transaction_id: 'xyz123',
  status: 'SUCCESSFUL',
  external_reference: 'KWAK-...'
}

Payment successful for client abc123
```

## ⚠️ Troubleshooting

### Webhook ne reçoit pas les notifications
1. Vérifiez que la URL est accessible publiquement
2. Testez manuellement avec curl
3. Vérifiez les logs Campay Dashboard

### Transaction introuvable
- Assurez-vous que l'`external_reference` correspond à notre table
- Vérifiez la requête POST `/api/initiate-payment` a bien créé l'entrée

### Signature invalde
- Vérifiez que le `secretKey` est correct
- Assurez-vous que vous lisez le `rawBody` avant de parser

---

**Configuration webhook: ✅ Prêt pour les clés de test**
