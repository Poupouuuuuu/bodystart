'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { createCart, addToCart, updateCartLine, removeFromCart, getCart, updateCartAttributes } from '@/lib/shopify'
import type { ShopifyCart } from '@/lib/shopify/types'
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
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<ShopifyCart | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Charger le panier depuis localStorage
  useEffect(() => {
    const cartId = localStorage.getItem('body-start-cart-id')
    if (cartId) {
      getCart(cartId).then((c) => {
        if (c) setCart(c)
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
        updatedCart = await addToCart(cart.id, [{ merchandiseId, quantity }])
      }
      setCart(updatedCart)
      setIsOpen(true)
      toast.success('Produit ajouté au panier !')
    } catch (err) {
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

  return (
    <CartContext.Provider value={{
      cart, isLoading, isOpen, totalQuantity,
      openCart, closeCart, addItem, updateItem, removeItem, setCartAttributes,
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
