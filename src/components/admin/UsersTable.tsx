'use client'

import { useState, useTransition } from 'react'
import { 
  Search, 
  UserCircle, 
  Phone, 
  MapPin, 
  Shield, 
  Trash2, 
  Edit3, 
  Plus, 
  X, 
  Check, 
  AlertTriangle, 
  Mail, 
  Calendar, 
  Loader2,
  Clock,
  Sparkles
} from 'lucide-react'
import { adminCreateUser, adminUpdateUser, adminDeleteUser } from '../../app/actions'
import { useRouter } from 'next/navigation'

export function UsersTable({ users }: { users: any[] }) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterAbo, setFilterAbo] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [deletingUser, setDeletingUser] = useState<any | null>(null)

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 1) return "Aujourd'hui"
    if (diffDays === 1) return "Hier"
    return `Inscrit il y a ${diffDays} jours`
  }

  const getAboStatus = (user: any) => {
    if (user.role !== 'client') return 'none'
    if (!user.abonnements || user.abonnements.length === 0) return 'never'
    const latest = user.abonnements[0]
    return latest.status === 'actif' ? 'active' : 'suspended'
  }

  // Filter and sort logic
  const filteredUsers = users.filter(user => {
    const searchStr = `${user.full_name || ''} ${user.email || ''} ${user.phone || ''} ${user.repere_textuel || ''} ${user.quartier || ''}`.toLowerCase()
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    
    const aboStatus = getAboStatus(user)
    const matchesAbo = 
      filterAbo === 'all' ||
      (filterAbo === 'active' && aboStatus === 'active') ||
      (filterAbo === 'suspended' && aboStatus === 'suspended') ||
      (filterAbo === 'never' && aboStatus === 'never')
      
    return matchesSearch && matchesRole && matchesAbo
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    return 0
  })

  // Submit forms
  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const res = await adminCreateUser(formData)
      if (res.success) {
        setSuccess('Utilisateur créé avec succès !')
        setTimeout(() => {
          setIsCreateOpen(false)
          setSuccess(null)
          router.refresh()
        }, 1500)
      } else {
        setError(res.error || 'Une erreur est survenue.')
      }
    })
  }

  const handleUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingUser) return
    setError(null)
    setSuccess(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const res = await adminUpdateUser(editingUser.id, formData)
      if (res.success) {
        setSuccess('Profil mis à jour !')
        setTimeout(() => {
          setEditingUser(null)
          setSuccess(null)
          router.refresh()
        }, 1500)
      } else {
        setError(res.error || 'Une erreur est survenue.')
      }
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return
    setError(null)
    setSuccess(null)
    
    startTransition(async () => {
      const res = await adminDeleteUser(deletingUser.id)
      if (res.success) {
        setSuccess('Utilisateur supprimé définitivement !')
        setTimeout(() => {
          setDeletingUser(null)
          setSuccess(null)
          router.refresh()
        }, 1500)
      } else {
        setError(res.error || 'Impossible de supprimer cet utilisateur.')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Top action block & stats overview */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-green-100/50 p-6 rounded-2xl border border-green-200 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <UserCircle className="w-7 h-7 text-green-600" />
            Gestion des Utilisateurs
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-0.5">
            {users.length} comptes inscrits dans la base de données
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-5 rounded-xl shadow-lg shadow-green-100 transition-all text-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Ajouter un utilisateur
        </button>
      </div>

      {/* Mini-stats counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Clients', value: users.filter(u => u.role === 'client').length, color: 'blue' },
          { label: 'Abonnés actifs', value: users.filter(u => u.role === 'client' && u.abonnements?.[0]?.status === 'actif').length, color: 'green' },
          { label: 'Agents', value: users.filter(u => u.role === 'agent').length, color: 'emerald' },
          { label: 'Sans abonnement', value: users.filter(u => u.role === 'client' && (!u.abonnements || u.abonnements.length === 0)).length, color: 'amber' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className={`text-2xl font-black ${
              stat.color === 'blue' ? 'text-blue-600' :
              stat.color === 'green' ? 'text-green-600' :
              stat.color === 'emerald' ? 'text-emerald-600' :
              'text-amber-600'
            }`}>{stat.value}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-tight">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Advanced filters card */}
      <div className="bg-green-100/50 p-6 rounded-2xl border border-green-200 shadow-[0_2px_20px_rgba(0,0,0,0.04)] space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Filtres de recherche</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Nom, téléphone, email, quartier..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-slate-50 border border-green-300 text-slate-900 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 w-full font-medium"
            />
          </div>

          <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-green-300 text-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 w-full"
          >
            <option value="all">Tous les rôles</option>
            <option value="client">Clients</option>
            <option value="agent">Agents</option>
            <option value="pending_agent">Agents en attente</option>
            <option value="admin">Admins</option>
          </select>

          <select 
            value={filterAbo}
            onChange={(e) => setFilterAbo(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-green-300 text-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 w-full"
          >
            <option value="all">Tous les statuts d'abonnement</option>
            <option value="active">Abonnés Actifs</option>
            <option value="suspended">Abonnements Suspendus</option>
            <option value="never">Jamais Abonnés (Inactifs)</option>
          </select>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-green-300 text-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 w-full"
          >
            <option value="newest">Plus récents d'abord</option>
            <option value="oldest">Plus anciens d'abord</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-green-100/50 rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-green-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Utilisateur</th>
                <th className="px-6 py-4">Coordonnées</th>
                <th className="px-6 py-4">Rôle</th>
                <th className="px-6 py-4">Abonnement</th>
                <th className="px-6 py-4">Dates clés</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((user) => {
                const aboStatus = getAboStatus(user)
                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center font-black text-white text-xs">
                          {user.full_name
                            ? user.full_name.trim().split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                            : user.email ? user.email.slice(0, 2).toUpperCase() : '?'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {user.full_name || <span className="text-slate-400 italic">Nom non renseigné</span>}
                          </div>
                          <div className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {user.email || 'Pas d\'email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="font-medium text-slate-700 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {user.phone || <span className="text-slate-400 italic text-xs">Non renseigné</span>}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          {user.repere_textuel || <span className="text-slate-400 italic">Sans adresse</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider
                        ${user.role === 'client' ? 'bg-blue-50 text-blue-600' : ''}
                        ${user.role === 'agent' ? 'bg-green-50 text-green-600' : ''}
                        ${user.role === 'pending_agent' ? 'bg-amber-50 text-amber-600' : ''}
                        ${user.role === 'admin' ? 'bg-purple-50 text-purple-600' : ''}
                      `}>
                        <Shield className="w-3.5 h-3.5" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'client' ? (
                        aboStatus === 'active' ? (
                          <div>
                            <span className="font-black text-[10px] uppercase px-2.5 py-1 rounded-md bg-green-50 text-green-600">
                              Actif
                            </span>
                            <span className="text-xs font-bold text-slate-500 block mt-1">{user.abonnements[0].type_forfait}</span>
                            {user.abonnements[0].date_fin && (
                              <span className="text-[10px] font-medium text-slate-400 block mt-0.5">Expire le {new Date(user.abonnements[0].date_fin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                            )}
                          </div>
                        ) : aboStatus === 'suspended' ? (
                          <div>
                            <span className="font-black text-[10px] uppercase px-2.5 py-1 rounded-md bg-red-50 text-red-600">
                              Suspendu
                            </span>
                            <span className="text-xs font-bold text-slate-500 block mt-1">{user.abonnements[0].type_forfait}</span>
                            {user.abonnements[0].date_fin && (
                              <span className="text-[10px] font-medium text-red-400 block mt-0.5">Expiré le {new Date(user.abonnements[0].date_fin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="font-black text-[10px] uppercase px-2.5 py-1 rounded-md bg-amber-50 text-amber-600">
                              Jamais abonné
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 block mt-1">Compte inactif</span>
                          </div>
                        )
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        {/* Date d'inscription */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          <span className="text-slate-400 font-bold">Inscrit&nbsp;:</span>
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                            : <span className="italic text-slate-300">Inconnu</span>}
                        </div>
                        {/* Date d'abonnement */}
                        {user.role === 'client' && (
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: aboStatus === 'active' ? '#16a34a' : aboStatus === 'suspended' ? '#dc2626' : '#94a3b8' }} />
                            <span className="font-bold" style={{ color: aboStatus === 'active' ? '#16a34a' : aboStatus === 'suspended' ? '#dc2626' : '#94a3b8' }}>Abonné&nbsp;:</span>
                            {user.abonnements?.[0]?.date_debut
                              ? <span style={{ color: aboStatus === 'active' ? '#15803d' : aboStatus === 'suspended' ? '#b91c1c' : '#94a3b8' }}>{new Date(user.abonnements[0].date_debut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              : <span className="italic text-slate-300">Jamais abonné</span>}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                          title="Modifier"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingUser(user)}
                          className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-16 text-center text-slate-400 font-medium">
              Aucun utilisateur trouvé correspondant aux filtres.
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-green-100/50 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-green-200 flex flex-col max-h-[90vh]">
            <header className="p-6 border-b border-green-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2 text-green-600">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-black text-slate-900 text-lg">Nouvel Utilisateur</h3>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </header>

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  {error}
                </div>
              )}
              {success && (
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 text-sm font-semibold flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  {success}
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">E-mail (Requis)</label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  placeholder="Ex : client@mail.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-slate-900 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Mot de passe (Requis)</label>
                <input 
                  type="password" 
                  name="password" 
                  required 
                  placeholder="Minimum 6 caractères"
                  className="w-full px-4 py-3 bg-slate-50 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-slate-900 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Rôle</label>
                  <select 
                    name="role" 
                    required 
                    className="w-full px-4 py-3 bg-slate-50 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-slate-700 text-sm font-bold"
                  >
                    <option value="client">Client</option>
                    <option value="agent">Agent</option>
                    <option value="pending_agent">Agent en attente</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Téléphone</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    placeholder="Ex : 677000000"
                    className="w-full px-4 py-3 bg-slate-50 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-slate-900 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Adresse / Quartier / Repère</label>
                <input 
                  type="text" 
                  name="repere_textuel" 
                  placeholder="Ex : Akwa, face boulangerie Z"
                  className="w-full px-4 py-3 bg-slate-50 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-slate-900 text-sm font-medium"
                />
              </div>

              <footer className="pt-4 border-t border-green-200 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsCreateOpen(false)}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl font-bold text-sm transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="w-2/3 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer le compte"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-green-100/50 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-green-200 flex flex-col max-h-[90vh]">
            <header className="p-6 border-b border-green-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Modifier le Profil</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{editingUser.email}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </header>

            <form onSubmit={handleUpdateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  {error}
                </div>
              )}
              {success && (
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 text-sm font-semibold flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  {success}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Rôle</label>
                  <select 
                    name="role" 
                    defaultValue={editingUser.role}
                    required 
                    className="w-full px-4 py-3 bg-slate-50 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-slate-700 text-sm font-bold"
                  >
                    <option value="client">Client</option>
                    <option value="agent">Agent</option>
                    <option value="pending_agent">Agent en attente</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Téléphone</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    defaultValue={editingUser.phone || ''}
                    placeholder="Ex : 677000000"
                    className="w-full px-4 py-3 bg-slate-50 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-slate-900 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Adresse / Quartier / Repère</label>
                <input 
                  type="text" 
                  name="repere_textuel" 
                  defaultValue={editingUser.repere_textuel || ''}
                  placeholder="Ex : Akwa, face boulangerie Z"
                  className="w-full px-4 py-3 bg-slate-50 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-slate-900 text-sm font-medium"
                />
              </div>

              <footer className="pt-4 border-t border-green-200 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl font-bold text-sm transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="w-2/3 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer les modifications"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-green-100/50 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-green-200 p-6 space-y-6">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">Supprimer l'utilisateur ?</h3>
                <p className="text-xs text-slate-500 font-medium">Action irréversible</p>
              </div>
            </div>

            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 text-sm font-medium text-slate-700 space-y-2">
              <p>Vous êtes sur le point de supprimer définitivement le compte :</p>
              <p className="font-black text-slate-900 text-xs bg-green-100/50 px-3 py-2 rounded-xl border border-green-200 shadow-sm inline-block">
                {deletingUser.email || deletingUser.phone}
              </p>
              <p className="text-red-700 text-xs">
                ⚠️ Cette action supprimera également ses demandes de collectes, son profil et ses abonnements associés.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-100 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-100 text-green-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4" />
                {success}
              </div>
            )}

            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => setDeletingUser(null)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3.5 rounded-xl font-bold text-sm transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="w-1/2 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-red-100 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
