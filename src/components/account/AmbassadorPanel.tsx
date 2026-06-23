'use client'

import { useState } from 'react'
import { BadgeCheck, Copy, Loader2, TrendingUp, Users, Wallet, ArrowDownRight, ArrowUpRight, Ticket } from 'lucide-react'
import { useAmbassador, type AmbassadorTx } from '@/hooks/useAmbassador'
import toast from 'react-hot-toast'

const euros = (cents: number) =>
  (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €'

const TX_LABEL: Record<AmbassadorTx['type'], string> = {
  commission: 'Commission sur vente',
  revoke: 'Reprise (remboursement)',
  spend: 'Utilisation cagnotte',
  spend_reversal: 'Reprise dépense (remboursement)',
  adjustment: 'Ajustement',
}
const TX_IS_CREDIT: Record<AmbassadorTx['type'], boolean> = {
  commission: true,
  revoke: false,
  spend: false,
  spend_reversal: true,
  adjustment: false,
}

export function AmbassadorPanel() {
  const state = useAmbassador()
  // État du flux « Utiliser ma cagnotte » (hooks AVANT tout return conditionnel).
  const [redeemAmount, setRedeemAmount] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [redeemResult, setRedeemResult] = useState<{ code: string; amountCents: number } | null>(null)
  const [redeemError, setRedeemError] = useState<string | null>(null)

  if (state.kind === 'loading') {
    return (
      <div className="bg-white rounded-2xl border border-spruce/10 py-20 text-center">
        <Loader2 className="w-8 h-8 text-fresh animate-spin mx-auto" />
      </div>
    )
  }
  if (state.kind === 'not_ambassador') {
    return (
      <div className="bg-white rounded-2xl border border-spruce/10 p-8 text-center">
        <p className="text-ink-mute text-sm font-medium">
          Cet espace est réservé aux ambassadeurs BodyStart. Tu veux le devenir ?{' '}
          <a href="mailto:contact.nexus.developpement@gmail.com" className="text-fresh font-semibold underline underline-offset-4">
            Écris-nous.
          </a>
        </p>
      </div>
    )
  }

  const { ambassador: a, stats, transactions } = state.data

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(a.code)
      toast.success('Code copié !')
    } catch {
      toast.error('Copie impossible')
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Code copié !')
    } catch {
      toast.error('Copie impossible')
    }
  }

  function redeemErrorMessage(json: { error?: string; reason?: string }): string {
    if (json.error === 'rate_limited') return 'Trop de demandes, réessaie dans une minute.'
    switch (json.reason) {
      case 'insufficient_balance':
        return `Ta cagnotte doit atteindre ${euros(a.minToUseCents)} pour être utilisée.`
      case 'below_min':
        return `Montant minimum : ${euros(a.minToUseCents)}.`
      case 'above_balance':
        return `Montant supérieur à ton solde utilisable (${euros(a.usableCents)}).`
      default:
        return 'Impossible de générer le code. Réessaie.'
    }
  }

  async function generateRedeemCode() {
    setRedeemError(null)
    const amt = parseFloat(redeemAmount.replace(',', '.'))
    if (!Number.isFinite(amt) || Math.round(amt * 100) < a.minToUseCents) {
      setRedeemError(`Montant minimum : ${euros(a.minToUseCents)}.`)
      return
    }
    const cents = Math.round(amt * 100)
    if (cents > a.usableCents) {
      setRedeemError(`Tu peux utiliser jusqu'à ${euros(a.usableCents)}.`)
      return
    }
    setRedeeming(true)
    try {
      const res = await fetch('/api/loyalty/me/ambassador/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ requestedAmountCents: cents }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setRedeemError(redeemErrorMessage(json))
        return
      }
      setRedeemResult({ code: json.redemption.discountCode, amountCents: json.redemption.amountCents })
    } catch {
      setRedeemError('Une erreur est survenue. Réessaie.')
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BadgeCheck className="w-6 h-6 text-fresh" />
          <h2 className="font-display text-[28px] font-extrabold tracking-tight text-spruce leading-[1.1]">
            Espace ambassadeur
          </h2>
        </div>
        <p className="text-ink-mute font-medium text-sm">
          Tes abonnés ont -10 % avec ton code ; toi, tu gagnes {a.ratePct} % de chaque commande en cagnotte produit, à vie.
        </p>
      </div>

      {/* Cagnotte */}
      <div className="bg-white border border-spruce/10 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 bg-sage rounded-full flex items-center justify-center">
            <Wallet className="w-6 h-6 text-spruce" />
          </div>
          <div>
            <p className="font-display font-bold text-spruce">Ta cagnotte</p>
            <p className="text-ink-mute text-sm font-medium">Utilisable en réduction produit dès {euros(a.minToUseCents)}</p>
          </div>
        </div>
        <p className="text-[40px] font-display font-extrabold text-fresh leading-none mb-2">{euros(a.balanceCents)}</p>
        {a.expired ? (
          <p className="text-terracotta text-[13px] font-semibold">Cagnotte expirée (12 mois sans activité).</p>
        ) : a.usableCents > 0 ? (
          <p className="text-ink-mute text-[13px] font-medium">Tu peux l’utiliser dès maintenant sur ta prochaine commande.</p>
        ) : (
          <p className="text-ink-mute text-[13px] font-medium">
            Encore {euros(a.minToUseCents - a.balanceCents)} avant de pouvoir l’utiliser.
          </p>
        )}
        {!a.active && (
          <p className="mt-2 text-terracotta text-[13px] font-semibold">Ton code est actuellement désactivé.</p>
        )}
      </div>

      {/* Utiliser ma cagnotte (génère un code à appliquer au checkout) */}
      {a.usableCents > 0 && (
        <div className="bg-white border border-spruce/10 rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-2 mb-1">
            <Ticket className="w-5 h-5 text-fresh" />
            <p className="font-display font-bold text-spruce">Utiliser ma cagnotte</p>
          </div>
          <p className="text-ink-mute text-sm font-medium mb-4">
            Génère un code de réduction à appliquer à ton panier. Produit-only, non cumulable, valable 1 h.
          </p>
          {redeemResult ? (
            <div className="bg-sage rounded-xl p-4">
              <p className="text-[12px] text-ink-mute font-medium mb-2">Ton code (−{euros(redeemResult.amountCents)})</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white border border-spruce/10 rounded-lg px-4 py-3 font-mono font-bold tracking-wider text-center text-spruce">
                  {redeemResult.code}
                </code>
                <button
                  onClick={() => copyText(redeemResult.code)}
                  className="p-3 border border-spruce/20 text-spruce hover:bg-spruce/5 rounded-lg transition-colors"
                  aria-label="Copier le code"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[12px] text-ink-mute font-medium mt-3">
                Panier minimum requis :{' '}
                <span className="font-bold text-spruce">{euros(redeemResult.amountCents * 2)}</span> (la remise s’applique en entier).
              </p>
              <p className="text-[12px] text-ink-mute mt-1">
                Valable 1 h. Applique-le au panier avant de payer ; ta cagnotte est débitée à la validation de la commande.
              </p>
              <button
                onClick={() => {
                  setRedeemResult(null)
                  setRedeemAmount('')
                }}
                className="mt-3 text-[13px] font-semibold text-fresh underline underline-offset-4"
              >
                Générer un autre code
              </button>
            </div>
          ) : (
            <>
              <label htmlFor="amb-redeem-amount" className="block text-[12px] text-ink-mute font-medium mb-2">
                Montant à utiliser ({euros(a.minToUseCents)} – {euros(a.usableCents)})
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    id="amb-redeem-amount"
                    type="number"
                    inputMode="decimal"
                    min={a.minToUseCents / 100}
                    max={a.usableCents / 100}
                    step="1"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    placeholder={String(a.minToUseCents / 100)}
                    className="w-full bg-white border border-spruce/15 rounded-xl px-4 py-3 pr-8 font-semibold text-spruce focus:outline-none focus:ring-2 focus:ring-fresh/40"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-mute font-semibold">€</span>
                </div>
                <button
                  onClick={generateRedeemCode}
                  disabled={redeeming}
                  className="h-12 px-5 text-[14px] font-semibold rounded-xl bg-fresh text-white hover:bg-fresh-deep disabled:opacity-60 transition-colors whitespace-nowrap"
                >
                  {redeeming ? 'Génération…' : 'Générer mon code'}
                </button>
              </div>
              {redeemError && <p className="text-terracotta text-[13px] font-semibold mt-2">{redeemError}</p>}
            </>
          )}
        </div>
      )}

      {/* Code + stats ventes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white border border-spruce/10 rounded-2xl p-5">
          <p className="text-[12px] text-ink-mute font-medium mb-2">Ton code promo</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-sage border border-spruce/10 rounded-xl px-4 py-3 font-mono font-bold text-lg tracking-wider text-center text-spruce">
              {a.code}
            </code>
            <button
              onClick={copyCode}
              className="p-3 border border-spruce/20 text-spruce hover:bg-spruce/5 rounded-xl transition-colors"
              aria-label="Copier le code"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={TrendingUp} value={String(stats.ordersCount)} label="ventes" />
          <Stat icon={Wallet} value={euros(stats.revenueCents)} label="CA généré" />
          <Stat icon={Users} value={`${stats.newCustomerRate}%`} label="nouveaux" />
        </div>
      </div>

      {/* Historique */}
      <div className="bg-white rounded-2xl border border-spruce/10 p-6 md:p-8">
        <h3 className="font-display font-bold text-spruce mb-5 text-lg">Historique</h3>
        {transactions.length === 0 ? (
          <p className="text-ink-mute text-sm font-medium">Aucun mouvement pour l’instant.</p>
        ) : (
          <ul className="divide-y divide-spruce/8">
            {transactions.map((t) => {
              const credit = TX_IS_CREDIT[t.type]
              return (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      credit ? 'bg-fresh/10 text-fresh' : 'bg-terracotta/10 text-terracotta'
                    }`}
                  >
                    {credit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-ink truncate">{TX_LABEL[t.type]}</p>
                    <p className="text-[12px] text-ink-mute">
                      {new Date(t.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <p className={`text-[14px] font-display font-bold ${credit ? 'text-fresh' : 'text-terracotta'}`}>
                    {credit ? '+' : '−'}
                    {euros(t.amountCents)}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function Stat({ icon: Icon, value, label }: { icon: typeof TrendingUp; value: string; label: string }) {
  return (
    <div className="bg-white border border-spruce/10 rounded-2xl p-4 flex flex-col justify-between">
      <Icon className="w-4 h-4 text-spruce mb-2" />
      <p className="text-[18px] font-display font-extrabold text-spruce leading-none">{value}</p>
      <p className="text-[11px] text-ink-mute font-medium mt-1">{label}</p>
    </div>
  )
}
