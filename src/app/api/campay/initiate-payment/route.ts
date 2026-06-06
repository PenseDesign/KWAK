/**
 * POST /api/initiate-payment
 * Initialise une demande de paiement Mobile Money via Campay
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createCampayAPI } from '@/lib/campay/api'
import { randomUUID } from 'crypto'

interface InitiatePaymentRequest {
  phone_number: string
  operator: 'mtn' | 'orange'
  amount: number
  demande_abonnement_id?: string
}

export async function POST(request: NextRequest) {
  try {
    // Parse la requête
    const body: InitiatePaymentRequest = await request.json()

    // Validation
    if (!body.phone_number || !body.operator || !body.amount) {
      return NextResponse.json(
        { error: 'Missing required fields: phone_number, operator, amount' },
        { status: 400 }
      )
    }

    if (body.amount <= 0 || body.amount > 500000) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be between 100 and 500000 XAF' },
        { status: 400 }
      )
    }

    // Récupère le user ID depuis l'auth (header Authorization)
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    // Récupère le user actuel
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token or user not found' },
        { status: 401 }
      )
    }

    // Génère une référence unique
    const reference = `KWAK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Crée une entrée dans payment_transactions
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .insert({
        id: randomUUID(),
        client_id: user.id,
        demande_abonnement_id: body.demande_abonnement_id,
        phone_number: body.phone_number,
        operator: body.operator,
        amount: body.amount,
        currency: 'XAF',
        reference,
        status: 'pending',
      })
      .select()
      .single()

    if (txError || !transaction) {
      console.error('Database error:', txError)
      return NextResponse.json(
        { error: 'Failed to create payment transaction' },
        { status: 500 }
      )
    }

    // Appelle l'API Campay
    try {
      const campay = createCampayAPI()

      // Formate le numéro de téléphone (ajoute le préfixe pays s'il manque)
      let formattedPhone = body.phone_number
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+237${formattedPhone}`
      }

      const campayResponse = await campay.initiateMoMoPayment({
        phone: formattedPhone,
        amount: body.amount,
        description: `KWAK - Abonnement (Ref: ${reference})`,
        external_reference: reference,
      })

      // Met à jour la transaction avec l'ID Campay
      if (campayResponse.transaction_id) {
        await supabase
          .from('payment_transactions')
          .update({
            campay_transaction_id: campayResponse.transaction_id,
            status: 'processing',
          })
          .eq('id', transaction.id)
      }

      return NextResponse.json({
        success: true,
        reference,
        campaign_id: campayResponse.transaction_id,
        transaction_id: transaction.id,
        message: 'Paiement en cours. Veuillez confirmer sur votre téléphone.',
      })
    } catch (campayError) {
      console.error('Campay API error:', campayError)

      // Met à jour le statut en failed
      await supabase
        .from('payment_transactions')
        .update({
          status: 'failed',
          error_message:
            campayError instanceof Error
              ? campayError.message
              : 'Erreur lors de l\'appel à Campay',
        })
        .eq('id', transaction.id)

      return NextResponse.json(
        {
          error:
            'Failed to initiate payment with provider. Please try again later.',
          reference,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
