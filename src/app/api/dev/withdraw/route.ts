/**
 * POST /api/dev/withdraw
 * Route sécurisée pour retirer les frais techniques vers le numéro Mobile Money du développeur
 * Accessible uniquement aux administrateurs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createCampayAPI } from '@/lib/campay/api'
import { randomUUID } from 'crypto'

interface WithdrawRequest {
  amount: number
}

export async function POST(request: NextRequest) {
  try {
    // Récupère le token d'authentification
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Vérifie que c'est un admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can withdraw' },
        { status: 403 }
      )
    }

    // Parse la requête
    const body: WithdrawRequest = await request.json()

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Crée un client service role pour les opérations sensibles
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Récupère le portefeuille
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('tech_fees_wallet')
      .select('*')
      .single()

    if (walletError || !wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    // Vérifie qu'il y a suffisamment de fonds
    if (wallet.balance_xaf < body.amount) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: ${wallet.balance_xaf} XAF` },
        { status: 400 }
      )
    }

    // Récupère le numéro de retrait depuis .env
    const withdrawPhoneNumber = process.env.DEV_WITHDRAW_PHONE
    if (!withdrawPhoneNumber) {
      return NextResponse.json(
        { error: 'Withdrawal phone number not configured' },
        { status: 500 }
      )
    }

    // Génère une référence de retrait
    const withdrawReference = `WITHDRAW-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Crée une transaction de retrait en attente
    const { data: txRecord, error: txError } = await supabaseAdmin
      .from('tech_fees_transactions')
      .insert({
        id: randomUUID(),
        wallet_id: wallet.id,
        type: 'withdrawal',
        amount: body.amount,
        description: `Retrait technique - ${withdrawReference}`,
        status: 'pending',
        withdrawal_phone: withdrawPhoneNumber,
        withdrawal_reference: withdrawReference,
      })
      .select()
      .single()

    if (txError || !txRecord) {
      console.error('Failed to create withdrawal transaction:', txError)
      return NextResponse.json(
        { error: 'Failed to create withdrawal record' },
        { status: 500 }
      )
    }

    // Appelle l'API Campay pour effectuer le retrait
    try {
      const campay = createCampayAPI()

      // Format du numéro (ajoute +237 si manquant)
      let formattedPhone = withdrawPhoneNumber
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+237${formattedPhone}`
      }

      // Effectue le retrait via Campay
      // Note: Campay utilise un endpoint de retrait différent
      const withdrawResponse = await campay.initiateWithdraw({
        phone: formattedPhone,
        amount: body.amount,
        description: `KWAK Frais techniques - ${withdrawReference}`,
        external_reference: withdrawReference,
      })

      // Met à jour la transaction avec l'ID Campay
      await supabaseAdmin
        .from('tech_fees_transactions')
        .update({
          status: 'completed',
          withdrawal_reference: withdrawResponse.transaction_id || withdrawReference,
        })
        .eq('id', txRecord.id)

      // Déduit du solde et met à jour le total retiré
      const { error: updateError } = await supabaseAdmin
        .from('tech_fees_wallet')
        .update({
          balance_xaf: wallet.balance_xaf - body.amount,
          total_withdrawn: wallet.total_withdrawn + body.amount,
          last_withdrawal_date: new Date().toISOString(),
        })
        .eq('id', wallet.id)

      if (updateError) {
        console.error('Failed to update wallet:', updateError)
      }

      console.log(`Withdrawal of ${body.amount} XAF initiated to ${withdrawPhoneNumber}`)

      return NextResponse.json({
        success: true,
        reference: withdrawReference,
        campaign_id: withdrawResponse.transaction_id,
        amount: body.amount,
        phone: withdrawPhoneNumber,
        message: 'Retrait lancé avec succès. Vous recevrez le montant sur votre numéro Mobile Money.',
      })
    } catch (campayError) {
      console.error('Campay withdraw error:', campayError)

      // Marque la transaction comme échouée
      await supabaseAdmin
        .from('tech_fees_transactions')
        .update({
          status: 'failed',
        })
        .eq('id', txRecord.id)

      return NextResponse.json(
        {
          error: 'Failed to process withdrawal with Campay API',
          reference: withdrawReference,
          details: campayError instanceof Error ? campayError.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Withdrawal handler error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
