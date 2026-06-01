'use client'

import { useState, useTransition, useEffect } from 'react'
import { createDemandeAbonnement } from '../../actions'
import { createClient } from '../../../lib/supabase/client'
import Image from 'next/image'
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Loader2,
  Zap,
  Star,
  Calendar,
  ShieldCheck,
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
    price: 700,
    period: 'semaine',
    passages: '2 passages / semaine',
    bagsPerPassage: 2,
    color: 'from-slate-700 to-slate-800',
    accent: 'text-blue-300',
    accentBg: 'bg-blue-300/10',
    badge: 'Flexible',
    icon: <Zap className="w-7 h-7" />,
    highlight: 'Sans engagement',
    features: [
      '1 sacs poubelles / passage',
      '2 ramassages par semaine',
      'Renouvelable chaque semaine',
      'Sans engagement',
    ],
  },
]

const OPERATEURS = [
  { id: 'mtn', label: 'MTN MoMo', color: 'bg-yellow-400 text-yellow-900', number: '677 00 00 00', logo: '📶' },
  { id: 'orange', label: 'Orange Money', color: 'bg-orange-500 text-white', number: '655 00 00 00', logo: '🟠' },
]

export default function SubscribePage() {
  const [step, setStep] = useState<'forfait' | 'paiement' | 'confirmation' | 'profile'>('forfait')
  const [selectedForfait, setSelectedForfait] = useState<typeof FORFAITS[0] | null>(null)
  const [selectedOperateur, setSelectedOperateur] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
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
    const isProfileComplete = userProfile?.phone && userProfile?.repere_textuel
    if (!isProfileComplete) {
      setStep('profile')
      setSelectedForfait(forfait)
      return
    }
    setSelectedForfait(forfait)
    setStep('paiement')
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createDemandeAbonnement(formData)
      if (result && !result.success) {
        setError(result.error ?? 'Erreur inconnue')
      }
    })
  }

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const phone = formData.get('phone') as string
    const repere_textuel = formData.get('repere_textuel') as string
    const lat = formData.get('lat') as string
    const lng = formData.get('lng') as string

    const supabase = createClient()
    const updates: Record<string, unknown> = { phone, repere_textuel }
    if (lat && lng) {
      updates.coords_gps = { lat: parseFloat(lat), lng: parseFloat(lng) }
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userProfile?.id)

    if (!error) {
      setUserProfile({ ...userProfile, phone, repere_textuel })
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
            <Image src="/logo.png" alt="LePointCitoyen" width={40} height={40} className="rounded-xl" />
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
            const needsProfile = !userProfile?.phone || !userProfile?.repere_textuel
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-8 space-y-2">
              <h1 className="text-4xl font-black text-slate-900">Paiement Mobile</h1>
              <p className="text-slate-500 font-medium">
                Forfait sélectionné : <span className="font-black text-slate-900">{selectedForfait.label}</span> —{' '}
                <span className="text-green-700 font-black">{selectedForfait.price.toLocaleString()} FCFA/{selectedForfait.period}</span>
              </p>
            </div>

            <input type="hidden" name="type_forfait" value={selectedForfait.id} />

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-2xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                {error}
              </div>
            )}

            {/* Operator selection */}
            <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100 space-y-5">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-slate-400" />
                <h3 className="font-black text-slate-900 text-lg">Choisissez votre opérateur</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {OPERATEURS.map((op) => (
                  <label
                    key={op.id}
                    id={`operateur-${op.id}`}
                    className={`cursor-pointer rounded-2xl border-2 p-5 flex flex-col items-center gap-3 transition-all
                      ${selectedOperateur === op.id ? 'border-green-600 bg-green-50' : 'border-slate-100 hover:border-slate-300'}`}
                  >
                    <input
                      type="radio"
                      name="operateur"
                      value={op.id}
                      required
                      className="sr-only"
                      onChange={() => setSelectedOperateur(op.id)}
                    />
                    <span className="text-4xl">{op.logo}</span>
                    <div className="text-center">
                      <p className="font-black text-slate-900">{op.label}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">Mobile Money</p>
                    </div>
                    {selectedOperateur === op.id && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Payment instructions */}
            {selectedOperateur && (
              <div className={`rounded-[2rem] p-7 space-y-4 ${selectedOperateur === 'mtn'
                ? 'bg-yellow-50 border border-yellow-200'
                : 'bg-orange-50 border border-orange-200'
                }`}>
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-5 h-5 ${selectedOperateur === 'mtn' ? 'text-yellow-700' : 'text-orange-700'}`} />
                  <h3 className={`font-black text-lg ${selectedOperateur === 'mtn' ? 'text-yellow-900' : 'text-orange-900'}`}>
                    Instructions de paiement
                  </h3>
                </div>
                <div className={`space-y-2 text-sm font-medium ${selectedOperateur === 'mtn' ? 'text-yellow-800' : 'text-orange-800'}`}>
                  <p>1. Ouvrez votre app <strong>{selectedOperateur === 'mtn' ? 'MTN MoMo' : 'Orange Money'}</strong></p>
                  <p>2. Envoyez <strong>{selectedForfait.price.toLocaleString()} FCFA</strong> au numéro :</p>
                  <div className={`text-2xl font-black tracking-wider py-3 px-5 rounded-2xl ${selectedOperateur === 'mtn' ? 'bg-yellow-200 text-yellow-900' : 'bg-orange-200 text-orange-900'
                    }`}>
                    {OPERATEURS.find(o => o.id === selectedOperateur)?.number}
                  </div>
                  <p>3. Dans le motif, indiquez : <strong>LPC - {selectedForfait.label}</strong></p>
                  <p>4. Entrez votre numéro de téléphone ci-dessous et soumettez la demande.</p>
                </div>
              </div>
            )}

            {/* Phone number */}
            <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100 space-y-4">
              <h3 className="font-black text-slate-900 text-lg">Votre numéro de paiement</h3>
              <p className="text-sm text-slate-500 font-medium">Entrez le numéro depuis lequel vous avez effectué le paiement.</p>
              <input
                name="phone_payment"
                type="tel"
                required
                placeholder="Ex : 677 00 00 00"
                className="block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all font-medium text-lg tracking-wider"
              />
            </div>

            <button
              type="submit"
              disabled={isPending || !selectedOperateur}
              id="submit-demande"
              className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-slate-200"
            >
              {isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  J'ai effectué le paiement — Soumettre
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-400 font-medium px-4">
              Votre abonnement sera activé dans les <strong>24h</strong> après vérification par notre équipe.
            </p>
          </form>
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
                    Adresse / Quartier / Repères (Obligatoire)
                  </label>
                  <input
                    name="repere_textuel"
                    type="text"
                    required
                    defaultValue={userProfile?.repere_textuel || ''}
                    placeholder="Ex : Akwa, face Boulangerie Z, Portail Vert"
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
                  <span className="text-[10px] font-black bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full uppercase">Recommandé</span>
                </div>
              </div>

              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Le GPS permet à notre agent de localiser précisément votre domicile sur sa carte de collecte.
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
