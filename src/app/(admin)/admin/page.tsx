import { getAdminStats, getPendingAgents } from '@/app/actions'
import { createClient } from '@/lib/supabase/server'
import { Activity, Users, DollarSign, Package } from 'lucide-react'
import { PendingAgents } from '@/components/admin/PendingAgents'

export const revalidate = 0 // always fetch fresh on page load

export default async function AdminPage() {
  const stats = await getAdminStats()
  const supabase = await createClient()
  
  const { agents: pendingAgents } = await getPendingAgents()
  
  const { data: recentPassages } = await supabase
    .from('passages')
    .select('*, profiles:client_id(repere_textuel, phone)')
    .order('heure_passage', { ascending: false, nullsFirst: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Tableau de Bord Admin</h1>
        <p className="text-slate-500">Supervision globale KWAK</p>
      </header>

      <PendingAgents agents={pendingAgents} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Collectes</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalCollectes}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Revenus Estimés (FCFA)</p>
            <p className="text-2xl font-bold text-slate-900">{stats.revenusEstimes.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Agents en ligne</p>
            <p className="text-2xl font-bold text-slate-900">{stats.agentsEnLigne}</p>
          </div>
        </div>
      </div>

      {/* Activités Récentes */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900">Activités Récentes</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">ID / Adresse</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Agent</th>
                <th className="px-6 py-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPassages?.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{p.profiles?.repere_textuel || 'Adresse non spécifiée'}</div>
                    <div className="text-sm text-slate-500">{p.profiles?.phone || 'Pas de numéro'}</div>
                    <div className="text-xs text-slate-400">{p.id.split('-')[0]}...</div>
                  </td>
                  <td className="px-6 py-4">
                    {p.heure_passage ? new Date(p.heure_passage).toLocaleString('fr-FR') : 'En attente'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                      Agent #1
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                      ${p.status === 'en_attente' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                      ${p.status === 'valide' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                      ${p.status === 'absent' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                      ${p.status === 'impossible' ? 'bg-slate-50 text-slate-700 border-slate-200' : ''}
                    `}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!recentPassages || recentPassages.length === 0) && (
            <div className="p-8 text-center text-slate-500">
              Aucune activité récente.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
