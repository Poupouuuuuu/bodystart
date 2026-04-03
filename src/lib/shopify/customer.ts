import { shopifyFetch } from './client'
import {
  CUSTOMER_CREATE,
  CUSTOMER_ACCESS_TOKEN_CREATE,
  CUSTOMER_ACCESS_TOKEN_DELETE,
  GET_CUSTOMER,
  CUSTOMER_UPDATE,
  CUSTOMER_RECOVER,
} from './queries/customer'

export interface CustomerError {
  code: string
  field: string[]
  message: string
}

export interface CustomerAccessToken {
  accessToken: string
  expiresAt: string
}

export interface Customer {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  createdAt: string
  defaultAddress: CustomerAddress | null
  addresses: { nodes: CustomerAddress[] }
  orders: { nodes: CustomerOrder[] }
}

export interface CustomerAddress {
  id: string
  address1: string
  address2: string | null
  city: string
  zip: string
  country: string
  phone: string | null
  name?: string
}

export interface CustomerOrder {
  id: string
  orderNumber: number
  processedAt: string
  financialStatus: string
  fulfillmentStatus: string
  currentTotalPrice: { amount: string; currencyCode: string }
  lineItems: {
    nodes: {
      title: string
      quantity: number
      variant: {
        image: { url: string; altText: string | null; width: number; height: number } | null
        price: { amount: string; currencyCode: string }
      } | null
    }[]
  }
}

const TOKEN_KEY = 'body-start-customer-token'

// ─── Helpers cookie (pour le middleware) ─────────────────────

function setCookie(name: string, value: string, expiresAt: string): void {
  const expires = new Date(expiresAt).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
}

// ─── Helpers localStorage + cookie sync ──────────────────────

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string, expiresAt: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(`${TOKEN_KEY}-expires`, expiresAt)
  setCookie(TOKEN_KEY, token, expiresAt)
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(`${TOKEN_KEY}-expires`)
  deleteCookie(TOKEN_KEY)
}

export function isTokenExpired(): boolean {
  if (typeof window === 'undefined') return true
  const expires = localStorage.getItem(`${TOKEN_KEY}-expires`)
  if (!expires) return true
  return new Date(expires) < new Date()
}

// ─── API calls ────────────────────────────────────────────────

export async function createCustomer(input: {
  email: string
  password: string
  firstName?: string
  lastName?: string
  acceptsMarketing?: boolean
}): Promise<{ token: string | null; errors: CustomerError[] }> {
  const data = await shopifyFetch<{
    customerCreate: {
      customer: { id: string } | null
      customerUserErrors: CustomerError[]
    }
  }>(CUSTOMER_CREATE, { input })

  const errors = data.customerCreate.customerUserErrors
  if (errors.length > 0) return { token: null, errors }

  // Auto-login après inscription
  return loginCustomer({ email: input.email, password: input.password })
}

export async function loginCustomer(input: {
  email: string
  password: string
}): Promise<{ token: string | null; errors: CustomerError[] }> {
  const data = await shopifyFetch<{
    customerAccessTokenCreate: {
      customerAccessToken: CustomerAccessToken | null
      customerUserErrors: CustomerError[]
    }
  }>(CUSTOMER_ACCESS_TOKEN_CREATE, { input })

  const errors = data.customerAccessTokenCreate.customerUserErrors
  const token = data.customerAccessTokenCreate.customerAccessToken

  if (errors.length > 0 || !token) return { token: null, errors }

  setStoredToken(token.accessToken, token.expiresAt)
  return { token: token.accessToken, errors: [] }
}

export async function logoutCustomer(accessToken: string): Promise<void> {
  await shopifyFetch(CUSTOMER_ACCESS_TOKEN_DELETE, { customerAccessToken: accessToken })
  clearStoredToken()
}

export async function getCustomer(accessToken: string): Promise<Customer | null> {
  const data = await shopifyFetch<{ customer: Customer | null }>(
    GET_CUSTOMER,
    { customerAccessToken: accessToken }
  )
  return data.customer
}

export async function updateCustomer(
  accessToken: string,
  customer: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    password?: string
    acceptsMarketing?: boolean
  }
): Promise<{ success: boolean; errors: CustomerError[] }> {
  const data = await shopifyFetch<{
    customerUpdate: {
      customer: { id: string } | null
      customerUserErrors: CustomerError[]
    }
  }>(CUSTOMER_UPDATE, { customerAccessToken: accessToken, customer })

  const errors = data.customerUpdate.customerUserErrors
  return { success: errors.length === 0, errors }
}

export async function recoverCustomerPassword(email: string): Promise<{ errors: CustomerError[] }> {
  const data = await shopifyFetch<{
    customerRecover: { customerUserErrors: CustomerError[] }
  }>(CUSTOMER_RECOVER, { email })
  return { errors: data.customerRecover.customerUserErrors }
}
