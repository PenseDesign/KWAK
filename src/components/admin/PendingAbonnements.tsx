'use client'

import { useTransition } from 'react'
import { activateAbonnement } from '@/app/actions'
import { CreditCard, CheckCircle2, Loader2, Clock, Smartphone, Hash, AlertTriangle } from 'lucide-react'

const OPERATEUR_LABELS: Record<string, string> = {
  mtn: 'MTN MoMo',
  orange: 'Orange Money',
}

// Prix attendu par forfait (pour vérification montant déclaré)
const MONTANT_ATTENDU: Record<string, number> = {
  'Mensuel Basique': 2500,
  'Mensuel Pro': 3000,
  'Hebdomadaire': 700,
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
    <div className="bg-green-100/50 rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-green-200 overflow-hidden mb-10">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
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

      <div className="divide-y divide-slate-50">
        {demandes.map((demande) => {
          const montantAttendu = MONTANT_ATTENDU[demande.type_forfait]
          const montantDeclare = demande.montant_declare
          const montantOk = montantDeclare && montantAttendu && montantDeclare >= montantAttendu

          return (
            <div key={demande.id} className="p-6 flex flex-col gap-4 hover:bg-slate-50/50 transition-colors">
              {/* Ligne principale */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    demande.operateur_paiement === 'mtn' ? 'bg-yellow-100 text-yellow-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      {demande.profiles?.phone || demande.phone_paiement || 'N/A'}
                    </p>
                    <p className="text-sm text-slate-500">
                      <span className="font-semibold text-slate-700">{demande.type_forfait}</span>
                      {' · '}
                      <span className={`font-bold ${
                        demande.operateur_paiement === 'mtn' ? 'text-yellow-700' : 'text-orange-600'
                      }`}>
                        {OPERATEUR_LABELS[demande.operateur_paiement] || demande.operateur_paiement}
                      </span>
                      {' · '}
                      depuis <span className="font-mono">{demande.phone_paiement}</span>
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
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-700 rounded-xl font-bold text-sm hover:bg-green-100 transition-all disabled:opacity-50 shrink-0 border border-green-100"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Activer l'abonnement
                </button>
              </div>

              {/* ─── [USSD] Bloc vérification transaction ─────────────────────────── */}
              {(demande.transaction_id_ussd || demande.montant_declare) && (
                <div className={`rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center gap-3 ${
                  montantOk
                    ? 'bg-green-50 border-green-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <Hash className={`w-5 h-5 shrink-0 ${montantOk ? 'text-green-600' : 'text-amber-600'}`} />
                  <div className="flex-1 space-y-1">
                    {demande.transaction_id_ussd && (
                      <p className="text-sm font-bold text-slate-800">
                        ID Txn :{' '}
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-900">
                          {demande.transaction_id_ussd}
                        </span>
                      </p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      {demande.montant_declare && (
                        <span className="text-sm text-slate-600 font-medium">
                          Déclaré : <strong>{Number(demande.montant_declare).toLocaleString('fr-FR')} FCFA</strong>
                        </span>
                      )}
                      {montantAttendu && (
                        <span className="text-sm text-slate-500 font-medium">
                          Attendu : <strong>{montantAttendu.toLocaleString('fr-FR')} FCFA</strong>
                        </span>
                      )}
                      {/* Badge de vérification */}
                      {montantDeclare && montantAttendu && (
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black ${
                          montantOk
                            ? 'bg-green-200 text-green-800'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {montantOk ? (
                            <><CheckCircle2 className="w-3 h-3" /> Montant correct</>
                          ) : (
                            <><AlertTriangle className="w-3 h-3" /> Montant insuffisant</>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* ─────────────────────────────────────────────────────────────────── */}
            </div>
          )
        })}
      </div>
    </div>
  )
}
