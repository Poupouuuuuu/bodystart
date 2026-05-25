# Loyalty L4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer l'interface client en ligne du programme loyalty BodyStart : page `/account` enrichie (Cagnotte + Parrainage avec vraies données), page publique `/parrainage`, widget cagnotte dans le panier, et fermeture des routes L3 phone-based.

**Architecture:** Helper de résolution session Shopify → loyalty_customer (match `shopify_customer_id` prioritaire, fallback `email` + auto-upgrade). Refactor L3 en helpers purs (`preview-core`, `redeem-online-core`) consommés par 2 paires de routes : L3 phone-based (staff/M2M only) et L4 session-based (`/me/*`). UI dans `/account` réécrite + nouvelle page `/parrainage` + widget dans `CartDrawer`. Aucune nouvelle migration SQL.

**Tech Stack:** Next.js 14 App Router + TypeScript, Shopify Customer Account API (cookie `body-start-customer-token`), Supabase (admin client service role), Vitest 2.1, Zod, libphonenumber-js, Upstash rate limiter, Tailwind custom (couleurs `#1a2e23` / `#f4f6f1` / `#89a890`).

**Spec source:** `docs/superpowers/specs/2026-05-24-loyalty-L4-client-online-design.md` (commit `a963225`).

---

## Phase 1 : Helpers infra (Tasks 1-3)

### Task 1 : Helper `site-url` (NEXT_PUBLIC_SITE_URL)

**Files:**
- Create: `src/lib/site-url.ts`
- Test: `src/lib/site-url.test.ts`

- [ ] **Step 1 : Write the failing test**

`src/lib/site-url.test.ts` :

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getSiteUrl, getSiteDomain } from './site-url'

describe('site-url', () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalEnv
  })

  describe('getSiteUrl', () => {
    it('retourne la valeur de NEXT_PUBLIC_SITE_URL', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://bodystart.vercel.app'
      expect(getSiteUrl()).toBe('https://bodystart.vercel.app')
    })

    it('strip le trailing slash', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://bodystart.fr/'
      expect(getSiteUrl()).toBe('https://bodystart.fr')
    })

    it('retourne chaine vide si variable absente', () => {
      delete process.env.NEXT_PUBLIC_SITE_URL
      expect(getSiteUrl()).toBe('')
    })

    it('retourne chaine vide si variable vide', () => {
      process.env.NEXT_PUBLIC_SITE_URL = ''
      expect(getSiteUrl()).toBe('')
    })
  })

  describe('getSiteDomain', () => {
    it('strip le protocole https', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://bodystart.fr'
      expect(getSiteDomain()).toBe('bodystart.fr')
    })

    it('strip le protocole http', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
      expect(getSiteDomain()).toBe('localhost:3000')
    })

    it('retourne chaine vide si url vide', () => {
      delete process.env.NEXT_PUBLIC_SITE_URL
      expect(getSiteDomain()).toBe('')
    })
  })
})
```

- [ ] **Step 2 : Run the failing test**

Run: `npx vitest run src/lib/site-url.test.ts`
Expected: FAIL with "Cannot find module './site-url'".

- [ ] **Step 3 : Write minimal implementation**

`src/lib/site-url.ts` :

```typescript
/**
 * Helper pour acceder a l'URL canonique du site, injectee via
 * NEXT_PUBLIC_SITE_URL (env Vercel). Le domaine final n'est pas
 * tranche en mai 2026 : on n'inscrit JAMAIS d'URL en dur dans le code.
 *
 * Exemples valeurs possibles :
 *   - "https://bodystart.vercel.app" (preview)
 *   - "https://bodystart.fr" (prod future)
 *   - "" (dev local sans config, on degrade proprement)
 */

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  return raw.replace(/\/$/, '')
}

