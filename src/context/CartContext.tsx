'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react'
import { createCart, addToCart, updateCartLine, removeFromCart, getCart, updateCartAttributes, updateCartDiscountCodes, updateCartBuyerIdentity, type ResultatAjoutPanier } from '@/lib/shopify'
import { useCustomer } from '@/context/CustomerContext'
import { getStoredToken } from '@/lib/shopify/customer'
import type { ShopifyCart } from '@/lib/shopify/types'
import { RELAY_ATTRIBUTE_KEYS, buildRelayAttributes, readRelayPickup, type ParcelShop, type RelayPickup } from '@/lib/mondialRelay'
import { gaAddToCart } from '@/lib/analytics'
import { metaAddToCart } from '@/lib/meta-pixel'
import { toast } from '@/lib/toast'
import { CADEAU_ATTR, type ActionCadeau } from '@/lib/paliers'
import { bilanAjout, issueErreurLevee, MESSAGES_PANIER, type BilanAjout } from '@/lib/panier-ajout'

const CART_ID_KEY = 'body-start-cart-id'

function lireIdPanier(): string | null {
  try {
    return localStorage.getItem(CART_ID_KEY)
  } catch {
    return null
  }
}

function ecrireIdPanier(id: string) {
  try {
    localStorage.setItem(CART_ID_KEY, id)
  } catch {
    /* navigation privée */
  }
}

/** Retire l'identifiant seulement s'il désigne toujours ce panier-là. */
function oublierIdPanier(id: string) {
  try {
    if (localStorage.getItem(CART_ID_KEY) === id) localStorage.removeItem(CART_ID_KEY)
  } catch {
    /* navigation privée */
  }
}

type LignesAjout = { merchandiseId: string; quantity: number }[]

/** GA4 add_to_cart et Meta AddToCart par ligne (chacun no-op sans son consentement). */
function suivreAjout(cart: ShopifyCart, lines: LignesAjout) {
  try {
    for (const { merchandiseId, quantity } of lines) {
      const line = cart.lines.nodes.find((l) => l.merchandise.id === merchandiseId)
      if (!line) continue
      const variant = line.merchandise.title
      gaAddToCart({
        item_id: line.merchandise.product.handle,
        item_name: line.merchandise.product.title,
        price: parseFloat(line.merchandise.price.amount),
        quantity,
        item_variant: variant && variant !== 'Default Title' ? variant : undefined,
      })
      // content_ids = ID numérique de la variante (format du catalogue Meta).
      metaAddToCart({
        variantId: merchandiseId,
        name: line.merchandise.product.title,
        price: parseFloat(line.merchandise.price.amount),
        quantity,
      })
    }
  } catch {
    /* tracking best-effort */
  }
}

/** Changement de parfum d'un cadeau (même ligne, autre variante). */
export type MutationCadeau = ActionCadeau | { type: 'variante'; lineId: string; variantId: string; montant: number }

