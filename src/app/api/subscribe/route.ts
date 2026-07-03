import { NextRequest, NextResponse } from 'next/server'
import { shopifyAdminFetch } from '@/lib/shopify/client'

// ============================================================
// Inscription newsletter → contact ABONNÉ marketing dans Shopify
// ============================================================
// But : créer/abonner le contact dans Shopify (Admin API) avec consentement
// marketing SUBSCRIBED, pour que l'automatisation « bienvenue » de Shopify Email
// se déclenche et envoie le code -10 %. On N'ENVOIE aucun email ici (c'est
// Shopify qui s'en charge) et on n'affiche jamais le code côté front.

export const dynamic = 'force-dynamic'

// ─── Rate limiter optionnel (5 / 10 min / IP) — skip si Upstash non configuré ───
let ratelimit: { limit: (key: string) => Promise<{ success: boolean }> } | null = null
if (process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_URL.includes('xxx')) {
  const { Ratelimit } = require('@upstash/ratelimit')
  const { Redis } = require('@upstash/redis')
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '10 m'),
    prefix: 'ratelimit:subscribe',
  })
}

const FIND_CUSTOMER = `
  query FindCustomer($q: String!) {
    customers(first: 1, query: $q) {
      nodes { id emailMarketingConsent { marketingState } }
    }
  }
`
const CREATE_CUSTOMER = `
  mutation CreateSubscriber($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`
const UPDATE_CONSENT = `
  mutation UpdateConsent($input: CustomerEmailMarketingConsentUpdateInput!) {
    customerEmailMarketingConsentUpdate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`
const ADD_TAGS = `
  mutation AddTags($id: ID!, $tags: [String!]!) {
    tagsAdd(id: $id, tags: $tags) {
      userErrors { field message }
    }
  }
`

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Tags additionnels autorisés (allowlist stricte — jamais de tag arbitraire
// depuis le client). 'boutique-b' = liste d'intention ouverture 2e boutique
// (formulaire « Me prévenir » de /stores).
const ALLOWED_EXTRA_TAGS = new Set(['boutique-b'])

export async function POST(req: NextRequest) {
  try {
    if (ratelimit) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
      const { success } = await ratelimit.limit(ip)
      if (!success) {
        return NextResponse.json({ error: 'Trop de tentatives. Réessaie dans un instant.' }, { status: 429 })
      }
    }

    const body = await req.json().catch(() => ({}))
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Email invalide.' }, { status: 400 })
    }
    const extraTag =
      typeof body?.tag === 'string' && ALLOWED_EXTRA_TAGS.has(body.tag) ? body.tag : null

    const consent = {
      marketingState: 'SUBSCRIBED',
      marketingOptInLevel: 'SINGLE_OPT_IN',
      consentUpdatedAt: new Date().toISOString(),
    }

    // 1. Le contact existe-t-il déjà ? (évite les doublons)
    const found = await shopifyAdminFetch<{
      customers: { nodes: { id: string; emailMarketingConsent: { marketingState: string } | null }[] }
    }>(FIND_CUSTOMER, { q: `email:${email}` })
    const existing = found.customers.nodes[0]

    if (existing) {
      // 2a. Déjà connu → on met à jour le consentement (idempotent) + succès.
      const res = await shopifyAdminFetch<{
        customerEmailMarketingConsentUpdate: { userErrors: { field: string[]; message: string }[] }
      }>(UPDATE_CONSENT, { input: { customerId: existing.id, emailMarketingConsent: consent } })
      const errs = res.customerEmailMarketingConsentUpdate.userErrors
      if (errs?.length) {
        // Erreur bénigne (ex. déjà au même état) → on log et on renvoie succès.
        console.warn('[subscribe] consent update userErrors:', JSON.stringify(errs))
      }
      if (extraTag) {
        // Contact déjà connu → on pose quand même le tag (liste d'intention).
        // Best-effort : un échec de tag ne doit pas faire échouer l'inscription,
        // mais on LIT les userErrors (graphql-request ne throw pas dessus).
        try {
          const tagRes = await shopifyAdminFetch<{
            tagsAdd: { userErrors: { field: string[] | null; message: string }[] }
          }>(ADD_TAGS, { id: existing.id, tags: [extraTag] })
          if (tagRes.tagsAdd.userErrors?.length) {
            console.warn('[subscribe] tagsAdd userErrors:', JSON.stringify(tagRes.tagsAdd.userErrors))
          }
        } catch (err) {
          console.warn('[subscribe] tagsAdd failed (non-blocking):', err)
        }
      }
      return NextResponse.json({ success: true, status: 'updated' })
    }

    // 2b. Nouveau contact → création abonné marketing.
    const res = await shopifyAdminFetch<{
      customerCreate: { customer: { id: string } | null; userErrors: { field: string[]; message: string }[] }
    }>(CREATE_CUSTOMER, {
      input: {
        email,
        emailMarketingConsent: consent,
        // popup-10 = tag d'acquisition de la POPUP (déclenche l'automatisation
        // bienvenue -10 % de Shopify Email). Un inscrit « boutique-b » ne doit
        // NI polluer ce segment NI recevoir le code : tags séparés par source.
        tags: extraTag ? ['newsletter', extraTag] : ['newsletter', 'popup-10'],
      },
    })
    const errs = res.customerCreate.userErrors
    if (errs?.length) {
      // Race possible (email pris entre-temps) → on considère l'inscription OK.
      if (errs.some((e) => /taken|already|exist/i.test(e.message))) {
        return NextResponse.json({ success: true, status: 'exists' })
      }
      console.error('[subscribe] customerCreate userErrors:', JSON.stringify(errs))
      return NextResponse.json({ error: 'Inscription impossible.' }, { status: 400 })
    }

    return NextResponse.json({ success: true, status: 'created' })
  } catch (error) {
    console.error('[subscribe API] Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
