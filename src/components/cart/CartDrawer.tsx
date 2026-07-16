'use client'

// STANDBY 2026-05-23 : coaching masque (cf. middleware redirect 301).
// Le toggle isCoaching a ete retire de CartDrawer en 2026-05-25 : tout le panier
// est desormais nutrition-only (titre "Mon panier").
// Re-theme DA claire V2 (2026-05-31) : surfaces creme/blanc, vert frais en
// accent, sentence case. Aucune logique panier/checkout touchee.
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X, Minus, Plus, ArrowRight, Package, Store, Truck, MapPin, Clock, CheckCircle2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { formatPrice, cn } from '@/lib/utils'
import { BODY_START_STORES } from '@/lib/shopify/types'
import { getCartLineComponentImages } from '@/lib/shopify/bundle'
import { FREE_SHIPPING_THRESHOLD_CENTS } from '@/lib/shipping'
import BundleComposite from '@/components/pack/v2/BundleComposite'
import { CagnotteCartWidget } from './CagnotteCartWidget'
import RelayPickupBlock from './RelayPickupBlock'
import { gaBeginCheckout } from '@/lib/analytics'

const activeStore = BODY_START_STORES.find((s) => s.isActive)
const FREE_SHIPPING_THRESHOLD = FREE_SHIPPING_THRESHOLD_CENTS / 100