interface CartContextType {
  cart: ShopifyCart | null
  isLoading: boolean
  /** true pendant le chargement initial du cart persisté (localStorage) —
   *  le drawer affiche un squelette au lieu de « panier vide » à tort. */
  isInitializing: boolean
  isOpen: boolean
  totalQuantity: number
  openCart: () => void
  closeCart: () => void
  /** Renvoie true si l'ajout a réussi (les erreurs sont déjà toastées ici) —
   *  les CTA ne doivent afficher « Ajouté ✓ » que sur true. */
  addItem: (merchandiseId: string, quantity?: number) => Promise<boolean>
  /** Ajout groupé (guide /conseil) : toutes les lignes en UNE mutation, puis
   *  les attributs fournis FUSIONNÉS avec ceux du panier (cartAttributesUpdate
   *  remplace tout). `clearRelay` retire un point relais éventuel, comme le
   *  passage en retrait du tiroir. Renvoie true si les lignes sont au panier. */
  addItems: (
    lines: { merchandiseId: string; quantity: number }[],
    options?: { attributes?: { key: string; value: string }[]; clearRelay?: boolean }
  ) => Promise<boolean>
  updateItem: (lineId: string, quantity: number) => Promise<void>
  /** Attend la fin des mutations quantité en cours (à appeler avant de
   *  partir au checkout pour ne pas payer une quantité périmée). */
  flushCartUpdates: () => Promise<void>
  removeItem: (lineId: string) => Promise<void>
  /** Pose des attributs en les FUSIONNANT avec ceux du panier (source du guide
   *  /conseil, parrainage…) ; `remove` retire des clés en plus (point relais). */
  setCartAttributes: (attributes: { key: string; value: string }[], options?: { remove?: string[] }) => Promise<void>
  applyDiscountCode: (code: string) => Promise<void>
  removeDiscountCode: (code: string) => Promise<void>
  /** Lignes cadeaux (paliers) : `planifier` est rappelé sur le panier à jour, dans la file des mutations. */
  syncCadeaux: (planifier: (cart: ShopifyCart) => MutationCadeau[]) => Promise<void>
  // Mondial Relay (point relais)
  relayPickup: RelayPickup | null
  selectRelayPickup: (shop: ParcelShop) => Promise<void>
  clearRelayPickup: () => Promise<void>
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<ShopifyCart | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Miroir ref du cart : les mutations quantité sont SÉRIALISÉES (file de
  // promesses) — un callback en file lirait un `cart` de closure périmé,
  // la ref donne toujours le dernier état.
  const cartRef = useRef<ShopifyCart | null>(null)
  useEffect(() => {
    cartRef.current = cart
  }, [cart])

  // Panier rattaché au client connecté (2026-09-05). Sans ça, le panier
  // Storefront est anonyme : le client retape son email au checkout et
  // Shopify ne peut pas lui envoyer de relance « panier abandonné » (seule
  // la relance « paiement abandonné », après saisie de l'email, marchait).
  // Idempotent : on ne rappelle l'API que si l'email du panier diffère.
  const { customer } = useCustomer()
  const linkedRef = useRef<string>('')
  useEffect(() => {
    const email = customer?.email
    if (!cart?.id || !email) return
    if (cart.buyerIdentity?.email === email) return
    const key = `${cart.id}|${email}`
    if (linkedRef.current === key) return
    linkedRef.current = key
    const token = getStoredToken()
    updateCartBuyerIdentity(cart.id, token ? { customerAccessToken: token, email } : { email })
      .then((c) => {
        if (c) setCart(c)
      })
      .catch((err) => {
        // Non bloquant (token expiré, etc.) : le panier reste utilisable.
        console.warn('[cart] buyerIdentity non rattachée :', err)
      })
  }, [cart?.id, cart?.buyerIdentity?.email, customer?.email])

  // File des mutations quantité : deux cartLinesUpdate parallèles peuvent se
  // doubler sur le réseau et la réponse PÉRIMÉE écraserait la plus récente.
  const updateQueueRef = useRef<Promise<void>>(Promise.resolve())

  // true dès qu'un ajout est parti : la réponse du chargement initial, plus
  // ancienne, ne doit plus écraser le panier ni effacer son identifiant.
  const ajoutLanceRef = useRef(false)

  // Charger le panier depuis localStorage (avec fallback si expiré)
  useEffect(() => {
    const cartId = lireIdPanier()

    // Retour depuis le checkout Shopify (bouton « précédent ») : quand la
    // page se recharge (pas de bfcache), l'utilisateur retombe sur le site
    // sans repère. Le marqueur posé au clic « Paiement sécurisé » (CartDrawer)
    // rouvre le panier — seulement s'il reste des articles : après une
    // commande payée, Shopify invalide le cart et getCart renvoie null.
    let reopenAt = 0
    try {
      reopenAt = Number(sessionStorage.getItem('bs-reopen-cart') ?? 0)
      if (reopenAt) sessionStorage.removeItem('bs-reopen-cart')
    } catch {
      /* navigation privée */
    }
    const shouldReopen = reopenAt > 0 && Date.now() - reopenAt < 30 * 60 * 1000

    if (cartId) {
      // Un cart persisté existe : tant que getCart n'a pas répondu, le drawer
      // ne doit pas afficher « Ton panier est vide » (message faux sur 4G lente).
      setIsInitializing(true)
      const charger = async (essai: number): Promise<void> => {
        try {
          const c = await getCart(cartId)
          if (ajoutLanceRef.current) return
          if (c) {
            setCart(c)
            if (shouldReopen && (c.totalQuantity ?? 0) > 0) setIsOpen(true)
          } else {
            // Shopify ne connaît plus ce panier (expiré, payé ou supprimé).
            oublierIdPanier(cartId)
          }
        } catch (err) {
          // Identifiant illisible : il ne servira jamais.
          if (issueErreurLevee(err) === 'panier-disparu') return oublierIdPanier(cartId)
          // Erreur passagère (réseau, 5xx, limite) : on GARDE l'identifiant.
          // Avant : il était effacé et le prochain ajout ouvrait un panier
          // neuf, sans les articles du client. Un 2e essai 3 s plus tard.
          if (essai === 0) {
            await new Promise((r) => setTimeout(r, 3000))
            if (!ajoutLanceRef.current) return charger(1)
          }
        }
      }
      charger(0).finally(() => setIsInitializing(false))
    }

    // Retour via bfcache : la page est restaurée telle quelle (drawer encore
    // ouvert, aucun re-montage) → on consomme le marqueur pour éviter une
    // réouverture surprise lors d'un rechargement complet ultérieur.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        try {
          sessionStorage.removeItem('bs-reopen-cart')
        } catch {
          /* navigation privée */
        }
      }
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  const totalQuantity = cart?.totalQuantity ?? 0

  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)