export function getSiteDomain(): string {
  const url = getSiteUrl()
  return url.replace(/^https?:\/\//, '')
}
```

- [ ] **Step 4 : Run the test, verify pass**

Run: `npx vitest run src/lib/site-url.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5 : Commit**

```bash
git add src/lib/site-url.ts src/lib/site-url.test.ts
git commit -m "feat(site-url): helper getSiteUrl/getSiteDomain depuis NEXT_PUBLIC_SITE_URL

Pas d'URL en dur dans le code (le domaine final n'est pas trance).
Utilise par le copy parrainage L4 (message WhatsApp pre-rempli, liens
de partage). Fallback chaine vide si la variable n'est pas definie.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 2 : Helper pur `preview-core`

**Files:**
- Create: `src/lib/loyalty/preview-core.ts`
- Test: `src/lib/loyalty/preview-core.test.ts`

- [ ] **Step 1 : Write the failing test**

`src/lib/loyalty/preview-core.test.ts` :

```typescript
import { describe, it, expect } from 'vitest'
import { buildPreview } from './preview-core'

describe('buildPreview', () => {
  it('balance < 20 € : eligible=false, reason=balance_below_minimum', () => {
    const out = buildPreview({
      customer: { id: 'c1', loyaltyBalanceCents: 1500 },
      cartSubtotalCents: 5000,
    })
    expect(out.eligible).toBe(false)
    expect(out.reason).toBe('balance_below_minimum')
    expect(out.maxRedeemableCents).toBe(0)
    expect(out.balanceCents).toBe(1500)
  })

  it('balance >= 20 €, cart > 0 : eligible=true', () => {
    const out = buildPreview({
      customer: { id: 'c1', loyaltyBalanceCents: 5000 },
      cartSubtotalCents: 10000,
    })
    expect(out.eligible).toBe(true)
    expect(out.reason).toBeUndefined()
    expect(out.maxRedeemableCents).toBe(5000) // min(balance, 50% cart) = min(5000, 5000)
    expect(out.balanceCents).toBe(5000)
  })

  it('cap 50 % du panier applique', () => {
    const out = buildPreview({
      customer: { id: 'c1', loyaltyBalanceCents: 10000 },
      cartSubtotalCents: 6000,
    })
    expect(out.eligible).toBe(true)
    expect(out.maxRedeemableCents).toBe(3000) // 50% de 6000
  })

  it('cart <= 0 : eligible=false, reason=invalid_cart', () => {
    const out = buildPreview({
      customer: { id: 'c1', loyaltyBalanceCents: 5000 },
      cartSubtotalCents: 0,
    })
    expect(out.eligible).toBe(false)
    expect(out.reason).toBe('invalid_cart')
  })

  it('config exposee dans la reponse', () => {
    const out = buildPreview({
      customer: { id: 'c1', loyaltyBalanceCents: 5000 },
      cartSubtotalCents: 10000,
    })
    expect(out.config.minBalanceCents).toBe(2000)
    expect(out.config.cartCapRatio).toBe(0.5)
  })
})
```

- [ ] **Step 2 : Run the failing test**

Run: `npx vitest run src/lib/loyalty/preview-core.test.ts`
Expected: FAIL with "Cannot find module './preview-core'".

- [ ] **Step 3 : Write minimal implementation**

`src/lib/loyalty/preview-core.ts` :

```typescript
/**
 * Logique pure du preview cagnotte en ligne.
 *
 * Extraite de la route /api/loyalty/preview (L3) pour etre partagee
 * entre la route phone-based L3 (staff/M2M) et la route session-based
 * L4 (/api/loyalty/me/preview).
 *
 * Aucun I/O. Aucune dependance Supabase / Shopify. Testable isolement.
 */
import {
  maxRedeemableCents,
  REDEEM_MIN_BALANCE_CENTS,
  REDEEM_CART_CAP_RATIO,
} from './calculate'

export interface PreviewInput {
  customer: { id: string; loyaltyBalanceCents: number }
  cartSubtotalCents: number
}

export type PreviewReason =
  | 'balance_below_minimum'
  | 'invalid_cart'
  | 'no_redeemable_amount'

export interface PreviewOutput {
  balanceCents: number
  maxRedeemableCents: number
  eligible: boolean
  reason?: PreviewReason
  config: { minBalanceCents: number; cartCapRatio: number }
}

export function buildPreview(input: PreviewInput): PreviewOutput {
  const balanceCents = input.customer.loyaltyBalanceCents
  const max = maxRedeemableCents(input.cartSubtotalCents, balanceCents)
  const eligible = max > 0

  let reason: PreviewReason | undefined
  if (!eligible) {
    if (balanceCents < REDEEM_MIN_BALANCE_CENTS) reason = 'balance_below_minimum'
    else if (input.cartSubtotalCents <= 0) reason = 'invalid_cart'
    else reason = 'no_redeemable_amount'
  }

  return {
    balanceCents,
    maxRedeemableCents: max,
    eligible,
    ...(reason ? { reason } : {}),
    config: {
      minBalanceCents: REDEEM_MIN_BALANCE_CENTS,
      cartCapRatio: REDEEM_CART_CAP_RATIO,
    },
  }
}
```

- [ ] **Step 4 : Run the test, verify pass**

Run: `npx vitest run src/lib/loyalty/preview-core.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5 : Commit**

```bash
git add src/lib/loyalty/preview-core.ts src/lib/loyalty/preview-core.test.ts
git commit -m "refactor(loyalty): extract preview-core pure helper

Logique pure preview cagnotte extraite de /api/loyalty/preview pour
etre partagee avec la future /api/loyalty/me/preview (L4 session-based).
Aucun I/O, aucune dependance externe. 5 tests vitest.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3 : Helper d'orchestration `redeem-online-core`

**Files:**
- Create: `src/lib/loyalty/redeem-online-core.ts`
- Test: `src/lib/loyalty/redeem-online-core.test.ts`

- [ ] **Step 1 : Write the failing test**

`src/lib/loyalty/redeem-online-core.test.ts` :

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { executeRedeem } from './redeem-online-core'

// Mock des helpers I/O
vi.mock('./redemption', () => ({
  expireOldRedemptions: vi.fn().mockResolvedValue(0),
  validateRedemptionRequest: vi.fn(),
  reserveRedemption: vi.fn(),
}))

import {
  expireOldRedemptions,
  validateRedemptionRequest,
  reserveRedemption,
} from './redemption'

describe('executeRedeem', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockSupabase: any = {}

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('happy path : validation OK + reserve OK', async () => {
    vi.mocked(validateRedemptionRequest).mockReturnValue({
      ok: true,
      appliedCents: 2000,
    })
    vi.mocked(reserveRedemption).mockResolvedValue({
      discountCode: 'BS-CAGNOTTE-XYZ12',
      amountCents: 2000,
      expiresAt: '2026-05-24T15:30:00Z',
    })

    const result = await executeRedeem({
      supabase: mockSupabase,
      customer: { id: 'c1', phone: '+33611111111', loyaltyBalanceCents: 5000 },
      cartSubtotalCents: 10000,
      requestedAmountCents: 2000,
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.redemption.discountCode).toBe('BS-CAGNOTTE-XYZ12')
      expect(result.redemption.amountCents).toBe(2000)
    }
    expect(expireOldRedemptions).toHaveBeenCalledWith(mockSupabase, 'c1')
  })

  it('validation KO : retourne {ok:false, kind:validation}', async () => {
    vi.mocked(validateRedemptionRequest).mockReturnValue({
      ok: false,
      reason: 'above_cap',
      maxAllowedCents: 3000,
    })

    const result = await executeRedeem({
      supabase: mockSupabase,
      customer: { id: 'c1', phone: '+33611111111', loyaltyBalanceCents: 5000 },
      cartSubtotalCents: 6000,
      requestedAmountCents: 9999,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.kind).toBe('validation')
      if (result.kind === 'validation') {
        expect(result.reason).toBe('above_cap')
        expect(result.maxAllowedCents).toBe(3000)
      }
    }
    expect(reserveRedemption).not.toHaveBeenCalled()
  })

  it('reserve throw : retourne {ok:false, kind:reserve}', async () => {
    vi.mocked(validateRedemptionRequest).mockReturnValue({
      ok: true,
      appliedCents: 2000,
    })
    vi.mocked(reserveRedemption).mockRejectedValue(new Error('Shopify API down'))

    const result = await executeRedeem({
      supabase: mockSupabase,
      customer: { id: 'c1', phone: '+33611111111', loyaltyBalanceCents: 5000 },
      cartSubtotalCents: 10000,
      requestedAmountCents: 2000,
    })

    expect(result.ok).toBe(false)
    if (!result.ok && result.kind === 'reserve') {
      expect(result.detail).toContain('Shopify API down')
    }
  })

  it('expireOldRedemptions throw : non-bloquant, on continue', async () => {
    vi.mocked(expireOldRedemptions).mockRejectedValue(new Error('DB hiccup'))
    vi.mocked(validateRedemptionRequest).mockReturnValue({
      ok: true,
      appliedCents: 2000,
    })
    vi.mocked(reserveRedemption).mockResolvedValue({
      discountCode: 'BS-CAGNOTTE-XYZ12',
      amountCents: 2000,
      expiresAt: '2026-05-24T15:30:00Z',
    })

    const result = await executeRedeem({
      supabase: mockSupabase,
      customer: { id: 'c1', phone: '+33611111111', loyaltyBalanceCents: 5000 },
      cartSubtotalCents: 10000,
      requestedAmountCents: 2000,
    })

    expect(result.ok).toBe(true)
  })
})
```

- [ ] **Step 2 : Run the failing test**

Run: `npx vitest run src/lib/loyalty/redeem-online-core.test.ts`
Expected: FAIL with "Cannot find module './redeem-online-core'".

- [ ] **Step 3 : Write minimal implementation**

`src/lib/loyalty/redeem-online-core.ts` :

```typescript
/**
 * Orchestration du redeem en ligne (sweep + validate + reserve).
 *
 * Extraite de la route /api/loyalty/redeem-online (L3) pour etre
 * partagee entre la route phone-based L3 (staff/M2M) et la route
 * session-based L4 (/api/loyalty/me/redeem-online).
 *
 * Reste un helper d'orchestration (pas 100% pur : appels DB +
 * Shopify Admin API a travers redemption.ts). La logique metier
 * pure est dans calculate.ts + redemption.ts/validateRedemptionRequest.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  expireOldRedemptions,
  validateRedemptionRequest,
  reserveRedemption,
  type ValidationFailureReason,
} from './redemption'

export interface RedeemInput {
  supabase: SupabaseClient
  customer: { id: string; phone: string; loyaltyBalanceCents: number }
  cartSubtotalCents: number
  requestedAmountCents: number
}

export type RedeemResult =
  | {
      ok: true
      redemption: { discountCode: string; amountCents: number; expiresAt: string }
    }
  | { ok: false; kind: 'validation'; reason: ValidationFailureReason; maxAllowedCents: number }
  | { ok: false; kind: 'reserve'; detail: string }

export async function executeRedeem(input: RedeemInput): Promise<RedeemResult> {
  // Sweep lazy DB-side. Non bloquant (best-effort).
  try {
    await expireOldRedemptions(input.supabase, input.customer.id)
  } catch (err) {
    console.warn('[executeRedeem] expireOldRedemptions failed (non-blocking):', err)
  }

  const validation = validateRedemptionRequest({
    balanceCents: input.customer.loyaltyBalanceCents,
    cartSubtotalCents: input.cartSubtotalCents,
    requestedAmountCents: input.requestedAmountCents,
  })
  if (!validation.ok) {
    return {
      ok: false,
      kind: 'validation',
      reason: validation.reason,
      maxAllowedCents: validation.maxAllowedCents,
    }
  }

  try {
    const reservation = await reserveRedemption(input.supabase, {
      customerId: input.customer.id,
      customerHint: input.customer.phone,
      amountCents: validation.appliedCents,
      cartSubtotalCents: input.cartSubtotalCents,
    })
    return {
      ok: true,
      redemption: {
        discountCode: reservation.discountCode,
        amountCents: reservation.amountCents,
        expiresAt: reservation.expiresAt,
      },
    }
  } catch (err) {
    return {
      ok: false,
      kind: 'reserve',
      detail: err instanceof Error ? err.message : 'unknown',
    }
  }
}
```

- [ ] **Step 4 : Run the test, verify pass**

Run: `npx vitest run src/lib/loyalty/redeem-online-core.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5 : Commit**

```bash
git add src/lib/loyalty/redeem-online-core.ts src/lib/loyalty/redeem-online-core.test.ts
git commit -m "refactor(loyalty): extract redeem-online-core orchestration helper

Orchestration sweep+validate+reserve extraite de /api/loyalty/redeem-online
pour etre partagee avec /api/loyalty/me/redeem-online (L4). Resultat type
discriminated union {ok:true | validation | reserve}. 4 tests vitest avec
mocks de redemption.ts.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 2 : Refactor routes L3 (Tasks 4-5)

### Task 4 : Refactor route `/api/loyalty/preview` en wrapper + auth staff/M2M + rate limit

**Files:**
- Modify: `src/app/api/loyalty/preview/route.ts` (rewrite complet)

- [ ] **Step 1 : Rewrite the route**

`src/app/api/loyalty/preview/route.ts` (remplace tout le fichier) :

```typescript
/**
 * POST /api/loyalty/preview
 *
 * SECURITY (Sprint L4) :
 *   - PRIORITAIRE : session staff Supabase Auth (cookies).
 *   - FALLBACK M2M : header X-Staff-Token = LOYALTY_STAFF_SECRET.
 *   - Plus jamais d'acces public anonyme (clients web passent par /me/preview).
 *
 * Rate limit Upstash (defense en profondeur) : 30 req/min/IP.
 *
 * Body : { phone: E.164, cartSubtotalCents: integer >= 0 }
 * Reponse : { balanceCents, maxRedeemableCents, eligible, reason?, config }
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'node:crypto'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { getStaffFromRequest, type StaffContext } from '@/lib/loyalty/staff-session'
import { normalizeToE164 } from '@/lib/loyalty/phone'
import { buildPreview } from '@/lib/loyalty/preview-core'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ─── Rate limiter Upstash : 30 req/min par IP ───
let rateLimiter: { limit: (key: string) => Promise<{ success: boolean; remaining: number }> } | null = null
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  !process.env.UPSTASH_REDIS_REST_URL.includes('xxx')
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Ratelimit } = require('@upstash/ratelimit')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require('@upstash/redis')
  rateLimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
    prefix: 'ratelimit:loyalty:preview',
  })
}

const BodySchema = z.object({
  phone: z.string().min(5).max(32),
  cartSubtotalCents: z.number().int().min(0),
})

function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ba.length !== bb.length) return false
  try {
    return crypto.timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

type AuthResult =
  | { kind: 'staff_session'; staff: StaffContext }
  | { kind: 'm2m_secret' }
  | { kind: 'unauthorized' }

async function authenticate(req: NextRequest): Promise<AuthResult> {
  const staff = await getStaffFromRequest()
  if (staff) return { kind: 'staff_session', staff }

  const expectedSecret = process.env.LOYALTY_STAFF_SECRET
  if (expectedSecret) {
    const provided = req.headers.get('x-staff-token') ?? ''
    if (provided && timingSafeEqualStr(provided, expectedSecret)) {
      return { kind: 'm2m_secret' }
    }
  }
  return { kind: 'unauthorized' }
}

export async function POST(req: NextRequest) {
  // ─── Auth obligatoire (staff session OU secret M2M) ───
  const auth = await authenticate(req)
  if (auth.kind === 'unauthorized') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (auth.kind === 'm2m_secret') {
    console.warn('[preview] AUDIT M2M : appel via X-Staff-Token (staff_user_id=null)')
  }

  // ─── Rate limit (defense en profondeur, meme en mode auth) ───
  if (rateLimiter) {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      '127.0.0.1'
    const { success, remaining } = await rateLimiter.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: 'rate_limited', detail: 'Trop de demandes.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }
  }

  // ─── Parse body ───
  let parsed: z.infer<typeof BodySchema>
  try {
    const body = await req.json()
    parsed = BodySchema.parse(body)
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: err instanceof Error ? err.message : 'parse error' },
      { status: 400 }
    )
  }

  const e164 = normalizeToE164(parsed.phone)
  if (!e164) {
    return NextResponse.json({ error: 'invalid_phone' }, { status: 400 })
  }

  // ─── Lookup customer + delegue a buildPreview ───
  const supabase = getLoyaltyAdminClient()
  const { data: customer, error } = await supabase
    .from('loyalty_customers')
    .select('id, loyalty_balance_cents')
    .eq('phone', e164)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'lookup_failed', detail: error.message }, { status: 500 })
  }

  if (!customer) {
    // Phone inconnu : reponse "vide" mais 200 (le widget caisse affichera juste "Pas de cagnotte")
    return NextResponse.json({
      balanceCents: 0,
      maxRedeemableCents: 0,
      eligible: false,
      reason: 'customer_not_found',
      config: { minBalanceCents: 2000, cartCapRatio: 0.5 },
    })
  }

  const preview = buildPreview({
    customer: { id: customer.id, loyaltyBalanceCents: customer.loyalty_balance_cents },
    cartSubtotalCents: parsed.cartSubtotalCents,
  })
  return NextResponse.json(preview)
}
```

- [ ] **Step 2 : Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (no type errors).

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/loyalty/preview/route.ts
git commit -m "refactor(loyalty): preview L3 en wrapper + auth staff/M2M + rate limit

L4 fermeture surface :
- Plus d'acces public anonyme (l'audit grep a confirme zero consumer
  externe sur cette route avant L4).
