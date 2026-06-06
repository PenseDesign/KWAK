# Template - Configuration des clés API Campay

## 📋 À faire quand vous recevrez les clés de test

### 1. Clés à recevoir de Campay

Vous recevrez environ:
```
Test Environment:
- App Key: CAMPAY_APP_KEY_TEST_xxx
- Secret Key: CAMPAY_SECRET_KEY_TEST_yyy
- Dashboard: https://campay.net/dashboard

Production Environment:
- App Key: CAMPAY_APP_KEY_PROD_xxx
- Secret Key: CAMPAY_SECRET_KEY_PROD_yyy
- (À configurer plus tard)
```

### 2. Configuration mode TEST

Modifiez `.env.local`:

```bash
# ============================================
# TEST ENVIRONMENT (actuellement)
# ============================================
CAMPAY_APP_KEY=CAMPAY_APP_KEY_TEST_xxx        # ⬅️ Remplacez cette ligne
CAMPAY_SECRET_KEY=CAMPAY_SECRET_KEY_TEST_yyy   # ⬅️ Remplacez cette ligne
CAMPAY_URL=https://api.sandbox.campay.net

# ============================================
# PRODUCTION ENVIRONMENT (à ajouter plus tard)
# ============================================
# CAMPAY_APP_KEY=CAMPAY_APP_KEY_PROD_xxx
# CAMPAY_SECRET_KEY=CAMPAY_SECRET_KEY_PROD_yyy
# CAMPAY_URL=https://api.campay.net
```

### 3. Configurer le webhook dans Campay Dashboard

1. Allez à [https://campay.net/dashboard](https://campay.net/dashboard)
2. **Settings → Webhooks**
3. Configurez:
   ```
   Success Webhook URL: https://your-domain.com/api/campay/payment-webhook
   Failure Webhook URL: https://your-domain.com/api/campay/payment-webhook
   ```

### 4. Numéros de test fournis par Campay

Vous devriez aussi recevoir des numéros de test:
```
MTN MoMo:
- +237612345678 (test value will be provided)

Orange Money:
- +237698765432 (test value will be provided)
```

Ces numéros fonctionneront seulement en TEST et ne débitent pas réellement.

### 5. Montants acceptés en test

Campay accepte usardin les montants:
- Minimum: 100 XAF
- Maximum: 500 000 XAF

**Montants recommandés pour test:**
- ✅ 1000 XAF
- ✅ 10 000 XAF
- ✅ 50 000 XAF

### 6. Vérifier la configuration

Une fois les clés mises à jour:

```bash
# 1. Démarrez le serveur
npm run dev

# 2. Testez le script de vérification
node scripts/verify-campay-setup.mjs

# Output attendu:
# ✅ CAMPAY_APP_KEY - Configuré
# ✅ CAMPAY_SECRET_KEY - Configuré
# ✅ CAMPAY_URL - Configuré
```

### 7. Premier test

```bash
# Testez le formulaire avec un montant de test
1. Allez à http://localhost:3000/subscribe (ou votre page)
2. Remplissez:
   - Numéro: +237612345678 (test number)
   - Opérateur: MTN MoMo
   - Montant: 1000 XAF
3. Soumettez
4. Vérifiez console pour les logs
5. Vérifiez la base de données pour la transaction
```

### 8. Vérifier la transaction en BD

```sql
SELECT id, reference, campay_transaction_id, status, amount, created_at
FROM payment_transactions
WHERE client_id = 'your_user_id'
ORDER BY created_at DESC
LIMIT 1;
```

---

## 🔐 Sécurité - Point d'attention

⚠️ **NE JAMAIS Committer les clés API!**

Les fichiers `.env.local` et `.env.production.local` sont dans `.gitignore`.

Vérifiez:
```bash
cat .gitignore | grep env
# Doit afficher: *.local
```

---

## 📝 Flux une fois configuré

```
1. Vous envoyez les clés
2. Je mets à jour .env.local
3. npm run dev
4. Test formulaire → Campay reçoit la requête
5. Campay envoie USSD/SMS au numero test
6. Je confirme sur le téléphone de test
7. Campay envoie webhook de notification
8. Transaction est marqué comme "successful"
9. Abonnement est activé automatiquement
10. ✅ Paiement complet
```

---

## ✅ Checklist réception clés

- [ ] Clés API reçues (App Key + Secret Key)
- [ ] URL Webhook configurée chez Campay
- [ ] Numéros de test reçus
- [ ] Montants acceptés documentés
- [ ] `.env.local` mis à jour
- [ ] `npm run dev` fonctionne sans erreur
- [ ] Test formulaire réussi
- [ ] Transaction dans BD avec statut "processing"
- [ ] Webhook notification reçue
- [ ] Statut mis à jour en "successful"
- [ ] 🎉 PRODUCTION READY

---

**En attente de vos clés de test pour activer complètement le système.**