  // Ajouts sérialisés : deux clics rapides sans panier ouvraient deux paniers,
  // le 2e écrasant l'identifiant du 1er.
  const ajoutQueueRef = useRef<Promise<unknown>>(Promise.resolve())

  /**
   * Ajoute des lignes au panier du client. Ne recrée un panier QUE si
   * Shopify dit que le sien n'existe plus (lib/panier-ajout) ; sur une
   * erreur passagère, lève sans toucher au panier ni à son identifiant.
   */
  const ajouterLignes = useCallback((lines: LignesAjout) => {
    const run = async (): Promise<{ cart: ShopifyCart | null; bilan: BilanAjout; recree: boolean }> => {
      ajoutLanceRef.current = true
      const avant = cartRef.current
      // Identifiant stocké même si le panier n'est pas encore chargé (4G
      // lente, chargement initial en échec) : avant, un clic à ce moment
      // ouvrait un panier neuf et faisait perdre l'ancien.
      const cartId = avant?.id ?? lireIdPanier()
      const appliquer = (r: ResultatAjoutPanier, base: ShopifyCart | null) => {
        if (r.cart) {
          cartRef.current = r.cart
          ecrireIdPanier(r.cart.id)
        }
        return bilanAjout({ avant: base, apres: r.cart, demandes: lines, userErrors: r.userErrors, warnings: r.warnings })
      }

      if (cartId) {
        let r: ResultatAjoutPanier
        try {
          r = await addToCart(cartId, lines)
        } catch (err) {
          if (issueErreurLevee(err) === 'passagere') throw err
          r = { cart: null, userErrors: [{ field: ['cartId'], message: 'identifiant illisible' }], warnings: [] }
        }
        const bilan = appliquer(r, avant)
        if (bilan.type !== 'panier-disparu') return { cart: r.cart, bilan, recree: false }
        // Shopify ne connaît plus ce panier : on en ouvre un nouveau.
        oublierIdPanier(cartId)
        cartRef.current = null
        setCart(null)
      }

      const r = await createCart(lines)
      const bilan = appliquer(r, null)
      return {
        cart: r.cart,
        bilan: bilan.type === 'panier-disparu' ? { type: 'rien', message: MESSAGES_PANIER.refuseGenerique } : bilan,
        recree: Boolean(cartId),
      }
    }
    const chained = ajoutQueueRef.current.then(run, run)
    ajoutQueueRef.current = chained.catch(() => undefined)
    return chained
  }, [])

