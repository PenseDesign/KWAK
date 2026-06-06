/**
 * POST /api/campay/payment-webhook
 * Webhook pour recevoir les notifications de statut de Campay
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PaymentTransaction } from '@/lib/types/database'

interface CampayWebhookPayload {
  reference: string          // <- PIÈGE : Chez CamPay, c'est l'ID de transaction CamPay
  external_reference?: string // Votre ID unique envoyé lors du /collect/
  status: string             // "SUCCESSFUL" ou "FAILED"
  amount: number
  currency: string
  operator?: string
  operator_reference?: string // ID de transaction MTN/Orange
  signature?: string
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const payload: CampayWebhookPayload = JSON.parse(rawBody)

    // Log complet obligatoire en production pour débugger au début
    console.log('CamPay Webhook Payload:', payload)

    const campayTransactionId = payload.reference; // Correspond à l'ID CamPay
    const externalRef = payload.external_reference;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let transaction = null

    // 1. Recherche prioritaire par l'ID de transaction CamPay
    if (campayTransactionId) {
      const { data } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('campay_transaction_id', campayTransactionId)
        .maybeSingle() // Évite de lever une exception si non trouvé

      if (data) transaction = data
    }

    // 2. Recherche secondaire par votre référence externe (ex: commande_id)
    if (!transaction && externalRef) {
      const { data } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('reference', externalRef)
        .maybeSingle()

      if (data) transaction = data
    }

    if (!transaction) {
      console.warn('Transaction non trouvée pour le webhook:', payload)
      // On répond quand même 200 à CamPay pour éviter qu'il ne bombarde votre serveur de requêtes de retry
      return NextResponse.json({ error: 'Transaction not found', success: false }, { status: 200 })
    }

    // Normalisation stricte du statut CamPay
    let transactionStatus = 'pending'
    const rawStatus = payload.status?.toUpperCase()

    if (rawStatus === 'SUCCESSFUL' || rawStatus === 'SUCCESS') {
      transactionStatus = 'successful'
    } else if (rawStatus === 'FAILED') {
      transactionStatus = 'failed'
    } else if (rawStatus === 'CANCELLED') {
      transactionStatus = 'cancelled'
    }

    // Mise à jour de la transaction dans Supabase
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: transactionStatus,
        campay_transaction_id: campayTransactionId,
        completed_at: transactionStatus === 'successful' ? new Date().toISOString() : null,
        // Optionnel : stocker la référence MTN/Orange si disponible
        error_message: rawStatus === 'FAILED' ? 'CamPay transaction failed' : null,
      })
      .eq('id', transaction.id)

    if (updateError) {
      console.error('Échec de la mise à jour Supabase:', updateError)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }

    // Si le paiement est validé et que la transaction n'était pas déjà traitée
    if (transactionStatus === 'successful' && transaction.status !== 'successful') {
      await handleSuccessfulPayment(supabase, transaction)
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      status: transactionStatus,
    }, { status: 200 })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── [CAMPAY] Activation automatique après paiement confirmé ─────────────────
// Appelée par le webhook quand Campay confirme un paiement SUCCESSFUL.
// En mode USSD actuel, cette fonction n'est pas déclenchée automatiquement
// (l'admin active manuellement depuis le dashboard).
// TODO: Cette fonction sera utilisée automatiquement quand Campay API sera actif.
async function handleSuccessfulPayment(supabase: SupabaseClient, transaction: PaymentTransaction) {
  try {
    if (!transaction.demande_abonnement_id) {
      console.warn('[Webhook] Transaction sans demande_abonnement_id — activation ignorée.')
      return
    }

    // Récupérer la demande d'abonnement
    const { data: demande, error: demandeError } = await supabase
      .from('demandes_abonnement')
      .select('*')
      .eq('id', transaction.demande_abonnement_id)
      .single()

    if (demandeError || !demande) {
      console.error('[Webhook] Demande d\'abonnement introuvable:', transaction.demande_abonnement_id)
      return
    }

    // Calculer les dates selon le forfait
    const now = new Date()
    const dateDebut = now.toISOString().split('T')[0]
    const dateFin = new Date(now)

    if (demande.type_forfait === 'Hebdomadaire') {
      dateFin.setDate(dateFin.getDate() + 7)
    } else {
      dateFin.setMonth(dateFin.getMonth() + 1)
    }

    // Jours de passage par défaut selon le forfait
    let joursPassage = [3, 6] // Mercredi + Samedi
    if (demande.type_forfait === 'Mensuel Pro') {
      joursPassage = [3, 4, 6] // Mercredi + Jeudi + Samedi
    }

    // Créer ou mettre à jour l'abonnement
    const { error: abonnementError } = await supabase
      .from('abonnements')
      .upsert({
        client_id: demande.client_id,
        type_forfait: demande.type_forfait,
        status: 'actif',
        date_debut: dateDebut,
        date_fin: dateFin.toISOString().split('T')[0],
        jours_passage: joursPassage,
      }, { onConflict: 'client_id' })

    if (abonnementError) {
      console.error('[Webhook] Erreur création abonnement:', abonnementError)
      return
    }

    // Marquer la demande comme activée
    await supabase
      .from('demandes_abonnement')
      .update({ status: 'actif' })
      .eq('id', demande.id)

    console.log(`[Webhook] Abonnement activé automatiquement pour client ${demande.client_id} — ${demande.type_forfait}`)
  } catch (err) {
    console.error('[Webhook] Erreur dans handleSuccessfulPayment:', err)
  }
}
// ─────────────────────────────────────────────────────────────────────────────
