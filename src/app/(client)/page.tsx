'use client'

import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, ArrowRight, ShieldCheck, Zap, BarChart3, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-green-100 selection:text-green-900">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center rotate-3 shadow-lg shadow-green-200">
                <span className="text-white font-black italic text-xl">K!</span>
              </div>
              <span className="text-2xl font-black tracking-tighter text-slate-900">KWAK</span>
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
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-bold border border-green-100 animate-fade-in">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                La révolution du ramassage urbain
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1.1]">
                Vos déchets ne sont plus <span className="text-green-600">votre souci.</span>
              </h1>
              <p className="text-xl text-slate-500 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
                KWAK connecte les ménages aux agents de collecte via une plateforme intelligente, transparente et écologique. Suivez votre ramassage en temps réel.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/login" className="px-8 py-5 bg-green-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-green-200 hover:bg-green-500 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2">
                  Inscrivez votre ménage
                  <ArrowRight className="w-6 h-6" />
                </Link>
                <Link href="/login" className="px-8 py-5 bg-slate-50 text-slate-900 border border-slate-200 rounded-[2rem] font-black text-lg hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-2">
                  Devenir Agent KWAK
                </Link>
              </div>
            </div>
            <div className="relative lg:ml-10">
              <div className="absolute -inset-4 bg-green-200/30 rounded-[3rem] blur-3xl -z-10"></div>
              <div className="relative bg-white p-4 rounded-[3rem] shadow-2xl shadow-slate-200 rotate-1">
                <Image 
                  src="/hero.png" 
                  alt="KWAK App Illustration" 
                  width={600} 
                  height={600} 
                  className="rounded-[2.5rem] w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Pourquoi choisir KWAK ?</h2>
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

      {/* For Professionals */}
      <section id="pro" className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[4rem] p-8 md:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-green-600/10 blur-[120px] rounded-full translate-x-1/2"></div>
            
            <div className="grid md:grid-cols-2 gap-16 items-center relative z-10">
              <div className="space-y-8">
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
                  Vous êtes un agent <br/> de collecte ?
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
                {/* Visual Placeholder for Agent Interface */}
                <div className="bg-slate-800 p-8 rounded-[3rem] border border-slate-700 shadow-2xl rotate-3">
                   <div className="space-y-4">
                      <div className="h-4 w-1/2 bg-slate-700 rounded-full"></div>
                      <div className="h-12 w-full bg-green-500/20 border border-green-500/30 rounded-2xl"></div>
                      <div className="h-12 w-full bg-slate-700 rounded-2xl"></div>
                      <div className="h-12 w-full bg-slate-700 rounded-2xl"></div>
                   </div>
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
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center rotate-3">
                  <span className="text-white font-black italic text-sm">K!</span>
                </div>
                <span className="text-xl font-black tracking-tighter">KWAK</span>
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
              © {new Date().getFullYear()} KWAK Waste Management Platform. Fait avec passion pour nos villes.
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
