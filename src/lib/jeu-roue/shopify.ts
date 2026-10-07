// Jeu de la roue : appels à l'API Admin Shopify (serveur uniquement).
// Version d'API épinglée : champs récents (customerByIdentifier,
// defaultEmailAddress, context des remises).

import { randomInt } from 'node:crypto'
import { shopifyAdminFetch } from '@/lib/shopify/client'
import { generateCode, noteLine, type Entry, type JeuResult } from './core'
import { LOTS, JEU_LOCATION_ID, CODE_VALIDITY_DAYS, lotById, type Lot, type LotId } from './lots'

const API = { apiVersion: '2026-04' }

export const PARTICIPANT_TAG = 'jeu-roue'
const MF_NAMESPACE = 'bodystart'
const MF_KEY = 'jeu_roue'

type UserError = { field?: string[] | null; message: string; code?: string | null }

const CUSTOMER_FIELDS = `
  id
  defaultEmailAddress { emailAddress }
  defaultPhoneNumber { phoneNumber }
  tags
  note
  jeuRoue: metafield(namespace: "${MF_NAMESPACE}", key: "${MF_KEY}") { value }
`

export interface ShopCustomer {
  id: string
  defaultEmailAddress: { emailAddress: string } | null
  defaultPhoneNumber: { phoneNumber: string } | null
  tags: string[]
  note: string | null
  jeuRoue: { value: string } | null
}

// ─── Lecture ──────────────────────────────────────────────────

/** Résultat d'une participation passée, lu dans le métachamp du client. */
export function readResult(c: Pick<ShopCustomer, 'jeuRoue'>): JeuResult | null {
  if (!c.jeuRoue?.value) return null
  try {
    const r = JSON.parse(c.jeuRoue.value) as Partial<JeuResult>
    if (r.lotId && lotById(r.lotId) && typeof r.code === 'string' && /^ROUE-[A-Z2-9]{6}$/.test(r.code)) {
      return { lotId: r.lotId, code: r.code, endsAt: r.endsAt ?? '', playedAt: r.playedAt ?? '' }
    }
  } catch {
    /* métachamp illisible : traité comme absent */
  }
  return null
}

export function hasPlayed(c: Pick<ShopCustomer, 'tags'>): boolean {
  return c.tags.includes(PARTICIPANT_TAG)
}

/** Un client déjà marqué `jeu-roue` avec cet e-mail ou ce téléphone. */
export async function findParticipant(email: string, phone: string): Promise<ShopCustomer | null> {
  const data = await shopifyAdminFetch<{ customers: { nodes: ShopCustomer[] } }>(
    `query FindParticipant($q: String!) { customers(first: 5, query: $q) { nodes { ${CUSTOMER_FIELDS} } } }`,
    { q: `tag:${PARTICIPANT_TAG} AND (email:${email} OR phone:${phone})` },
    API
  )
  return data.customers.nodes.find(hasPlayed) ?? null
}

export async function getCustomerByEmail(email: string): Promise<ShopCustomer | null> {
  const data = await shopifyAdminFetch<{ customerByIdentifier: ShopCustomer | null }>(
    `query CustomerByEmail($email: String!) { customerByIdentifier(identifier: { emailAddress: $email }) { ${CUSTOMER_FIELDS} } }`,
    { email },
    API
  )
  return data.customerByIdentifier
}

export async function getCustomerById(id: string): Promise<ShopCustomer | null> {
  const data = await shopifyAdminFetch<{ customer: ShopCustomer | null }>(
    `query CustomerById($id: ID!) { customer(id: $id) { ${CUSTOMER_FIELDS} } }`,
    { id },
    API
  )
  return data.customer
}

// ─── Fiche client ─────────────────────────────────────────────

const isPhoneError = (errs: UserError[]) =>
  errs.some((e) => (e.field ?? []).some((f) => /phone/i.test(f)) || /phone|t[ée]l[ée]phone/i.test(e.message))

function consent(now: string) {
  return { marketingState: 'SUBSCRIBED', marketingOptInLevel: 'SINGLE_OPT_IN', consentUpdatedAt: now }
}

/**
 * Crée la fiche client, ou met à jour celle qui existe déjà (prénom, nom,
 * téléphone). Si le téléphone appartient déjà à une autre fiche, il est
 * ignoré sans bloquer. Case cochée : accord e-mail et SMS (opt-in simple).
 * Case décochée : on ne touche pas aux accords existants.
 */
