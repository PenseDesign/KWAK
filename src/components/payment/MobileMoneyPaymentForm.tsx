/* eslint-disable react-hooks/rules-of-hooks */
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const BASE_DEFAULT_AMOUNT = 3000
const PAYMENT_FEE = 139

const paymentFormSchema = z.object({
  phone_number: z
    .string()
    .min(9, 'Le numéro doit contenir au moins 9 chiffres')
    .regex(/^\d+$/, 'Utilisez uniquement des chiffres (sans espaces ni caractères spéciaux)')
    .refine(
      (val) => val.length <= 15,
      'Le numéro est trop long (max 15 chiffres)'
    ),
  operator: z.enum(['mtn', 'orange'] as const),
})

export type PaymentFormData = z.infer<typeof paymentFormSchema>

interface MobileMoneyPaymentFormProps {
  onSuccess?: (data: {
    reference: string
    transactionId: string
    operator: 'mtn' | 'orange'
    phone_number: string
  }) => void
  onError?: (error: string) => void
  customDescription?: string
  amount?: number
  onSubmit?: (data: PaymentFormData) => Promise<{
    reference: string
    transactionId: string
    operator: 'mtn' | 'orange'
    phone_number: string
  }>
}

export function MobileMoneyPaymentForm({
  onSuccess,
  onError,
  customDescription,
  amount,
  onSubmit,
}: MobileMoneyPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      operator: 'mtn',
    },
  })

  const selectedOperator = watch('operator')

  const handleFormSubmit = async (data: PaymentFormData) => {
    setIsLoading(true)
    setStatusMessage('')

    try {
      const amountToPay = (amount ?? BASE_DEFAULT_AMOUNT) + PAYMENT_FEE

      if (onSubmit) {
        const result = await onSubmit(data)
        setStatusMessage(
          '⏳ En attente de validation sur votre téléphone...\nVérifiez votre SMS ou le prompt USSD sur votre appareil.'
        )
        onSuccess?.({
          reference: result.reference,
          transactionId: result.transactionId,
          operator: result.operator,
          phone_number: result.phone_number,
        })
        return
      }

      // Formate le numéro pour CamPay (ajoute +237 si nécessaire)
      let formattedPhone = data.phone_number
      if (!formattedPhone.startsWith('+')) {
        // accepte si l'utilisateur a entré 237... ou 6... -> normaliser vers +237...
        if (formattedPhone.startsWith('237')) {
          formattedPhone = `+${formattedPhone}`
        } else {
          formattedPhone = `+237${formattedPhone}`
        }
      }

      // Appel à l'API pour initialiser le paiement
      const response = await fetch('/api/campay/initiate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: formattedPhone,
          operator: data.operator,
          amount: amountToPay,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'initialisation du paiement')
      }

      setStatusMessage(
        '⏳ En attente de validation sur votre téléphone...\nVérifiez votre SMS ou le prompt USSD sur votre appareil.'
      )

      // Optionnel : appeler le callback de succès
      onSuccess?.({
        reference: result.reference,
        transactionId: result.campaign_id || result.transaction_id,
        operator: data.operator,
        phone_number: data.phone_number,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
      setStatusMessage(`❌ ${errorMessage}`)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Paiement par Mobile Money
      </h3>

      {customDescription && (
        <p className="mb-4 text-sm text-gray-600">{customDescription}</p>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Montant (affichage) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Montant à payer
          </label>
          <div className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono text-gray-900">
            {((amount ?? BASE_DEFAULT_AMOUNT) + PAYMENT_FEE).toLocaleString('fr-FR', { minimumFractionDigits: 0 })} XAF
            <span className="block text-xs text-gray-500 mt-1">
              ({(amount ?? BASE_DEFAULT_AMOUNT).toLocaleString('fr-FR')} XAF forfait + {PAYMENT_FEE} XAF frais)
            </span>
          </div>
        </div>

        {/* Sélecteur d'opérateur */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Opérateur
          </label>
          <div className="flex gap-3">
            {['mtn', 'orange'].map((op) => (
              <label
                key={op}
                className="flex items-center cursor-pointer"
              >
                <input
                  type="radio"
                  value={op}
                  {...register('operator')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-sm font-medium text-gray-900 uppercase">
                  {op === 'mtn' ? 'MTN MoMo' : 'Orange Money'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Numéro de téléphone */}
        <div>
          <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
            Numéro de téléphone
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">
              {selectedOperator === 'mtn' ? '+237' : '+237'}
            </span>
            <input
              id="phone_number"
              type="text"
              placeholder="6 75 XX XX 00"
              {...register('phone_number')}
              className={`flex-1 rounded-md border ${
                errors.phone_number ? 'border-red-500' : 'border-gray-300'
              } px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
              disabled={isLoading}
            />
          </div>
          {errors.phone_number && (
            <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>
          )}
        </div>

        {/* Bouton soumission */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '⏳ Traitement...' : 'Confirmer le paiement'}
        </button>

        {/* Message de statut */}
        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-md text-sm whitespace-pre-line ${
              statusMessage.startsWith('❌')
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {statusMessage}
          </div>
        )}

        {/* Info supplémentaire */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800">
          <p className="font-semibold mb-1">⚠️ Important :</p>
          <ul className="list-inside list-disc space-y-0.5">
            <li>Vérifiez que votre solde est suffisant</li>
            <li>Vous recevrez une USSD ou un SMS de confirmation</li>
            <li>Entrez votre code secret (PIN) pour valider</li>
            <li>Max 10 tentatives, puis attendre 24h</li>
          </ul>
        </div>
      </form>
    </div>
  )
}
