import { NextRequest, NextResponse } from 'next/server'

/**
 * Route d'initiation de paiement (adaptée depuis le code fourni)
 * Expose: POST /api/initiate-payment
 * Body: { phone: string }
 */

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ success: false, message: 'Missing phone' }, { status: 400 })
    }

    // 1. Demande de Token à CamPay
    const tokenRes = await fetch('https://campay.net', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_username: process.env.CAMPAY_APP_USERNAME,
        app_password: process.env.CAMPAY_APP_PASSWORD,
      }),
    })

    const tokenData = await tokenRes.json()
    if (!tokenRes.ok) throw new Error('Impossible d\'obtenir le token CamPay')

    // Decide amount: use fixed 3139 XAF (production requirement). For sandbox some providers cap amount;
    // to force sandbox small amount you can set CAMPAY_SANDBOX_FORCE_25=1 in .env.local
    const FIXED_AMOUNT = process.env.CAMPAY_SANDBOX_FORCE_25 === '1' ? 25 : 3139

    // 2. Déclenchement de la collecte (Débit direct)
    const collectRes = await fetch('https://campay.net', {
      method: 'POST',
      headers: {
        Authorization: `Token ${tokenData.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: String(FIXED_AMOUNT),
        currency: 'XAF',
        from: phone,
        description: 'Paiement Application Web',
        external_reference: 'CMD-' + Date.now(),
      }),
    })

    const collectData = await collectRes.json()
    if (!collectRes.ok)
      return NextResponse.json({ success: false, message: collectData.message || 'Échec du débit' }, { status: 400 })

    return NextResponse.json({ success: true, reference: collectData.reference })
  } catch (error: unknown) {
    const getErrorMessage = (e: unknown) => {
      if (e instanceof Error) return e.message
      try {
        return String(e)
      } catch {
        return 'Unknown error'
      }
    }

    return NextResponse.json({ success: false, message: getErrorMessage(error) }, { status: 500 })
  }
}