export default function CartDrawer() {
  const { cart, isOpen, isLoading, isInitializing, closeCart, updateItem, flushCartUpdates, removeItem, setCartAttributes, relayPickup, clearRelayPickup } = useCart()

  const [isClickAndCollect, setIsClickAndCollect] = useState(false)

  // ─── Quantités optimistes + debounce (retour client mobile 2026-07) ───
  // Avant : chaque tap +/- = une mutation Shopify bloquante (~0,5-1s sur 4G),
  // tout le panier grisé, les taps rapides avalés. Maintenant : le chiffre
  // change immédiatement, UNE mutation part 350 ms après le dernier tap
  // (dernière valeur gagnante), seule la ligne concernée s'estompe.
  const [pendingQty, setPendingQty] = useState<Record<string, number>>({})
  const [syncingLines, setSyncingLines] = useState<Record<string, boolean>>({})
  const qtyTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const changeQty = (lineId: string, serverQty: number, delta: number) => {
    const current = pendingQty[lineId] ?? serverQty
    const next = Math.max(1, current + delta)
    if (next === current) return
    setPendingQty((p) => ({ ...p, [lineId]: next }))
    const existing = qtyTimersRef.current[lineId]
    if (existing) clearTimeout(existing)
    qtyTimersRef.current[lineId] = setTimeout(() => {
      delete qtyTimersRef.current[lineId]
      setSyncingLines((s) => ({ ...s, [lineId]: true }))
      void updateItem(lineId, next).finally(() => {
        setSyncingLines((s) => {
          const n = { ...s }
          delete n[lineId]
          return n
        })
        // On ne rend la main au chiffre serveur que si aucun nouveau tap
        // n'est reparti en debounce entre-temps (sinon flash de l'ancienne valeur).
        if (!qtyTimersRef.current[lineId]) {
          setPendingQty((p) => {
            const n = { ...p }
            delete n[lineId]
            return n
          })
        }
      })
    }, 350)
  }

  useEffect(() => {
    const timers = qtyTimersRef.current
    return () => {
      Object.values(timers).forEach(clearTimeout)
    }
  }, [])

  // Réhydratation après reload : le mode retrait vit dans les attributs du
  // cart Shopify (persisté), pas dans ce state local. Sans cette sync, l'UI
  // réaffiche « Livraison » alors que le checkout partirait en retrait.
  const cartClickAndCollect = cart?.attributes?.some(
    (a) => a.key === '__click_and_collect' && a.value === 'true'
  ) ?? false
  useEffect(() => {
    setIsClickAndCollect(cartClickAndCollect)
  }, [cartClickAndCollect])

  // Verrou scroll quand le panier est ouvert : sinon la molette scrolle
  // l'arrière-plan. On verrouille <html> ET <body> car l'élément scrollable du
  // document est <html> (documentElement) en mode standards — body seul ne
  // suffit pas. Restauré à la fermeture/démontage. (overscroll-contain sur la
  // zone scrollable empêche en plus le scroll-chaining.)
  useEffect(() => {
    if (!isOpen) return
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
  }, [isOpen])

  // ─── A11y clavier (sprint 4) : le drawer avait role="dialog" aria-modal
  // sans RIEN derrière — pas d'Escape, focus resté derrière l'overlay, Tab
  // qui parcourait la page masquée. C'est le chemin d'achat principal.
  const panelRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  // inert quand fermé : le drawer est juste translate-x-full (hors écran mais
  // dans le DOM) — sans inert, tous ses boutons restent tabbables sur CHAQUE page.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    if (isOpen) panel.removeAttribute('inert')
    else panel.setAttribute('inert', '')
  }, [isOpen])

  // Ouverture : mémorise l'élément actif puis focus le bouton Fermer.
  // Fermeture : restaure le focus à l'élément déclencheur.
  useEffect(() => {
    if (isOpen) {
      restoreFocusRef.current = document.activeElement as HTMLElement | null
      closeBtnRef.current?.focus()
    } else {
      restoreFocusRef.current?.focus?.()
      restoreFocusRef.current = null
    }
  }, [isOpen])

  // Escape ferme + focus trap (Tab boucle dans le panneau).
  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(e: KeyboardEvent) {
      // Une modale est-elle ouverte AU-DESSUS du drawer (picker point relais
      // monté DANS le panneau, popup newsletter, lightbox) ? Alors on lui cède
      // entièrement le clavier : sans ce garde, UN Escape dans le picker
      // fermait le picker ET tout le panier (2 listeners document).
      const otherDialogOpen = Array.from(
        document.querySelectorAll('[role="dialog"][aria-modal="true"]')
      ).some(
        (d) =>
          d !== panelRef.current &&
          !d.hasAttribute('inert') &&
          d.getAttribute('aria-hidden') !== 'true'
      )
      if (otherDialogOpen) return

      if (e.key === 'Escape') {
        closeCart()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, closeCart])

  const items = cart?.lines?.nodes ?? []
  const isEmpty = items.length === 0

  const subtotalAmount = parseFloat(cart?.cost?.subtotalAmount?.amount ?? '0')
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotalAmount)
  const freeShippingProgress = Math.min(100, (subtotalAmount / FREE_SHIPPING_THRESHOLD) * 100)
  const hasFreeShipping = subtotalAmount >= FREE_SHIPPING_THRESHOLD

  async function toggleClickAndCollect() {
    const newValue = !isClickAndCollect
    setIsClickAndCollect(newValue)

    try {
      // Passage en retrait : un point relais éventuel n'a plus de sens
      // (attribut + adresse de livraison retirés du cart).
      if (newValue && relayPickup) {
        await clearRelayPickup()
      }

      if (activeStore) {
        await setCartAttributes(
          newValue
            ? [
                { key: '__click_and_collect', value: 'true' },
                { key: 'pickup_location_id', value: activeStore.shopifyLocationId },
              ]
            : [
                { key: '__click_and_collect', value: 'false' },
                { key: 'pickup_location_id', value: '' },
              ]
        )
      }
    } catch {
      // Échec réseau (setCartAttributes re-throw) : retour à la vérité du
      // cart — sinon l'UI affiche « Retrait » alors que le checkout partirait
      // en livraison, avec des frais de port surprise.
      setIsClickAndCollect(cartClickAndCollect)
    }
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-40 animate-fade-in"
          onClick={closeCart}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        ref={panelRef}
        className={cn(
          'fixed top-0 right-0 h-full w-full sm:w-[480px] bg-canvas z-50 flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        // h-full = repli universel ; 100dvh (inline) corrige la hauteur sur
        // mobile (barre d'URL dynamique) là où c'est supporté.
        style={{ height: '100dvh' }}
        role="dialog"
        aria-modal="true"
        aria-label="Ton panier"
        aria-hidden={!isOpen}
      >
        {/* ─── Header (toujours visible) ─── */}
        <div className="flex-shrink-0 flex items-center justify-between px-8 py-6">
          <h2 className="font-display text-[20px] font-extrabold tracking-tight text-spruce">
            Mon panier
          </h2>
          <button
            ref={closeBtnRef}
            onClick={closeCart}
            className="p-2 -mr-2 rounded-full text-ink-mute hover:text-spruce hover:bg-spruce/5 transition-colors"
            aria-label="Fermer le panier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Contenu ─── */}
        {isEmpty && isInitializing ? (
          /* Cart persisté en cours de chargement : squelette — surtout PAS
             « Ton panier est vide » (message faux qui fait re-remplir en double) */
          <div className="flex-1 min-h-0 px-8 pt-2 space-y-6" aria-hidden="true">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-5 pb-6 border-b border-spruce/10 animate-pulse">
                <div className="w-20 h-24 bg-spruce/10 rounded-lg flex-shrink-0" />
                <div className="flex-1 pt-1 space-y-3">
                  <div className="h-4 bg-spruce/10 rounded w-3/4" />
                  <div className="h-3 bg-spruce/10 rounded w-1/3" />
                  <div className="h-9 bg-spruce/10 rounded-full w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          /* Panier vide */
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-8 text-center text-ink">
            <p className="font-display font-bold text-lg text-spruce mb-2">Ton panier est vide</p>
            <p className="text-ink-mute font-medium mb-8 max-w-[250px] text-sm">
              Ajoute des produits pour voir ton résumé de commande.
            </p>
            <Link
              href="/products"
              onClick={closeCart}
              className="h-14 w-full text-[14px] font-semibold rounded-full inline-flex justify-center items-center gap-2 transition-colors bg-fresh text-white hover:bg-fresh-deep"
            >
              Acheter maintenant
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* ─── Zone scrollable (flex-1 min-h-0) : barre livraison + articles + cagnotte ─── */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {/* Barre livraison gratuite */}
              {!isClickAndCollect && (
                <div className="px-8 pb-5">
                  <div className="bg-white border border-spruce/10 rounded-xl p-4">
                    {hasFreeShipping ? (
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-fresh flex-shrink-0" />
                        <p className="text-[12px] font-semibold text-spruce">
                          Ta livraison est offerte !
                        </p>
                      </div>
                    ) : (
                      <p className="text-[12px] font-medium text-ink-mute mb-2.5">
                        Plus que{' '}
                        <span className="font-bold text-spruce">
                          {formatPrice({
                            amount: remainingForFreeShipping.toFixed(2),
                            currencyCode: cart?.cost?.subtotalAmount?.currencyCode ?? 'EUR',
                          })}
                        </span>{' '}
                        pour la livraison offerte
                      </p>
                    )}
                    <div
                      className="relative h-1.5 bg-spruce/10 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(freeShippingProgress)}
                      aria-label="Progression vers la livraison offerte"
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-fresh rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${freeShippingProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Liste des produits */}
              <div className="px-8 pt-2 pb-8 space-y-6">
            {items.map((item) => {
              const product = item.merchandise.product
              const image = product.featuredImage
              // Bundle sans featuredImage (volontaire) → repli sur les images
              // des composants (empilées, max 3), sinon placeholder.
              const componentImages = image ? [] : getCartLineComponentImages(item.merchandise)
              // Quantité affichée = optimiste si des taps sont en attente ;
              // le prix de la ligne s'estompe tant que le serveur n'a pas confirmé.
              const displayQty = pendingQty[item.id] ?? item.quantity
              const lineBusy = pendingQty[item.id] != null || !!syncingLines[item.id]

              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex gap-5 pb-6 border-b border-spruce/10 last:border-0',
                    isLoading && 'opacity-60 pointer-events-none'
                  )}
                >
                  {/* Image */}
                  <Link
                    href={`/products/${product.handle}`}
                    onClick={closeCart}
                    className="relative w-20 h-24 flex-shrink-0 bg-white rounded-lg overflow-hidden flex items-center justify-center border border-spruce/10"
                  >
                    {image ? (
                      <Image
                        src={image.url}
                        alt={image.altText ?? product.title}
                        fill
                        className="object-contain p-2"
                        sizes="80px"
                      />
                    ) : componentImages.length > 0 ? (
                      // Pack : même composite que les cartes /packs (pots des
                      // composants empilés sur fond végétal), réduit à la vignette.
                      // Le composite remplit le slot (w-full h-full) via variant thumb.
                      <BundleComposite
                        images={componentImages}
                        alt={product.title}
                        variant="thumb"
                        sizes="80px"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-spruce/25" />
                    )}
                  </Link>

                  {/* Infos */}
                  <div className="flex-1 min-w-0 flex flex-col justify-start pt-1">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <Link href={`/products/${product.handle}`} onClick={closeCart}>
                          <p className="font-display font-bold text-ink text-[14px] leading-tight line-clamp-2">
                            {product.title}
                          </p>
                        </Link>
                        {item.merchandise.title !== 'Default Title' && (
                          <p className="text-[12px] font-medium text-ink-mute mt-0.5">
                            {item.merchandise.title}
                          </p>
                        )}

                        {/* Remove link — purge le debounce quantité de la ligne
                            (sinon une mutation orpheline partirait après coup) */}
                        <button
                          onClick={() => {
                            const t = qtyTimersRef.current[item.id]
                            if (t) {
                              clearTimeout(t)
                              delete qtyTimersRef.current[item.id]
                            }
                            setPendingQty((p) => {
                              const n = { ...p }
                              delete n[item.id]
                              return n
                            })
                            void removeItem(item.id)
                          }}
                          aria-label={`Retirer ${product.title} du panier`}
                          className="text-[12px] font-medium text-ink-mute underline underline-offset-2 hover:text-terracotta mt-1 py-1.5 transition-colors"
                        >
                          Retirer
                        </button>
                      </div>
                      <span
                        className={cn(
                          'font-semibold text-spruce text-sm whitespace-nowrap transition-opacity',
                          lineBusy && 'opacity-50'
                        )}
                      >
                        {formatPrice(item.cost.totalAmount)}
                      </span>
                    </div>

                    <div className="mt-auto pt-4">
                      {/* Quantité pill */}
                      {/* Cibles tactiles : w-6 (24px) → w-10 (40px, ~44 avec le
                          padding du pill) + aria-labels (icône seule sinon). */}
                      <div className="inline-flex items-center bg-white border border-spruce/15 rounded-full px-1 py-1">
                        <button
                          onClick={() => changeQty(item.id, item.quantity, -1)}
                          disabled={displayQty <= 1}
                          aria-label={`Réduire la quantité de ${product.title}`}
                          className="w-10 h-10 flex items-center justify-center rounded-full text-ink-mute hover:bg-spruce/5 disabled:opacity-30 transition-all"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-[13px] font-bold text-ink tabular-nums" aria-live="polite">
                          {displayQty}
                        </span>
                        <button
                          onClick={() => changeQty(item.id, item.quantity, +1)}
                          aria-label={`Augmenter la quantité de ${product.title}`}
                          className="w-10 h-10 flex items-center justify-center rounded-full text-ink-mute hover:bg-spruce/5 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
              </div>

              {/* ─── Widget Cagnotte (loyalty) — dans la zone scrollable ─── */}
              <CagnotteCartWidget />

              {/* Point relais Mondial Relay (livraison uniquement, non bloquant).
                  Déplacé du pied fixe vers la zone scrollable : sur petit écran
                  le pied ~400px masquait les articles (retour client 2026-07). */}
              {!isClickAndCollect && (
                <div className="px-8">
                  <RelayPickupBlock />
                </div>
              )}
            </div>

            {/* ─── Footer récap + checkout (flex-shrink-0, toujours visible).
                Compact sur mobile (paddings réduits, détail du récap masqué) :
                seul l'essentiel — mode de livraison, total, CTA — reste fixe. ─── */}
            {cart && (
              <div className="flex-shrink-0 px-5 pb-4 pt-4 sm:px-8 sm:pb-6 sm:pt-5 border-t border-spruce/10 bg-canvas shadow-[0_-8px_20px_-12px_rgba(0,0,0,0.08)]">

            {/* ─── Toggle Livraison / Click & Collect ─── */}
            {activeStore && (
              <div className="flex bg-white p-1 rounded-xl mb-3 sm:mb-5 border border-spruce/10">
                {/* disabled pendant la mutation : un double-tap rapide lançait
                    deux flux clearRelayPickup/setCartAttributes entrelacés */}
                <button
                  onClick={() => isClickAndCollect && toggleClickAndCollect()}
                  disabled={isLoading}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold rounded-lg transition-colors disabled:opacity-60',
                    !isClickAndCollect
                      ? 'bg-sage text-spruce'
                      : 'text-ink-mute hover:text-spruce'
                  )}
                >
                  <Truck className="w-3.5 h-3.5" />
                  Livraison
                </button>
                <button
                  onClick={() => !isClickAndCollect && toggleClickAndCollect()}
                  disabled={isLoading}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold rounded-lg transition-colors disabled:opacity-60',
                    isClickAndCollect
                      ? 'bg-sage text-spruce'
                      : 'text-ink-mute hover:text-spruce'
                  )}
                >
                  <Store className="w-3.5 h-3.5" />
                  Retrait
                </button>
              </div>
            )}

            {/* Récap prix — sur mobile, seul le Total reste visible (le détail
                sous-total/livraison/TVA est sur le checkout Shopify) */}
            <div className="space-y-3 mb-3 sm:mb-6 bg-white p-3 sm:p-4 rounded-xl border border-spruce/10">
              <div className="hidden sm:flex justify-between text-[13px] text-ink-mute font-medium">
                <span>Sous-total</span>
                <span className="font-semibold text-ink">{formatPrice(cart.cost.subtotalAmount)}</span>
              </div>
              <div className="hidden sm:flex justify-between text-[13px] text-ink-mute font-medium">
                <span>Livraison</span>
                <span className="font-semibold text-ink">
                  {isClickAndCollect ? 'Gratuit' : 'Calculée à l\'étape suivante'}
                </span>
              </div>
              {cart.cost.totalTaxAmount && (
                <div className="hidden sm:flex justify-between text-[13px] text-ink-mute font-medium">
                  <span>Dont TVA</span>
                  <span className="font-semibold text-ink">{formatPrice(cart.cost.totalTaxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center sm:pt-3 sm:border-t border-spruce/10 sm:mt-1">
                <span className="text-[14px] font-bold text-ink">Total</span>
                <span className="font-display font-extrabold text-2xl text-spruce">
                  {formatPrice(cart.cost.totalAmount)}
                </span>
              </div>
            </div>

            {/* Bouton checkout */}
            <div className="flex flex-col gap-3">
              <a
                href={cart.checkoutUrl}
                onClick={(e) => {
                  // Marqueur « retour checkout » : si l'utilisateur revient du
                  // checkout Shopify avec « précédent » et que la page se
                  // recharge, CartContext rouvre le panier (retour client 2026-07).
                  try {
                    sessionStorage.setItem('bs-reopen-cart', String(Date.now()))
                  } catch {
                    /* navigation privée : tant pis, pas de réouverture */
                  }
                  // Quantités encore en debounce ou en vol : on retient la
                  // navigation le temps de pousser les mutations — sinon le
                  // checkout Shopify chargerait une quantité périmée.
                  const pendingIds = Object.keys(qtyTimersRef.current)
                  const mustFlush = pendingIds.length > 0 || Object.keys(syncingLines).length > 0
                  if (mustFlush) {
                    e.preventDefault()
                    const flushes = pendingIds.map((id) => {
                      clearTimeout(qtyTimersRef.current[id])
                      delete qtyTimersRef.current[id]
                      const q = pendingQty[id]
                      return q != null ? updateItem(id, q) : Promise.resolve()
                    })
                    void Promise.all([...flushes, flushCartUpdates()]).finally(() => {
                      window.location.href = cart.checkoutUrl
                    })
                  }
                  // GA4 begin_checkout avant redirection vers le checkout Shopify
                  // (no-op sans consentement ; n'empêche jamais la navigation).
                  try {
                    gaBeginCheckout(
                      cart.lines.nodes.map((l) => ({
                        item_id: l.merchandise.product.handle,
                        item_name: l.merchandise.product.title,
                        price: parseFloat(l.merchandise.price.amount),
                        quantity: l.quantity,
                        item_variant:
                          l.merchandise.title && l.merchandise.title !== 'Default Title'
                            ? l.merchandise.title
                            : undefined,
                      })),
                      parseFloat(cart.cost.subtotalAmount.amount)
                    )
                  } catch {
                    /* tracking best-effort */
                  }
                }}
                className="w-full h-14 flex items-center justify-center text-[14px] font-semibold rounded-full transition-colors bg-fresh text-white hover:bg-fresh-deep"
              >
                {isClickAndCollect ? 'Valider le retrait' : 'Paiement sécurisé'}
              </a>
            </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
