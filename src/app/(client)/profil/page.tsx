'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '../../actions'
import { createClient } from '../../../lib/supabase/client'
import { 
  MapPin, 
  Phone, 
  Camera, 
  Loader2, 
  ArrowLeft, 
  CheckCircle2, 
  Navigation,
  Info,
  Home
} from 'lucide-react'

export default function ProfilPage() {
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  
  const router = useRouter()
  useEffect(() => {
    const supabase = createClient()
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile(data)
      if (data?.photo_facade_url) setPhotoPreview(data.photo_facade_url)
      setLoading(false)
    }
    getProfile()
  }, [router])

  const handleGetGps = () => {
    setGpsLoading(true)
    setError(null)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setProfile({
            ...profile,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setGpsLoading(false)
        },
        (err) => {
          setError("Impossible de récupérer la position GPS. Vérifiez les permissions.")
          setGpsLoading(false)
        },
        { enableHighAccuracy: true }
      )
    } else {
      setError("La géolocalisation n'est pas supportée par votre navigateur.")
      setGpsLoading(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    // Add GPS coordinates manually as they are in state
    if (profile?.lat) formData.append('lat', profile.lat.toString())
    if (profile?.lng) formData.append('lng', profile.lng.toString())

    startTransition(async () => {
      const res = await updateProfile(formData)
      if (res.success) {
        setSuccess(true)
        setTimeout(() => router.push('/dashboard'), 2000)
      } else {
        setError(res.error || "Une erreur est survenue")
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 h-20 flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="p-2.5 bg-slate-50 text-slate-500 hover:text-slate-900 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-black tracking-tighter">Mon Profil LEPOINCITOYEN</span>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-8">
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Welcome/Instructions */}
          <div className="bg-green-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-green-100 relative overflow-hidden">
             <div className="relative z-10 space-y-2">
                <h1 className="text-2xl font-black">Complétez vos infos 🚛</h1>
                <p className="text-green-100 text-sm font-medium opacity-90 leading-relaxed">
                  Aidez nos agents à vous trouver rapidement. L'adresse et le téléphone sont essentiels.
                </p>
             </div>
             <Navigation className="absolute -right-8 -bottom-8 w-40 h-40 text-white/10 rotate-12" />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-2xl flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-100 text-green-700 text-sm font-medium rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Profil mis à jour avec succès ! Redirection...
            </div>
          )}

          {/* Section: Coordonnées obligatoires */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Home className="w-5 h-5 text-green-600" />
              <h2 className="font-black text-slate-900 text-lg">Localisation Physique</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                  Adresse / Quartier (Obligatoire)
                </label>
                <input
                  name="repere_textuel"
                  type="text"
                  required
                  defaultValue={profile?.repere_textuel || ''}
                  placeholder="Ex : Akwa, face Boulangerie Z, Portail Vert"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                  Téléphone de contact
                </label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input
                    name="phone"
                    type="tel"
                    required
                    defaultValue={profile?.phone || ''}
                    placeholder="6XX XX XX XX"
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: GPS (Optionnel) */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                <h2 className="font-black text-slate-900 text-lg">Position GPS</h2>
                <span className="text-[10px] font-black bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full uppercase">Optionnel</span>
              </div>
            </div>
            
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Le GPS permet à l'agent de voir votre maison sur sa carte. Activez-le quand vous êtes chez vous.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                type="button"
                onClick={handleGetGps}
                disabled={gpsLoading}
                className="w-full sm:w-auto px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                {gpsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                {profile?.lat ? "Mettre à jour ma position" : "Capturer ma position GPS"}
              </button>
              
              {profile?.lat && (
                <div className="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-50 px-3 py-2 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Position capturée : {profile.lat.toFixed(4)}, {profile.lng.toFixed(4)}
                </div>
              )}
            </div>
          </div>

          {/* Section: Photo (Optionnelle mais recommandée) */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Camera className="w-5 h-5 text-purple-600" />
              <h2 className="font-black text-slate-900 text-lg">Photo de la Façade</h2>
              <span className="text-[10px] font-black bg-purple-50 text-purple-500 px-2 py-0.5 rounded-full uppercase">Optionnel</span>
            </div>

            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Une photo de votre portail ou de votre façade aide l'agent à ne pas se tromper de maison.
            </p>

            <div className="relative group">
              <input
                type="file"
                name="photo"
                accept="image/*"
                onChange={handlePhotoChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`w-full aspect-video rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-purple-300 ${photoPreview ? 'border-none' : ''}`}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Façade" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-3">
                      <Camera className="w-8 h-8" />
                    </div>
                    <span className="text-sm font-bold text-slate-400">Cliquez pour prendre une photo</span>
                  </>
                )}
              </div>
              {photoPreview && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none">
                  <span className="text-white font-bold flex items-center gap-2">
                    <Camera className="w-5 h-5" /> Modifier la photo
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-slate-900 hover:bg-black text-white py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 shadow-2xl shadow-slate-200"
          >
            {isPending ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <>
                Enregistrer mon profil
                <CheckCircle2 className="w-6 h-6" />
              </>
            )}
          </button>

          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
             <Info className="w-5 h-5 text-amber-600 shrink-0" />
             <p className="text-xs text-amber-700 font-medium">
               Ces informations sont confidentielles et ne sont partagées qu'avec l'agent assigné à votre collecte.
             </p>
          </div>

        </form>
      </div>
    </div>
  )
}