  const addItem = useCallback(async (merchandiseId: string, quantity = 1) => {
    setIsLoading(true)
    try {
      const lines = [{ merchandiseId, quantity }]
      const { cart: updatedCart, bilan, recree } = await ajouterLignes(lines)
      if (updatedCart) setCart(updatedCart)
      if (!updatedCart || bilan.type === 'rien' || bilan.type === 'panier-disparu') {
        // false → les CTA n'affichent PAS « Ajouté ✓ ».
        toast.error(bilan.type === 'rien' ? bilan.message : MESSAGES_PANIER.refuseGenerique, { duration: 6000 })
        return false
      }
      suivreAjout(updatedCart, lines)
      setIsOpen(true)
      if (bilan.type === 'partiel') toast.info(bilan.message, { icon: '⚠️', duration: 6000 })
      else if (recree) toast.success(MESSAGES_PANIER.panierRecree, { duration: 6000 })
      else toast.success('Produit ajouté au panier !')
      return true
    } catch (err) {
      // Erreur passagère : panier et identifiant intacts, rien d'annoncé comme ajouté.
      console.warn('[cart] ajout en échec :', err)
      toast.error(MESSAGES_PANIER.passagere, { duration: 6000 })
      return false
    } finally {
      setIsLoading(false)
    }
  }, [ajouterLignes])

  const addItems = useCallback(async (
    lines: { merchandiseId: string; quantity: number }[],
    options?: { attributes?: { key: string; value: string }[]; clearRelay?: boolean }
  ) => {
    if (lines.length === 0) return false
    setIsLoading(true)
    try {
      const resultat = await ajouterLignes(lines)
      const { bilan, recree } = resultat
      let updatedCart = resultat.cart
      if (updatedCart) setCart(updatedCart)
      if (!updatedCart || bilan.type === 'rien' || bilan.type === 'panier-disparu') {
        toast.error(bilan.type === 'rien' ? bilan.message : MESSAGES_PANIER.refuseGenerique, { duration: 6000 })
        return false
      }

      const attributes = options?.attributes ?? []
      if (attributes.length > 0) {
        const nouvelles = new Set(attributes.map((a) => a.key))
        const conservees = (updatedCart.attributes ?? [])
          .filter(
            (a) =>
              a.value != null &&
              !nouvelles.has(a.key) &&
              !(options?.clearRelay && RELAY_ATTRIBUTE_KEYS.includes(a.key))
          )
          .map((a) => ({ key: a.key, value: a.value as string }))
        try {
          updatedCart = await updateCartAttributes(updatedCart.id, [...conservees, ...attributes])
          setCart(updatedCart)
        } catch {
          // Les produits sont bien au panier : on le dit, et le client règle
          // le mode de livraison dans le tiroir (qui reflète le vrai panier).
          toast.error('Ta sélection est au panier, mais le mode de livraison n\'a pas été enregistré : vérifie-le dans le panier.')
        }
      }

      suivreAjout(updatedCart, lines)
      setIsOpen(true)
      if (bilan.type === 'partiel') toast.info(bilan.message, { icon: '⚠️', duration: 6000 })
      else if (recree) {
        toast.success(lines.length > 1 ? MESSAGES_PANIER.panierRecreeSelection : MESSAGES_PANIER.panierRecree, { duration: 6000 })
      } else toast.success(lines.length > 1 ? 'Sélection ajoutée au panier !' : 'Produit ajouté au panier !')
      return true
    } catch (err) {
      console.warn('[cart] ajout groupé en échec :', err)
      toast.error(MESSAGES_PANIER.passagere, { duration: 6000 })
      return false
    } finally {
      setIsLoading(false)
    }
  }, [ajouterLignes])

