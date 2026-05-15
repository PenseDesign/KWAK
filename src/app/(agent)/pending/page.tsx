'use client'

import { Clock, ShieldAlert, LogOut } from 'lucide-react'
import { signOut } from '../../actions'

export default function PendingAgentPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8">
        
        <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full"></div>
            <Clock className="w-24 h-24 text-amber-500 relative z-10 animate-pulse" />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-black text-white tracking-tight">Compte en attente</h1>
          <p className="text-slate-400 font-medium leading-relaxed">
            Merci pour votre inscription en tant qu'Agent LEPOINCITOYEN ! <br/>
            Votre profil est actuellement en cours de vérification par notre équipe administrative.
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-[2rem] flex items-start gap-4 text-left">
          <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
          <div className="space-y-1">
            <p className="text-white font-bold text-sm">Pourquoi cette attente ?</p>
            <p className="text-slate-500 text-xs leading-relaxed">
              Pour garantir la qualité de service et la sécurité de nos clients, nous vérifions manuellement chaque candidature d'agent. Cela prend généralement moins de 24h.
            </p>
          </div>
        </div>

        <button 
          onClick={() => signOut()}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-white font-bold transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Se déconnecter
        </button>

      </div>
    </div>
  )
}
