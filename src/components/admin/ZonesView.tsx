'use client'

import { useState } from 'react'
import { Map, MapPin, Users, ArrowLeft, Loader2, Edit3, CheckCircle2, X } from 'lucide-react'
import { getClientsByZone, updateClientZone } from '../../app/actions'

export function ZonesView({ zones }: { zones: any[] }) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editingClient, setEditingClient] = useState<string | null>(null)
  const [newZoneName, setNewZoneName] = useState('')
  const [updating, setUpdating] = useState(false)

  const handleZoneClick = async (zoneName: string) => {
    setSelectedZone(zoneName)
    setLoading(true)
    const res = await getClientsByZone(zoneName)
    if (res.success) setClients(res.clients)
    setLoading(false)
  }

  const handleUpdateZone = async (clientId: string) => {
    if (!newZoneName.trim()) return
    setUpdating(true)
    const res = await updateClientZone(clientId, newZoneName.trim().toUpperCase())
    if (res.success) {
      // Retirer le client de la liste actuelle s'il a changé de zone
      setClients(clients.filter(c => c.id !== clientId))
      setEditingClient(null)
      setNewZoneName('')
    }
    setUpdating(false)
  }

  if (selectedZone) {
    return (
      <div className="space-y-6">
        <div className="bg-green-100/50 p-6 rounded-[2rem] shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-green-200">
          <button 
            onClick={() => setSelectedZone(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-bold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Retour aux zones
          </button>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <MapPin className="w-6 h-6 text-blue-600" />
                Zone: {selectedZone}
              </h2>
              <p className="text-slate-500 font-medium mt-1">
                {clients.length} clients dans ce secteur
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : (
            <div className="grid gap-4">
              {clients.map(client => (
                <div key={client.id} className="p-4 border border-green-200 rounded-2xl hover:border-blue-200 transition-colors bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-900">{client.repere_textuel}</p>
                    <p className="text-sm text-slate-500 font-medium">{client.phone}</p>
                  </div>
                  
                  {editingClient === client.id ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        value={newZoneName}
                        onChange={(e) => setNewZoneName(e.target.value)}
                        placeholder="Nouvelle zone..."
                        className="px-3 py-2 border border-green-300 rounded-xl text-sm outline-none focus:border-blue-500 font-bold"
                      />
                      <button 
                        onClick={() => handleUpdateZone(client.id)}
                        disabled={updating}
                        className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50"
                      >
                        {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => setEditingClient(null)}
                        className="p-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setEditingClient(client.id)
                        setNewZoneName(selectedZone)
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-100/50 border border-green-300 rounded-xl text-sm font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" /> Déplacer
                    </button>
                  )}
                </div>
              ))}
              {clients.length === 0 && (
                <div className="p-8 text-center text-slate-400 font-medium bg-slate-50 rounded-2xl">
                  Aucun client trouvé dans cette zone.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-green-100/50 p-6 rounded-[2rem] shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-green-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">Cartographie des Zones</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">Répartition de vos clients par quartiers approximatifs.</p>
        </div>
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
          <Map className="w-7 h-7" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {zones.map((zone, idx) => (
          <button 
            key={idx} 
            onClick={() => handleZoneClick(zone.name)}
            className="text-left bg-green-100/50 rounded-3xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-green-200 hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 group-hover:opacity-[0.06] transition-all duration-500">
               <MapPin className="w-24 h-24 text-blue-600" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <MapPin className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-black uppercase rounded-lg flex items-center gap-1 border border-green-100">
                  <Users className="w-3 h-3" />
                  {zone.count} clients
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900">{zone.name}</h3>
              <p className="text-sm text-blue-600 mt-2 font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                Gérer les clients <ArrowLeft className="w-4 h-4 rotate-180" />
              </p>
            </div>
          </button>
        ))}
      </div>

      {zones.length === 0 && (
        <div className="p-12 text-center bg-green-100/50 rounded-[2rem] border border-green-200 text-slate-400 font-medium shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
          Aucune zone détectée. Vos clients n'ont pas encore renseigné d'adresse.
        </div>
      )}
    </div>
  )
}
