'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  getCustomer,
  loginCustomer,
  logoutCustomer,
  createCustomer,
  getStoredToken,
  isTokenExpired,
  clearStoredToken,
  type Customer,
  type CustomerError,
} from '@/lib/shopify/customer'

interface CustomerContextType {
  customer: Customer | null
  isLoading: boolean
  isLoggedIn: boolean
  login: (email: string, password: string) => Promise<{ errors: CustomerError[] }>
  register: (data: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => Promise<{ errors: CustomerError[] }>
  logout: () => Promise<void>
  refreshCustomer: () => Promise<void>
}

const CustomerContext = createContext<CustomerContextType | null>(null)

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshCustomer = useCallback(async () => {
    const token = getStoredToken()
    if (!token || isTokenExpired()) {
      clearStoredToken()
      setCustomer(null)
      setIsLoading(false)
      return
    }
    try {
      const c = await getCustomer(token)
      setCustomer(c)
    } catch {
      clearStoredToken()
      setCustomer(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshCustomer()
  }, [refreshCustomer])

  const login = async (email: string, password: string) => {
    const { errors } = await loginCustomer({ email, password })
    if (errors.length === 0) await refreshCustomer()
    return { errors }
  }

  const register = async (data: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => {
    const { errors } = await createCustomer(data)
    if (errors.length === 0) await refreshCustomer()
    return { errors }
  }

  const logout = async () => {
    const token = getStoredToken()
    if (token) await logoutCustomer(token)
    setCustomer(null)
  }

  return (
    <CustomerContext.Provider value={{
      customer,
      isLoading,
      isLoggedIn: !!customer,
      login,
      register,
      logout,
      refreshCustomer,
    }}>
      {children}
    </CustomerContext.Provider>
  )
}

export function useCustomer() {
  const ctx = useContext(CustomerContext)
  if (!ctx) throw new Error('useCustomer must be used within CustomerProvider')
  return ctx
}
