'use client'

import { useState, useEffect } from 'react'
import { getClientStatus, reportIssue, signOut } from '@/app/actions'
import { AlertTriangle, Calendar, CheckCircle2, Loader2, PackageX, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ClientPage() {
  const [loading, setLoading] = useState(true)
  const [statusData, setStatusData] = useState<any>(null)
  const [reporting, setReporting] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)

  const [user, setUser] = useState<any>(null)

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
        const data = await getClientStatus(user.id)
        setStatusData(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchStatus()
  }, [user])

  const handleReport = async () => {
    if (!user) return
    setReporting(true)
    await reportIssue(user.id, "Le camion n'est pas passé")
    setReportSuccess(true)
    setReporting(false)
    setTimeout(() => setReportSuccess(false), 5000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
      </div>
    )
  }

  const abonnement = statusData?.abonnement
  const nextDate = statusData?.nextPassageDate

  return (
    <div className="min-h-screen bg-green-50 p-4 md:p-8">
      <div className="max-w-md mx-auto space-y-8">
        
        <header className="flex justify-between items-start mt-8">
          <div className="space-y-2 text-left">
            <h1 className="text-4xl font-black text-green-800 tracking-tight">Mon Espace</h1>
            <p className="text-green-600 font-medium">Suivi de vos ramassages KWAK</p>
          </div>
          <button 
            onClick={() => signOut()}
            className="p-3 bg-white text-slate-400 hover:text-red-500 rounded-2xl border border-slate-100 transition-colors shadow-sm"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Statut Abonnement */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-green-100">
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-2xl ${
              abonnement?.status === 'actif' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {abonnement?.status === 'actif' ? <CheckCircle2 className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Forfait {abonnement?.type_forfait || 'Aucun'}</h2>
              <p className={`font-medium ${abonnement?.status === 'actif' ? 'text-green-600' : 'text-red-600'}`}>
                {abonnement?.status === 'actif' ? 'Actif' : 'Inactif / En retard'}
              </p>
            </div>
          </div>
          
          {abonnement && (
            <div className="pt-4 border-t border-slate-100 text-sm text-slate-500">
              Expire le : {new Date(abonnement.date_expiration).toLocaleDateString('fr-FR')}
            </div>
          )}
        </div>

        {/* Prochain Passage */}
        <div className="bg-gradient-to-br from-green-600 to-green-500 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Calendar className="w-24 h-24" />
          </div>
          <h3 className="text-green-100 font-medium mb-1 relative z-10">Prochain passage prévu</h3>
          <p className="text-3xl font-black relative z-10">
            {nextDate ? new Date(nextDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'À définir'}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4 pt-4">
          <button 
            onClick={handleReport}
            disabled={reporting || reportSuccess}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 py-4 rounded-2xl font-medium border border-slate-200 shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {reporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : reportSuccess ? (
              <span className="text-green-600 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Signalé avec succès</span>
            ) : (
              <>
                <PackageX className="w-5 h-5 text-red-500" />
                Signaler un oubli (Le camion n'est pas passé)
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
