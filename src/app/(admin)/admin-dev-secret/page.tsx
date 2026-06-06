'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

interface TechFeeWallet {
  id: string
  balance_xaf: number
  total_accumulated: number
  total_withdrawn: number
  last_withdrawal_date: string | null
}

interface TechFeeTransaction {
  id: string
  type: string
  amount: number
  description: string
  status: string
  created_at: string
}

export default function AdminDevSecretPage() {
  const router = useRouter()
  const [wallet, setWallet] = useState<TechFeeWallet | null>(null)
  const [transactions, setTransactions] = useState<TechFeeTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [withdrawStatus, setWithdrawStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Récupère le user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          router.push('/login')
          return
        }

        // Vérifie que c'est un admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role !== 'admin') {
          router.push('/')
          return
        }

        // Récupère le portefeuille
        const { data: walletData, error: walletError } = await supabase
          .from('tech_fees_wallet')
          .select('*')
          .single()

        if (walletError || !walletData) {
          setError('Impossible de charger le portefeuille')
          return
        }

        setWallet(walletData)

        // Récupère l'historique des transactions
        const { data: txData, error: txError } = await supabase
          .from('tech_fees_transactions')
          .select('*')
          .eq('wallet_id', walletData.id)
          .order('created_at', { ascending: false })
          .limit(20)

        if (!txError && txData) {
          setTransactions(txData)
        }
      } catch (err) {
        console.error('Error loading wallet data:', err)
        setError('Erreur lors du chargement')
      } finally {
        setIsLoading(false)
      }
    }

    loadWalletData()
  }, [router])

  const handleWithdraw = async () => {
    if (!wallet || wallet.balance_xaf <= 0) {
      setWithdrawStatus('❌ Solde insuffisant')
      return
    }

    setIsWithdrawing(true)
    setWithdrawStatus('⏳ Traitement du retrait en cours...')

    try {
      const response = await fetch('/api/dev/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: wallet.balance_xaf,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setWithdrawStatus(`❌ ${result.error || 'Erreur lors du retrait'}`)
      } else {
        setWithdrawStatus(`✅ Retrait de ${wallet.balance_xaf} XAF lancé!\nRéférence: ${result.reference}`)
        // Actualise les données après 2 secondes
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      console.error('Withdrawal error:', error)
      setWithdrawStatus(`❌ Erreur technique: ${error instanceof Error ? error.message : 'Inconnu'}`)
    } finally {
      setIsWithdrawing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  if (!wallet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Portefeuille non trouvé</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center border-b border-purple-400 pb-6">
          <h1 className="text-3xl font-bold text-white mb-2">🔐 Admin Dev - Portefeuille Technique</h1>
          <p className="text-purple-300">Gestion des frais techniques et retraits</p>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Solde courant */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-6 text-white shadow-lg">
            <p className="text-sm font-medium opacity-90">Solde Disponible</p>
            <p className="text-3xl font-bold mt-2">
              {wallet.balance_xaf.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs opacity-75 mt-1">XAF</p>
          </div>

          {/* Total accumulé */}
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg p-6 text-white shadow-lg">
            <p className="text-sm font-medium opacity-90">Total Accumulé</p>
            <p className="text-3xl font-bold mt-2">
              {wallet.total_accumulated.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs opacity-75 mt-1">XAF</p>
          </div>

          {/* Total retiré */}
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-6 text-white shadow-lg">
            <p className="text-sm font-medium opacity-90">Total Retiré</p>
            <p className="text-3xl font-bold mt-2">
              {wallet.total_withdrawn.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs opacity-75 mt-1">XAF</p>
          </div>
        </div>

        {/* Bouton de retrait */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Opération de Retrait</h2>
            <span className="text-xs bg-purple-900 text-white px-3 py-1 rounded-full">MODE TEST</span>
          </div>

          {withdrawStatus && (
            <div
              className={`mb-4 p-4 rounded-lg text-sm whitespace-pre-line ${
                withdrawStatus.startsWith('✅')
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : withdrawStatus.startsWith('⏳')
                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {withdrawStatus}
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600 mb-2">
              ℹ️ Montant à retirer: <span className="font-bold text-gray-900">{wallet.balance_xaf} XAF</span>
            </p>
            {wallet.last_withdrawal_date && (
              <p className="text-xs text-gray-500">
                Dernier retrait: {new Date(wallet.last_withdrawal_date).toLocaleDateString('fr-FR')} à{' '}
                {new Date(wallet.last_withdrawal_date).toLocaleTimeString('fr-FR')}
              </p>
            )}
          </div>

          <button
            onClick={handleWithdraw}
            disabled={isWithdrawing || wallet.balance_xaf <= 0}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all"
          >
            {isWithdrawing ? '⏳ Retrait en cours...' : `💰 Retirer ${wallet.balance_xaf} XAF`}
          </button>

          <p className="text-xs text-gray-500 mt-3 text-center">
            Le retrait sera envoyé à votre numéro Mobile Money configuré via l'API Campay
          </p>
        </div>

        {/* Historique des transactions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 Historique des Transactions</h2>

          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune transaction enregistrée</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Date</th>
                    <th className="text-left px-4 py-3 font-semibold">Type</th>
                    <th className="text-left px-4 py-3 font-semibold">Montant</th>
                    <th className="text-left px-4 py-3 font-semibold">Statut</th>
                    <th className="text-left px-4 py-3 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {new Date(tx.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          tx.type === 'fee_credit'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {tx.type === 'fee_credit' ? '➕ Crédit' : '➖ Retrait'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold">
                        {tx.type === 'fee_credit' ? '+' : '-'}{tx.amount} XAF
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          tx.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : tx.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {tx.status === 'completed' ? '✅ Complété' : tx.status === 'pending' ? '⏳ En attente' : '❌ Échoué'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{tx.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-purple-300 text-xs">
          <p>🔒 Cette page est sécurisée et réservée aux administrateurs</p>
        </div>
      </div>
    </div>
  )
}
