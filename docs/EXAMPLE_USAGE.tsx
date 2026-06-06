/**
 * Exemple d'utilisation du composant MobileMoneyPaymentForm
 * Placer ce code dans vos pages Next.js
 */

'use client'

import { useState } from 'react'
import { MobileMoneyPaymentForm } from '@/components/payment/MobileMoneyPaymentForm'

export default function SubscriptionPage() {
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [paymentData, setPaymentData] = useState<any>(null)

  const handlePaymentSuccess = (data: { reference: string; transactionId: string }) => {
    console.log('✅ Paiement lancé:', data)
    
    // Options:
    // 1. Rediriger vers une page de confirmation
    // 2. Afficher un message de succès
    // 3. Polling la base de données pour voir quand la transaction est complétée
    
    setPaymentStatus('pending')
    setPaymentData(data)

    // Exemple: Polling pour voir le statut de la transaction
    const pollInterval = setInterval(async () => {
      try {
        // Optionnel: vous pouvez créer une route pour vérifier le statut
        // const response = await fetch(`/api/campay/transaction-status/${data.transactionId}`)
        // const status = await response.json()
        // if (status.status === 'successful') {
        //   setPaymentStatus('success')
        //   clearInterval(pollInterval)
        // }
      } catch (error) {
        console.error('Erreur lors du polling:', error)
      }
    }, 2000)

    // Arrêter après 5 minutes
    setTimeout(() => clearInterval(pollInterval), 300000)
  }

  const handlePaymentError = (error: string) => {
    console.error('❌ Erreur de paiement:', error)
    setPaymentStatus('error')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Abonnement Premium</h1>
          <p className="text-gray-600">Accédez à tous nos services premium dès maintenant</p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              name: 'Basique',
              price: 5000,
              features: ['Accès essentiel', 'Support email', '5 GB stockage'],
            },
            {
              name: 'Pro',
              price: 15000,
              features: ['Accès complet', 'Support prioritaire', '100 GB stockage', 'Rapports avancés'],
              highlighted: true,
            },
            {
              name: 'Premium',
              price: 50000,
              features: ['Tous les avantages', 'Support 24/7', 'Stockage illimité', 'API access'],
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg p-6 ${
                plan.highlighted
                  ? 'bg-white border-2 border-blue-600 shadow-lg scale-105'
                  : 'bg-white border border-gray-200 shadow'
              }`}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">{plan.price.toLocaleString()}</span>
                <span className="text-gray-600 ml-2">XAF/mois</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-center">
                    <span className="text-blue-600 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">
                Choisir ce plan
              </button>
            </div>
          ))}
        </div>

        {/* Formulaire de paiement */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Paiement sécurisé</h2>

          {paymentStatus === 'idle' && (
            <>
              <p className="text-gray-600 mb-6">
                Payez directement via votre téléphone avec MTN MoMo ou Orange Money.
              </p>
              <MobileMoneyPaymentForm
                amount={15000}
                customDescription="Plan Pro - Abonnement mensuel"
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </>
          )}

          {paymentStatus === 'pending' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="mb-4">
                <div className="inline-block">
                  <div className="animate-spin">
                    <div className="text-4xl">⏳</div>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Paiement en cours</h3>
              <p className="text-blue-800 text-sm mb-4">
                Réf: <span className="font-mono">{paymentData?.reference}</span>
              </p>
              <p className="text-blue-700 text-sm">
                Veuillez confirmer le paiement sur votre téléphone. Cela peut prendre quelques minutes...
              </p>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">Paiement réussi!</h3>
              <p className="text-green-800 text-sm mb-4">
                Votre abonnement est maintenant actif. Accès immédiat à tous les services premium.
              </p>
              <button className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors">
                Accéder aux services
              </button>
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Erreur de paiement</h3>
              <p className="text-red-800 text-sm mb-4">
                Le paiement n'a pas pu être complété. Veuillez réessayer.
              </p>
              <button
                onClick={() => setPaymentStatus('idle')}
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>

        {/* FAQ */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions fréquentes</h3>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <p className="font-semibold text-gray-900">Quels opérateurs acceptez-vous?</p>
              <p>Nous acceptons MTN MoMo et Orange Money.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Combien de temps avant activation?</p>
              <p>L'activation est immédiate après confirmation du paiement.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Puis-je annuler mon abonnement?</p>
              <p>Oui, vous pouvez annuler à tout moment depuis votre profil.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
