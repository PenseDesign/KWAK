/**
 * USSDPaymentFlow — Paiement Mobile Money via deep-link USSD
 *
 * Solution temporaire en attendant les accès API Campay production.
 * Ce composant génère des deep-links tel: qui ouvrent directement le
 * numéroteur du téléphone avec le code USSD pré-rempli (MTN / Orange).
 *
 * TODO: Remplacer par MobileMoneyPaymentForm + Campay API quand disponible.
 */

'use client'

import { useState } from 'react'
import {
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Copy,
  Phone,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Hash,
} from 'lucide-react'

// ─── Numéros de réception des paiements ───────────────────────────────────────
// Ces numéros sont publics (l'utilisateur doit savoir à qui il envoie l'argent)
const MTN_PHONE = process.env.NEXT_PUBLIC_MTN_BUSINESS_PHONE || '651156233'
const ORANGE_PHONE = process.env.NEXT_PUBLIC_ORANGE_BUSINESS_PHONE || '689011889'

// ─── Codes USSD Cameroun ───────────────────────────────────────────────────────
// MTN MoMo   : *126*1*DESTINATAIRE*MONTANT#
// Orange Money: #150*4*MONTANT*DESTINATAIRE#
const getMTNUSSDLink = (amount: number) =>
  `tel:*126*1*${MTN_PHONE}*${amount}%23`

const getOrangeUSSDLink = (amount: number) =>
  `tel:%23150*1*${amount}*${ORANGE_PHONE}%23`

// ─── Types ────────────────────────────────────────────────────────────────────
export interface USSDPaymentData {
  operator: 'mtn' | 'orange'
  phone_number: string      // Numéro depuis lequel le paiement a été fait
  transaction_id: string    // ID de transaction reçu par SMS
  amount: number            // Montant payé
}

interface USSDPaymentFlowProps {
  amount: number            // Prix du forfait (ex: 2500)
  forfaitLabel: string      // Ex: "Mensuel Basique"
  onSubmit: (data: USSDPaymentData) => Promise<void>
  onError?: (msg: string) => void
}