  // Mise à jour quantité — sérialisée, sans gel global (le drawer gère son
  // propre état par ligne). Détecte le plafonnement stock (Shopify renvoie la
  // ligne CLAMPÉE sans forcément d'userError) et ne remplace JAMAIS le panier
  // local par null (une erreur métier effaçait tout le panier affiché).
  const updateItem = useCallback((lineId: string, quantity: number): Promise<void> => {
    const run = async () => {
      const current = cartRef.current
      if (!current) return
      try {
        const { cart: updated, userErrors } = await updateCartLine(current.id, [
          { id: lineId, quantity },
        ])
        if (updated) {
          setCart(updated)
          const line = updated.lines.nodes.find((l) => l.id === lineId)
          if (line && line.quantity < quantity) {
            toast.info('Stock maximum atteint pour ce produit', { icon: '⚠️' })
          }
        }
        if (userErrors.length > 0) {
          // Messages Shopify potentiellement en anglais → libellé FR générique.
          toast.error('Impossible de mettre à jour la quantité')
        }
      } catch {
        toast.error('Erreur lors de la mise à jour')
      }
    }
    const chained = updateQueueRef.current.then(run, run)
    updateQueueRef.current = chained
    return chained
  }, [])

  // Cadeaux des paliers : dans la même file que les quantités, pour ne jamais
  // croiser une mutation du client. Le plan est recalculé sur le panier À JOUR
  // (cartRef), pas sur celui du rendu qui a déclenché l'appel. Silencieux :
  // pas de toast, pas de suivi « ajout au panier » (ce n'est pas un achat).
  const syncCadeaux = useCallback((planifier: (cart: ShopifyCart) => MutationCadeau[]): Promise<void> => {
    const run = async () => {
      let current = cartRef.current
      if (!current) return
      const ops = planifier(current)
      if (ops.length === 0) return
      const attrs = (montant: number) => [{ key: CADEAU_ATTR, value: String(montant) }]
      try {
        const retirer = ops.flatMap((o) => (o.type === 'retirer' ? [o.lineId] : []))
        if (retirer.length) {
          current = await removeFromCart(current.id, [...new Set(retirer)])
          setCart(current)
        }
        const maj = ops.flatMap((o) =>
          o.type === 'quantite1'
            ? [{ id: o.lineId, quantity: 1 }]
            : o.type === 'variante'
              ? [{ id: o.lineId, quantity: 1, merchandiseId: o.variantId, attributes: attrs(o.montant) }]
              : []
        )
        if (maj.length) {
          const { cart: updated } = await updateCartLine(current.id, maj)
          if (updated) {
            current = updated
            setCart(current)
          }
        }
        const ajouter = ops.flatMap((o) =>
          o.type === 'ajouter' ? [{ merchandiseId: o.variantId, quantity: 1, attributes: attrs(o.montant) }] : []
        )
        if (ajouter.length) {
          const { cart: ajoute } = await addToCart(current.id, ajouter)
          if (ajoute) {
            current = ajoute
            setCart(current)
          }
        }
      } catch (err) {
        // Non bloquant : le panier reste utilisable, la barre se recalcule au prochain changement.
        console.warn('[cart] synchronisation des cadeaux en échec :', err)
      }
    }
    const chained = updateQueueRef.current.then(run, run)
    updateQueueRef.current = chained
    return chained
  }, [])

  // Barrière : résout quand toutes les mutations quantité en file sont parties
  // ET revenues — à attendre avant la redirection checkout.
  const flushCartUpdates = useCallback(() => updateQueueRef.current, [])

  const removeItem = useCallback(async (lineId: string) => {
    if (!cart) return
    setIsLoading(true)
    try {
      const updatedCart = await removeFromCart(cart.id, [lineId])
      setCart(updatedCart)
      toast.success('Produit retiré du panier')
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setIsLoading(false)
    }
  }, [cart])

