'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { getAdminStats, getPendingAgents, getPendingAbonnements, getAllUsers, getZonesStats } from '../../actions'
import { createClient } from '../../../lib/supabase/client'
import { Activity, Users, DollarSign, Package, LayoutDashboard, Map, ClipboardCheck, RefreshCw } from 'lucide-react'
import { PendingAgents } from '../../../components/admin/PendingAgents'
import { PendingAbonnements } from '../../../components/admin/PendingAbonnements'
import { CreateTournee } from '../../../components/admin/CreateTournee'
import { SignalementsList } from '../../../components/admin/SignalementsList'
import { UsersTable } from '../../../components/admin/UsersTable'
import { ZonesView } from '../../../components/admin/ZonesView'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [recentPassages, setRecentPassages] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [pendingAgents, setPendingAgents] = useState<any[]>([])
  const [pendingDemandes, setPendingDemandes] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'overview'

  const fetchData = async () => {
    try {
      const supabase = createClient()

      const [statsData, passagesData, usersData, zonesData, agentsData, demandesData] = await Promise.all([
        getAdminStats(),
        supabase.from('passages').select('*, profiles:client_id(repere_textuel, phone)').order('heure_passage', { ascending: false, nullsFirst: false }).limit(10),
        currentTab === 'users' ? getAllUsers() : Promise.resolve({ success: true, users: [] }),
        currentTab === 'zones' ? getZonesStats() : Promise.resolve({ success: true, zones: [] }),
        (currentTab === 'validations' || currentTab === 'overview') ? getPendingAgents() : Promise.resolve({ success: true, agents: [] }),
        (currentTab === 'validations' || currentTab === 'overview') ? getPendingAbonnements() : Promise.resolve({ success: true, demandes: [] })
      ])

      setStats(statsData)
      setRecentPassages(passagesData.data || [])
      if (usersData.success) setUsers(usersData.users)
      if (zonesData.success) setZones(zonesData.zones)
      if (agentsData.success) setPendingAgents(agentsData.agents)
      if (demandesData.success) setPendingDemandes(demandesData.demandes)
    } catch (e) {
      console.error('[AdminPage] Error:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [currentTab])

  // Rafraîchir automatiquement toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshing(true)
      fetchData()
    }, 30000)
    return () => clearInterval(interval)
  }, [currentTab])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const tabs = [
    { id: 'overview', name: 'Vue Globale', icon: LayoutDashboard },
    { id: 'users', name: 'Utilisateurs', icon: Users },
    { id: 'zones', name: 'Zones & Logistique', icon: Map },
    { id: 'validations', name: 'Validations', icon: ClipboardCheck },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tableau de Bord Admin</h1>
          <p className="text-slate-500 font-medium mt-1">Supervision globale LEPOINCITOYEN</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-3 bg-white text-slate-600 hover:text-green-600 rounded-xl border border-slate-200 transition-all hover:border-green-200 disabled:opacity-50"
          title="Rafraîchir"
        >
          {refreshing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
        </button>
      </header>

      {/* Tabs Navigation */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = currentTab === tab.id
          return (
            <Link
              key={tab.id}
              href={`/admin?tab=${tab.id}`}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap border ${isActive
                  ? 'bg-white text-green-600 border-green-200 shadow-sm'
                  : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-200/50 hover:text-slate-700'
                }`}
            >
              <Icon className="w-5 h-5" />
              {tab.name}
            </Link>
          )
        })}
      </div>

      <div className="mt-8">
        {/* OVERVIEW TAB */}
        {currentTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center gap-5 relative overflow-hidden group">
                <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
                  <Package className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Collectes</p>
                  <p className="text-3xl font-black text-slate-900">{stats.totalCollectes}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center gap-5 relative overflow-hidden group">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                  <DollarSign className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revenus (FCFA)</p>
                  <p className="text-3xl font-black text-slate-900">{stats.revenusEstimes.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <SignalementsList />

              <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center gap-3">
                  <Activity className="w-6 h-6 text-slate-400" />
                  <h2 className="text-xl font-bold text-slate-900">Activités Récentes</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-6 py-4">ID / Adresse</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recentPassages?.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{p.profiles?.repere_textuel || 'Adresse non spécifiée'}</div>
                            <div className="text-xs text-slate-500 font-medium">{p.profiles?.phone || 'Pas de numéro'}</div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-500">
                            {p.heure_passage ? new Date(p.heure_passage).toLocaleString('fr-FR') : 'En attente'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider
                              ${p.status === 'en_attente' ? 'bg-amber-50 text-amber-600' : ''}
                              ${p.status === 'valide' ? 'bg-green-50 text-green-600' : ''}
                              ${p.status === 'absent' ? 'bg-red-50 text-red-600' : ''}
                              ${p.status === 'impossible' ? 'bg-slate-100 text-slate-600' : ''}
                            `}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!recentPassages || recentPassages.length === 0) && (
                    <div className="p-12 text-center text-slate-400 font-medium">
                      Aucune activité récente.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'users' && <UsersTable users={users} />}

        {currentTab === 'zones' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ZonesView zones={zones} />
            </div>
            <div>
              <CreateTournee />
            </div>
          </div>
        )}

        {currentTab === 'validations' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <PendingAbonnements demandes={pendingDemandes} />
            <PendingAgents agents={pendingAgents} />
          </div>
        )}
      </div>
    </div>
  )
}
