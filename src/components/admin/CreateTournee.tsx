'use client'

import { useState, useEffect, useTransition } from 'react'
import { getAgents, createTournee } from '../../app/actions'
import {
  Calendar,
  User,
  Truck,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

export function CreateTournee() {
  const [agents, setAgents] = useState<any[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [selectedAgent, setSelectedAgent] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    async function fetchAgents() {
      const res = await getAgents()
      if (res.success) setAgents(res.agents)
      setLoadingAgents(false)
    }
    fetchAgents()
  }, [])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await createTournee(formData)
      if (res.success) {
        setMessage({
          type: 'success',
          text: `Tournée créée avec succès ! ${res.passagesCount} clients programmés pour ce jour.`
        })
        setSelectedAgent('')
      } else {
        setMessage({ type: 'error', text: res.error || "Erreur lors de la création" })
      }
    })
  }

  const getDayName = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long' })
  }

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
          <Truck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">Nouvelle Tournée</h2>
          <p className="text-slate-500 text-sm font-medium">Générez la liste des collectes du jour</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
              Assigner un Agent
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <select
                name="agent_id"
                required
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-medium appearance-none"
              >
                <option value="">Sélectionner un agent...</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.repere_textuel || agent.phone}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
              Date de la tournée
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input
                name="date"
                type="date"
                required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-medium"
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-blue-700">Logique Automatique</p>
            <p className="text-xs text-blue-600/80 font-medium leading-relaxed">
              En créant une tournée pour le <strong>{getDayName(selectedDate)}</strong>, le système ajoutera
              automatiquement les clients dont l'abonnement prévoit un passage ce jour-là.
            </p>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
            }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || loadingAgents}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 shadow-md shadow-slate-900/10"
        >
          {isPending ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              Générer la Tournée
              <Truck className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
