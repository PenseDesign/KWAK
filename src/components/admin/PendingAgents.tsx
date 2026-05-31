'use client'

import { useTransition } from 'react'
import { approveAgent } from '@/app/actions'
import { UserCheck, UserX, Loader2, Clock } from 'lucide-react'

export function PendingAgents({ agents }: { agents: any[] }) {
    const [isPending, startTransition] = useTransition()

    const handleApprove = (id: string) => {
        startTransition(async () => {
            await approveAgent(id)
        })
    }

    if (agents.length === 0) return null

    return (
        <div className="bg-green-100/50 rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-green-200 overflow-hidden mb-10">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <h2 className="text-lg font-semibold text-slate-900">Agents en attente ({agents.length})</h2>
                </div>
            </div>

            <div className="divide-y divide-slate-50">
                {agents.map((agent) => (
                    <div key={agent.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center">
                                <UserCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">{agent.id.split('-')[0]}...</p>
                                <p className="text-sm text-slate-500">{agent.phone || 'Pas de numéro'}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleApprove(agent.id)}
                                disabled={isPending}
                                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl font-bold text-sm hover:bg-green-100 transition-all disabled:opacity-50"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                                Approuver
                            </button>
                            <button className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors">
                                <UserX className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
