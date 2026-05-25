'use client'

import Link from 'next/link'
import { Wallet, TrendingUp, ArrowDownCircle, Loader2 } from 'lucide-react'
import { useLoyaltyMe } from '@/hooks/useLoyaltyMe'
import { EnrollmentBlock } from './EnrollmentBlock'

function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function transactionLabel(tx: {
  type: string
  channel: string
  shopifyOrderId: string | null
  relatedCustomerFirstName: string | null
}): string {
  if (tx.type === 'referral_commission') {
    return tx.relatedCustomerFirstName
      ? `Commission parrainage de ${tx.relatedCustomerFirstName}`
      : 'Commission parrainage'
  }
  if (tx.type === 'spend') {
    return tx.shopifyOrderId
      ? `Utilisée sur commande #${tx.shopifyOrderId.split('/').pop()}`
      : 'Utilisée en boutique'
  }
  if (tx.type === 'adjustment') return 'Ajustement'
  if (tx.type === 'import_credit') return 'Crédit d\'accueil'
  return tx.type
}

export function CagnottePanel() {
  const { state, refresh } = useLoyaltyMe()

  if (state.kind === 'loading') {
    return (
      <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 py-20 text-center shadow-sm">
        <Loader2 className="w-8 h-8 text-[#1a2e23] animate-spin mx-auto" />
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-700 text-sm">
        Impossible de charger ta cagnotte. Réessaye dans un instant.
      </div>
    )
  }

  if (state.kind === 'logged_out') {
    return (
      <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-8 text-center shadow-sm">
        <p className="text-[#4a5f4c] text-sm font-medium">
          Connecte-toi pour voir ta cagnotte.
        </p>
      </div>
    )
  }

  if (state.kind === 'not_enrolled') {
    return <EnrollmentBlock onEnrolled={refresh} />
  }

  const { customer, recentTransactions, totals } = state
  const isBelow = customer.loyaltyBalanceCents < 2000

  return (
    <div className="space-y-6">
      {/* Header solde */}
      <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-8 md:p-10 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#1a2e23]/5 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#1a2e23]" />
          </div>
          <h2 className="font-display text-[20px] font-black uppercase tracking-tight text-[#1a2e23] leading-none">
            Ma cagnotte
          </h2>
        </div>

        <p className="font-display text-[56px] md:text-[72px] font-black text-[#1a2e23] leading-none mb-3">
          {formatEuros(customer.loyaltyBalanceCents)}
        </p>

        <p className="text-[#4a5f4c] text-sm font-medium max-w-md">
          {isBelow
            ? 'Tu peux utiliser ta cagnotte dès qu\'elle atteint 20 €. En attendant, profites-en pour parrainer tes potes.'
            : 'Disponible sur ta prochaine commande, jusqu\'à 50 % du panier.'}
        </p>
      </div>

      {/* Totaux */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-[20px] border border-[#1a2e23]/5 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[#89a890]" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c]">Total gagné</p>
          </div>
          <p className="font-display text-[24px] font-black text-[#1a2e23] leading-none">
            {formatEuros(totals.earnedCents)}
          </p>
          <p className="text-[12px] text-[#89a890] font-medium mt-1">depuis ton inscription</p>
        </div>
        <div className="bg-white rounded-[20px] border border-[#1a2e23]/5 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownCircle className="w-4 h-4 text-[#89a890]" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c]">Total utilisé</p>
          </div>
          <p className="font-display text-[24px] font-black text-[#1a2e23] leading-none">
            {formatEuros(totals.spentCents)}
          </p>
          <p className="text-[12px] text-[#89a890] font-medium mt-1">sur toutes tes commandes</p>
        </div>
      </div>

      {/* Historique */}
      <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 overflow-hidden shadow-sm">
        <div className="px-6 md:px-8 py-5 border-b border-[#1a2e23]/5">
          <h3 className="font-display font-black uppercase tracking-tight text-[#1a2e23] text-sm">
            Historique
          </h3>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="px-6 md:px-8 py-12 text-center">
            <p className="text-[#4a5f4c] text-sm font-medium mb-5">
              Ta cagnotte est encore vide. Pour commencer à gagner, partage ton code parrain.
            </p>
            <Link
              href="/account?tab=referral"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a2e23] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#2e4f3c] transition-all shadow-lg"
            >
              Voir mon code
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#1a2e23]/5">
            {recentTransactions.map((tx) => {
              const isPositive = tx.amountCents > 0 && tx.type !== 'spend'
              return (
                <div key={tx.id} className="px-6 md:px-8 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold text-sm text-[#1a2e23] truncate">
                      {transactionLabel(tx)}
                    </p>
                    <p className="text-[12px] text-[#89a890] font-medium mt-0.5">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-black text-sm ${isPositive ? 'text-[#1a2e23]' : 'text-[#89a890]'}`}>
                      {isPositive ? '+' : '-'}{formatEuros(Math.abs(tx.amountCents))}
                    </p>
                    <p className="text-[11px] text-[#89a890] font-medium mt-0.5">
                      Solde : {formatEuros(tx.balanceAfterCents)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
