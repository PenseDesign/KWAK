'use client'

import { useState, useEffect } from 'react'
import { signUp } from '@/app/actions'
import { Lock, Mail, Loader2, ArrowRight, User, Home, Truck, Phone, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<'client' | 'pending_agent'>('client')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      formData.append('role', role)
      const result = await signUp(formData)

      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    } catch (err: any) {
      setError('Une erreur inattendue est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  // Redirection automatique vers /login après inscription réussie
  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => router.push('/login'), 3000)
    return () => clearTimeout(timer)
  }, [success, router])

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-10 rounded-[3rem] shadow-xl text-center space-y-6 border border-slate-100">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900">Compte créé avec succès !</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Bienvenue sur la plateforme LEPOINCITOYEN.
          </p>
          <p className="text-sm text-slate-400">
            Redirection automatique vers la connexion…
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-green-500 h-1.5 rounded-full"
              style={{ animation: 'progressShrink 3s linear forwards', width: '100%' }}
            />
          </div>
          <style>{`@keyframes progressShrink { from { width: 100% } to { width: 0% } }`}</style>
          <Link href="/login" className="inline-block text-green-600 font-bold hover:underline text-sm">
            Aller à la connexion maintenant →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md space-y-8">

        {/* Header */}
        <div className="text-center space-y-4">
          <Link href="/" className="inline-block">
            <Image src="/logo.png" alt="LePointCitoyen" width={100} height={100} />
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Créer un compte</h1>
            <p className="text-slate-500 font-medium">Rejoignez la communauté LEPOINCITOYEN aujourd'hui</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-2xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                {error}
              </div>
            )}

            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('client')}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${role === 'client'
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-slate-100 bg-slate-50 text-slate-500'
                  }`}
              >
                <Home className={`w-6 h-6 mb-2 ${role === 'client' ? 'text-green-600' : 'text-slate-400'}`} />
                <span className="block font-bold text-sm">Ménage</span>
                <span className="text-[10px] opacity-80 leading-tight">Je veux faire ramasser mes déchets</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('pending_agent')}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${role === 'pending_agent'
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-slate-100 bg-slate-50 text-slate-500'
                  }`}
              >
                <Truck className={`w-6 h-6 mb-2 ${role === 'pending_agent' ? 'text-green-600' : 'text-slate-400'}`} />
                <span className="block font-bold text-sm">Agent</span>
                <span className="text-[10px] opacity-80 leading-tight">Je veux travailler comme collecteur</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Nom complet</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-600 transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    name="full_name"
                    type="text"
                    required
                    className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all"
                    placeholder="Jean Dupont"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Numéro de téléphone</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-600 transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    name="phone"
                    type="tel"
                    required
                    className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all"
                    placeholder="6xx xxx xxx"
                  />
                </div>
                <p className="text-xs text-green-700 font-medium ml-1">
                  ℹ️ Ce numéro servira à vous connecter
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Mot de passe</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-600 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Email — champ de sécurité, discret mais obligatoire */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2 ml-1">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <label className="text-sm font-bold text-slate-500">Adresse e-mail <span className="font-normal text-slate-400">(pour la sécurité du compte)</span></label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-600 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all"
                    placeholder="exemple@gmail.com"
                  />
                </div>
                <p className="text-xs text-slate-400 ml-1">
                  🔒 Utilisé uniquement en cas de perte de mot de passe. Jamais partagé.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-green-100"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Créer mon compte
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-50 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Déjà un compte ? <Link href="/login" className="text-green-600 font-bold hover:underline">Connectez-vous</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