export async function upsertCustomer(entry: Entry): Promise<string> {
  const now = new Date().toISOString()
  const existing = await getCustomerByEmail(entry.email)

  if (existing) {
    const update = async (withPhone: boolean) =>
      (
        await shopifyAdminFetch<{ customerUpdate: { userErrors: UserError[] } }>(
          `mutation UpdateCustomer($input: CustomerInput!) { customerUpdate(input: $input) { customer { id } userErrors { field message } } }`,
          {
            input: {
              id: existing.id,
              firstName: entry.firstName,
              lastName: entry.lastName,
              ...(withPhone ? { phone: entry.phone } : {}),
            },
          },
          API
        )
      ).customerUpdate.userErrors
    let errs = await update(existing.defaultPhoneNumber?.phoneNumber !== entry.phone)
    let phoneOk = existing.defaultPhoneNumber?.phoneNumber === entry.phone
    if (errs.length && isPhoneError(errs)) errs = await update(false)
    else if (!errs.length) phoneOk = true
    if (errs.length) console.warn('[jeu-roue] customerUpdate userErrors:', JSON.stringify(errs))

    if (entry.optIn) await subscribe(existing.id, now, phoneOk)
    return existing.id
  }

  const create = async (withPhone: boolean) =>
    (
      await shopifyAdminFetch<{ customerCreate: { customer: { id: string } | null; userErrors: UserError[] } }>(
        `mutation CreateCustomer($input: CustomerInput!) { customerCreate(input: $input) { customer { id } userErrors { field message } } }`,
        {
          input: {
            firstName: entry.firstName,
            lastName: entry.lastName,
            email: entry.email,
            ...(withPhone ? { phone: entry.phone } : {}),
            ...(entry.optIn ? { emailMarketingConsent: consent(now) } : {}),
            ...(entry.optIn && withPhone ? { smsMarketingConsent: consent(now) } : {}),
          },
        },
        API
      )
    ).customerCreate

  let res = await create(true)
  if (res.userErrors.length && isPhoneError(res.userErrors)) res = await create(false)
  if (res.customer) return res.customer.id

  // Fiche créée entre-temps (double envoi) : on la relit.
  const again = await getCustomerByEmail(entry.email)
  if (again) return again.id
  throw new Error(`[jeu-roue] customerCreate userErrors: ${JSON.stringify(res.userErrors)}`)
}

async function subscribe(customerId: string, now: string, withSms: boolean) {
  const email = await shopifyAdminFetch<{ customerEmailMarketingConsentUpdate: { userErrors: UserError[] } }>(
    `mutation EmailConsent($input: CustomerEmailMarketingConsentUpdateInput!) { customerEmailMarketingConsentUpdate(input: $input) { userErrors { field message } } }`,
    { input: { customerId, emailMarketingConsent: consent(now) } },
    API
  )
  if (email.customerEmailMarketingConsentUpdate.userErrors.length) {
    console.warn('[jeu-roue] email consent:', JSON.stringify(email.customerEmailMarketingConsentUpdate.userErrors))
  }
  if (!withSms) return
  const sms = await shopifyAdminFetch<{ customerSmsMarketingConsentUpdate: { userErrors: UserError[] } }>(
    `mutation SmsConsent($input: CustomerSmsMarketingConsentUpdateInput!) { customerSmsMarketingConsentUpdate(input: $input) { userErrors { field message } } }`,
    { input: { customerId, smsMarketingConsent: consent(now) } },
    API
  )
  if (sms.customerSmsMarketingConsentUpdate.userErrors.length) {
    console.warn('[jeu-roue] sms consent:', JSON.stringify(sms.customerSmsMarketingConsentUpdate.userErrors))
  }
}

// ─── Stock et prix des lots ───────────────────────────────────

type StockVariant = {
  id: string
  price: string
  inventoryItem: { inventoryLevel: { quantities: { quantity: number }[] } | null } | null
}
type StockNode =
  | ({ __typename: 'ProductVariant' } & StockVariant)
  | { __typename: 'Product'; id: string; variants: { nodes: StockVariant[] } }
  | null

const available = (v: StockVariant) => v.inventoryItem?.inventoryLevel?.quantities[0]?.quantity ?? 0

/**
 * Lots tirables (stock > 0 à Coignières pour les articles offerts ; la remise
 * sur commande l'est toujours) et prix d'une unité (le plus élevé des
 * variantes ciblées, pour que l'article soit toujours entièrement offert).
 */
export async function lotsAvailability(): Promise<{ available: Set<LotId>; prices: Map<LotId, number> }> {
  const ids = LOTS.flatMap((l) => [...(l.products ?? []), ...(l.variants ?? [])])
  const data = await shopifyAdminFetch<{ nodes: StockNode[] }>(
    `query LotsStock($ids: [ID!]!, $loc: ID!) {
      nodes(ids: $ids) {
        __typename
        ... on Product { id variants(first: 50) { nodes { id price inventoryItem { inventoryLevel(locationId: $loc) { quantities(names: ["available"]) { quantity } } } } } }
        ... on ProductVariant { id price inventoryItem { inventoryLevel(locationId: $loc) { quantities(names: ["available"]) { quantity } } } }
      }
    }`,
    { ids, loc: JEU_LOCATION_ID },
    API
  )
  const byId = new Map<string, StockVariant[]>()
  for (const n of data.nodes) {
    if (!n) continue
    byId.set(n.id, n.__typename === 'Product' ? n.variants.nodes : [n])
  }

  const avail = new Set<LotId>()
  const prices = new Map<LotId, number>()
  for (const lot of LOTS) {
    if (lot.type === 'order') {
      avail.add(lot.id)
      continue
    }
    const variants = [...(lot.products ?? []), ...(lot.variants ?? [])].flatMap((id) => byId.get(id) ?? [])
    if (variants.reduce((sum, v) => sum + Math.max(0, available(v)), 0) > 0) avail.add(lot.id)
    const max = Math.max(0, ...variants.map((v) => Number(v.price)).filter(Number.isFinite))
    if (max > 0) prices.set(lot.id, max)
  }
  return { available: avail, prices }
}

