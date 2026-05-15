'use client'

import { useTransition } from 'react'
import { activateAbonnement } from '@/app/actions'
import { CreditCard, CheckCircle2, Loader2, Clock, Smartphone } from 'lucide-react'

const OPERATEUR_LABELS: Record<string, string> = {
  mtn: 'MTN MoMo',
  orange: 'Orange Money',
}

export function PendingAbonnements({ demandes }: { demandes: any[] }) {
  const [isPending, startTransition] = useTransition()

  const handleActivate = (id: string) => {
    startTransition(async () => {
      await activateAbonnement(id)
    })
  }

  if (demandes.length === 0) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-10">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-slate-900">
            Demandes d'abonnement ({demandes.length})
          </h2>
        </div>
        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
          En attente de validation
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {demandes.map((demande) => (
          <div key={demande.id} className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{demande.profiles?.phone || demande.phone_paiement || 'N/A'}</p>
                <p className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-700">{demande.type_forfait}</span>
                  {' · '}
                  {OPERATEUR_LABELS[demande.operateur_paiement] || demande.operateur_paiement}
                  {' · '}
                  paiement depuis <span className="font-mono">{demande.phone_paiement}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(demande.created_at).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleActivate(demande.id)}
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all disabled:opacity-50 shrink-0"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Activer l'abonnement
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
