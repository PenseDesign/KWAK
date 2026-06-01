'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { getClientStatus, reportIssue, signOut } from '../../actions'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Loader2,
  PackageX,
  LogOut,
  History,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Phone,
  Sparkles,
  User,
  Info,
} from 'lucide-react'
import { createClient } from '../../../lib/supabase/client'
import Image from 'next/image'
import { JoursPassageSelector } from '../../../components/client/JoursPassageSelector'

export default function DashboardContent() {
  const [loading, setLoading] = useState(true)
  const [statusData, setStatusData] = useState<any>(null)
  const [reporting, setReporting] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  const searchParams = useSearchParams()
  const isPendingSubscription = searchParams.get('subscribed') === 'pending'

  useEffect(() => {
    const supabase = createClient()
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  useEffect(() => {
    if (!user) return
    const fetchStatus = async () => {
      try {
        const data = await getClientStatus()
        setStatusData(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchStatus()

    // Rafraîchir automatiquement toutes les 30 secondes
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [user])

  const handleReport = async () => {
    if (!user) return
    setReporting(true)
    await reportIssue("Le camion n'est pas passé")
    setReportSuccess(true)
    setReporting(false)
    setTimeout(() => setReportSuccess(false), 5000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
      </div>
    )
  }

  const abonnement = statusData?.abonnement
  const nextDate = statusData?.nextPassageDate
  const historique = statusData?.historique || []

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">

      {/* Top Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.jpeg" alt="LePointCitoyen" width={40} height={40} className="rounded-xl" />
            <span className="text-xl font-black tracking-tighter">LEPOINCITOYEN</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/profil"
              className="p-2.5 bg-slate-50 text-slate-500 hover:text-green-600 rounded-xl transition-all hover:bg-green-50"
              title="Mon Profil"
            >
              <User className="w-5 h-5" />
            </a>
            <button
              onClick={() => signOut()}
              className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-8 grid lg:grid-cols-3 gap-8">

        {/* Left Column: Status & Actions */}
        <div className="lg:col-span-2 space-y-6">

          {/* Welcome Card */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
              <ShieldCheck className="w-48 h-48 text-green-600" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="space-y-1">
                <h1 className="text-3xl font-black text-slate-900 leading-tight">Bonjour ! 👋</h1>
                <p className="text-slate-500 font-medium">Votre ville est plus propre grâce à vous.</p>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${abonnement?.status === 'actif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                  <div className={`w-2 h-2 rounded-full ${abonnement?.status === 'actif' ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`} />
                  Forfait {abonnement?.status === 'actif' ? 'Actif' : 'Inactif'}
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm font-bold">
                  <CreditCard className="w-4 h-4" />
                  {abonnement?.type_forfait || 'Aucun forfait'}
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Banner — shown if no active subscription */}
          {!isPendingSubscription && abonnement?.status !== 'actif' && (
            <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-green-200 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 opacity-10">
                <Sparkles className="w-48 h-48" />
              </div>
              <div className="relative z-10 space-y-5">
                <div className="space-y-2">
                  <p className="text-green-200 font-bold text-xs tracking-widest uppercase">Action requise</p>
                  <h2 className="text-2xl font-black leading-tight">Vous n'avez pas encore d'abonnement actif</h2>
                  <p className="text-green-100 text-sm font-medium opacity-90">
                    Souscrivez dès maintenant pour profiter des collectes LEPOINCITOYEN à domicile.
                  </p>
                </div>
                <a
                  href="/subscribe"
                  id="cta-subscribe"
                  className="inline-flex items-center gap-2 bg-white text-green-700 font-black py-3 px-6 rounded-2xl hover:bg-green-50 transition-colors shadow-lg"
                >
                  <CreditCard className="w-5 h-5" />
                  Souscrire maintenant
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* Pending subscription confirmation */}
          {isPendingSubscription && (
            <div className="bg-blue-50 border border-blue-200 rounded-[2rem] p-7 flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-blue-900 text-lg">Demande envoyée avec succès !</p>
                <p className="text-blue-700 text-sm font-medium">
                  Votre abonnement sera activé dans les <strong>24h</strong> après vérification du paiement.
                </p>
              </div>
            </div>
          )}

          {/* Profile Incomplete Alert */}
          {(!statusData?.profile?.repere_textuel || !statusData?.profile?.phone) && (
            <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-7 flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                <Info className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="font-black text-amber-900 text-lg">Profil incomplet</p>
                  <p className="text-amber-700 text-sm font-medium">
                    Veuillez renseigner votre <strong>adresse exacte</strong> et votre <strong>téléphone de contact</strong> pour que l'agent puisse vous trouver.
                  </p>
                </div>
                <a
                  href="/profil"
                  className="inline-flex items-center gap-2 bg-amber-600 text-white font-bold py-2 px-4 rounded-xl hover:bg-amber-700 transition-colors text-sm"
                >
                  Compléter mon profil
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* Next Passage Large Card */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200 text-white relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-10">
              <Calendar className="w-64 h-64" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-2">
                <p className="text-green-400 font-bold tracking-widest uppercase text-xs">Prochain Passage Prévu</p>
                <h2 className="text-4xl font-black">
                  {nextDate ? new Date(nextDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Date à définir'}
                </h2>
                <p className="text-slate-400 text-sm font-medium">
                  Préparez vos bacs la veille au soir.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex flex-col items-center">
                <Clock className="w-8 h-8 text-green-400 mb-2" />
                <span className="text-xs font-bold text-slate-300">Heure estimée</span>
                <span className="text-xl font-black">{statusData?.estimatedTime || '07:30 - 09:00'}</span>
              </div>
            </div>
          </div>

          {/* Historique */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-6 h-6 text-slate-400" />
                <h3 className="text-xl font-black text-slate-900">Passages récents</h3>
              </div>
              <button className="text-sm font-bold text-green-600 hover:underline flex items-center gap-1">
                Tout voir <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {historique.length > 0 ? historique.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Ramassage effectué</p>
                      <p className="text-xs text-slate-400 font-medium">{new Date(h.heure_passage).toLocaleString('fr-FR')}</p>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-tighter">
                    Validé
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-slate-400 font-medium">
                  Aucun historique pour le moment.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Mini Info Cards */}
        <div className="space-y-6">

          {/* Jours de passage (seulement si actif) */}
          {abonnement?.status === 'actif' && (
            <JoursPassageSelector
              initialJours={abonnement.jours_passage}
              typeForfait={abonnement.type_forfait}
            />
          )}

          {/* Signalement Card */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Un problème ?</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Si les agents ne sont pas passés ou si vous avez une réclamation, signalez-le ici.
              </p>
            </div>
            <button
              onClick={handleReport}
              disabled={reporting || reportSuccess}
              className="w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50
                bg-slate-900 text-white hover:bg-black shadow-lg shadow-slate-200"
            >
              {reporting ? <Loader2 className="w-5 h-5 animate-spin" /> : reportSuccess ? "Signalé !" : "Signaler un oubli"}
            </button>
          </div>

          {/* Support Card */}
          <div className="bg-green-600 rounded-[2.5rem] p-8 text-white space-y-6 shadow-xl shadow-green-100">
            <div className="space-y-2">
              <h3 className="text-xl font-black leading-tight">Besoin de nous contacter ?</h3>
              <p className="text-green-100 text-sm font-medium opacity-80">
                Notre support client est disponible pour vous aider avec votre abonnement.
              </p>
            </div>
            <a href="tel:+237600000000" className="w-full bg-white text-green-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-50 transition-colors">
              <Phone className="w-5 h-5" />
              Contacter le support
            </a>
          </div>

        </div>

      </div>
    </div>
  )
}

function Clock({ className, ...props }: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
