/**
 * Utilitaire pour interagir avec l'API Campay
 * Documentation: https://campay.net/docs
 */

interface CampayInitiatePaymentRequest {
  phone: string
  amount: number
  description?: string
  external_reference?: string
}

interface CampayInitiatePaymentResponse {
  success: boolean
  transaction_id: string
  status: string
  message?: string
}

interface CampayTransactionStatus {
  success: boolean
  status: string
  transaction_id: string
  message?: string
}

export class CampayAPI {
  private username: string
  private password: string
  private baseUrl: string
  private token: string | null = null
  private webhookSecret: string

  constructor() {
    this.username = process.env.CAMPAY_APP_USERNAME || ''
    this.password = process.env.CAMPAY_APP_PASSWORD || ''
    this.baseUrl = process.env.CAMPAY_URL || 'https://api.campay.net'
    this.webhookSecret = process.env.CAMPAY_WEBHOOK_SECRET || ''

    if (!this.username || !this.password) {
      console.warn('Campay credentials (USERNAME/PASSWORD) are not configured')
    }
  }

  /**
   * Récupère un token d'accès temporaire
   */
  private async getAccessToken(): Promise<string> {
    if (this.token) return this.token

    const response = await fetch(`${this.baseUrl}/api/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: this.username,
        password: this.password,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Failed to get Campay token: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    this.token = data.token
    return data.token
  }

  /**
   * Initialise une demande de paiement
   * @param request Données de la requête
   * @returns Réponse de Campay
   */
  async initiateMoMoPayment(
    request: CampayInitiatePaymentRequest
  ): Promise<CampayInitiatePaymentResponse> {
    const token = await this.getAccessToken()

    const payload = {
      phone: request.phone,
      amount: request.amount,
      description: request.description || 'Abonnement service',
      external_reference: request.external_reference,
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/collect/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Campay API error: ${response.status} - ${errorData}`)
      }

      const data = await response.json()
      // Campay renvoie généralement { reference: "..." } pour un paiement
      // On normalise selon notre interface
      return {
        success: true,
        transaction_id: data.reference || data.transaction_id || '',
        status: 'PENDING',
        message: data.message || 'Payment initiated successfully',
      }
    } catch (error) {
      console.error('Campay initiate payment error:', error)
      throw error
    }
  }

  /**
   * Vérifie le statut d'une transaction
   * @param transactionId ID de transaction Campay (reference)
   * @returns Statut de la transaction
   */
  async getTransactionStatus(transactionId: string): Promise<CampayTransactionStatus> {
    const token = await this.getAccessToken()

    try {
      const response = await fetch(`${this.baseUrl}/api/transaction/${transactionId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch transaction status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: data.status === 'SUCCESSFUL',
        status: data.status,
        transaction_id: data.reference || transactionId,
        message: data.message,
      }
    } catch (error) {
      console.error('Campay get status error:', error)
      throw error
    }
  }

  /**
   * Initie un retrait (withdraw) - Transfert de fonds vers un numéro Mobile Money
   * @param request Données du retrait
   * @returns Réponse de Campay
   */
  async initiateWithdraw(
    request: CampayInitiatePaymentRequest
  ): Promise<CampayInitiatePaymentResponse> {
    const token = await this.getAccessToken()

    const payload = {
      phone: request.phone,
      amount: request.amount,
      description: request.description || 'Retrait',
      external_reference: request.external_reference,
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/withdraw/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Campay withdraw error: ${response.status} - ${errorData}`)
      }

      const data = await response.json()
      return {
        success: true,
        transaction_id: data.reference || data.transaction_id || '',
        status: 'PENDING',
        message: data.message,
      }
    } catch (error) {
      console.error('Campay withdraw error:', error)
      throw error
    }
  }

  /**
   * Vérifie la signature d'une requête webhook
   * @param payload Données du webhook (chaine JSON)
   * @param signature Signature reçue (Header x-campay-signature)
   * @returns true si la signature est valide
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) return false;
    
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex')

    return expectedSignature === signature
  }
}

/**
 * Crée une instance de l'API Campay
 */
export function createCampayAPI(): CampayAPI {
  return new CampayAPI()
}
