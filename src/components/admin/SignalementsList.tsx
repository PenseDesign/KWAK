'use client'

import { useState, useEffect, useTransition } from 'react'
import { getSignalements, resolveSignalement } from '../../app/actions'
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  MessageSquare,
  User,
  Phone
} from 'lucide-react'

export function SignalementsList() {
  const [signalements, setSignalements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const fetchSignalements = async () => {
    const res = await getSignalements()
    if (res.success) setSignalements(res.signalements)
    setLoading(false)
  }

  useEffect(() => {
    fetchSignalements()
  }, [])

  const handleResolve = (id: string) => {
    startTransition(async () => {
      const res = await resolveSignalement(id)
      if (res.success) {
        setSignalements(signalements.filter(s => s.id !== id))
      }
    })
  }

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300" /></div>

  if (signalements.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] p-12 text-center shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100">
        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-slate-900">Aucun signalement</h3>
        <p className="text-slate-400 text-sm font-medium">Tous les problèmes clients ont été traités.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[2rem] shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <h2 className="text-xl font-black text-slate-900">Signalements Clients</h2>
        </div>
        <span className="bg-red-50 text-red-600 text-xs font-black px-3 py-1 rounded-full uppercase border border-red-100">
          {signalements.length} Ouvert{signalements.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="divide-y divide-slate-50">
        {signalements.map((s) => (
          <div key={s.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">
                    {s.profiles?.repere_textuel || "Adresse non spécifiée"}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-bold mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {s.profiles?.phone || "Inconnu"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(s.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-600 font-medium italic">
                  "{s.message}"
                </p>
              </div>
            </div>

            <button
              onClick={() => handleResolve(s.id)}
              disabled={isPending}
              className="px-6 py-3 bg-green-50 text-green-700 border border-green-100 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-green-100 transition-all active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Marquer comme traité
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