- Auth cascade : session staff (priorite) OU X-Staff-Token (M2M, log
  d'audit warn).
- Rate limit Upstash 30 req/min/IP (defense en profondeur).
- Logique metier delegue a buildPreview (preview-core.ts). Route
  devient un wrapper mince (parse body Zod -> lookup customer ->
  buildPreview -> NextResponse).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 5 : Refactor route `/api/loyalty/redeem-online` en wrapper + auth staff/M2M

**Files:**
- Modify: `src/app/api/loyalty/redeem-online/route.ts` (rewrite complet)

- [ ] **Step 1 : Rewrite the route**

`src/app/api/loyalty/redeem-online/route.ts` :

```typescript
/**
 * POST /api/loyalty/redeem-online
 *
 * SECURITY (L4) : meme pattern que /api/loyalty/preview.
 *   - Staff session OU X-Staff-Token (M2M).
 *   - Plus d'acces public anonyme.
 *
 * Body : { phone: E.164, cartSubtotalCents, requestedAmountCents }
 * Reponse : { ok, redemption: { discountCode, amountCents, expiresAt } }
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'node:crypto'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { getStaffFromRequest, type StaffContext } from '@/lib/loyalty/staff-session'
import { normalizeToE164 } from '@/lib/loyalty/phone'
import { executeRedeem } from '@/lib/loyalty/redeem-online-core'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BodySchema = z.object({
  phone: z.string().min(5).max(32),
  cartSubtotalCents: z.number().int().min(1),
  requestedAmountCents: z.number().int().min(1),
})

function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ba.length !== bb.length) return false
  try {
    return crypto.timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

type AuthResult =
  | { kind: 'staff_session'; staff: StaffContext }
  | { kind: 'm2m_secret' }
  | { kind: 'unauthorized' }

async function authenticate(req: NextRequest): Promise<AuthResult> {
  const staff = await getStaffFromRequest()
  if (staff) return { kind: 'staff_session', staff }
  const expectedSecret = process.env.LOYALTY_STAFF_SECRET
  if (expectedSecret) {
    const provided = req.headers.get('x-staff-token') ?? ''
    if (provided && timingSafeEqualStr(provided, expectedSecret)) {
      return { kind: 'm2m_secret' }
    }
  }
  return { kind: 'unauthorized' }
}

export async function POST(req: NextRequest) {
  const auth = await authenticate(req)
  if (auth.kind === 'unauthorized') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (auth.kind === 'm2m_secret') {
    console.warn('[redeem-online] AUDIT M2M : appel via X-Staff-Token')
  }

  let parsed: z.infer<typeof BodySchema>
  try {
    const body = await req.json()
    parsed = BodySchema.parse(body)
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: err instanceof Error ? err.message : 'parse error' },
      { status: 400 }
    )
  }

  const e164 = normalizeToE164(parsed.phone)
  if (!e164) {
    return NextResponse.json({ error: 'invalid_phone' }, { status: 400 })
  }

  const supabase = getLoyaltyAdminClient()
  const { data: customer, error: lookupErr } = await supabase
    .from('loyalty_customers')
    .select('id, phone, loyalty_balance_cents')
    .eq('phone', e164)
    .maybeSingle()

  if (lookupErr) {
    return NextResponse.json(
      { error: 'lookup_failed', detail: lookupErr.message },
      { status: 500 }
    )
  }
  if (!customer) {
    return NextResponse.json({ error: 'customer_not_found' }, { status: 404 })
  }

  const result = await executeRedeem({
    supabase,
    customer: {
      id: customer.id,
      phone: customer.phone,
      loyaltyBalanceCents: customer.loyalty_balance_cents,
    },
    cartSubtotalCents: parsed.cartSubtotalCents,
    requestedAmountCents: parsed.requestedAmountCents,
  })

  if (!result.ok) {
    if (result.kind === 'validation') {
      return NextResponse.json(
        {
          error: 'validation_failed',
          reason: result.reason,
          maxAllowedCents: result.maxAllowedCents,
        },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'reserve_failed', detail: result.detail }, { status: 500 })
  }

  return NextResponse.json({ ok: true, redemption: result.redemption })
}
```

- [ ] **Step 2 : Run typecheck + tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: PASS, 0 régression (tous les tests TS existants doivent passer car la logique est inchangée, seules les routes ont changé de structure).

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/loyalty/redeem-online/route.ts
git commit -m "refactor(loyalty): redeem-online L3 en wrapper + auth staff/M2M

Meme pattern que preview/route.ts. Logique deleguee a executeRedeem
(redeem-online-core.ts). Plus d'acces public anonyme.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 3 : Helper de résolution session (Task 6)

### Task 6 : Helper `resolveLoyaltyForSession`

**Files:**
- Create: `src/lib/loyalty/session.ts`
- Test: `src/lib/loyalty/session.test.ts`

- [ ] **Step 1 : Write the failing test**

`src/lib/loyalty/session.test.ts` :

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mocks
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))
vi.mock('@/lib/shopify/customer-server', () => ({
  getCustomer: vi.fn(),
}))
vi.mock('./supabase-admin', () => ({
  getLoyaltyAdminClient: vi.fn(),
}))

import { cookies } from 'next/headers'
import { getCustomer } from '@/lib/shopify/customer-server'
import { getLoyaltyAdminClient } from './supabase-admin'
import { resolveLoyaltyForSession } from './session'

const TOKEN_COOKIE = 'body-start-customer-token'

function mockCookies(value: string | undefined) {
  vi.mocked(cookies).mockReturnValue({
    get: (name: string) => (name === TOKEN_COOKIE && value ? { value } : undefined),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)
}

function mockSupabaseChain(returns: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(returns)
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockReturnValue({ eq })
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
  const from = vi.fn().mockReturnValue({ select, update })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(getLoyaltyAdminClient).mockReturnValue({ from } as any)
  return { from, select, eq, maybeSingle, update }
}

describe('resolveLoyaltyForSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logged_out : pas de cookie', async () => {
    mockCookies(undefined)
    const result = await resolveLoyaltyForSession()
    expect(result.state).toBe('logged_out')
  })

  it('logged_out : token Shopify invalide (getCustomer renvoie null)', async () => {
    mockCookies('expired-token')
    vi.mocked(getCustomer).mockResolvedValue(null)
    const result = await resolveLoyaltyForSession()
    expect(result.state).toBe('logged_out')
  })

  it('enrolled : match par shopify_customer_id', async () => {
    mockCookies('valid-token')
    vi.mocked(getCustomer).mockResolvedValue({
      id: 'gid://shopify/Customer/123',
      email: 'a@b.fr',
      firstName: 'Adam',
      lastName: 'L',
      phone: null,
      createdAt: '2026-01-01',
      defaultAddress: null,
      addresses: { nodes: [] },
      orders: { nodes: [] },
    })
    mockSupabaseChain({
      data: {
        id: 'loy-1',
        phone: '+33611111111',
        email: 'a@b.fr',
        first_name: 'Adam',
        shopify_customer_id: 'gid://shopify/Customer/123',
        referral_code: 'BS-XXXX1',
        loyalty_balance_cents: 1500,
        has_first_purchase: true,
        referral_commission_until: '2027-01-01',
      },
      error: null,
    })

    const result = await resolveLoyaltyForSession()
    expect(result.state).toBe('enrolled')
    if (result.state === 'enrolled') {
      expect(result.customer.id).toBe('loy-1')
      expect(result.customer.loyaltyBalanceCents).toBe(1500)
    }
  })

  it('not_enrolled : pas trouve par shopify_id ni par email', async () => {
    mockCookies('valid-token')
    vi.mocked(getCustomer).mockResolvedValue({
      id: 'gid://shopify/Customer/999',
      email: 'new@user.fr',
      firstName: 'Nouvel',
      lastName: '',
      phone: null,
      createdAt: '2026-01-01',
      defaultAddress: null,
      addresses: { nodes: [] },
      orders: { nodes: [] },
    })
    // 2 lookups successifs renvoient null
    const maybeSingle = vi.fn()
      .mockResolvedValueOnce({ data: null, error: null }) // shopify_id
      .mockResolvedValueOnce({ data: null, error: null }) // email
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getLoyaltyAdminClient).mockReturnValue({ from } as any)

    const result = await resolveLoyaltyForSession()
    expect(result.state).toBe('not_enrolled')
    if (result.state === 'not_enrolled') {
      expect(result.shopify.email).toBe('new@user.fr')
    }
  })

  it('enrolled + auto-upgrade : trouve par email sans shopify_customer_id, on update', async () => {
    mockCookies('valid-token')
    vi.mocked(getCustomer).mockResolvedValue({
      id: 'gid://shopify/Customer/555',
      email: 'boutique@client.fr',
      firstName: 'Old',
      lastName: '',
      phone: null,
      createdAt: '2026-01-01',
      defaultAddress: null,
      addresses: { nodes: [] },
      orders: { nodes: [] },
    })
    const updateEq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq: updateEq })
    const maybeSingle = vi.fn()
      .mockResolvedValueOnce({ data: null, error: null }) // shopify_id null
      .mockResolvedValueOnce({
        data: {
          id: 'loy-2',
          phone: '+33622222222',
          email: 'boutique@client.fr',
          first_name: 'Old',
          shopify_customer_id: null,
          referral_code: 'BS-XXXX2',
          loyalty_balance_cents: 500,
          has_first_purchase: false,
          referral_commission_until: null,
        },
        error: null,
      })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select, update })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getLoyaltyAdminClient).mockReturnValue({ from } as any)

    const result = await resolveLoyaltyForSession()
    expect(result.state).toBe('enrolled')
    if (result.state === 'enrolled') {
      expect(result.customer.id).toBe('loy-2')
    }
    expect(update).toHaveBeenCalledWith({ shopify_customer_id: 'gid://shopify/Customer/555' })
  })
})
```

- [ ] **Step 2 : Run the failing test**

Run: `npx vitest run src/lib/loyalty/session.test.ts`
Expected: FAIL with "Cannot find module './session'".

- [ ] **Step 3 : Write minimal implementation**

`src/lib/loyalty/session.ts` :

```typescript
/**
 * Resolution session Shopify -> loyalty_customer.
 *
 * Strategie 2 niveaux :
 *   1. Match prioritaire par shopify_customer_id.
 *   2. Fallback : match par email + auto-upgrade (UPDATE shopify_customer_id
 *      pour stabiliser le lien primary).
 *
 * Si rien trouve : { state: 'not_enrolled' } => le front affiche le bloc
 * d'enrolment (demander le telephone E.164).
 */
import { cookies } from 'next/headers'
import { getCustomer } from '@/lib/shopify/customer-server'
import { getLoyaltyAdminClient } from './supabase-admin'

const SHOPIFY_TOKEN_COOKIE = 'body-start-customer-token'

export interface ShopifyContext {
  id: string
  email: string
  firstName: string
}

export interface LoyaltyCustomerRow {
  id: string
  phone: string
  email: string | null
  firstName: string
  referralCode: string
  loyaltyBalanceCents: number
  hasFirstPurchase: boolean
  referralCommissionUntil: string | null
  shopifyCustomerId: string | null
}

export type ResolveResult =
  | { state: 'logged_out' }
  | { state: 'not_enrolled'; shopify: ShopifyContext }
  | { state: 'enrolled'; shopify: ShopifyContext; customer: LoyaltyCustomerRow }

function rowToCustomer(row: {
  id: string
  phone: string
  email: string | null
  first_name: string
  referral_code: string
  loyalty_balance_cents: number
  has_first_purchase: boolean
  referral_commission_until: string | null
  shopify_customer_id: string | null
}): LoyaltyCustomerRow {
  return {
    id: row.id,
    phone: row.phone,
    email: row.email,
    firstName: row.first_name,
    referralCode: row.referral_code,
    loyaltyBalanceCents: row.loyalty_balance_cents,
    hasFirstPurchase: row.has_first_purchase,
    referralCommissionUntil: row.referral_commission_until,
    shopifyCustomerId: row.shopify_customer_id,
  }
}

