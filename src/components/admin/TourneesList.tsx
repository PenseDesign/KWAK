'use client'

import { useState, useEffect } from 'react'
import { getTourneesByDate, getTourneeDetails } from '../../app/actions'
import { Calendar, Loader2, Truck, CheckCircle2, XCircle, Clock, ChevronRight, ArrowLeft, MapPin } from 'lucide-react'

export function TourneesList() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [tournees, setTournees] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTournee, setSelectedTournee] = useState<any | null>(null)
  const [tourneeDetails, setTourneeDetails] = useState<any | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const fetchTournees = async () => {
    setLoading(true)
    const res = await getTourneesByDate(date)
    if (res.success) setTournees(res.tournees)
    setLoading(false)
  }

  useEffect(() => {
    fetchTournees()
  }, [date])

  const handleSelectTournee = async (tourneeId: string) => {
    setLoadingDetails(true)
    const res = await getTourneeDetails(tourneeId)
    if (res.success) {
      setSelectedTournee(res.tournee)
      setTourneeDetails(res.passages)
    }
    setLoadingDetails(false)
  }

  if (selectedTournee) {
    return (
      <div className="bg-white rounded-[2rem] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100">
        <button 
          onClick={() => setSelectedTournee(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-bold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Retour aux tournées
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              Tournée du {new Date(selectedTournee.date).toLocaleDateString('fr-FR')}
            </h2>
            <p className="text-slate-500 font-medium mt-1">
              Agent: {selectedTournee.agent?.repere_textuel || selectedTournee.agent?.phone}
            </p>
          </div>
          <div className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm uppercase tracking-widest">
            {selectedTournee.statut}
          </div>
        </div>

        {loadingDetails ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Clients à collecter ({tourneeDetails?.length})</h3>
            
            <div className="grid gap-4">
              {tourneeDetails?.map((passage: any) => (
                <div key={passage.id} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-blue-200 transition-colors bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      passage.status === 'valide' ? 'bg-green-100 text-green-600' : 
                      passage.status === 'en_attente' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {passage.status === 'valide' ? <CheckCircle2 className="w-5 h-5" /> : 
                       passage.status === 'en_attente' ? <Clock className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{passage.client?.repere_textuel || 'Adresse inconnue'}</p>
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {passage.client?.phone}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {passage.status}
                  </div>
                </div>
              ))}
              {tourneeDetails?.length === 0 && (
                <div className="p-8 text-center text-slate-400 font-medium bg-slate-50 rounded-2xl">
                  Aucun client prévu pour cette tournée.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Tournées par date</h2>
            <p className="text-slate-500 text-sm font-medium">Consultez l'historique ou le planning</p>
          </div>
        </div>

        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="grid gap-4">
          {tournees.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelectTournee(t.id)}
              className="w-full p-5 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 hover:shadow-md transition-all group bg-white text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-lg">
                    Agent: {t.agent?.repere_textuel || t.agent?.phone || 'Inconnu'}
                  </p>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">
                    {t.passages[0]?.count || 0} passages prévus
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm font-bold">
                <span className={`px-3 py-1 rounded-lg uppercase tracking-widest text-[10px] ${
                  t.statut === 'terminee' ? 'bg-green-100 text-green-700' :
                  t.statut === 'en_cours' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {t.statut}
                </span>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
            </button>
          ))}
          {tournees.length === 0 && (
            <div className="p-12 text-center text-slate-400 font-medium bg-slate-50 rounded-2xl border border-slate-100">
              Aucune tournée enregistrée pour cette date.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
