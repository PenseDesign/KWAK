'use client'

import { useState } from 'react'
import { Search, UserCircle, Phone, MapPin, Shield } from 'lucide-react'

export function UsersTable({ users }: { users: any[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.phone && user.phone.includes(searchTerm)) || 
      (user.repere_textuel && user.repere_textuel.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesRole = filterRole === 'all' || user.role === filterRole
    return matchesSearch && matchesRole
  })

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-blue-500" />
          Annuaire Utilisateurs
        </h2>
        <div className="flex flex-wrap gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full sm:w-64 font-medium"
            />
          </div>
          <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tous les rôles</option>
            <option value="client">Clients</option>
            <option value="agent">Agents</option>
            <option value="pending_agent">Agents en attente</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4">Utilisateur</th>
              <th className="px-6 py-4">Rôle</th>
              <th className="px-6 py-4">Abonnement</th>
              <th className="px-6 py-4">Inscrit le</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {user.phone || 'Non renseigné'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                    <MapPin className="w-3 h-3 text-slate-300" />
                    {user.repere_textuel || 'Adresse non renseignée'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider
                    ${user.role === 'client' ? 'bg-blue-50 text-blue-600' : ''}
                    ${user.role === 'agent' ? 'bg-green-50 text-green-600' : ''}
                    ${user.role === 'pending_agent' ? 'bg-amber-50 text-amber-600' : ''}
                    ${user.role === 'admin' ? 'bg-purple-50 text-purple-600' : ''}
                  `}>
                    <Shield className="w-3 h-3" />
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.role === 'client' ? (
                    user.abonnements && user.abonnements.length > 0 ? (
                      <div>
                        <span className={`font-black text-[10px] uppercase px-2 py-0.5 rounded-md ${user.abonnements[0].status === 'actif' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {user.abonnements[0].status}
                        </span>
                        <span className="text-xs font-bold text-slate-500 block mt-1">{user.abonnements[0].type_forfait}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[10px] font-black uppercase bg-slate-100 px-2 py-1 rounded-md">Aucun</span>
                    )
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-400 font-medium">
                  {new Date(user.created_at).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center text-slate-400 font-medium">
            Aucun utilisateur trouvé.
          </div>
        )}
      </div>
    </div>
  )
}