export async function resolveLoyaltyForSession(): Promise<ResolveResult> {
  // 1. Lit le cookie Shopify
  const cookieStore = cookies()
  const tokenCookie = cookieStore.get(SHOPIFY_TOKEN_COOKIE)
  if (!tokenCookie?.value) {
    return { state: 'logged_out' }
  }

  // 2. Resout le customer Shopify
  const shopifyCustomer = await getCustomer(tokenCookie.value)
  if (!shopifyCustomer) {
    return { state: 'logged_out' }
  }

  const shopify: ShopifyContext = {
    id: shopifyCustomer.id,
    email: shopifyCustomer.email,
    firstName: shopifyCustomer.firstName,
  }

  const admin = getLoyaltyAdminClient()
  const SELECT = 'id, phone, email, first_name, referral_code, loyalty_balance_cents, has_first_purchase, referral_commission_until, shopify_customer_id'

  // 3. Lookup prioritaire par shopify_customer_id
  const byShopifyId = await admin
    .from('loyalty_customers')
    .select(SELECT)
    .eq('shopify_customer_id', shopify.id)
    .maybeSingle()

  if (byShopifyId.data) {
    return { state: 'enrolled', shopify, customer: rowToCustomer(byShopifyId.data) }
  }

  // 4. Fallback : lookup par email
  if (!shopify.email) {
    return { state: 'not_enrolled', shopify }
  }
  const byEmail = await admin
    .from('loyalty_customers')
    .select(SELECT)
    .eq('email', shopify.email)
    .maybeSingle()

  if (!byEmail.data) {
    return { state: 'not_enrolled', shopify }
  }

  // 5. Auto-upgrade : on lie shopify_customer_id pour stabiliser
  if (!byEmail.data.shopify_customer_id) {
    try {
      await admin
        .from('loyalty_customers')
        .update({ shopify_customer_id: shopify.id })
        .eq('id', byEmail.data.id)
    } catch (err) {
      // Conflit UNIQUE possible (cas marginal : 2 comptes Shopify pour 1 phone loyalty)
      // On laisse le client garder son ancien lien, on log juste.
      console.warn('[resolveLoyaltyForSession] auto-upgrade failed (non-blocking):', err)
    }
  }

  return { state: 'enrolled', shopify, customer: rowToCustomer(byEmail.data) }
}
```

- [ ] **Step 4 : Run the test, verify pass**

Run: `npx vitest run src/lib/loyalty/session.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5 : Commit**

```bash
git add src/lib/loyalty/session.ts src/lib/loyalty/session.test.ts
git commit -m "feat(loyalty): resolveLoyaltyForSession (cookie Shopify -> loyalty_customer)

Helper serveur 2 niveaux + auto-upgrade :
- Match shopify_customer_id prioritaire
- Fallback email + auto-update du shopify_customer_id pour stabiliser
- 5 tests vitest (logged_out, enrolled match shopify_id, enrolled match
  email + upgrade, not_enrolled, token Shopify invalide)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 4 : Routes session-based `/me/*` (Tasks 7-10)

### Task 7 : Route `GET /api/loyalty/me`

**Files:**
- Create: `src/app/api/loyalty/me/route.ts`

- [ ] **Step 1 : Write the route**

`src/app/api/loyalty/me/route.ts` :

```typescript
/**
 * GET /api/loyalty/me
 *
 * Renvoie l'etat loyalty du client Shopify connecte :
 *   - logged_out (401)
 *   - not_enrolled : pas encore de loyalty_customer (200)
 *   - enrolled : customer + 20 dernieres transactions + totaux (200)
 *
 * Pas de body. Auth via cookie body-start-customer-token (Shopify).
 */
