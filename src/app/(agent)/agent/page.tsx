'use client'

import { useEffect, useState, useRef } from 'react'
import { getAgentTournee, signOut } from '@/app/actions'
import { createClient } from '@/lib/supabase/client'
import { useSync } from '@/hooks/offline/useSync'
import { optimizeRoute } from '@/lib/tournee/engine'
import { MapPin, Download, CheckCircle, Camera, Loader2, LogOut, Phone as PhoneIcon, MessageSquare } from 'lucide-react'
import { ClientMission } from '@/lib/types/database'

export default function AgentPage() {
  const [loading, setLoading] = useState(false)
  const [activeMission, setActiveMission] = useState<ClientMission | null>(null)
  const [photoData, setPhotoData] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { cachedTournee, saveTournee, queuePassageValidation, offlineQueueCount, isSyncing } = useSync()

  const [agentId, setAgentId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const getAgent = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setAgentId(user.id)
    }
    getAgent()
  }, [])

  const handleDownloadTournee = async () => {
    if (!agentId) return
    setLoading(true)
    try {
      const res = await getAgentTournee(agentId)
      if (res.success && res.missions) {
        const optimized = optimizeRoute(res.missions)
        await saveTournee(optimized)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Camera handling
  useEffect(() => {
    if (activeMission && !photoData) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [activeMission, photoData])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error("Camera access denied or unavailable", err)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
  }

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0)
        const base64 = canvasRef.current.toDataURL('image/jpeg', 0.8)
        setPhotoData(base64)
      }
    }
  }

  const handleValidate = async () => {
    if (!activeMission) return
    
    await queuePassageValidation(activeMission.passage_id, 'valide', photoData || undefined)
    
    // Reset state
    setActiveMission(null)
    setPhotoData(null)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 pb-24">
      <header className="mb-6 flex justify-between items-center">
        <div className="flex justify-between items-start w-full">
          <div>
            <h1 className="text-2xl font-bold text-green-400">Mode Mission</h1>
            <p className="text-slate-400 text-sm">{cachedTournee.length} passages prévus</p>
          </div>
          <button 
            onClick={() => signOut()}
            className="p-3 bg-slate-900 text-slate-500 hover:text-white rounded-2xl border border-slate-800 transition-colors shadow-lg"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        
        {offlineQueueCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-900/50 text-amber-500 px-3 py-1 rounded-full text-xs font-medium border border-amber-800">
            {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
            {offlineQueueCount} en attente
          </div>
        )}
      </header>

      {cachedTournee.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 space-y-6">
          <button 
            onClick={handleDownloadTournee}
            disabled={loading}
            className="bg-green-600 hover:bg-green-500 text-white w-48 h-48 rounded-full flex flex-col items-center justify-center gap-4 shadow-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-10 h-10 animate-spin" /> : <Download className="w-10 h-10" />}
            <span className="font-semibold text-center">Télécharger<br/>ma tournée</span>
          </button>
          <p className="text-slate-500 text-sm text-center px-8">
            Connectez-vous à internet le matin pour récupérer votre itinéraire de la journée.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {cachedTournee.map((mission, index) => {
            const isCompleted = mission.passage_status === 'valide'
            return (
              <div 
                key={mission.passage_id}
                onClick={() => !isCompleted && setActiveMission(mission)}
                className={`p-4 rounded-2xl border transition-all ${
                  isCompleted 
                    ? 'bg-slate-900/30 border-slate-800 opacity-60' 
                    : 'bg-slate-900 border-slate-700 hover:border-green-500/50 cursor-pointer shadow-lg'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 flex flex-col items-center justify-center rounded-full font-bold text-lg ${
                    isCompleted ? 'bg-green-900/50 text-green-500' : 'bg-green-500 text-slate-950'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium text-slate-200 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {mission.repere_textuel || "Client " + mission.phone}
                    </p>
                    {mission.phone && !isCompleted && (
                      <div className="flex gap-4 mt-2" onClick={(e) => e.stopPropagation()}>
                        <a href={`tel:${mission.phone}`} className="text-xs font-bold text-green-400 flex items-center gap-1 hover:text-green-300">
                          <PhoneIcon className="w-3.5 h-3.5" /> Appeler
                        </a>
                        <a href={`https://wa.me/${mission.phone.replace(/\s/g, '')}`} target="_blank" className="text-xs font-bold text-blue-400 flex items-center gap-1 hover:text-blue-300">
                          <MessageSquare className="w-3.5 h-3.5" /> Message
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal/Drawer pour la validation (Le conseil Yassa) */}
      {activeMission && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
          <div className="flex-1 relative bg-black">
            {photoData ? (
              <img src={photoData} alt="Aperçu" className="w-full h-full object-cover" />
            ) : (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            )}
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlay d'aide visuelle - L'appli dit où on est */}
            <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent">
              <button 
                onClick={() => setActiveMission(null)}
                className="text-white text-sm font-medium mb-4"
              >
                ← Retour
              </button>
              <h2 className="text-xl font-bold text-white">Prochain arrêt :</h2>
              <p className="text-green-400 text-2xl font-black">{activeMission.repere_textuel}</p>
            </div>
          </div>

          <div className="p-6 bg-slate-900 rounded-t-3xl -mt-6 relative z-10 space-y-6">
            {!photoData ? (
              <button 
                onClick={takePhoto}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 font-medium"
              >
                <Camera className="w-5 h-5" />
                Prendre la photo de façade
              </button>
            ) : (
              <div className="flex gap-4">
                <button 
                  onClick={() => setPhotoData(null)}
                  className="flex-1 bg-slate-800 text-white py-4 rounded-xl font-medium"
                >
                  Reprendre
                </button>
                <button 
                  onClick={handleValidate}
                  className="flex-1 bg-green-500 text-slate-950 py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Terminé !
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
