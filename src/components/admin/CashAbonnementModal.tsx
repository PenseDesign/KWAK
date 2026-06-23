'use client'

import { useState, useTransition } from 'react'
import { adminCreateCashAbonnement, adminRenewCashAbonnement } from '@/app/actions'
import {
  X, Loader2, AlertTriangle, CheckCircle2, Download,
  User, Phone, Mail, MapPin, Banknote, FileText, Lock, Home, Calendar
} from 'lucide-react'

const FORFAITS = [
  { id: 'Mensuel Basique', label: 'Mensuel Basique', price: 2500 },
  { id: 'Mensuel Pro', label: 'Mensuel Pro', price: 3000 },
  { id: 'Hebdomadaire', label: 'Hebdomadaire', price: 1000 },
]

type Receipt = {
  receiptNumber: string
  clientName: string
  clientPhone: string
  clientEmail: string
  clientAddress: string
  clientQuartier: string
  forfait: string
  montant: number
  dateDebut: string
  dateFin: string
  dateEmission: string
  modePaiement: string
  validePar: string
  generatedPassword: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
}

function formatShort(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

// ── Génération PDF via jsPDF ────────────────────────────────────────────────
async function downloadReceiptPDF(receipt: Receipt) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' })

  const W = doc.internal.pageSize.getWidth()
  const margin = 12
  let y = margin

  // ── Couleurs
  const green = [22, 163, 74] as [number, number, number]
  const dark = [15, 23, 42] as [number, number, number]
  const grey = [100, 116, 139] as [number, number, number]
  const light = [241, 245, 249] as [number, number, number]
  const white = [255, 255, 255] as [number, number, number]

  // ── Header vert
  doc.setFillColor(...green)
  doc.rect(0, 0, W, 30, 'F')
  doc.setTextColor(...white)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('LEPOINCITOYEN', margin, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Service de collecte des ordures ménagères', margin, 19)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('REÇU DE PAIEMENT', W - margin, 12, { align: 'right' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(receipt.receiptNumber, W - margin, 19, { align: 'right' })
  y = 38

  // ── Date & mode
  doc.setFillColor(...light)
  doc.roundedRect(margin, y, W - margin * 2, 12, 2, 2, 'F')
  doc.setTextColor(...grey)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date d'émission : ${formatDate(receipt.dateEmission)}`, margin + 4, y + 5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...green)
  doc.text(receipt.modePaiement.toUpperCase(), W - margin - 4, y + 5, { align: 'right' })
  y += 18

  // ── Section Client
  const sectionHeader = (title: string) => {
    doc.setFillColor(...dark)
    doc.rect(margin, y, W - margin * 2, 7, 'F')
    doc.setTextColor(...white)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(title, margin + 3, y + 5)
    y += 10
  }

  const row = (label: string, value: string) => {
    doc.setTextColor(...grey)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(label, margin + 3, y)
    doc.setTextColor(...dark)
    doc.setFont('helvetica', 'bold')
    doc.text(value || '—', margin + 42, y)
    y += 6
  }

  sectionHeader('INFORMATIONS CLIENT')
  row('Nom complet', receipt.clientName)
  row('Téléphone', receipt.clientPhone)
  row('Email', receipt.clientEmail)
  row('Quartier', receipt.clientQuartier)
  row('Adresse / Repère', receipt.clientAddress)
  y += 2

  sectionHeader('DÉTAILS ABONNEMENT')
  row('Forfait', receipt.forfait)
  row('Début', formatShort(receipt.dateDebut))
  row('Fin', formatShort(receipt.dateFin))
  row('Montant payé', `${receipt.montant.toLocaleString('fr-FR')} FCFA`)
  row('Mode de paiement', receipt.modePaiement)
  y += 2

  // ── Accès compte (mot de passe)
  doc.setFillColor(254, 243, 199) // amber-100
  doc.roundedRect(margin, y, W - margin * 2, 20, 2, 2, 'F')
  doc.setTextColor(146, 64, 14)   // amber-800
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('ACCÈS À VOTRE COMPTE', margin + 4, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.text(`Connectez-vous sur l'application avec votre téléphone.`, margin + 4, y + 12)
  doc.text(`Mot de passe temporaire :`, margin + 4, y + 17)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(receipt.generatedPassword, margin + 55, y + 17)
  y += 26

  // ── Validé par + signature
  doc.setTextColor(...grey)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Validé par : ${receipt.validePar}`, margin + 3, y)
  y += 10
  doc.setDrawColor(...grey)
  doc.line(margin + 3, y, margin + 60, y)
  doc.setFontSize(7)
  doc.text('Signature', margin + 3, y + 4)

  // ── Footer
  const footerY = doc.internal.pageSize.getHeight() - 10
  doc.setFillColor(...green)
  doc.rect(0, footerY - 4, W, 14, 'F')
  doc.setTextColor(...white)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Ce reçu est votre preuve de paiement. Conservez-le précieusement.', W / 2, footerY + 2, { align: 'center' })

  doc.save(`Recu_${receipt.receiptNumber}.pdf`)
}
// ────────────────────────────────────────────────────────────────────────────

export function CashAbonnementModal({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState<'form' | 'receipt'>('form')
  const [mode, setMode] = useState<'nouveau' | 'renouvellement'>('nouveau')
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedForfait, setSelectedForfait] = useState(FORFAITS[0])
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const action = mode === 'renouvellement' ? adminRenewCashAbonnement : adminCreateCashAbonnement
      const res = await action(formData)
      if (res.success && res.receipt) {
        setReceipt(res.receipt as Receipt)
        setStep('receipt')
        onSuccess()
      } else {
        setError((res as any).error || 'Une erreur est survenue.')
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">

        {/* Header */}
        <div className={`p-5 border-b flex justify-between items-center shrink-0 ${step === 'receipt' ? 'bg-green-600' : 'bg-slate-50'}`}>
          <div className="flex items-center gap-3">
            {step === 'receipt' ? (
              <FileText className="w-5 h-5 text-white" />
            ) : (
              <Banknote className="w-5 h-5 text-green-600" />
            )}
            <div>
              <h3 className={`font-black text-lg ${step === 'receipt' ? 'text-white' : 'text-slate-900'}`}>
                {step === 'form' ? 'Abonnement Cash' : 'Reçu de Paiement'}
              </h3>
              <p className={`text-xs font-medium ${step === 'receipt' ? 'text-green-100' : 'text-slate-400'}`}>
                {step === 'form' ? 'Paiement en espèces / Main propre' : receipt?.receiptNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${step === 'receipt' ? 'hover:bg-green-500 text-white' : 'hover:bg-slate-200 text-slate-400'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── ÉTAPE 1 : FORMULAIRE ── */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">

            {/* Toggle Mode */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button type="button" onClick={() => { setMode('nouveau'); setError(null) }}
                className={`py-2.5 rounded-lg text-xs font-black transition-all ${
                  mode === 'nouveau' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                ✨ Nouveau client
              </button>
              <button type="button" onClick={() => { setMode('renouvellement'); setError(null) }}
                className={`py-2.5 rounded-lg text-xs font-black transition-all ${
                  mode === 'renouvellement' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                🔄 Renouvellement
              </button>
            </div>

            {mode === 'renouvellement' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
                🔍 Entrez le numéro de téléphone du client existant. Son compte sera retrouvé automatiquement.
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            {/* Identité — seulement pour nouveau client */}
            {mode === 'nouveau' && <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                <User className="w-3 h-3" /> Identité du client
              </p>
              <div className="space-y-3">
                <input name="full_name" type="text" required placeholder="Nom complet *"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                    <input name="phone" type="tel" required placeholder="Téléphone *"
                      className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                    <input name="email" type="email" placeholder="Email (optionnel)"
                      className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                  </div>
                </div>
              </div>
            </div>}

            {/* Adresse — seulement pour nouveau client */}
            {mode === 'nouveau' && <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                <Home className="w-3 h-3" /> Adresse de collecte
              </p>
              <div className="space-y-3">
                <input name="quartier" type="text" placeholder="Quartier (ex: Akwa, Bonanjo…)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-300 pointer-events-none" />
                  <input name="repere_textuel" type="text" placeholder="Repère / Adresse détaillée"
                    className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                </div>
              </div>
            </div>}

            {/* Téléphone — seulement pour renouvellement */}
            {mode === 'renouvellement' && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> Téléphone du client
                </p>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                  <input name="phone" type="tel" required placeholder="Ex: 677656873"
                    className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20" />
                </div>
              </div>
            )}

            {/* Forfait */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                <Banknote className="w-3 h-3" /> Forfait & Paiement
              </p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {FORFAITS.map(f => (
                  <button key={f.id} type="button" onClick={() => setSelectedForfait(f)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${selectedForfait.id === f.id ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                    <p className={`text-xs font-black leading-tight ${selectedForfait.id === f.id ? 'text-green-700' : 'text-slate-700'}`}>{f.label}</p>
                    <p className={`text-sm font-black mt-1 ${selectedForfait.id === f.id ? 'text-green-600' : 'text-slate-500'}`}>{f.price.toLocaleString()} F</p>
                  </button>
                ))}
              </div>
              <input type="hidden" name="type_forfait" value={selectedForfait.id} />
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                <input name="montant_recu" type="number" required defaultValue={selectedForfait.price}
                  key={selectedForfait.id}
                  placeholder="Montant reçu (FCFA)"
                  className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
              </div>

              {/* Date de début */}
              <div className="relative mt-3">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                <input
                  name="date_debut"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
                <p className="text-[10px] text-slate-400 font-medium mt-1 pl-1">Date de début de l'abonnement</p>
              </div>
            </div>

            {/* Info mot de passe auto — seulement pour nouveau client */}
            {mode === 'nouveau' && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 font-medium">
                  Un mot de passe temporaire sera auto-généré et <strong>imprimé sur le reçu PDF</strong> à remettre au client.
                </p>
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button type="button" onClick={onClose}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3.5 rounded-xl font-bold text-sm transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={isPending}
                className={`w-2/3 text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg disabled:opacity-60 ${
                  mode === 'renouvellement' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100' : 'bg-green-600 hover:bg-green-700 shadow-green-100'
                }`}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isPending ? (mode === 'renouvellement' ? 'Renouvellement…' : 'Création en cours…') : (mode === 'renouvellement' ? 'Renouveler & Imprimer' : 'Créer & Activer')}
              </button>
            </div>
          </form>
        )}

        {/* ── ÉTAPE 2 : REÇU ── */}
        {step === 'receipt' && receipt && (
          <div className="flex-1 overflow-y-auto">
            {/* Reçu stylisé */}
            <div className="p-6 space-y-4">
              {/* Succès banner */}
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
                <div>
                  <p className="font-black text-green-800 text-sm">Compte créé & abonnement activé !</p>
                  <p className="text-xs text-green-600 font-medium mt-0.5">Le client peut déjà se connecter à l'application.</p>
                </div>
              </div>

              {/* Corps du reçu */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden">
                {/* En-tête reçu */}
                <div className="bg-slate-900 p-4 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-base">LEPOINCITOYEN</p>
                      <p className="text-slate-400 text-xs">Collecte des ordures ménagères</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">N° Reçu</p>
                      <p className="font-mono font-bold text-xs text-green-400">{receipt.receiptNumber}</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between text-xs">
                    <span className="text-slate-400">Date : <span className="text-white">{formatDate(receipt.dateEmission)}</span></span>
                    <span className="bg-green-600 text-white px-2 py-0.5 rounded-full font-bold text-[10px] uppercase">💵 Espèces</span>
                  </div>
                </div>

                {/* Infos client */}
                <div className="p-4 space-y-3 bg-white">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-[10px] text-slate-400 font-bold uppercase">Nom</p><p className="font-bold text-slate-900">{receipt.clientName}</p></div>
                    <div><p className="text-[10px] text-slate-400 font-bold uppercase">Téléphone</p><p className="font-bold text-slate-900">{receipt.clientPhone}</p></div>
                    <div><p className="text-[10px] text-slate-400 font-bold uppercase">Quartier</p><p className="font-bold text-slate-900">{receipt.clientQuartier || '—'}</p></div>
                    <div><p className="text-[10px] text-slate-400 font-bold uppercase">Email</p><p className="font-bold text-slate-900 truncate">{receipt.clientEmail}</p></div>
                  </div>
                  {receipt.clientAddress && (
                    <div><p className="text-[10px] text-slate-400 font-bold uppercase">Adresse</p><p className="font-bold text-slate-900">{receipt.clientAddress}</p></div>
                  )}
                </div>

                <div className="h-px bg-dashed bg-slate-100" />

                {/* Abonnement */}
                <div className="p-4 space-y-2 bg-white border-t border-dashed border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Abonnement</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-[10px] text-slate-400 font-bold uppercase">Forfait</p><p className="font-black text-slate-900">{receipt.forfait}</p></div>
                    <div><p className="text-[10px] text-slate-400 font-bold uppercase">Montant payé</p><p className="font-black text-green-700 text-base">{receipt.montant.toLocaleString('fr-FR')} FCFA</p></div>
                    <div><p className="text-[10px] text-slate-400 font-bold uppercase">Début</p><p className="font-bold text-slate-900">{formatShort(receipt.dateDebut)}</p></div>
                    <div><p className="text-[10px] text-slate-400 font-bold uppercase">Fin</p><p className="font-bold text-slate-900">{formatShort(receipt.dateFin)}</p></div>
                  </div>
                </div>

                {/* Mot de passe — uniquement pour les nouveaux comptes */}
                {receipt.generatedPassword && (
                  <div className="p-4 bg-amber-50 border-t border-dashed border-amber-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Accès à l'application</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-600 font-medium">Se connecte avec son numéro de téléphone</p>
                        <p className="text-xs text-slate-500">Mot de passe temporaire :</p>
                      </div>
                      <code className="bg-white border border-amber-200 text-amber-700 font-black text-lg px-3 py-1 rounded-xl tracking-widest">{receipt.generatedPassword}</code>
                    </div>
                  </div>
                )}

                {/* Validé par */}
                <div className="p-4 bg-slate-50 border-t border-dashed border-slate-200 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Validé par</p>
                    <p className="font-bold text-slate-900">{receipt.validePar}</p>
                  </div>
                  <div className="text-right">
                    <div className="w-32 h-px bg-slate-300 mb-1" />
                    <p className="text-[10px] text-slate-400">Signature</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={onClose}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3.5 rounded-xl font-bold text-sm transition-colors">
                Fermer
              </button>
              <button onClick={() => downloadReceiptPDF(receipt)}
                className="w-2/3 bg-slate-900 hover:bg-black text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-slate-200">
                <Download className="w-4 h-4" />
                Télécharger le PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