import { NextResponse } from 'next/server'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { resolveLoyaltyForSession } from '@/lib/loyalty/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const session = await resolveLoyaltyForSession()

  if (session.state === 'logged_out') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (session.state === 'not_enrolled') {
    return NextResponse.json({
      state: 'not_enrolled',
      shopify: { email: session.shopify.email, firstName: session.shopify.firstName },
    })
  }

  // enrolled : fetch transactions + totaux
  const admin = getLoyaltyAdminClient()
  const customerId = session.customer.id

  const [txQuery, totalsQuery] = await Promise.all([
    admin
      .from('loyalty_transactions')
      .select(`
        id, type, amount_cents, balance_after_cents, channel,
        shopify_order_id, related_customer_id, created_at
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(20),
    admin
      .from('loyalty_transactions')
      .select('type, amount_cents')
      .eq('customer_id', customerId),
  ])

  if (txQuery.error || totalsQuery.error) {
    return NextResponse.json(
      { error: 'fetch_failed', detail: txQuery.error?.message ?? totalsQuery.error?.message },
      { status: 500 }
    )
  }

  // Resolution prenoms des filleuls (pour referral_commission)
  const relatedIds = Array.from(
    new Set(
      (txQuery.data ?? [])
        .map((t) => t.related_customer_id)
        .filter((id): id is string => id !== null)
    )
  )
  let relatedNames: Record<string, string> = {}
  if (relatedIds.length > 0) {
    const { data: related } = await admin
      .from('loyalty_customers')
      .select('id, first_name')
      .in('id', relatedIds)
    relatedNames = Object.fromEntries((related ?? []).map((r) => [r.id, r.first_name]))
  }

  const recentTransactions = (txQuery.data ?? []).map((t) => ({
    id: t.id,
    type: t.type,
    amountCents: t.amount_cents,
    balanceAfterCents: t.balance_after_cents,
    channel: t.channel,
    shopifyOrderId: t.shopify_order_id,
    relatedCustomerFirstName: t.related_customer_id ? relatedNames[t.related_customer_id] ?? null : null,
    createdAt: t.created_at,
  }))

  const earnedCents = (totalsQuery.data ?? [])
    .filter((t) => t.type === 'referral_commission' || t.type === 'import_credit' || t.type === 'adjustment')
    .reduce((s, t) => s + (t.amount_cents > 0 ? t.amount_cents : 0), 0)
  const spentCents = (totalsQuery.data ?? [])
    .filter((t) => t.type === 'spend')
    .reduce((s, t) => s + t.amount_cents, 0)

  return NextResponse.json({
    state: 'enrolled',
    customer: {
      id: session.customer.id,
      firstName: session.customer.firstName,
      referralCode: session.customer.referralCode,
      loyaltyBalanceCents: session.customer.loyaltyBalanceCents,
      hasFirstPurchase: session.customer.hasFirstPurchase,
      referralCommissionUntil: session.customer.referralCommissionUntil,
    },
    recentTransactions,
    totals: { earnedCents, spentCents },
  })
}
```

- [ ] **Step 2 : Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/loyalty/me/route.ts
git commit -m "feat(loyalty): GET /api/loyalty/me route session-based

Renvoie l'etat loyalty du client Shopify connecte (logged_out 401,
not_enrolled 200, enrolled 200 avec customer + 20 dernieres transactions
+ totaux earned/spent). Resolution des prenoms filleuls pour les
transactions referral_commission.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 8 : Route `POST /api/loyalty/me/enroll`

**Files:**
- Create: `src/app/api/loyalty/me/enroll/route.ts`

- [ ] **Step 1 : Write the route**

`src/app/api/loyalty/me/enroll/route.ts` :

```typescript
/**
 * POST /api/loyalty/me/enroll
 *
 * Inscrit un client Shopify connecte au programme loyalty.
 * Auth via cookie body-start-customer-token.
 *
 * Body : { phone: string (E.164 ou format francais normalisable) }
 * Reponse 200 : { ok, customer: { id, referralCode, loyaltyBalanceCents } }
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { resolveLoyaltyForSession } from '@/lib/loyalty/session'
import { normalizeToE164 } from '@/lib/loyalty/phone'
import { upsertLoyaltyCustomer } from '@/lib/loyalty/upsert-customer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ─── Rate limiter Upstash : reutilise le prefix d'upsert ───
let rateLimiter: { limit: (key: string) => Promise<{ success: boolean; remaining: number }> } | null = null
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  !process.env.UPSTASH_REDIS_REST_URL.includes('xxx')
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Ratelimit } = require('@upstash/ratelimit')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require('@upstash/redis')
  rateLimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '10 m'),
    analytics: true,
    prefix: 'ratelimit:loyalty:me:enroll',
  })
}

const BodySchema = z.object({
  phone: z.string().min(5).max(32),
})

export async function POST(req: NextRequest) {
  const session = await resolveLoyaltyForSession()
  if (session.state === 'logged_out') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (session.state === 'enrolled') {
    return NextResponse.json({ error: 'already_enrolled' }, { status: 409 })
  }

  // Rate limit IP (anti-spam)
  if (rateLimiter) {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      '127.0.0.1'
    const { success, remaining } = await rateLimiter.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: 'rate_limited' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }
  }

  let parsed: z.infer<typeof BodySchema>
  try {
    const body = await req.json()
    parsed = BodySchema.parse(body)
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: err instanceof Error ? err.message : 'parse error' },
      { status: 400 }
    )
  }

  const e164 = normalizeToE164(parsed.phone)
  if (!e164) {
    return NextResponse.json({ error: 'invalid_phone' }, { status: 400 })
  }

  try {
    const admin = getLoyaltyAdminClient()
    const result = await upsertLoyaltyCustomer(admin, {
      phone: e164,
      firstName: session.shopify.firstName,
      email: session.shopify.email,
      shopifyCustomerId: session.shopify.id,
      source: 'online',
    })

    return NextResponse.json({
      ok: true,
      customer: {
        id: result.id,
        referralCode: result.referralCode,
        loyaltyBalanceCents: result.loyaltyBalanceCents,
      },
    })
  } catch (err) {
    console.error('[me/enroll] error:', err)
    return NextResponse.json(
      { error: 'enroll_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2 : Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/loyalty/me/enroll/route.ts
git commit -m "feat(loyalty): POST /api/loyalty/me/enroll route enrolment session

Inscrit un client Shopify connecte. Reutilise upsertLoyaltyCustomer
(L2) avec email + shopifyCustomerId de la session. 409 si deja
enrole. Rate limit 5 req/10min/IP.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 9 : Route `POST /api/loyalty/me/preview`

**Files:**
- Create: `src/app/api/loyalty/me/preview/route.ts`

- [ ] **Step 1 : Write the route**

`src/app/api/loyalty/me/preview/route.ts` :

```typescript
/**
 * POST /api/loyalty/me/preview
 *
 * Preview cagnotte pour le client Shopify connecte.
 * Auth via cookie body-start-customer-token.
 *
 * Body : { cartSubtotalCents: integer >= 0 }
 * Reponse : voir PreviewOutput de preview-core.ts
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { resolveLoyaltyForSession } from '@/lib/loyalty/session'
import { buildPreview } from '@/lib/loyalty/preview-core'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BodySchema = z.object({
  cartSubtotalCents: z.number().int().min(0),
})

export async function POST(req: Request) {
  const session = await resolveLoyaltyForSession()
  if (session.state === 'logged_out') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (session.state === 'not_enrolled') {
    return NextResponse.json({ error: 'not_enrolled' }, { status: 403 })
  }

  let parsed: z.infer<typeof BodySchema>
  try {
    const body = await req.json()
    parsed = BodySchema.parse(body)
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: err instanceof Error ? err.message : 'parse error' },
      { status: 400 }
    )
  }

  const preview = buildPreview({
    customer: {
      id: session.customer.id,
      loyaltyBalanceCents: session.customer.loyaltyBalanceCents,
    },
    cartSubtotalCents: parsed.cartSubtotalCents,
  })

  return NextResponse.json(preview)
}
```

- [ ] **Step 2 : Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/loyalty/me/preview/route.ts
git commit -m "feat(loyalty): POST /api/loyalty/me/preview route session

Preview cagnotte session-based. Delegue a buildPreview (preview-core).
Aucun phone dans le body : tout vient de la session Shopify.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 10 : Route `POST /api/loyalty/me/redeem-online`

**Files:**
- Create: `src/app/api/loyalty/me/redeem-online/route.ts`

- [ ] **Step 1 : Write the route**

`src/app/api/loyalty/me/redeem-online/route.ts` :

```typescript
/**
 * POST /api/loyalty/me/redeem-online
 *
 * Reserve cagnotte pour le client Shopify connecte. Cree un code
 * Shopify (endsAt 1h) + insert loyalty_redemptions(reserved).
 *
 * Auth via cookie body-start-customer-token.
 *
 * Body : { cartSubtotalCents, requestedAmountCents }
 * Reponse 200 : { ok, redemption: { discountCode, amountCents, expiresAt } }
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { resolveLoyaltyForSession } from '@/lib/loyalty/session'
import { executeRedeem } from '@/lib/loyalty/redeem-online-core'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Rate limit 10 req/min/IP (chaque appel = 1 code Shopify cree, couteux)
let rateLimiter: { limit: (key: string) => Promise<{ success: boolean; remaining: number }> } | null = null
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  !process.env.UPSTASH_REDIS_REST_URL.includes('xxx')
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Ratelimit } = require('@upstash/ratelimit')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require('@upstash/redis')
  rateLimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit:loyalty:me:redeem',
  })
}

const BodySchema = z.object({
  cartSubtotalCents: z.number().int().min(1),
  requestedAmountCents: z.number().int().min(1),
})

export async function POST(req: NextRequest) {
  const session = await resolveLoyaltyForSession()
  if (session.state === 'logged_out') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (session.state === 'not_enrolled') {
    return NextResponse.json({ error: 'not_enrolled' }, { status: 403 })
  }

  if (rateLimiter) {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      '127.0.0.1'
    const { success, remaining } = await rateLimiter.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: 'rate_limited' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }
  }

  let parsed: z.infer<typeof BodySchema>
  try {
    const body = await req.json()
    parsed = BodySchema.parse(body)
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: err instanceof Error ? err.message : 'parse error' },
      { status: 400 }
    )
  }

  const supabase = getLoyaltyAdminClient()
  const result = await executeRedeem({
    supabase,
    customer: {
      id: session.customer.id,
      phone: session.customer.phone,
      loyaltyBalanceCents: session.customer.loyaltyBalanceCents,
    },
    cartSubtotalCents: parsed.cartSubtotalCents,
    requestedAmountCents: parsed.requestedAmountCents,
  })

  if (!result.ok) {
    if (result.kind === 'validation') {
      return NextResponse.json(
        {
          error: 'validation_failed',
          reason: result.reason,
          maxAllowedCents: result.maxAllowedCents,
        },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'reserve_failed', detail: result.detail }, { status: 500 })
  }

  return NextResponse.json({ ok: true, redemption: result.redemption })
}
```

- [ ] **Step 2 : Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/loyalty/me/redeem-online/route.ts
git commit -m "feat(loyalty): POST /api/loyalty/me/redeem-online route session

Reserve cagnotte session-based. Delegue a executeRedeem (redeem-online-core).
Rate limit 10 req/min/IP (chaque appel cree un code Shopify).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 5 : Hook + composants UI (Tasks 11-14)

### Task 11 : Hook `useLoyaltyMe`

**Files:**
- Create: `src/hooks/useLoyaltyMe.ts`

- [ ] **Step 1 : Write the hook**

`src/hooks/useLoyaltyMe.ts` :

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'

export type LoyaltyMeState =
  | { kind: 'loading' }
  | { kind: 'error'; error: string }
  | { kind: 'logged_out' }
  | { kind: 'not_enrolled'; shopify: { email: string; firstName: string } }
  | {
      kind: 'enrolled'
      customer: {
        id: string
        firstName: string
        referralCode: string
        loyaltyBalanceCents: number
        hasFirstPurchase: boolean
        referralCommissionUntil: string | null
      }
      recentTransactions: Array<{
        id: string
        type: 'referral_commission' | 'spend' | 'adjustment' | 'import_credit'
        amountCents: number
        balanceAfterCents: number
        channel: 'in_store' | 'online'
        shopifyOrderId: string | null
        relatedCustomerFirstName: string | null
        createdAt: string
      }>
      totals: { earnedCents: number; spentCents: number }
    }

interface UseLoyaltyMeReturn {
  state: LoyaltyMeState
  refresh: () => void
}

export function useLoyaltyMe(): UseLoyaltyMeReturn {
  const [state, setState] = useState<LoyaltyMeState>({ kind: 'loading' })
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setState({ kind: 'loading' })

    fetch('/api/loyalty/me', { cache: 'no-store', credentials: 'include' })
      .then(async (res) => {
        if (cancelled) return
        if (res.status === 401) {
          setState({ kind: 'logged_out' })
          return
        }
        const json = await res.json()
        if (!res.ok) {
          setState({ kind: 'error', error: json?.error ?? 'fetch_failed' })
          return
        }
        if (json.state === 'not_enrolled') {
          setState({ kind: 'not_enrolled', shopify: json.shopify })
        } else if (json.state === 'enrolled') {
          setState({
            kind: 'enrolled',
            customer: json.customer,
            recentTransactions: json.recentTransactions,
            totals: json.totals,
          })
        } else {
          setState({ kind: 'error', error: 'unknown_state' })
        }
      })
      .catch((err) => {
        if (cancelled) return
        setState({ kind: 'error', error: err instanceof Error ? err.message : 'network' })
      })

    return () => {
      cancelled = true
    }
  }, [refreshKey])

  return { state, refresh }
}
```

- [ ] **Step 2 : Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3 : Commit**

```bash
git add src/hooks/useLoyaltyMe.ts
git commit -m "feat(loyalty): hook useLoyaltyMe pour fetch /api/loyalty/me

Discriminated union state (loading | error | logged_out | not_enrolled |
enrolled). Refresh manuel via callback. Pas de re-fetch entre re-renders
(deps stables).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 12 : Composant `EnrollmentBlock`

**Files:**
- Create: `src/components/account/EnrollmentBlock.tsx`

- [ ] **Step 1 : Write the component**

`src/components/account/EnrollmentBlock.tsx` :

```typescript
'use client'

import { useState } from 'react'
import { Loader2, Phone } from 'lucide-react'
import toast from 'react-hot-toast'

interface EnrollmentBlockProps {
  onEnrolled: () => void
}

export function EnrollmentBlock({ onEnrolled }: EnrollmentBlockProps) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/loyalty/me/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (res.status === 429) {
          setError('Trop d\'essais. Réessaye dans quelques minutes.')
        } else if (json.error === 'invalid_phone') {
          setError('Numéro invalide. Vérifie le format.')
        } else {
          setError(json.detail ?? 'Erreur. Réessaye dans un instant.')
        }
        return
      }
      toast.success('Programme activé !')
      onEnrolled()
    } catch {
      setError('Problème réseau. Réessaye.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-8 md:p-10 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-[#1a2e23]/5 flex items-center justify-center mb-6">
        <Phone className="w-6 h-6 text-[#1a2e23]" />
      </div>

      <h2 className="font-display text-[28px] font-black uppercase tracking-tighter text-[#1a2e23] leading-none mb-3">
        Rejoins le programme
      </h2>

      <p className="text-[#4a5f4c] text-sm font-medium mb-6 max-w-md">
        Pour gagner et utiliser ta cagnotte, on a juste besoin de ton numéro
        de téléphone. C&apos;est ta carte de fidélité, donc pas de carte
        physique à trimballer.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1a2e23] mb-2">
            Téléphone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+33 6 12 34 56 78"
            required
            className="w-full px-5 py-3.5 rounded-2xl border border-[#1a2e23]/10 text-sm font-medium text-[#1a2e23] bg-[#f4f6f1] focus:outline-none focus:ring-2 focus:ring-[#1a2e23]/10 focus:border-[#1a2e23]/30 placeholder:text-[#89a890]"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-2xl px-5 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || phone.trim().length < 5}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#1a2e23] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#2e4f3c] transition-all shadow-lg disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Activer mon programme
        </button>
      </form>

      <p className="text-[12px] text-[#89a890] font-medium mt-6 max-w-md">
        Ton numéro reste chez nous, on ne le partage pas. Il sert aussi à
        te reconnaître quand tu passes en boutique.
      </p>
    </div>
  )
}
```

- [ ] **Step 2 : Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3 : Commit**

```bash
git add src/components/account/EnrollmentBlock.tsx
git commit -m "feat(loyalty): EnrollmentBlock composant inscription programme

Form telephone E.164 -> POST /api/loyalty/me/enroll. Gestion erreur
(invalid_phone / rate_limited / network). Callback onEnrolled pour
refresh useLoyaltyMe parent. Copy validee par Adam (voix on/nous,
tutoiement, zero tiret cadratin).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 13 : Composant `CagnottePanel`

**Files:**
- Create: `src/components/account/CagnottePanel.tsx`

- [ ] **Step 1 : Write the component**

`src/components/account/CagnottePanel.tsx` :

```typescript
'use client'

import Link from 'next/link'
import { Wallet, TrendingUp, ArrowDownCircle, Loader2 } from 'lucide-react'
import { useLoyaltyMe } from '@/hooks/useLoyaltyMe'
import { EnrollmentBlock } from './EnrollmentBlock'

function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function transactionLabel(tx: {
  type: string
  channel: string
  shopifyOrderId: string | null
  relatedCustomerFirstName: string | null
}): string {
  if (tx.type === 'referral_commission') {
    return tx.relatedCustomerFirstName
      ? `Commission parrainage de ${tx.relatedCustomerFirstName}`
      : 'Commission parrainage'
  }
  if (tx.type === 'spend') {
    return tx.shopifyOrderId
      ? `Utilisée sur commande #${tx.shopifyOrderId.split('/').pop()}`
      : 'Utilisée en boutique'
  }
  if (tx.type === 'adjustment') return 'Ajustement'
  if (tx.type === 'import_credit') return 'Crédit d\'accueil'
  return tx.type
}

export function CagnottePanel() {
  const { state, refresh } = useLoyaltyMe()

  if (state.kind === 'loading') {
    return (
      <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 py-20 text-center shadow-sm">
        <Loader2 className="w-8 h-8 text-[#1a2e23] animate-spin mx-auto" />
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-700 text-sm">
        Impossible de charger ta cagnotte. Réessaye dans un instant.
      </div>
    )
  }

  if (state.kind === 'logged_out') {
    return (
      <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-8 text-center shadow-sm">
        <p className="text-[#4a5f4c] text-sm font-medium">
          Connecte-toi pour voir ta cagnotte.
        </p>
      </div>
    )
  }

  if (state.kind === 'not_enrolled') {
    return <EnrollmentBlock onEnrolled={refresh} />
  }

  const { customer, recentTransactions, totals } = state
  const isBelow = customer.loyaltyBalanceCents < 2000

  return (
    <div className="space-y-6">
      {/* ─── Header solde ─── */}
      <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-8 md:p-10 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#1a2e23]/5 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#1a2e23]" />
          </div>
          <h2 className="font-display text-[20px] font-black uppercase tracking-tight text-[#1a2e23] leading-none">
            Ma cagnotte
          </h2>
        </div>

        <p className="font-display text-[56px] md:text-[72px] font-black text-[#1a2e23] leading-none mb-3">
          {formatEuros(customer.loyaltyBalanceCents)}
        </p>

        <p className="text-[#4a5f4c] text-sm font-medium max-w-md">
          {isBelow
            ? 'Tu peux utiliser ta cagnotte dès qu\'elle atteint 20 €. En attendant, profites-en pour parrainer tes potes.'
            : 'Disponible sur ta prochaine commande, jusqu\'à 50 % du panier.'}
        </p>
      </div>

      {/* ─── Totaux ─── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-[20px] border border-[#1a2e23]/5 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[#89a890]" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c]">Total gagné</p>
          </div>
          <p className="font-display text-[24px] font-black text-[#1a2e23] leading-none">
            {formatEuros(totals.earnedCents)}
          </p>
          <p className="text-[12px] text-[#89a890] font-medium mt-1">depuis ton inscription</p>
        </div>
        <div className="bg-white rounded-[20px] border border-[#1a2e23]/5 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownCircle className="w-4 h-4 text-[#89a890]" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c]">Total utilisé</p>
          </div>
          <p className="font-display text-[24px] font-black text-[#1a2e23] leading-none">
            {formatEuros(totals.spentCents)}
          </p>
          <p className="text-[12px] text-[#89a890] font-medium mt-1">sur toutes tes commandes</p>
        </div>
      </div>

      {/* ─── Historique ─── */}
      <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 overflow-hidden shadow-sm">
        <div className="px-6 md:px-8 py-5 border-b border-[#1a2e23]/5">
          <h3 className="font-display font-black uppercase tracking-tight text-[#1a2e23] text-sm">
            Historique
          </h3>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="px-6 md:px-8 py-12 text-center">
            <p className="text-[#4a5f4c] text-sm font-medium mb-5">
              Ta cagnotte est encore vide. Pour commencer à gagner, partage ton code parrain.
            </p>
            <Link
              href="/account?tab=referral"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a2e23] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#2e4f3c] transition-all shadow-lg"
            >
              Voir mon code
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#1a2e23]/5">
            {recentTransactions.map((tx) => {
              const isPositive = tx.amountCents > 0 && tx.type !== 'spend'
              return (
                <div key={tx.id} className="px-6 md:px-8 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold text-sm text-[#1a2e23] truncate">
                      {transactionLabel(tx)}
                    </p>
                    <p className="text-[12px] text-[#89a890] font-medium mt-0.5">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-black text-sm ${isPositive ? 'text-[#1a2e23]' : 'text-[#89a890]'}`}>
                      {isPositive ? '+' : '-'}{formatEuros(Math.abs(tx.amountCents))}
                    </p>
                    <p className="text-[11px] text-[#89a890] font-medium mt-0.5">
                      Solde : {formatEuros(tx.balanceAfterCents)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3 : Commit**

```bash
git add src/components/account/CagnottePanel.tsx
git commit -m "feat(loyalty): CagnottePanel composant onglet cagnotte

Header solde XL + sous-titre conditionnel (< 20 € / >= 20 €) + totaux
gagne/utilise + historique 20 dernieres transactions. Affichage
EnrollmentBlock si pas enrole. Copy validee Adam (voix on/nous, zero
tiret cadratin).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 14 : Composant `ReferralPanel` (réécriture complète)

**Files:**
- Create: `src/components/account/ReferralPanel.tsx`

- [ ] **Step 1 : Write the component**

`src/components/account/ReferralPanel.tsx` :

```typescript
'use client'

import Link from 'next/link'
import { Gift, Users, Copy, MessageCircle, Share2, Loader2, Wallet } from 'lucide-react'
import { useLoyaltyMe } from '@/hooks/useLoyaltyMe'
import { EnrollmentBlock } from './EnrollmentBlock'
import { getSiteUrl, getSiteDomain } from '@/lib/site-url'
import toast from 'react-hot-toast'

function buildWhatsAppText(referralCode: string): string {
  const domain = getSiteDomain() || 'notre site'
  const url = getSiteUrl()
  return `Salut ! Je commande mes compléments sur ${domain}. T'as 5 € de remise sur ta première commande avec mon code ${referralCode} (à partir de 40 € d'achat).${url ? ' Lien direct : ' + url : ''}`
}

export function ReferralPanel() {
  const { state, refresh } = useLoyaltyMe()

  if (state.kind === 'loading') {
    return (
      <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 py-20 text-center shadow-sm">
        <Loader2 className="w-8 h-8 text-[#1a2e23] animate-spin mx-auto" />
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-700 text-sm">
        Impossible de charger ton parrainage. Réessaye dans un instant.
      </div>
    )
  }

  if (state.kind === 'logged_out') {
    return (
      <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-8 text-center shadow-sm">
        <p className="text-[#4a5f4c] text-sm font-medium">
          Connecte-toi pour voir ton code parrain.
        </p>
      </div>
    )
  }

  if (state.kind === 'not_enrolled') {
    return <EnrollmentBlock onEnrolled={refresh} />
  }

  const { customer } = state
  const referralCode = customer.referralCode
  const whatsappText = buildWhatsAppText(referralCode)
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralCode)
      toast.success('Code copié !')
    } catch {
      toast.error('Copie impossible')
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BodyStart',
          text: whatsappText,
        })
      } catch {
        // share annule par l'utilisateur, on ne notifie pas
      }
    } else {
      await handleCopy()
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div>
        <h2 className="font-display text-[28px] font-black uppercase tracking-tighter text-[#1a2e23] leading-none mb-2">
          Parrainage
        </h2>
        <p className="text-[#4a5f4c] font-medium text-sm">
          Partage ton code, gagne 5 % à vie sur les achats de tes potes pendant 12 mois.
        </p>
      </div>

      {/* ─── Carte code ─── */}
      <div className="bg-[#1a2e23] text-white rounded-[28px] p-8 md:p-10 relative overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(#4a5f4c 1px, transparent 1px), linear-gradient(90deg, #4a5f4c 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <p className="font-display font-black uppercase tracking-tight">Ton code parrain</p>
              <p className="text-white/50 text-sm font-medium">Partage-le avec tes potes</p>
            </div>
          </div>

          <code className="block w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 font-mono font-bold text-xl tracking-widest text-center mb-4">
            {referralCode}
          </code>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 px-3 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-colors text-[11px] font-bold uppercase tracking-widest"
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">Copier</span>
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-colors text-[11px] font-bold uppercase tracking-widest"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-3 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-colors text-[11px] font-bold uppercase tracking-widest"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Partager</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Comment ca marche (compact) ─── */}
      <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-8 shadow-sm">
        <h3 className="font-display font-black uppercase tracking-tight text-[#1a2e23] mb-6 flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-[#89a890]" /> Comment ça marche
        </h3>
        <div className="space-y-5">
          {[
            { step: '01', title: 'Tu partages ton code à un pote', desc: 'Par DM, WhatsApp, SMS, comme tu veux.' },
            { step: '02', title: 'Il le rentre au panier', desc: 'Sur sa 1ʳᵉ commande, à partir de 40 € d\'achat. Il a 5 € de remise.' },
            { step: '03', title: 'Tu gagnes 5 % pendant 1 an', desc: 'On te crédite 5 % du montant de chacune de ses commandes.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4">
              <div className="w-10 h-10 bg-[#1a2e23] text-white rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0">
                {step}
              </div>
              <div className="pt-1.5">
                <p className="font-display font-bold text-[#1a2e23] text-sm uppercase tracking-tight">{title}</p>
                <p className="text-[#4a5f4c] text-sm font-medium">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Lien cagnotte ─── */}
      <div className="bg-[#1a2e23]/5 rounded-[20px] p-6 flex items-center justify-between gap-4">
        <p className="text-[#1a2e23] font-display font-bold text-sm uppercase tracking-tight">
          Voir ce que tu as déjà gagné
        </p>
        <Link
          href="/account?tab=cagnotte"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a2e23] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#2e4f3c] transition-all"
        >
          <Wallet className="w-4 h-4" /> Ma cagnotte
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3 : Commit**

```bash
git add src/components/account/ReferralPanel.tsx
git commit -m "feat(loyalty): ReferralPanel reecrit avec vraies donnees loyalty

Plus de generation cote client (useMemo mensonger supprime). Fetch
via useLoyaltyMe -> vraie data /api/loyalty/me. Carte code BS-XXXXX
+ boutons Copier / WhatsApp / Partager (navigator.share fallback
clipboard). Message WhatsApp pre-rempli utilise getSiteUrl()/Domain()
(pas d'URL en dur). Copy validee Adam (voix on/nous, zero tiret
cadratin, vraie mecanique 5€/40€/5%/12mois).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 6 : Intégration `/account` (Task 15)

### Task 15 : Intégrer onglet Cagnotte + swap ReferralPanel dans `/account`

**Files:**
- Modify: `src/app/(nutrition)/account/page.tsx`

- [ ] **Step 1 : Read existing page**

Run: read `src/app/(nutrition)/account/page.tsx` pour confirmer la structure.
Le fichier doit déjà contenir un `type Tab` et un `navItems` array.

- [ ] **Step 2 : Modify the page**

Dans `src/app/(nutrition)/account/page.tsx` :

**Édition A : ajouter `'cagnotte'` au type Tab.**

Old:
```typescript
type Tab = 'overview' | 'orders' | 'order-detail' | 'addresses' | 'profile' | 'reviews' | 'referral' | 'coaching'
```

New:
```typescript
type Tab = 'overview' | 'orders' | 'order-detail' | 'addresses' | 'profile' | 'reviews' | 'referral' | 'cagnotte' | 'coaching'
```

**Édition B : ajouter l'import des nouveaux composants en haut du fichier.**

Old:
```typescript
import {
  User, Package, MapPin, LogOut, ChevronRight, ShoppingBag, Star,
  Gift, Dumbbell, Plus, Pencil, Trash2, X, Loader2, Save, Copy, Users
} from 'lucide-react'
```

New:
```typescript
import {
  User, Package, MapPin, LogOut, ChevronRight, ShoppingBag, Star,
  Gift, Dumbbell, Plus, Pencil, Trash2, X, Loader2, Save, Wallet
} from 'lucide-react'
import { CagnottePanel } from '@/components/account/CagnottePanel'
import { ReferralPanel } from '@/components/account/ReferralPanel'
```

**Édition C : supprimer l'ancien composant `ReferralPanel` local** (lignes ~475-531 selon ta lecture initiale, le bloc qui commence par `function ReferralPanel({ customer }: ...` jusqu'à sa fermeture `}`).

**Édition D : remplacer le `navItems` array** :

Old:
```typescript
const navItems: { icon: typeof Package; label: string; tab: Tab; count?: number }[] = [
  { icon: Package, label: 'Mes commandes', tab: 'orders', count: customer.orders?.nodes?.length },
  { icon: MapPin, label: 'Mes adresses', tab: 'addresses' },
  { icon: Star, label: 'Mes avis', tab: 'reviews' },
  { icon: Gift, label: 'Parrainage', tab: 'referral' },
  { icon: Dumbbell, label: 'Mon coaching', tab: 'coaching' },
]
```

New:
```typescript
const navItems: { icon: typeof Package; label: string; tab: Tab; count?: number }[] = [
  { icon: Package, label: 'Mes commandes', tab: 'orders', count: customer.orders?.nodes?.length },
  { icon: MapPin, label: 'Mes adresses', tab: 'addresses' },
  { icon: Wallet, label: 'Ma cagnotte', tab: 'cagnotte' },
  { icon: Gift, label: 'Parrainage', tab: 'referral' },
  { icon: Star, label: 'Mes avis', tab: 'reviews' },
  { icon: Dumbbell, label: 'Mon coaching', tab: 'coaching' },
]
```

**Édition E : ajouter le `case 'cagnotte'` dans `renderPanel` et remplacer `case 'referral'`** :

Old:
```typescript
case 'referral': return <ReferralPanel customer={customer} />
case 'coaching': return (
```

New:
```typescript
case 'referral': return <ReferralPanel />
case 'cagnotte': return <CagnottePanel />
case 'coaching': return (
```

**Édition F : ajouter le support `?tab=...` via useSearchParams** dans `AccountContent` (juste après les useState existants) :

Trouver ligne (à ~538) :
```typescript
const [activeTab, setActiveTab] = useState<Tab>('overview')
```

Remplacer par :
```typescript
const tabFromUrl = searchParams.get('tab') as Tab | null
const [activeTab, setActiveTab] = useState<Tab>(
  tabFromUrl && ['overview','orders','addresses','profile','reviews','referral','cagnotte','coaching'].includes(tabFromUrl)
    ? tabFromUrl
    : 'overview'
)
```

- [ ] **Step 3 : Run typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS, et dans la sortie du build on doit voir `/account` listé sans erreur.

- [ ] **Step 4 : Commit**

```bash
git add src/app/\(nutrition\)/account/page.tsx
git commit -m "feat(loyalty): /account integre onglet Cagnotte + ReferralPanel reecrit

- Suppression du composant ReferralPanel local mensonger (code generere
  cote client, '-10 %', '10 € bon d'achat', 'bientot actif').
- Ajout onglet 'Ma cagnotte' (icone Wallet) entre 'Mes adresses' et
  'Parrainage'.
- Composants importes depuis src/components/account/.
- Support deep link ?tab=cagnotte / ?tab=referral (depuis CartDrawer
  ou page /parrainage).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 7 : Page publique `/parrainage` (Task 16)

### Task 16 : Page `/parrainage`

**Files:**
- Create: `src/app/(nutrition)/parrainage/page.tsx`

- [ ] **Step 1 : Write the page**

`src/app/(nutrition)/parrainage/page.tsx` :

```typescript
import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { Gift, Users, ShoppingBag, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Parrainage BodyStart : 5 € pour ton pote, 5 % pour toi',
  description:
    'Partage ton code parrain BodyStart. Ton pote a 5 € sur sa première commande, tu gagnes 5 % de ses achats pendant 12 mois. Aucune carte, aucune appli.',
}

const STEPS = [
  {
    step: '01',
    title: 'Tu partages ton code',
    desc: 'Ton code BS-XXXXX est dispo dans ton compte. Envoie-le par DM, WhatsApp, SMS, comme tu veux.',
    icon: Users,
  },
  {
    step: '02',
    title: 'Ton pote économise 5 €',
    desc: 'Il rentre ton code au panier sur sa première commande, à partir de 40 € d\'achat. Direct, sans condition cachée.',
    icon: ShoppingBag,
  },
  {
    step: '03',
    title: 'Tu gagnes 5 % pendant 1 an',
    desc: 'À chaque fois qu\'il commande, on te crédite 5 % du montant payé. Ta cagnotte grossit toute seule, utilisable dès 20 €.',
    icon: Gift,
  },
]

const FAQ = [
  {
    q: 'Combien de potes je peux parrainer ?',
    a: 'Autant que tu veux. Plus tu partages, plus ta cagnotte grimpe.',
  },
  {
    q: 'Quand mon pote peut utiliser le code ?',
    a: 'Sur sa première commande, à partir de 40 € d\'achat (hors frais de port). Une fois par filleul.',
  },
  {
    q: 'Comment j\'utilise ma cagnotte ?',
    a: 'Dès que tu as 20 € ou plus, tu peux l\'utiliser au panier. Tu choisis le montant, jusqu\'à 50 % du total de ta commande.',
  },
  {
    q: 'C\'est cumulable avec d\'autres remises ?',
    a: 'Sur une commande, c\'est un code à la fois. Ta cagnotte s\'applique comme une remise sur ton panier ; tu ne peux pas l\'empiler avec un autre code promo, donc tu prends le plus avantageux. Pareil pour le code parrain : un seul code par commande, le plus avantageux gagne.',
  },
  {
    q: 'Mes 5 % s\'arrêtent quand ?',
    a: '12 mois après la première commande de ton pote. Après, il reste ton ami mais plus ton filleul. La cagnotte déjà gagnée, elle, reste à toi.',
  },
  {
    q: 'Et ma cagnotte expire ?',
    a: 'Jamais. Une fois créditée, c\'est à toi pour la vie.',
  },
]

export default function ParrainagePage() {
  // Detection cote serveur : presence cookie shopify (pas besoin de fetch)
  const isLoggedIn = !!cookies().get('body-start-customer-token')?.value

  return (
    <div className="bg-[#f4f6f1] min-h-screen">
      {/* ─── Hero ─── */}
      <section className="bg-[#1a2e23] text-white">
        <div className="container py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/10 rounded-full text-[11px] font-bold uppercase tracking-widest mb-6">
              <Gift className="w-3 h-3" /> Programme parrainage
            </div>
            <h1 className="font-display text-[40px] md:text-[64px] font-black uppercase tracking-tighter leading-[0.95] mb-6">
              Tu recommandes, ton pote économise, tu gagnes.
            </h1>
            <p className="text-white/80 text-lg md:text-xl font-medium leading-relaxed max-w-2xl mb-8">
              Le programme parrainage BodyStart, c&apos;est simple. Tu partages ton
              code, ton pote a 5 € sur sa première commande, et tu touches 5 %
              de ses achats pendant 12 mois. Aucune carte physique, aucune
              appli, ton compte BodyStart suffit.
            </p>
            <div className="flex flex-wrap gap-3">
              {isLoggedIn ? (
                <Link
                  href="/account?tab=referral"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#1a2e23] text-[12px] font-bold uppercase tracking-widest rounded-full hover:bg-white/90 transition-all shadow-lg"
                >
                  Voir mon code <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#1a2e23] text-[12px] font-bold uppercase tracking-widest rounded-full hover:bg-white/90 transition-all shadow-lg"
                  >
                    Connecte-toi pour avoir ton code
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 px-6 py-4 border border-white/20 text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-white/10 transition-all"
                  >
                    Pas encore de compte ? Inscris-toi en 30 secondes
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Comment ca marche ─── */}
      <section className="container py-16 md:py-24">
        <h2 className="font-display text-[32px] md:text-[48px] font-black uppercase tracking-tighter text-[#1a2e23] leading-none mb-12 max-w-2xl">
          Comment ça marche
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#1a2e23] text-white rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0">
                  {step}
                </div>
                <Icon className="w-6 h-6 text-[#89a890]" />
              </div>
              <h3 className="font-display font-black uppercase tracking-tight text-[#1a2e23] text-lg mb-3">
                {title}
              </h3>
              <p className="text-[#4a5f4c] text-sm font-medium leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="container pb-16 md:pb-24">
        <h2 className="font-display text-[32px] md:text-[48px] font-black uppercase tracking-tighter text-[#1a2e23] leading-none mb-12 max-w-2xl">
          Les questions qu&apos;on nous pose
        </h2>

        <div className="space-y-4 max-w-3xl">
          {FAQ.map(({ q, a }) => (
            <details
              key={q}
              className="group bg-white rounded-[20px] border border-[#1a2e23]/5 shadow-sm"
            >
              <summary className="cursor-pointer list-none px-6 md:px-8 py-5 flex items-center justify-between gap-4">
                <span className="font-display font-bold text-[#1a2e23] text-base">{q}</span>
                <span className="text-[#89a890] text-2xl font-bold transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="px-6 md:px-8 pb-5 text-[#4a5f4c] text-sm font-medium leading-relaxed">
                {a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ─── CTA bas ─── */}
      <section className="container pb-16 md:pb-24">
        <div className="bg-[#1a2e23] text-white rounded-[28px] p-10 md:p-16 text-center">
          <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mb-4">
            Aucune carte physique. Aucune appli à installer.
          </p>
          <h2 className="font-display text-[28px] md:text-[40px] font-black uppercase tracking-tighter leading-tight mb-8">
            Ton compte BodyStart fait tout.
          </h2>
          {isLoggedIn ? (
            <Link
              href="/account?tab=referral"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#1a2e23] text-[12px] font-bold uppercase tracking-widest rounded-full hover:bg-white/90 transition-all shadow-lg"
            >
              Voir mon code <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#1a2e23] text-[12px] font-bold uppercase tracking-widest rounded-full hover:bg-white/90 transition-all shadow-lg"
            >
              Connecte-toi pour démarrer <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2 : Run typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS, route `/parrainage` listée dans la sortie du build (statique ou dynamique).

- [ ] **Step 3 : Commit**

```bash
git add src/app/\(nutrition\)/parrainage/page.tsx
git commit -m "feat(loyalty): page publique /parrainage SEO + marketing

Server Component statique avec metadata SEO. Hero / 3 etapes / 6 FAQ
/ CTA bas. CTA conditionnel selon cookie body-start-customer-token
(Server Component, pas de fetch). Copy validee Adam (voix on/nous,
tutoiement, vraie mecanique, zero tiret cadratin, FAQ cumul corrigee).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 8 : Widget panier (Task 17)

### Task 17 : `CagnotteCartWidget` + intégration `CartDrawer`

**Files:**
- Create: `src/components/cart/CagnotteCartWidget.tsx`
- Modify: `src/components/cart/CartDrawer.tsx` (1 import + 1 ligne JSX)

- [ ] **Step 1 : Write the widget**

`src/components/cart/CagnotteCartWidget.tsx` :

```typescript
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Wallet, Check, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLoyaltyMe } from '@/hooks/useLoyaltyMe'
import { useCart } from '@/hooks/useCart'

const LOYALTY_CODE_PREFIX = 'BS-CAGNOTTE-'
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
  const { cart, applyDiscountCode, removeDiscountCode } = useCart()
  const [redeemAmount, setRedeemAmount] = useState(0)
  const [busy, setBusy] = useState(false)

  const subtotalCents = useMemo(
    () => eurosToCents(cart?.cost?.subtotalAmount?.amount ?? '0'),
    [cart]
  )

  // Detection cagnotte appliquee : si un discountCode du cart commence par BS-CAGNOTTE-
  const appliedLoyaltyCode = useMemo(() => {
    const codes = cart?.discountCodes ?? []
    return codes.find((c: { code: string; applicable?: boolean }) => c.code.startsWith(LOYALTY_CODE_PREFIX))
  }, [cart])

  // Cas A : logged_out -> rien
  if (state.kind === 'logged_out' || state.kind === 'loading' || state.kind === 'error') {
    return null
  }

  // Cas B : not_enrolled -> CTA activer
  if (state.kind === 'not_enrolled') {
    return (
      <div className="bg-[#f4f6f1] border border-[#1a2e23]/5 rounded-xl p-4 mx-8 mb-4">
        <p className="text-[12px] text-[#4a5f4c] font-medium mb-3">
          Active ton programme fidélité pour gagner sur tes prochaines commandes.
        </p>
        <Link
          href="/account?tab=cagnotte"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a2e23] text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-[#2e4f3c] transition-all"
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
    async function handleRemove() {
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
      <div className="bg-[#e8f0e3] border border-[#1a2e23]/10 rounded-xl p-4 mx-8 mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Check className="w-4 h-4 text-[#1a2e23] flex-shrink-0" />
          <p className="text-[12px] font-bold text-[#1a2e23] truncate">
            Cagnotte appliquée
          </p>
        </div>
        <button
          onClick={handleRemove}
          disabled={busy}
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#4a5f4c] hover:text-[#1a2e23] disabled:opacity-50"
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
      <div className="bg-[#f4f6f1] border border-[#1a2e23]/5 rounded-xl px-4 py-3 mx-8 mb-4 flex items-center gap-2">
        <Wallet className="w-4 h-4 text-[#89a890] flex-shrink-0" />
        <p className="text-[12px] font-medium text-[#4a5f4c]">
          Cagnotte : <span className="font-bold text-[#1a2e23]">{formatEuros(balanceCents)}</span> · Utilisable dès 20 €
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
    <div className="bg-white border border-[#1a2e23]/5 rounded-xl p-5 mx-8 mb-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="w-4 h-4 text-[#1a2e23]" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#1a2e23]">Ta cagnotte</p>
      </div>

      <p className="text-[13px] font-medium text-[#4a5f4c] mb-4">
        Tu as <span className="font-bold text-[#1a2e23]">{formatEuros(balanceCents)}</span> disponibles
      </p>

      <input
        type="range"
        min={0}
        max={maxRedeemCents}
        step={100}
        value={redeemAmount}
        onChange={(e) => setRedeemAmount(Number(e.target.value))}
        className="w-full mb-3 accent-[#1a2e23]"
      />

      <p className="text-[12px] text-[#4a5f4c] font-medium mb-4">
        {redeemAmount === 0
          ? 'Choisis le montant à utiliser'
          : <>Tu utilises <span className="font-bold text-[#1a2e23]">{formatEuros(redeemAmount)}</span> sur cette commande</>}
      </p>

      <button
        onClick={handleApply}
        disabled={busy || redeemAmount === 0}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1a2e23] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#2e4f3c] transition-all disabled:opacity-40"
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        Appliquer {redeemAmount > 0 ? formatEuros(redeemAmount) : ''}
      </button>

      <p className="text-[11px] text-[#89a890] font-medium mt-3 text-center">
        Plafond 50 % du panier. Ne s&apos;utilise pas sur les frais de port.
      </p>
    </div>
  )
}
```

- [ ] **Step 2 : Add helpers to CartContext if needed**

Vérifier que `useCart()` expose `applyDiscountCode(code)` et `removeDiscountCode(code)`. Si NON, ajouter ces helpers dans `src/context/CartContext.tsx` :

```typescript
// Dans CartContextType
applyDiscountCode: (code: string) => Promise<void>
removeDiscountCode: (code: string) => Promise<void>

// Implementations (en utilisant cartDiscountCodesUpdate Storefront)
const applyDiscountCode = useCallback(async (code: string) => {
  if (!cart) return
  setIsLoading(true)
  try {
    const existingCodes = cart.discountCodes?.map((c: { code: string }) => c.code) ?? []
    const newCodes = Array.from(new Set([...existingCodes, code]))
    const updated = await updateCartDiscountCodes(cart.id, newCodes)
    setCart(updated)
  } finally {
    setIsLoading(false)
  }
}, [cart])

const removeDiscountCode = useCallback(async (code: string) => {
  if (!cart) return
  setIsLoading(true)
  try {
    const remaining = (cart.discountCodes ?? [])
      .map((c: { code: string }) => c.code)
      .filter((c: string) => c !== code)
    const updated = await updateCartDiscountCodes(cart.id, remaining)
    setCart(updated)
  } finally {
    setIsLoading(false)
  }
}, [cart])
```

Et exposer `applyDiscountCode, removeDiscountCode` dans `<CartContext.Provider value={...}>`.

Vérifier aussi que `updateCartDiscountCodes(cartId, codes)` existe dans `@/lib/shopify`. Si non, l'ajouter dans `src/lib/shopify/cart.ts` (utilise la mutation `cartDiscountCodesUpdate`).

- [ ] **Step 3 : Inject widget in CartDrawer**

Dans `src/components/cart/CartDrawer.tsx` :

Ajouter en haut, dans les imports :
```typescript
import { CagnotteCartWidget } from './CagnotteCartWidget'
```

Trouver la section juste avant le bouton checkout / total final (dans le rendu du panier non-vide). Insérer :
```tsx
{!isEmpty && !isCoaching && <CagnotteCartWidget />}
```

- [ ] **Step 4 : Run typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS, build complete sans erreur.

- [ ] **Step 5 : Commit**

```bash
git add src/components/cart/CagnotteCartWidget.tsx src/components/cart/CartDrawer.tsx src/context/CartContext.tsx src/lib/shopify/cart.ts
git commit -m "feat(loyalty): CagnotteCartWidget 5 etats dans CartDrawer

Widget cagnotte dans le panier (drawer), 5 etats :
- A logged_out / loading / error -> rien
- B not_enrolled -> CTA Activer
- C balance < 20 € -> bandeau mini info
- D balance >= 20 € -> slider 0 -> min(balance, 50% panier) + Appliquer
- E code BS-CAGNOTTE-* deja dans cart -> 'Cagnotte appliquee' + Retirer

Ajout helpers applyDiscountCode/removeDiscountCode dans CartContext
(cartDiscountCodesUpdate Storefront). Detection code loyalty via
prefix BS-CAGNOTTE-.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 9 : Validation finale + livraison (Task 18)

### Task 18 : Build + tests verts + rapport L4 + push

**Files:**
- Create: `SPRINT_L4_REPORT.md`

- [ ] **Step 1 : Run all tests**

Run: `npx vitest run`
Expected: PASS (au moins 118 tests existants + nouveaux tests L4 = ~130+). Couverture loyalty >= 80 %.

- [ ] **Step 2 : Run typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS, dans la sortie build on doit voir les nouvelles routes :
```
├ ƒ /api/loyalty/me                       0 B
├ ƒ /api/loyalty/me/enroll                0 B
├ ƒ /api/loyalty/me/preview               0 B
├ ƒ /api/loyalty/me/redeem-online         0 B
├ ƒ /parrainage                           ... (statique ou dynamique)
```

- [ ] **Step 3 : Write SPRINT_L4_REPORT.md**

`SPRINT_L4_REPORT.md` :

```markdown
# Sprint L4 : Interface client en ligne (loyalty)

**Branche** : feat/loyalty
**Spec source** : docs/superpowers/specs/2026-05-24-loyalty-L4-client-online-design.md
**Plan source** : docs/superpowers/plans/2026-05-24-loyalty-L4-implementation.md
**Status** : livre, en attente revue preview

## Resume executif

L4 livre l'interface client en ligne du programme loyalty BodyStart :
- /account enrichi (onglet Cagnotte + ReferralPanel reecrit avec vraies donnees)
- Page publique /parrainage (SEO + marketing)
- Widget cagnotte dans CartDrawer (5 etats)
- Fermeture des routes L3 phone-based (staff/M2M only) + extraction
  helpers purs (preview-core + redeem-online-core) reutilisables par
  les 2 paires de routes.
- 4 nouvelles routes session-based /me/* (cookie Shopify Customer API)

Aucune migration SQL. Toute la logique metier (5%, 12 mois, min 20€,
cap 50%, anti auto-parrainage) reste dans les fonctions L1/L2.

## Ce qui a ete fait

[Liste detaillee des fichiers crees + modifies, copie depuis §7 du spec]

## Actions manuelles toi

1. **Configurer NEXT_PUBLIC_SITE_URL sur Vercel** (preview + prod).
   Sans cette variable, les liens WhatsApp / partage seront vides
   mais la page reste fonctionnelle.
2. **Forcer le telephone obligatoire au checkout Shopify** (Settings
   > Checkout > Customer information). Sinon les webhooks ne matchent
   pas tous les clients par phone, et le fallback email est moins
   robuste.
3. **Tester end-to-end sur preview** :
   - Connecte-toi avec un compte Shopify existant
   - Va sur /account onglet Cagnotte -> bloc enrolment -> entrer
     ton telephone E.164 -> code parrain affiche
   - Va sur /parrainage -> verifie le copy + CTA conditionnel
   - Ajoute > 40 € au panier -> verifie le widget cagnotte
     (cas C ou D selon ton solde)
4. **Verifier que GitHub Actions pgTAP reste vert** (pas de
   migration SQL en L4 mais on s'assure rien n'est casse).

## Decisions techniques

[Resume des decisions cles du spec + impacts]

## Hors-scope L4 (a traiter en L6)

- Emails Resend (welcome, commission creditee)
- Import CSV legacy
- Notifs web push
- Statistiques parrain ('tu as parraine N personnes')

## Edge cases couverts

[Liste]
```

- [ ] **Step 4 : Commit final + push**

```bash
git add SPRINT_L4_REPORT.md
git commit -m "docs(loyalty): SPRINT_L4_REPORT - livraison interface client en ligne

Rapport final L4 : ce qui a ete livre, actions manuelles toi (config
NEXT_PUBLIC_SITE_URL + forcer telephone checkout Shopify + tests
e2e sur preview), decisions techniques, edge cases couverts.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"

git push origin feat/loyalty
```

- [ ] **Step 5 : Vérifier que CI pgTAP reste vert**

Aller sur https://github.com/Poupouuuuuu/bodystart/actions/workflows/pgtap.yml et confirmer que le dernier run sur `feat/loyalty` est vert (28/28 assertions). Pas de nouvelle migration SQL en L4, donc le CI doit juste re-tourner et passer.

---

## Self-review checklist

Le plan couvre-t-il tout le spec ?

- [x] §3.1 Helper `resolveLoyaltyForSession` → Task 6
- [x] §3.2 Refactor L3 en helpers purs → Tasks 2, 3
- [x] §3.3 Fermeture L3 staff/M2M + rate limit → Tasks 4, 5
- [x] §3.4 Routes `/me/*` → Tasks 7, 8, 9, 10
- [x] §3.5 Enrichissement `/account` → Tasks 13, 14, 15
- [x] §3.6 Page publique `/parrainage` → Task 16
- [x] §3.7 Widget `CagnotteCartWidget` → Task 17
- [x] §5 Copy (validé) → utilisé dans Tasks 12-17
- [x] Helper `site-url` (corrections Adam) → Task 1
- [x] Tests TS (vitest) → Tasks 1, 2, 3, 6
- [x] Build + commit final + rapport → Task 18

Pas de placeholder, types cohérents (PreviewInput / RedeemInput / ResolveResult réutilisés), commandes exactes, code complet à chaque step.
