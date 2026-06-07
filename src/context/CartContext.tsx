'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { createCart, addToCart, updateCartLine, removeFromCart, getCart, updateCartAttributes, updateCartDiscountCodes, addCartDeliveryAddresses, removeCartDeliveryAddresses } from '@/lib/shopify'
import type { ShopifyCart } from '@/lib/shopify/types'
import { RELAY_ATTRIBUTE_KEY, formatRelayAttributeValue, parseRelayAttributeValue, buildRelayDeliveryAddress, type ParcelShop } from '@/lib/mondialRelay'
import { gaAddToCart } from '@/lib/analytics'
import toast from 'react-hot-toast'

interface CartContextType {
  cart: ShopifyCart | null
  isLoading: boolean
  isOpen: boolean
  totalQuantity: number
  openCart: () => void
  closeCart: () => void
  addItem: (merchandiseId: string, quantity?: number) => Promise<void>
  updateItem: (lineId: string, quantity: number) => Promise<void>
  removeItem: (lineId: string) => Promise<void>
  setCartAttributes: (attributes: { key: string; value: string }[]) => Promise<void>
  applyDiscountCode: (code: string) => Promise<void>
  removeDiscountCode: (code: string) => Promise<void>
  // Mondial Relay (point relais)
  relayPickup: { id: string; name: string; cpVille: string } | null
  selectRelayPickup: (shop: ParcelShop) => Promise<void>
  clearRelayPickup: () => Promise<void>
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<ShopifyCart | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Charger le panier depuis localStorage (avec fallback si expiré)
  useEffect(() => {
    const cartId = localStorage.getItem('body-start-cart-id')
    if (cartId) {
      getCart(cartId).then((c) => {
        if (c) {
          setCart(c)
        } else {
          // Panier expiré ou supprimé côté Shopify
          localStorage.removeItem('body-start-cart-id')
        }
      }).catch(() => {
        localStorage.removeItem('body-start-cart-id')
      })
    }
  }, [])

  const totalQuantity = cart?.totalQuantity ?? 0

  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)

  const addItem = useCallback(async (merchandiseId: string, quantity = 1) => {
    setIsLoading(true)
    try {
      let updatedCart: ShopifyCart
      if (!cart) {
        updatedCart = await createCart([{ merchandiseId, quantity }])
        localStorage.setItem('body-start-cart-id', updatedCart.id)
      } else {
        try {
          updatedCart = await addToCart(cart.id, [{ merchandiseId, quantity }])
        } catch {
          // Panier expiré — on en recrée un nouveau
          updatedCart = await createCart([{ merchandiseId, quantity }])
          localStorage.setItem('body-start-cart-id', updatedCart.id)
        }
      }
      setCart(updatedCart)
      // GA4 add_to_cart (no-op sans consentement mesure d'audience).
      // Détails dérivés de la ligne ajoutée ; n'interrompt jamais l'ajout panier.
      try {
        const line = updatedCart.lines.nodes.find((l) => l.merchandise.id === merchandiseId)
        if (line) {
          const variant = line.merchandise.title
          gaAddToCart({
            item_id: line.merchandise.product.handle,
            item_name: line.merchandise.product.title,
            price: parseFloat(line.merchandise.price.amount),
            quantity,
            item_variant: variant && variant !== 'Default Title' ? variant : undefined,
          })
        }
      } catch {
        /* tracking best-effort */
      }
      setIsOpen(true)
      toast.success('Produit ajouté au panier !')
    } catch {
      toast.error('Erreur lors de l\'ajout au panier')
    } finally {
      setIsLoading(false)
    }
  }, [cart])

  const updateItem = useCallback(async (lineId: string, quantity: number) => {
    if (!cart) return
    setIsLoading(true)
    try {
      const updatedCart = await updateCartLine(cart.id, [{ id: lineId, quantity }])
      setCart(updatedCart)
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setIsLoading(false)
    }
  }, [cart])

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

  const setCartAttributes = useCallback(async (attributes: { key: string; value: string }[]) => {
    if (!cart) return
    setIsLoading(true)
    try {
      const updatedCart = await updateCartAttributes(cart.id, attributes)
      setCart(updatedCart)
    } catch {
      toast.error('Erreur lors de la mise à jour')
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
  // Relais courant dérivé de l'attribut "Point Relais" du cart (re-hydraté
  // après reload sans état React).
  const relayPickup = useMemo(() => {
    const attr = cart?.attributes?.find((a) => a.key === RELAY_ATTRIBUTE_KEY)
    return parseRelayAttributeValue(attr?.value)
  }, [cart])

  // Attributs hors "Point Relais" (en préservant leurs valeurs non nulles),
  // pour merger sans écraser le Click & Collect ni d'autres attributs.
  const attributesWithoutRelay = useCallback(
    (): { key: string; value: string }[] =>
      (cart?.attributes ?? [])
        .filter((a) => a.key !== RELAY_ATTRIBUTE_KEY && a.value != null)
        .map((a) => ({ key: a.key, value: a.value as string })),
    [cart]
  )

  const selectRelayPickup = useCallback(async (shop: ParcelShop) => {
    if (!cart) return
    setIsLoading(true)
    try {
      // 1) Attribut "Point Relais" — MERGE (source de vérité pour l'étiquette).
      const merged = [
        ...attributesWithoutRelay(),
        { key: RELAY_ATTRIBUTE_KEY, value: formatRelayAttributeValue(shop) },
      ]
      let updated = await updateCartAttributes(cart.id, merged)
      // 2) Adresse de livraison du relais (pré-remplissage checkout) — best-effort.
      //    Si le script/API échoue, l'attribut suffit : on n'interrompt rien.
      try {
        const existing = (updated.delivery?.addresses ?? []).map((a) => a.id)
        if (existing.length) updated = await removeCartDeliveryAddresses(cart.id, existing)
        updated = await addCartDeliveryAddresses(cart.id, [
          {
            address: { deliveryAddress: buildRelayDeliveryAddress(shop) },
            selected: true,
            validationStrategy: 'COUNTRY_CODE_ONLY',
          },
        ])
      } catch {
        /* non bloquant : l'attribut "Point Relais" reste posé */
      }
      setCart(updated)
    } catch {
      toast.error('Impossible d\'enregistrer le point relais')
    } finally {
      setIsLoading(false)
    }
  }, [cart, attributesWithoutRelay])

  const clearRelayPickup = useCallback(async () => {
    if (!cart) return
    setIsLoading(true)
    try {
      let updated = await updateCartAttributes(cart.id, attributesWithoutRelay())
      try {
        const existing = (updated.delivery?.addresses ?? []).map((a) => a.id)
        if (existing.length) updated = await removeCartDeliveryAddresses(cart.id, existing)
      } catch {
        /* non bloquant */
      }
      setCart(updated)
    } catch {
      /* silencieux : le retrait du relais ne doit jamais bloquer le panier */
    } finally {
      setIsLoading(false)
    }
  }, [cart, attributesWithoutRelay])

  return (
    <CartContext.Provider value={{
      cart, isLoading, isOpen, totalQuantity,
      openCart, closeCart, addItem, updateItem, removeItem, setCartAttributes,
      applyDiscountCode, removeDiscountCode,
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
