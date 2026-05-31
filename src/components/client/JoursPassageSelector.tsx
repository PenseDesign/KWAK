'use client'

import { useState } from 'react'
import { Calendar, Loader2, CheckCircle2 } from 'lucide-react'
import { updateJoursPassage } from '../../app/actions'

const DAYS = [
  { id: 1, name: 'Lundi' },
  { id: 2, name: 'Mardi' },
  { id: 3, name: 'Mercredi' },
  { id: 4, name: 'Jeudi' }
]

export function JoursPassageSelector({ initialJours = [], typeForfait }: { initialJours: number[], typeForfait: string }) {
  const [selectedDays, setSelectedDays] = useState<number[]>(initialJours)
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Mensuel Pro a droit à 3 passages, les autres à 2 maximum
  // Hebdomadaire donne droit à combien ? Supposons 2 pour le moment comme les autres.
  const maxDays = typeForfait === 'Mensuel Pro' ? 3 : 2

  const toggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter(d => d !== dayId))
    } else {
      if (selectedDays.length < maxDays) {
        setSelectedDays([...selectedDays, dayId])
      } else {
        setMessage({ type: 'error', text: `Votre forfait ${typeForfait} vous donne droit à exactement ${maxDays} jours de passage.` })
        setTimeout(() => setMessage(null), 3000)
      }
    }
  }

  const handleSave = async () => {
    if (selectedDays.length !== maxDays) {
      setMessage({ type: 'error', text: `Veuillez sélectionner exactement ${maxDays} jours.` })
      return
    }

    setIsUpdating(true)
    setMessage(null)
    const res = await updateJoursPassage(selectedDays)
    if (res.success) {
      setMessage({ type: 'success', text: 'Jours de passage mis à jour !' })
    } else {
      setMessage({ type: 'error', text: res.error || 'Erreur lors de la mise à jour.' })
    }
    setIsUpdating(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const hasChanged = JSON.stringify([...selectedDays].sort()) !== JSON.stringify([...initialJours].sort())
  const isExactDays = selectedDays.length === maxDays

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900">Jours de passage</h3>
          <p className="text-slate-500 text-sm font-medium">Choisissez vos {maxDays} jours de collecte (Obligatoire)</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {DAYS.map(day => {
          const isSelected = selectedDays.includes(day.id)
          return (
            <button
              key={day.id}
              onClick={() => toggleDay(day.id)}
              className={`flex-1 min-w-[100px] py-3 px-4 rounded-2xl font-bold transition-all border-2 text-sm flex items-center justify-center gap-2 ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50/50'
              }`}
            >
              {isSelected && <CheckCircle2 className="w-4 h-4" />}
              {day.name}
            </button>
          )
        })}
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-sm font-bold mb-6 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={isUpdating || !hasChanged || !isExactDays}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enregistrer mes choix"}
      </button>
    </div>
  )
}
