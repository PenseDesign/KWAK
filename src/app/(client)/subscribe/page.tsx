'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createDemandeAbonnementDraft } from '../../actions'
import { createClient } from '../../../lib/supabase/client'

// ─── [USSD MODE ACTIF] ──────────────────────────────────────────────────────
// Solution temporaire en attendant les credentials API Campay production.
// Pour réactiver Campay : décommenter l'import ci-dessous et remplacer
// USSDPaymentFlow par MobileMoneyPaymentForm dans le JSX.
//
// TODO: import { MobileMoneyPaymentForm, type PaymentFormData } from '@/components/payment/MobileMoneyPaymentForm'
import { USSDPaymentFlow, type USSDPaymentData } from '@/components/payment/USSDPaymentFlow'
// ─────────────────────────────────────────────────────────────────────────────

import Image from 'next/image'
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Zap,
  Star,
  Calendar,
  Home,
  Phone,
  MapPin,
  Navigation,
  Info,
} from 'lucide-react'

const FORFAITS = [
  {
    id: 'Mensuel Basique',
    label: 'Mensuel Basique',
    price: 2500,
    period: 'mois',
    passages: '1 passages / semaine',
    bagsPerPassage: 1,
    color: 'from-slate-800 to-slate-900',
    accent: 'text-green-400',
    accentBg: 'bg-green-400/10',
    badge: null,
    icon: <Calendar className="w-7 h-7" />,
    highlight: '04 passages / mois',
    features: [
      '1 sac poubelle / passage',
      '1 ramassage par semaine',
      'Suivi en temps réel',
      'Support client',
    ],
  },
  {
    id: 'Mensuel Pro',
    label: 'Mensuel Pro',
    price: 3000,
    period: 'mois',
    passages: '2 passages / semaine',
    bagsPerPassage: 2,
    color: 'from-green-700 to-green-900',
    accent: 'text-yellow-300',
    accentBg: 'bg-yellow-300/10',
    badge: 'Populaire',
    icon: <Star className="w-7 h-7" />,
    highlight: '08 passages / mois',
    features: [
      '01 sacs poubelles / passage',
      '02 ramassages par semaine',
      'Suivi en temps réel',
      'Support prioritaire',
      'Rapport mensuel',
    ],
  },
  {
    id: 'Hebdomadaire',
    label: 'Hebdomadaire',
    price: 1000,
    period: 'mois',
    passages: '2 passages / mois',
    bagsPerPassage: 2,
    color: 'from-slate-700 to-slate-800',
    accent: 'text-blue-300',
    accentBg: 'bg-blue-300/10',
    badge: 'Flexible',
    icon: <Zap className="w-7 h-7" />,
    highlight: 'Sans engagement',
    features: [
      '1 sacs poubelles / passage',
      '2 ramassages par mois',
      'Renouvelable chaque mois',
      'Sans engagement',
    ],
  },
]

