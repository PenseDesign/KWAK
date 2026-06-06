'use client'

import { useEffect, useState, useRef } from 'react'
import { getAgentTournee, signOut, reportIssue } from '../../actions'
import { createClient } from '../../../lib/supabase/client'
import { useSync } from '../../../hooks/offline/useSync'
import { optimizeRoute } from '../../../lib/tournee/engine'
import { MapPin, Download, CheckCircle, Camera, Loader2, LogOut, Phone as PhoneIcon, MessageSquare, AlertTriangle, Navigation, Upload, X } from 'lucide-react'
import { ClientMission } from '../../../lib/types/database'
import NetworkAlert from '../../../components/shared/NetworkAlert'

export default function AgentPage() {
  const [loading, setLoading] = useState(false)
  const [activeMission, setActiveMission] = useState<ClientMission | null>(null)
  const [photoData, setPhotoData] = useState<string | null>(null)

  // Nouveaux états
  const [reporting, setReporting] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [agentProfile, setAgentProfile] = useState<any>(null)

  // Notification Toast state
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { cachedTournee, saveTournee, queuePassageValidation, offlineQueueCount, isSyncing } = useSync()

  const [agentId, setAgentId] = useState<string | null>(null)

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(prev => prev?.message === message ? null : prev)
    }, 4000)
  }

  useEffect(() => {
    const supabase = createClient()
    const getAgent = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setAgentId(user.id)
        // Vérifier si le profil est complet
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setAgentProfile(profile)
      }
    }
    getAgent()
  }, [])

  const handleDownloadTournee = async () => {
    if (!agentId) return

    // Vérifier si le profil est complet
    const isProfileComplete = agentProfile?.phone && agentProfile?.repere_textuel
    if (!isProfileComplete) {
      setShowProfileModal(true)
      return
    }

    setLoading(true)
    try {
      const res = await getAgentTournee()
      if (res.success && res.missions && res.missions.length > 0) {
        const optimized = optimizeRoute(res.missions)
        await saveTournee(optimized)
        showNotification("Tournée téléchargée et optimisée !", 'success')
      } else {
        showNotification("Aucune tournée n'est prévue pour vous aujourd'hui.", 'info')
      }
    } catch (e) {
      console.error(e)
      showNotification("Erreur lors du téléchargement. Vérifiez votre connexion.", 'error')
    } finally {
      setLoading(false)
    }
  }

  // Camera handling
  useEffect(() => {
    if (activeMission && !photoData && !cameraError) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [activeMission, photoData, cameraError])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraError(false)
    } catch (err) {
      console.error("Camera access denied or unavailable", err)
      setCameraError(true)
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoData(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleValidate = async () => {
    if (!activeMission) return

    await queuePassageValidation(activeMission.passage_id, 'valide', photoData || undefined)
    showNotification("Passage validé !", 'success')

    // Reset state
    setActiveMission(null)
    setPhotoData(null)
    setCameraError(false)
  }

  const handleReport = async () => {
    if (!agentId) return
    const reason = prompt("Décrivez le problème (ex: Tricycle en panne, Route bloquée) :")
    if (!reason) return

    setReporting(true)
    const res = await reportIssue(reason)
    setReporting(false)

    if (res.success) {
      setReportSuccess(true)
      showNotification("Incident signalé avec succès !", 'success')
      setTimeout(() => setReportSuccess(false), 3000)
    } else {
      showNotification("Erreur lors du signalement.", 'error')
    }
  }

  // Statistiques
  const completedCount = cachedTournee.filter(m => m.passage_status === 'valide').length
  const totalCount = cachedTournee.length
  const progressPercentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-24 font-sans relative">
      <NetworkAlert />

      <div className="p-4">
        <header className="mb-6 flex flex-col gap-4">
          <div className="flex justify-between items-start w-full">
            <div>
              <h1 className="text-2xl font-black text-white">Mode Mission</h1>
              <p className="text-green-400 font-medium capitalize">{today}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="p-3 bg-slate-900 text-slate-400 hover:text-white rounded-2xl border border-slate-800 transition-colors shadow-lg"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {offlineQueueCount > 0 && (
            <div className="self-start flex items-center gap-2 bg-amber-900/50 text-amber-500 px-4 py-2 rounded-full text-sm font-bold border border-amber-800">
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
              {offlineQueueCount} validations en attente de réseau
            </div>
          )}
        </header>

        {totalCount === 0 ? (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 text-center space-y-6 shadow-2xl">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-slate-500" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Aucune tournée chargée</h2>
                <p className="text-slate-400 mt-2 font-medium">Vous n'avez pas encore téléchargé votre itinéraire du jour.</p>
              </div>
              <button
                onClick={handleDownloadTournee}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-400 text-slate-950 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                Télécharger ma tournée
              </button>
            </div>

            <div className="bg-red-950/30 border border-red-900/50 rounded-[2rem] p-6 space-y-4">
              <div className="flex items-center gap-3 text-red-500">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-bold">Un empêchement ?</h3>
              </div>
              <p className="text-sm text-red-200/70">Signalez un problème (panne, accident) à votre superviseur.</p>
              <button
                onClick={handleReport}
                disabled={reporting || reportSuccess}
                className="w-full py-3 bg-red-900/50 text-red-400 hover:bg-red-900/80 rounded-xl font-bold transition-all disabled:opacity-50"
              >
                {reporting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : reportSuccess ? "Signalé avec succès" : "Signaler un problème"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Barre de progression */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] space-y-4 shadow-lg">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">Progression</p>
                  <p className="text-2xl font-black text-white">{completedCount} <span className="text-slate-500 text-lg">/ {totalCount}</span></p>
                </div>
                <div className="text-green-400 font-black text-xl">{progressPercentage}%</div>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite] -skew-x-12" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {cachedTournee.map((mission, index) => {
                const isCompleted = mission.passage_status === 'valide'
                const gpsUrl = mission.coords_gps
                  ? `https://www.google.com/maps/dir/?api=1&destination=${mission.coords_gps.lat},${mission.coords_gps.lng}`
                  : null

                return (
                  <div
                    key={mission.passage_id}
                    onClick={() => !isCompleted && setActiveMission(mission)}
                    className={`p-5 rounded-[2rem] border transition-all ${isCompleted
                      ? 'bg-slate-900/40 border-slate-800/50 opacity-60'
                      : 'bg-slate-900 border-slate-700 hover:border-green-500/50 cursor-pointer shadow-xl'
                      }`}
                  >
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 shrink-0 flex flex-col items-center justify-center rounded-2xl font-black text-xl ${isCompleted ? 'bg-green-900/30 text-green-500' : 'bg-green-500 text-slate-950 shadow-inner shadow-white/20'
                        }`}>
                        {isCompleted ? <CheckCircle className="w-6 h-6" /> : index + 1}
                      </div>

                      <div className="flex-1 space-y-3">
                        <p className="font-bold text-slate-200 leading-tight">
                          {mission.repere_textuel || "Client " + mission.phone}
                        </p>

                        {!isCompleted && (
                          <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                            {gpsUrl && (
                              <a href={gpsUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-bold flex items-center gap-1.5 hover:bg-blue-500/20 transition-colors">
                                <Navigation className="w-4 h-4" /> Naviguer
                              </a>
                            )}
                            {mission.phone && (
                              <>
                                <a href={`tel:${mission.phone}`} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-sm font-bold flex items-center gap-1.5 hover:bg-slate-700 transition-colors">
                                  <PhoneIcon className="w-4 h-4" /> Appel
                                </a>
                                <a href={`https://wa.me/${mission.phone.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-sm font-bold flex items-center gap-1.5 hover:bg-green-500/20 transition-colors">
                                  <MessageSquare className="w-4 h-4" /> WhatsApp
                                </a>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal de complétion de profil */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Complétez votre profil</h2>
              <p className="text-slate-500 font-medium mt-2">Veuillez renseigner vos informations pour apparaître dans le système.</p>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const phone = formData.get('phone') as string
              const repere_textuel = formData.get('repere_textuel') as string

              const supabase = createClient()
              const { error } = await supabase
                .from('profiles')
                .update({ phone, repere_textuel })
                .eq('id', agentId)

              if (!error) {
                setAgentProfile({ ...agentProfile, phone, repere_textuel })
                setShowProfileModal(false)
                showNotification('Profil mis à jour avec succès!', 'success')
              } else {
                showNotification('Erreur lors de la mise à jour du profil.', 'error')
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Numéro de téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={agentProfile?.phone || ''}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  placeholder="+237 6XX XXX XXX"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Adresse / Repère textuel</label>
                <textarea
                  name="repere_textuel"
                  defaultValue={agentProfile?.repere_textuel || ''}
                  required
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none"
                  placeholder="Ex: Quartier, près du marché, maison bleue..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal/Drawer pour la validation */}
      {activeMission && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
          <div className="flex-1 relative bg-black flex items-center justify-center">
            {photoData ? (
              <img src={photoData} alt="Aperçu" className="w-full h-full object-cover" />
            ) : cameraError ? (
              <div className="text-center p-6 space-y-4">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-10 h-10 text-amber-500" />
                </div>
                <h3 className="text-white font-bold text-lg">Caméra indisponible</h3>
                <p className="text-slate-400 text-sm">Nous n'avons pas pu accéder à votre appareil photo. Veuillez importer une photo depuis votre galerie.</p>
              </div>
            ) : (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            )}
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute top-0 left-0 w-full p-6 bg-gradient-to-b from-black/80 to-transparent">
              <button
                onClick={() => { setActiveMission(null); setCameraError(false); }}
                className="text-white text-sm font-bold mb-6 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md"
              >
                ← Annuler
              </button>
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Arrêt {cachedTournee.findIndex(m => m.passage_id === activeMission.passage_id) + 1}</h2>
              <p className="text-green-400 text-2xl font-black leading-tight mt-1">{activeMission.repere_textuel}</p>
            </div>
          </div>

          <div className="p-6 bg-slate-900 rounded-t-[2.5rem] -mt-8 relative z-10 space-y-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            {!photoData ? (
              cameraError ? (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-lg transition-colors"
                  >
                    <Upload className="w-6 h-6" />
                    Importer une photo
                  </button>
                </div>
              ) : (
                <button
                  onClick={takePhoto}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-lg shadow-xl"
                >
                  <Camera className="w-6 h-6" />
                  Capturer la façade
                </button>
              )
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => setPhotoData(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-bold transition-colors"
                >
                  Reprendre
                </button>
                <button
                  onClick={handleValidate}
                  className="flex-1 bg-green-500 hover:bg-green-400 text-slate-950 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle className="w-6 h-6" />
                  Valider !
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Elegant Toast notification banner */}
      {notification && (
        <div className="fixed bottom-6 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 ${notification.type === 'success'
            ? 'bg-green-950/90 border-green-800 text-green-200'
            : notification.type === 'error'
              ? 'bg-red-950/90 border-red-900 text-red-200'
              : 'bg-slate-900/95 border-slate-800 text-slate-200'
            }`}>
            {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />}
            {notification.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />}
            {notification.type === 'info' && <Loader2 className="w-5 h-5 animate-spin text-blue-400 shrink-0" />}
            <span className="font-semibold text-sm flex-1">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
