'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Wallet, Check, X, Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'
import { useLoyaltyMe } from '@/hooks/useLoyaltyMe'
import { useCart } from '@/hooks/useCart'

// Prefix des codes generes par createRedemptionDiscountCode (cf. src/lib/shopify/loyalty-discounts.ts)
const LOYALTY_CODE_PREFIX = 'LY-'
const MIN_BALANCE_CENTS = 2000
const CAP_RATIO = 0.5

function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €'
}

function eurosToCents(amount: string | number): number {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  return Math.round(n * 100)
}

export function CagnotteCartWidget() {
  const { state, refresh } = useLoyaltyMe()
  const { cart, applyDiscountCode, removeDiscountCode, closeCart } = useCart()
  const [redeemAmount, setRedeemAmount] = useState(0)
  const [busy, setBusy] = useState(false)

  const subtotalCents = useMemo(
    () => eurosToCents(cart?.cost?.subtotalAmount?.amount ?? '0'),
    [cart]
  )

  // Detection cagnotte appliquee : si un discountCode du cart commence par LY-
  const appliedLoyaltyCode = useMemo(() => {
    const codes = cart?.discountCodes ?? []
    return codes.find((c) => c.code.startsWith(LOYALTY_CODE_PREFIX))
  }, [cart])

  // Cas A : loading / error -> rien
  if (state.kind === 'loading' || state.kind === 'error') {
    return null
  }

  // Cas A' : invité — le moment le plus chaud du parcours était le seul
  // endroit où le programme fidélité n'existait pas. Bandeau discret + lien
  // connexion (closeCart : sinon la navigation se fait DERRIÈRE le drawer).
  if (state.kind === 'logged_out') {
    return (
      <div className="bg-sage border border-spruce/10 rounded-xl p-4 mx-8 mb-4">
        <p className="text-[12px] text-ink-mute font-medium">
          Parrainage : ton pote a 10 € dès 60 €, toi 5 % de ses achats en cagnotte.{' '}
          <Link
            href="/login?redirect=/account%3Ftab%3Dreferral"
            onClick={closeCart}
            className="font-semibold text-spruce underline underline-offset-2 hover:text-fresh-deep"
          >
            Connecte-toi
          </Link>
        </p>
      </div>
    )
  }

  // Cas B : not_enrolled -> CTA activer
  if (state.kind === 'not_enrolled') {
    return (
      <div className="bg-sage border border-spruce/10 rounded-xl p-4 mx-8 mb-4">
        <p className="text-[12px] text-ink-mute font-medium mb-3">
          Active ton programme fidélité pour gagner sur tes prochaines commandes.
        </p>
        <Link
          href="/account?tab=cagnotte"
          onClick={closeCart}
          className="inline-flex items-center gap-2 px-4 py-2 bg-fresh text-white text-[12px] font-semibold rounded-full hover:bg-fresh-deep transition-colors"
        >
          Activer
        </Link>
      </div>
    )
  }

  const { customer } = state
  const balanceCents = customer.loyaltyBalanceCents

  // Cas E : cagnotte deja appliquee
  if (appliedLoyaltyCode) {
    // Montant réellement déduit par le code LY- (allocations du cart) — sans
    // ça, après un reload impossible de savoir combien la cagnotte a déduit.
    const appliedCents = (cart?.discountAllocations ?? [])
      .filter((a) => a.code?.startsWith(LOYALTY_CODE_PREFIX))
      .reduce((sum, a) => sum + eurosToCents(a.discountedAmount.amount), 0)
    const handleRemove = async () => {
      if (!appliedLoyaltyCode) return
      setBusy(true)
      try {
        await removeDiscountCode(appliedLoyaltyCode.code)
        toast.success('Cagnotte retirée')
      } catch {
        toast.error('Impossible de retirer la cagnotte')
      } finally {
        setBusy(false)
      }
    }
    return (
      <div className="bg-sage border border-spruce/10 rounded-xl p-4 mx-8 mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Check className="w-4 h-4 text-fresh flex-shrink-0" />
          <p className="text-[13px] font-semibold text-spruce truncate">
            Cagnotte appliquée{appliedCents > 0 ? ` : −${formatEuros(appliedCents)}` : ''}
          </p>
        </div>
        <button
          onClick={handleRemove}
          disabled={busy}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-mute hover:text-terracotta disabled:opacity-50 transition-colors"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
          Retirer
        </button>
      </div>
    )
  }

  // Cas C : enrolled, balance < 20 €
  if (balanceCents < MIN_BALANCE_CENTS) {
    return (
      <div className="bg-sage border border-spruce/10 rounded-xl px-4 py-3 mx-8 mb-4 flex items-center gap-2">
        <Wallet className="w-4 h-4 text-spruce flex-shrink-0" />
        <p className="text-[12px] font-medium text-ink-mute">
          Cagnotte : <span className="font-semibold text-spruce">{formatEuros(balanceCents)}</span> · Utilisable dès 20 €
        </p>
      </div>
    )
  }

  // Cas D : enrolled, balance >= 20 €, slider
  const cap = Math.floor(subtotalCents * CAP_RATIO)
  const maxRedeemCents = Math.min(balanceCents, cap)

  async function handleApply() {
    if (redeemAmount < 1 || redeemAmount > maxRedeemCents) return
    setBusy(true)
    try {
      const res = await fetch('/api/loyalty/me/redeem-online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cartSubtotalCents: subtotalCents,
          requestedAmountCents: redeemAmount,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.detail ?? 'Impossible d\'appliquer ta cagnotte')
        return
      }
      await applyDiscountCode(json.redemption.discountCode)
      toast.success(`Cagnotte appliquée : -${formatEuros(redeemAmount)}`)
      refresh()
      setRedeemAmount(0)
    } catch {
      toast.error('Problème réseau. Réessaye.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white border border-spruce/10 rounded-xl p-5 mx-8 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="w-4 h-4 text-spruce" />
        <p className="text-[12px] font-semibold text-spruce">Ta cagnotte</p>
      </div>

      <p className="text-[13px] font-medium text-ink-mute mb-4">
        Tu as <span className="font-semibold text-spruce">{formatEuros(balanceCents)}</span> disponibles
      </p>

      <input
        type="range"
        min={0}
        max={maxRedeemCents}
        step={100}
        value={redeemAmount}
        onChange={(e) => setRedeemAmount(Number(e.target.value))}
        // A11y : sans label le lecteur d'écran annonçait un slider anonyme, et
        // sans valuetext il lisait la valeur en CENTIMES (« 2000 » pour 20 €).
        aria-label="Montant de cagnotte à utiliser"
        aria-valuetext={`${(redeemAmount / 100).toLocaleString('fr-FR')} euros`}
        className="w-full mb-3 accent-fresh"
      />

      <p className="text-[12px] text-ink-mute font-medium mb-4">
        {redeemAmount === 0
          ? 'Choisis le montant à utiliser'
          : <>Tu utilises <span className="font-semibold text-spruce">{formatEuros(redeemAmount)}</span> sur cette commande</>}
      </p>

      <button
        onClick={handleApply}
        disabled={busy || redeemAmount === 0}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-fresh text-white text-[14px] font-semibold rounded-full hover:bg-fresh-deep transition-colors disabled:opacity-40"
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        Appliquer {redeemAmount > 0 ? formatEuros(redeemAmount) : ''}
      </button>

      <p className="text-[11px] text-ink-mute font-medium mt-3 text-center">
        Plafond 50 % du panier. Ne s&apos;utilise pas sur les frais de port.
      </p>
    </div>
  )
}
