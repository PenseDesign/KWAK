import { Map, MapPin, Users } from 'lucide-react'

export function ZonesView({ zones }: { zones: any[] }) {
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[2rem] shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-between">
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
          <div key={idx} className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
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
              <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">
                Une tournée optimisée dans ce secteur peut couvrir {zone.count} points de collecte.
              </p>
            </div>
          </div>
        ))}
      </div>

      {zones.length === 0 && (
        <div className="p-12 text-center bg-white rounded-[2rem] border border-slate-100 text-slate-400 font-medium shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
          Aucune zone détectée. Vos clients n'ont pas encore renseigné d'adresse.
        </div>
      )}
    </div>
  )
}