// ─── Code de remise ───────────────────────────────────────────

export function discountInput(lot: Lot, code: string, amount: number, startsAt: Date, endsAt: Date) {
  return {
    title: `Jeu roue : ${lot.label} : ${code}`,
    code,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    context: { all: 'ALL' },
    customerGets: {
      // Montant fixe appliqué une seule fois sur l'ensemble des articles
      // concernés (et non par article) : un seul article offert.
      value: { discountAmount: { amount: amount.toFixed(2), appliesOnEachItem: false } },
      items:
        lot.type === 'order'
          ? { all: true }
          : { products: { productsToAdd: lot.products ?? [], productVariantsToAdd: lot.variants ?? [] } },
    },
    ...(lot.minSubtotal
      ? { minimumRequirement: { subtotal: { greaterThanOrEqualToSubtotal: lot.minSubtotal.toFixed(2) } } }
      : {}),
    usageLimit: 1,
    appliesOncePerCustomer: false,
    combinesWith: { productDiscounts: false, orderDiscounts: true, shippingDiscounts: true },
  }
}

/** Crée le code unique (nouveau tirage du code s'il existe déjà). */
export async function createLotDiscount(lot: Lot, amount: number): Promise<{ code: string; endsAt: string }> {
  const startsAt = new Date()
  const endsAt = new Date(startsAt.getTime() + CODE_VALIDITY_DAYS * 24 * 3600 * 1000)
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode(randomInt)
    const data = await shopifyAdminFetch<{
      discountCodeBasicCreate: { codeDiscountNode: { id: string } | null; userErrors: UserError[] }
    }>(
      `mutation CreateDiscount($input: DiscountCodeBasicInput!) { discountCodeBasicCreate(basicCodeDiscount: $input) { codeDiscountNode { id } userErrors { field message code } } }`,
      { input: discountInput(lot, code, amount, startsAt, endsAt) },
      API
    )
    const { codeDiscountNode, userErrors } = data.discountCodeBasicCreate
    if (codeDiscountNode) return { code, endsAt: endsAt.toISOString() }
    const taken = userErrors.some((e) => e.code === 'TAKEN' || /taken|already|unique/i.test(e.message))
    if (!taken) throw new Error(`[jeu-roue] discountCodeBasicCreate: ${JSON.stringify(userErrors)}`)
  }
  throw new Error('[jeu-roue] impossible de générer un code unique')
}

// ─── Marquage du participant ──────────────────────────────────

/**
 * Étiquettes `jeu-roue` et `jeu-roue-<lot>`, ligne ajoutée à la note, résultat
 * en métachamp (pour réafficher le lot). Chaque étape est indépendante : un
 * échec est journalisé sans bloquer (le résultat est déjà gardé dans Redis).
 */
export async function markParticipant(customer: ShopCustomer, lot: Lot, result: JeuResult): Promise<void> {
  const steps: [string, () => Promise<UserError[]>][] = [
    [
      'tagsAdd',
      async () =>
        (
          await shopifyAdminFetch<{ tagsAdd: { userErrors: UserError[] } }>(
            `mutation AddTags($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { field message } } }`,
            { id: customer.id, tags: [PARTICIPANT_TAG, `${PARTICIPANT_TAG}-${lot.id}`] },
            API
          )
        ).tagsAdd.userErrors,
    ],
    [
      'note',
      async () =>
        (
          await shopifyAdminFetch<{ customerUpdate: { userErrors: UserError[] } }>(
            `mutation UpdateNote($input: CustomerInput!) { customerUpdate(input: $input) { customer { id } userErrors { field message } } }`,
            { input: { id: customer.id, note: [customer.note?.trim(), noteLine(result, lot)].filter(Boolean).join('\n') } },
            API
          )
        ).customerUpdate.userErrors,
    ],
    [
      'metafield',
      async () =>
        (
          await shopifyAdminFetch<{ metafieldsSet: { userErrors: UserError[] } }>(
            `mutation SetResult($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { userErrors { field message } } }`,
            {
              metafields: [
                { ownerId: customer.id, namespace: MF_NAMESPACE, key: MF_KEY, type: 'json', value: JSON.stringify(result) },
              ],
            },
            API
          )
        ).metafieldsSet.userErrors,
    ],
  ]
  for (const [name, run] of steps) {
    try {
      const errs = await run()
      if (errs.length) console.error(`[jeu-roue] ${name} userErrors:`, JSON.stringify(errs))
    } catch (err) {
      console.error(`[jeu-roue] ${name} a échoué :`, err)
    }
  }
}