  const setCartAttributes = useCallback(async (
    attributes: { key: string; value: string }[],
    options?: { remove?: string[] }
  ) => {
    const current = cartRef.current ?? cart
    if (!current) return
    setIsLoading(true)
    try {
      // cartAttributesUpdate remplace TOUS les attributs : on garde ceux du
      // panier (source=guide-conseil, objectif, budget…) sauf ceux qu'on
      // remplace ou qu'on retire. Avant : la bascule Livraison/Retrait les
      // effaçait tous.
      const replaced = new Set([...attributes.map((a) => a.key), ...(options?.remove ?? [])])
      const kept = (current.attributes ?? [])
        .filter((a) => a.value != null && !replaced.has(a.key))
        .map((a) => ({ key: a.key, value: a.value as string }))
      const updatedCart = await updateCartAttributes(current.id, [...kept, ...attributes])
      setCart(updatedCart)
    } catch (err) {
      toast.error('Erreur lors de la mise à jour')
      // Re-throw : le toggle Livraison/Retrait doit pouvoir REVENIR en
      // arrière visuellement (sinon l'UI affiche « Retrait » alors que le
      // checkout partira en livraison avec des frais de port).
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [cart])

  // Remplace l'integralite des codes promos du cart par la liste fournie
  // (cartDiscountCodesUpdate ecrase, n'ajoute pas). Pour ajouter sans
  // detruire les codes existants, on merge avant d'envoyer.
  const applyDiscountCode = useCallback(async (code: string) => {
    if (!cart) return
    setIsLoading(true)
    try {
      const current = (cart.discountCodes ?? []).map((c) => c.code)
      const next = current.includes(code) ? current : [...current, code]
      const updatedCart = await updateCartDiscountCodes(cart.id, next)
      setCart(updatedCart)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'application du code')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [cart])

  const removeDiscountCode = useCallback(async (code: string) => {
    if (!cart) return
    setIsLoading(true)
    try {
      const next = (cart.discountCodes ?? []).map((c) => c.code).filter((c) => c !== code)
      const updatedCart = await updateCartDiscountCodes(cart.id, next)
      setCart(updatedCart)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du retrait du code')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [cart])

  // ─── Mondial Relay : point relais ──────────────────────────
  // Relais courant dérivé des attributs du cart (ré-hydraté après reload
  // sans état React). L'adresse de livraison du cart n'est jamais touchée.
  const relayPickup = useMemo(() => readRelayPickup(cart?.attributes), [cart])

  // Attributs hors point relais (en préservant leurs valeurs non nulles),
  // pour merger sans écraser le Click & Collect ni d'autres attributs.
  const attributesWithoutRelay = useCallback(
    (): { key: string; value: string }[] =>
      (cart?.attributes ?? [])
        .filter((a) => !RELAY_ATTRIBUTE_KEYS.includes(a.key) && a.value != null)
        .map((a) => ({ key: a.key, value: a.value as string })),
    [cart]
  )

  const selectRelayPickup = useCallback(async (shop: ParcelShop) => {
    if (!cart) return
    setIsLoading(true)
    try {
      // cartAttributesUpdate remplace TOUS les attributs : on merge.
      const updated = await updateCartAttributes(cart.id, [
        ...attributesWithoutRelay(),
        ...buildRelayAttributes(shop),
      ])
      setCart(updated)
    } catch {
      toast.error('Impossible d\'enregistrer le point relais. Réessaie dans un instant.')
    } finally {
      setIsLoading(false)
    }
  }, [cart, attributesWithoutRelay])

  const clearRelayPickup = useCallback(async () => {
    if (!cart) return
    setIsLoading(true)
    try {
      const updated = await updateCartAttributes(cart.id, attributesWithoutRelay())
      setCart(updated)
    } catch {
      /* silencieux : le retrait du relais ne doit jamais bloquer le panier */
    } finally {
      setIsLoading(false)
    }
  }, [cart, attributesWithoutRelay])

  return (
    <CartContext.Provider value={{
      cart, isLoading, isInitializing, isOpen, totalQuantity,
      openCart, closeCart, addItem, addItems, updateItem, flushCartUpdates, removeItem, setCartAttributes,
      applyDiscountCode, removeDiscountCode, syncCadeaux,
      relayPickup, selectRelayPickup, clearRelayPickup,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCartContext() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCartContext must be used within CartProvider')
  return ctx
}
