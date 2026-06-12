'use client'

import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, ArrowRight, ShieldCheck, Zap, BarChart3, Menu, X, Award, Users, MapPin, Truck } from 'lucide-react'
import { useState } from 'react'

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-green-100 selection:text-green-900">

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="LePointCitoyen" width={140} height={140} className="rounded-xl" />
              <span className="text-xl font-black tracking-tighter text-slate-900">LEPOINCITOYEN</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-sm font-semibold text-slate-600 hover:text-green-600 transition-colors">Services</a>
              <a href="#pro" className="text-sm font-semibold text-slate-600 hover:text-green-600 transition-colors">Agent</a>
              <Link href="/login" className="text-sm font-semibold text-slate-900 hover:text-green-600 transition-colors">Connexion</Link>
              <Link href="/register" className="bg-green-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-green-500 transition-all active:scale-95 shadow-lg shadow-green-100">
                Inscription
              </Link>
            </div>

            <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 p-4 space-y-4 animate-in slide-in-from-top duration-300">
            <a href="#services" onClick={() => setIsMenuOpen(false)} className="block text-lg font-bold text-slate-900">Services</a>
            <a href="#pro" onClick={() => setIsMenuOpen(false)} className="block text-lg font-bold text-slate-900">Agent</a>
            <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block text-lg font-bold text-slate-900">Connexion</Link>
            <Link href="/register" onClick={() => setIsMenuOpen(false)} className="block w-full bg-green-600 text-white p-4 rounded-2xl font-black text-center">
              Inscription
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-100">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </span>
                Précollecte et valorisation responsable
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                Vos déchets ne sont plus <span className="text-green-600">votre souci.</span>
              </h1>
              <p className="text-lg text-slate-500 font-normal max-w-xl mx-auto lg:mx-0 leading-relaxed">
                LEPOINCITOYEN connecte les ménages aux agents de collecte via une plateforme intelligente, transparente et écologique. Suivez votre ramassage en temps réel.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link href="/login" className="px-6 py-3.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                  Inscrivez votre ménage
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/login" className="px-6 py-3.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  Devenir Agent Collecteur
                </Link>
              </div>
            </div>
            <div className="relative lg:ml-10">
              <div className="absolute -inset-2 bg-green-100/40 rounded-2xl -z-10"></div>
              <div className="relative bg-white p-2 rounded-2xl shadow-lg shadow-slate-200/80 border border-slate-100">
                <Image
                  src="/hero.png"
                  alt="Agents LEPOINCITOYEN sur le terrain à Douala"
                  width={600}
                  height={600}
                  className="rounded-xl w-full h-auto object-cover"
                  priority
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-white px-4 py-2.5 rounded-xl shadow-md border border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Service Certifié CUD</p>
                  <p className="text-[10px] text-slate-400">Douala, Cameroun</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Services Section */}
      <section id="services" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Pourquoi choisir LEPOINCITOYEN ?</h2>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto">Une technologie pensée pour les réalités du terrain, assurant une ville plus propre chaque jour.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all group">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black mb-4">Ramassage Garanti</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Grâce à notre moteur d'optimisation, aucun ménage n'est oublié. Votre collecte est programmée et respectée.</p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all group">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black mb-4">Preuve en Image</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Chaque passage est validé par une photo. Vous recevez une notification dès que vos déchets sont collectés.</p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all group">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black mb-4">Suivi de Performance</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Visualisez vos statistiques de collecte et gérez vos abonnements en quelques clics depuis votre mobile.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '500+', label: 'Ménages desservis', icon: Users },
              { value: '15+', label: 'Agents déployés', icon: Truck },
              { value: '5', label: 'Quartiers couverts', icon: MapPin },
              { value: '98%', label: 'Taux de satisfaction', icon: Award },
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-3">
                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto">
                  <stat.icon className="w-7 h-7" />
                </div>
                <p className="text-3xl md:text-4xl font-black text-slate-900">{stat.value}</p>
                <p className="text-sm font-bold text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nos Agents sur le terrain */}
      <section id="terrain" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-bold border border-blue-100">
              <Award className="w-4 h-4" />
              Service Certifié CUD — Douala, Cameroun
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Nos agents sur le terrain</h2>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto">Des hommes et des femmes dévoués, formés et équipés, qui parcourent vos quartiers chaque jour pour une ville plus propre.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Photo 1 — Agent de dos */}
            <div className="group relative overflow-hidden rounded-[2.5rem] aspect-[4/5] shadow-lg">
              <Image
                src="/agent-back.jpeg"
                alt="Agent LEPOINCITOYEN en mission dans les rues de Douala"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white font-black text-lg">Responsable et durable</p>
                <p className="text-white/70 text-sm font-medium">Chaque agent porte fièrement les couleurs LP</p>
              </div>
            </div>

            {/* Photo 2 — Équipe */}
            <div className="group relative overflow-hidden rounded-[2.5rem] aspect-[4/5] shadow-lg">
              <Image
                src="/agents-team.jpeg"
                alt="Équipe d'agents LEPOINCITOYEN prêts pour la collecte"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white font-black text-lg">Travail d'équipe</p>
                <p className="text-white/70 text-sm font-medium">Hommes et femmes unis pour Douala propre</p>
              </div>
            </div>

            {/* Photo 3 — Tricycle */}
            <div className="group relative overflow-hidden rounded-[2.5rem] aspect-[4/5] shadow-lg">
              <Image
                src="/agents-tricycle.jpeg"
                alt="Agents LEPOINCITOYEN avec leur véhicule de collecte"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white font-black text-lg">Équipement adapté</p>
                <p className="text-white/70 text-sm font-medium">Tricycles brandés pour la précollecte de proximité</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Professionals */}
      <section id="pro" className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[4rem] p-8 md:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-green-600/10 blur-[120px] rounded-full translate-x-1/2"></div>

            <div className="grid md:grid-cols-2 gap-16 items-center relative z-10">
              <div className="space-y-8">
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
                  Vous êtes un agent <br /> de collecte ?
                </h2>
                <p className="text-xl text-slate-400 font-medium leading-relaxed">
                  Optimisez votre temps, gérez vos tournées même hors-ligne et soyez payé pour chaque mission accomplie en toute transparence.
                </p>
                <ul className="space-y-4">
                  {[
                    "Tournées optimisées automatiquement",
                    "Mode offline pour les zones sans réseau",
                    "Historique de vos collectes et gains",
                    "Assistance technique 24/7"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white font-semibold">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/login" className="inline-flex px-8 py-5 bg-white text-slate-900 rounded-[2rem] font-black text-lg hover:bg-green-50 transition-all active:scale-95 shadow-2xl">
                  Rejoindre l'équipe terrain
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="relative rounded-[3rem] overflow-hidden shadow-2xl rotate-2">
                  <Image
                    src="/agent-back.jpeg"
                    alt="Agent LEPOINCITOYEN — Service Certifié CUD"
                    width={500}
                    height={600}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16 text-center md:text-left">
            <div className="space-y-6">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <Image src="/logo.png" alt="LePointCitoyen" width={60} height={60} className="rounded-lg" />
                <span className="text-xl font-black tracking-tighter">LEPOINCITOYEN</span>
              </div>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                La plateforme qui rend nos villes plus propres, un ramassage après l'autre.
              </p>
            </div>

            <div className="space-y-6">
              <h4 className="font-black text-slate-900">Application</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li><Link href="/login">Espace Client</Link></li>
                <li><Link href="/login">Mode Agent</Link></li>
                <li><Link href="/login">Administration</Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="font-black text-slate-900">Société</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li><a href="#">À propos</a></li>
                <li><a href="#">Nous rejoindre</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="font-black text-slate-900">Légal</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li><a href="#">Confidentialité</a></li>
                <li><a href="#">CGU</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-400 font-medium">
              © {new Date().getFullYear()} LEPOINCITOYEN — Précollecte et Valorisation Responsable. Fait avec passion pour nos villes.
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
