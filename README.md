This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🚀 Démarrage rapide

Lancez le serveur de développement:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur pour voir le résultat.

Vous pouvez modifier la page en éditant `app/page.tsx`. La page se met à jour automatiquement lors de la modification du fichier.

## 💳 Intégration Campay (Mobile Money)

Ce projet inclut une intégration complète pour le paiement par Mobile Money (MTN MoMo / Orange Money).

### 📋 Documentation Campay

- **[Démarrage rapide](docs/QUICK_START.md)** - Guide 5 minutes
- **[Intégration complète](docs/CAMPAY_INTEGRATION.md)** - Documentation détaillée
- **[Configuration webhook](docs/WEBHOOK_CONFIG.md)** - Setup webhook Campay
- **[Exemple d'utilisation](docs/EXAMPLE_USAGE.tsx)** - Exemple de page
- **[Statut du projet](CAMPAY_STATUS.md)** - Vue d'ensemble complète
- **[Clés API à recevoir](CLÉS_API_À_RECEVOIR.md)** - Template config

### 🔑 Configuration

1. Obtenez vos clés de test : https://campay.net/dashboard
2. Configurez `.env.local`:
   ```bash
   CAMPAY_APP_KEY=your_test_app_key
   CAMPAY_SECRET_KEY=your_test_secret_key
   CAMPAY_URL=https://api.sandbox.campay.net
   ```
3. Déployez la migration Supabase : `supabase/migrations/20260604_payment_transactions.sql`
4. Testez : `npm run dev`

### 🧪 Tester localement

```bash
# Vérifier que tout est configuré
node scripts/verify-campay-setup.mjs

# Voir les tests d'intégration
node docs/TEST_INTEGRATION.mjs
```

### 📱 Composant Formulaire

```tsx
import { MobileMoneyPaymentForm } from '@/components/payment'

export default function SubscribePage() {
  return (
    <MobileMoneyPaymentForm
      amount={15000}
      customDescription="Premium Plan - 1 month"
      onSuccess={(data) => console.log('Payment started:', data)}
      onError={(error) => console.log('Error:', error)}
    />
  )
}
```

### 🛣️ API Routes

- `POST /api/campay/initiate-payment` - Initialiser un paiement
- `POST /api/campay/payment-webhook` - Webhook Campay

---

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