export default function SubscribePage() {
  const router = useRouter()
  const [step, setStep] = useState<'forfait' | 'paiement' | 'confirmation' | 'profile'>('forfait')
  const [selectedForfait, setSelectedForfait] = useState<typeof FORFAITS[0] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsCoords, setGpsCoords] = useState<{ lat: number, lng: number } | null>(null)

  const handleGetGpsInSubscribe = () => {
    setGpsLoading(true)
    setError(null)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setGpsLoading(false)
        },
        (err) => {
          setError("Impossible de récupérer la position GPS. Vérifiez les permissions.")
          setGpsLoading(false)
        },
        { enableHighAccuracy: true }
      )
    } else {
      setError("La géolocalisation n'est pas supportée par votre navigateur.")
      setGpsLoading(false)
    }
  }

  useEffect(() => {
    const supabase = createClient()
    const checkProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setUserProfile(profile)
      }
      setLoadingProfile(false)
    }
    checkProfile()
  }, [])

  const handleSelectForfait = (forfait: typeof FORFAITS[0]) => {
    // Vérifier si le profil est complet avant de continuer
    const isProfileComplete = userProfile?.phone && userProfile?.repere_textuel && userProfile?.full_name && userProfile?.quartier && userProfile?.coords_gps
    if (!isProfileComplete) {
      setStep('profile')
      setSelectedForfait(forfait)
      return
    }
    setSelectedForfait(forfait)
    setStep('paiement')
  }

  // ─── [USSD MODE] Handler paiement par code USSD ──────────────────────────────
  // Enregistre la demande avec l'ID de transaction saisi par le client.
  // L'admin valide ensuite manuellement depuis le dashboard.
  //
  // TODO: Remplacer par handleCampayPaymentSubmit() quand API Campay disponible.
  const handleUSSDPaymentSubmit = async (data: USSDPaymentData) => {
    if (!selectedForfait) {
      throw new Error('Veuillez sélectionner un forfait avant de payer.')
    }

    const formData = new FormData()
    formData.append('type_forfait', selectedForfait.id)
    formData.append('operateur', data.operator)
    formData.append('phone_payment', data.phone_number)
    formData.append('transaction_id_ussd', data.transaction_id)
    formData.append('montant_declare', String(data.amount))

    const result = await createDemandeAbonnementDraft(formData)
    if (!result.success) {
      throw new Error(result.error || 'Impossible de créer la demande d\'abonnement.')
    }

    router.push('/dashboard?subscribed=pending')
  }
  // ─────────────────────────────────────────────────────────────────────────────

  /*
  // ── [CAMPAY - TEMPORAIREMENT DÉSACTIVÉ] ──────────────────────────────────────
  // Réactiver quand les credentials API Campay production sont disponibles.
  // Remplacer aussi l'import USSDPaymentFlow par MobileMoneyPaymentForm.
  const handleCampayPaymentSubmit = async (data: PaymentFormData) => {
    if (!selectedForfait) throw new Error('Veuillez sélectionner un forfait.')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Session expirée. Veuillez vous reconnecter.')
    const formData = new FormData()
    formData.append('type_forfait', selectedForfait.id)
    formData.append('operateur', data.operator)
    formData.append('phone_payment', data.phone_number)
    const draft = await createDemandeAbonnementDraft(formData)
    if (!draft.success || !draft.demandeId) throw new Error(draft.error || 'Erreur création demande.')
    const response = await fetch('/api/campay/initiate-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ phone_number: data.phone_number, operator: data.operator, amount: selectedForfait.price + 139, demande_abonnement_id: draft.demandeId }),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Erreur Campay.')
    setPaymentMessage('Paiement initié, confirmez la transaction sur votre téléphone.')
    return { reference: result.reference, transactionId: result.transaction_id || result.campaign_id || '', operator: data.operator, phone_number: data.phone_number }
  }
  // ─────────────────────────────────────────────────────────────────────────────
  */


  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const phone = formData.get('phone') as string
    const repere_textuel = formData.get('repere_textuel') as string
    const full_name = formData.get('full_name') as string
    const quartier = formData.get('quartier') as string
    const lat = formData.get('lat') as string
    const lng = formData.get('lng') as string

    if (!lat || !lng) {
      setError('Vous devez capturer votre position GPS pour continuer.')
      return
    }

    const supabase = createClient()
    const updates: Record<string, unknown> = { phone, repere_textuel, full_name, quartier, coords_gps: { lat: parseFloat(lat), lng: parseFloat(lng) } }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userProfile?.id)

    if (!error) {
      setUserProfile({ ...userProfile, phone, repere_textuel, full_name, quartier, coords_gps: { lat: parseFloat(lat), lng: parseFloat(lng) } })
      setStep('paiement')
    } else {
      setError('Erreur lors de la mise à jour du profil.')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.jpeg" alt="LePointCitoyen" width={120} height={120} className="rounded-xl" />
            <span className="text-xl font-black tracking-tighter">LEPOINCITOYEN — Abonnement</span>
          </div>
          {step === 'paiement' && (
            <button
              onClick={() => setStep('forfait')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          {(() => {
            const stepsList = ['forfait']
            const needsProfile = !userProfile?.phone || !userProfile?.repere_textuel || !userProfile?.full_name || !userProfile?.quartier || !userProfile?.coords_gps
            if (needsProfile || step === 'profile') {
              stepsList.push('profile')
            }
            stepsList.push('paiement')

            return stepsList.map((s, i) => {
              const isActive = step === s
              const isCompleted = stepsList.indexOf(step) > i
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all
                    ${isActive || isCompleted
                      ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                      : 'bg-slate-100 text-slate-400'
                    }`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                  </div>
                  <span className={`text-sm font-bold hidden sm:block ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                    {s === 'forfait' ? 'Choisir un forfait' : s === 'profile' ? 'Mon Profil' : 'Paiement'}
                  </span>
                  {i < stepsList.length - 1 && <div className="w-8 h-px bg-slate-200" />}
                </div>
              )
            })
          })()}
        </div>

        {/* STEP 1 — Choose plan */}
        {step === 'forfait' && (
          <div>
            <div className="text-center mb-10 space-y-2">
              <h1 className="text-4xl font-black text-slate-900">Choisissez votre forfait</h1>
              <p className="text-slate-500 font-medium">Des collectes régulières pour une ville plus propre.</p>
            </div>

            <div className="grid gap-5">
              {FORFAITS.map((forfait) => (
                <button
                  key={forfait.id}
                  id={`forfait-${forfait.id.toLowerCase().replace(' ', '-')}`}
                  onClick={() => handleSelectForfait(forfait)}
                  className={`bg-gradient-to-br ${forfait.color} text-white rounded-[2rem] p-7 text-left group hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-xl relative overflow-hidden`}
                >
                  {forfait.badge && (
                    <span className={`absolute top-5 right-5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${forfait.accent} bg-white/10`}>
                      {forfait.badge}
                    </span>
                  )}
                  <div className="flex items-start gap-5">
                    <div className={`p-3 rounded-2xl bg-white/10 ${forfait.accent}`}>
                      {forfait.icon}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${forfait.accentBg} ${forfait.accent}`}>
                          {forfait.highlight}
                        </span>
                        <span className={`text-xs font-black px-2.5 py-1 rounded-full bg-white/10 text-white/80 flex items-center gap-1`}>
                          🗑️ {forfait.bagsPerPassage} sac{forfait.bagsPerPassage > 1 ? 's' : ''} / passage
                        </span>
                      </div>
                      <h2 className="text-2xl font-black">{forfait.label}</h2>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black">{forfait.price.toLocaleString()}</span>
                        <span className="text-white/60 font-medium">FCFA / {forfait.period}</span>
                      </div>
                      <ul className="space-y-1.5">
                        {forfait.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                            <CheckCircle2 className="w-4 h-4 text-white/60 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <ArrowRight className="w-6 h-6 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all mt-1 shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — Payment */}
        {step === 'paiement' && selectedForfait && (
          <div className="space-y-6">
            <div className="text-center mb-8 space-y-2">
              <h1 className="text-4xl font-black text-slate-900">Paiement Mobile</h1>
              <p className="text-slate-500 font-medium">
                Forfait sélectionné : <span className="font-black text-slate-900">{selectedForfait.label}</span> —{' '}
                <span className="text-green-700 font-black">{selectedForfait.price.toLocaleString()} FCFA/{selectedForfait.period}</span>
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-2xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                {error}
              </div>
            )}

            {/* ─── [USSD MODE ACTIF] ─────────────────────────────────────────────── */}
            {/* TODO: Remplacer par <MobileMoneyPaymentForm> quand Campay API dispo  */}
            <USSDPaymentFlow
              amount={selectedForfait.price}
              forfaitLabel={selectedForfait.label}
              onSubmit={handleUSSDPaymentSubmit}
              onError={(message) => setError(message)}
            />
            {/* ─────────────────────────────────────────────────────────────────── */}

            {/*
            [CAMPAY - TEMPORAIREMENT DÉSACTIVÉ]
            <MobileMoneyPaymentForm
              amount={selectedForfait.price}
              customDescription={`Payer ${(selectedForfait.price + 139).toLocaleString()} FCFA`}
              onSubmit={handleCampayPaymentSubmit}
              onError={(message) => setError(message)}
              onSuccess={() => setError(null)}
            />
            */}

            <div className="text-center text-xs text-slate-400 font-medium px-4">
              Votre abonnement sera activé dans les 2h après vérification de votre paiement.
            </div>
          </div>
        )}

        {/* STEP — Complete profile */}
        {step === 'profile' && selectedForfait && (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="text-center mb-8 space-y-2">
              <h1 className="text-4xl font-black text-slate-900">Complétez votre profil</h1>
              <p className="text-slate-500 font-medium">
                Pour finaliser votre abonnement <span className="font-black text-slate-900">{selectedForfait.label}</span>, nous avons besoin de vos coordonnées de collecte.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-2xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                {error}
              </div>
            )}

            {/* Section: Coordonnées obligatoires */}
            <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Home className="w-5 h-5 text-green-600" />
                <h3 className="font-black text-slate-900 text-lg">Adresse de Collecte</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                    Nom Complet (Obligatoire)
                  </label>
                  <input
                    name="full_name"
                    type="text"
                    required
                    defaultValue={userProfile?.full_name || ''}
                    placeholder="Ex: Jean Dupont"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none transition-all font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                    Quartier (Obligatoire)
                  </label>
                  <input
                    name="quartier"
                    type="text"
                    required
                    defaultValue={userProfile?.quartier || ''}
                    placeholder="Ex: Akwa, Bonanjo..."
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none transition-all font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                    Adresse Détaillée / Repères (Obligatoire)
                  </label>
                  <input
                    name="repere_textuel"
                    type="text"
                    required
                    defaultValue={userProfile?.repere_textuel || ''}
                    placeholder="Ex : face Boulangerie Z, Portail Vert"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none transition-all font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                    Téléphone de contact (Obligatoire)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                    <input
                      name="phone"
                      type="tel"
                      required
                      defaultValue={userProfile?.phone || ''}
                      placeholder="Ex: 6XX XX XX XX"
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none transition-all font-medium text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: GPS (Optionnel) */}
            <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <h3 className="font-black text-slate-900 text-lg">Position GPS</h3>
                  <span className="text-[10px] font-black bg-red-50 text-red-500 px-2 py-0.5 rounded-full uppercase">Obligatoire</span>
                </div>
              </div>

              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Le GPS est obligatoire. Il permet à notre agent de localiser précisément votre domicile sur sa carte de collecte.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="button"
                  onClick={handleGetGpsInSubscribe}
                  disabled={gpsLoading}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  {gpsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                  {gpsCoords ? "Mettre à jour ma position" : "Capturer ma position GPS"}
                </button>

                {gpsCoords && (
                  <div className="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-50 px-3 py-2 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Position capturée : {gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}
                  </div>
                )}
              </div>

              {/* Hidden inputs to send GPS coordinates */}
              <input type="hidden" name="lat" value={gpsCoords?.lat || ''} />
              <input type="hidden" name="lng" value={gpsCoords?.lng || ''} />
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => setStep('forfait')}
                className="w-full sm:w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 py-5 rounded-2xl font-black text-lg transition-all active:scale-[0.98]"
              >
                Retour
              </button>

              <button
                type="submit"
                className="w-full sm:w-2/3 bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-slate-200"
              >
                Continuer vers le paiement
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <Info className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700 font-medium">
                Ces informations sont indispensables pour organiser le passage de nos camions chez vous.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