// ─── Composant principal ───────────────────────────────────────────────────────
export function USSDPaymentFlow({
  amount,
  forfaitLabel,
  onSubmit,
  onError,
}: USSDPaymentFlowProps) {
  const [step, setStep] = useState<'operator' | 'confirm'>('operator')
  const [selectedOperator, setSelectedOperator] = useState<'mtn' | 'orange' | null>(null)
  const [transactionId, setTransactionId] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const businessPhone = selectedOperator === 'mtn' ? MTN_PHONE : ORANGE_PHONE

  const ussdCode =
    selectedOperator === 'mtn'
      ? `*126*1*${MTN_PHONE}*${amount}#`
      : `#150*4*${amount}*${ORANGE_PHONE}#`

  const ussdLink =
    selectedOperator === 'mtn'
      ? getMTNUSSDLink(amount)
      : getOrangeUSSDLink(amount)

  const handleCopyPhone = async () => {
    await navigator.clipboard.writeText(businessPhone)
    setCopiedPhone(true)
    setTimeout(() => setCopiedPhone(false), 2000)
  }

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(ussdCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleSelectOperator = (op: 'mtn' | 'orange') => {
    setSelectedOperator(op)
    setStep('confirm')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedOperator) {
      onError?.('Veuillez sélectionner un opérateur.')
      return
    }
    if (!transactionId.trim()) {
      onError?.("Veuillez saisir l'ID de votre transaction.")
      return
    }
    if (!phoneNumber.trim() || phoneNumber.replace(/\D/g, '').length < 9) {
      onError?.('Veuillez saisir un numéro de téléphone valide.')
      return
    }

    setIsLoading(true)
    try {
      await onSubmit({
        operator: selectedOperator,
        phone_number: phoneNumber.replace(/\D/g, ''),
        transaction_id: transactionId.trim().toUpperCase(),
        amount,
      })
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── ÉTAPE 1 : Choisir l'opérateur et lancer le paiement ─────────────────────
  if (step === 'operator') {
    return (
      <div className="space-y-5">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
          <p className="font-black text-blue-900 flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Comment payer ?
          </p>
          <ol className="space-y-2">
            {[
              'Cliquez sur votre opérateur ci-dessous',
              'Votre téléphone ouvre le code de paiement pré-rempli',
              'Appuyez "Appeler" puis saisissez votre PIN secret',
              "Revenez ici et entrez l'ID de transaction reçu par SMS",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-blue-700 font-medium">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Montant à payer */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
            Montant à envoyer
          </p>
          <p className="text-5xl font-black">
            {amount.toLocaleString('fr-FR')}
            <span className="text-2xl text-slate-300 ml-2">FCFA</span>
          </p>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            Forfait {forfaitLabel}
          </p>
        </div>

        {/* Boutons opérateurs */}
        <p className="text-center text-sm font-black text-slate-500 uppercase tracking-widest">
          Choisissez votre opérateur
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* ── MTN MoMo ── */}
          <a
            href={getMTNUSSDLink(amount)}
            onClick={() => handleSelectOperator('mtn')}
            className="flex flex-col items-center gap-3 p-6 bg-gradient-to-b from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 rounded-2xl transition-all active:scale-[0.97] shadow-lg shadow-yellow-200 no-underline"
          >
            <div className="w-16 h-16 bg-white/30 backdrop-blur rounded-full flex items-center justify-center">
              <span className="font-black text-yellow-900 text-2xl">M</span>
            </div>
            <div className="text-center">
              <p className="font-black text-yellow-900">MTN MoMo</p>
              <p className="text-yellow-800 text-xs font-bold font-mono">{MTN_PHONE}</p>
            </div>
            <span className="flex items-center gap-1 bg-yellow-600/20 text-yellow-900 text-xs font-black px-3 py-1 rounded-full">
              Payer maintenant <ArrowRight className="w-3 h-3" />
            </span>
          </a>

          {/* ── Orange Money ── */}
          <a
            href={getOrangeUSSDLink(amount)}
            onClick={() => handleSelectOperator('orange')}
            className="flex flex-col items-center gap-3 p-6 bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 rounded-2xl transition-all active:scale-[0.97] shadow-lg shadow-orange-200 no-underline"
          >
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <span className="font-black text-white text-2xl">O</span>
            </div>
            <div className="text-center">
              <p className="font-black text-white">Orange Money</p>
              <p className="text-orange-100 text-xs font-bold font-mono">{ORANGE_PHONE}</p>
            </div>
            <span className="flex items-center gap-1 bg-black/20 text-white text-xs font-black px-3 py-1 rounded-full">
              Payer maintenant <ArrowRight className="w-3 h-3" />
            </span>
          </a>
        </div>

        {/* Lien si déjà payé */}
        <div className="text-center pt-2">
          <p className="text-slate-400 text-xs font-medium mb-2">Vous avez déjà effectué le paiement ?</p>
          <button
            type="button"
            onClick={() => setStep('confirm')}
            className="text-green-600 font-bold text-sm hover:underline flex items-center gap-1 mx-auto"
          >
            Entrer mon ID de transaction <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // ── ÉTAPE 2 : Saisir l'ID de transaction ────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setStep('operator')}
          className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div>
          <h3 className="font-black text-slate-900">Confirmer le paiement</h3>
          <p className="text-slate-400 text-xs font-medium">Étape 2 sur 2</p>
        </div>
      </div>

      {/* Sélecteur opérateur si on arrive via "Déjà payé" */}
      {!selectedOperator && (
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
            Opérateur utilisé
          </p>
          <div className="flex gap-3">
            {(['mtn', 'orange'] as const).map((op) => (
              <label
                key={op}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer font-bold text-sm transition-all ${selectedOperator === op
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name="operator_select"
                  value={op}
                  onChange={() => setSelectedOperator(op)}
                />
                {op === 'mtn' ? '🟡 MTN MoMo' : '🟠 Orange Money'}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Récap du destinataire */}
      {selectedOperator && (
        <div className="space-y-3">
          {/* Code USSD à composer si le deep-link n'a pas fonctionné */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Code USSD (si le lien n'a pas fonctionné)
            </p>
            <div className="flex items-center justify-between gap-3">
              <code className="font-mono font-black text-slate-900 text-sm bg-white border border-slate-200 px-3 py-2 rounded-xl flex-1 break-all">
                {ussdCode}
              </code>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-2.5 bg-slate-200 hover:bg-slate-300 rounded-xl transition-colors shrink-0"
              >
                {copiedCode ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-600" />
                )}
              </button>
            </div>
          </div>

          {/* Résumé du destinataire */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${selectedOperator === 'mtn'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-orange-50 border-orange-200'
              }`}
          >
            <div>
              <p
                className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${selectedOperator === 'mtn' ? 'text-yellow-700' : 'text-orange-700'
                  }`}
              >
                {selectedOperator === 'mtn' ? 'MTN MoMo' : 'Orange Money'} — Envoyé vers
              </p>
              <p
                className={`font-black text-lg font-mono ${selectedOperator === 'mtn' ? 'text-yellow-900' : 'text-orange-900'
                  }`}
              >
                {businessPhone}
              </p>
              <p
                className={`text-sm font-black ${selectedOperator === 'mtn' ? 'text-yellow-800' : 'text-orange-800'
                  }`}
              >
                {amount.toLocaleString('fr-FR')} FCFA
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyPhone}
              className={`p-2.5 rounded-xl transition-colors shrink-0 ${selectedOperator === 'mtn'
                  ? 'bg-yellow-200 hover:bg-yellow-300'
                  : 'bg-orange-200 hover:bg-orange-300'
                }`}
            >
              {copiedPhone ? (
                <CheckCircle2 className="w-4 h-4 text-green-700" />
              ) : (
                <Copy
                  className={`w-4 h-4 ${selectedOperator === 'mtn' ? 'text-yellow-700' : 'text-orange-700'
                    }`}
                />
              )}
            </button>
          </div>
        </div>
      )}

      {/* ID de transaction */}
      <div>
        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
          ID de transaction (reçu par SMS) *
        </label>
        <input
          type="text"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="Ex: CM24061234 ou MP2406XXXXX..."
          required
          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-slate-900 placeholder:font-normal placeholder:font-sans focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none transition-all"
        />
        <p className="text-xs text-slate-400 mt-1.5 ml-1">
          Trouvez cet ID dans le SMS de confirmation de votre opérateur.
        </p>
      </div>

      {/* Numéro payeur */}
      <div>
        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
          Numéro MoMo utilisé pour payer *
        </label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
            placeholder="6XX XX XX XX"
            maxLength={9}
            required
            className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none transition-all"
          />
        </div>
      </div>

      {/* Notice délai */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 font-medium leading-relaxed">
          Votre abonnement sera activé <strong>dans les 2h</strong> après vérification de votre
          paiement par notre équipe. Vous recevrez une confirmation.
        </p>
      </div>

      {/* Bouton soumettre */}
      <button
        type="submit"
        disabled={
          isLoading ||
          !transactionId.trim() ||
          !phoneNumber.trim() ||
          !selectedOperator
        }
        className="w-full py-5 bg-slate-900 hover:bg-black text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <CheckCircle2 className="w-6 h-6" />
        )}
        {isLoading ? 'Envoi en cours...' : 'Confirmer mon paiement'}
      </button>
    </form>
  )
}
