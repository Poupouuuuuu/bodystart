import { describe, it, expect, vi } from 'vitest'
import { buildInsertPayload, upsertLoyaltyCustomer } from './upsert-customer'
import { REFERRAL_CODE_PREFIX } from './calculate'

describe('buildInsertPayload', () => {
  it('construit le payload Postgres avec defaults', () => {
    const payload = buildInsertPayload(
      {
        phone: '+33612345678',
        firstName: 'Adam',
      },
      'BS-ABCDE'
    )
    expect(payload).toEqual({
      phone: '+33612345678',
      first_name: 'Adam',
      last_name: null,
      email: null,
      shopify_customer_id: null,
      referral_code: 'BS-ABCDE',
      referred_by_code: null,
      email_opt_in: false,
      source: 'online',
    })
  })

  it('garde referred_by_code si format valide', () => {
    const payload = buildInsertPayload(
      {
        phone: '+33612345678',
        firstName: 'Marie',
        referredByCode: 'BS-XYZ23',
      },
      'BS-NEW34'
    )
    expect(payload.referred_by_code).toBe('BS-XYZ23')
  })

  it('ignore un referred_by_code malforme (filtrage defense)', () => {
    const payload = buildInsertPayload(
      {
        phone: '+33612345678',
        firstName: 'Marie',
        referredByCode: 'XX-INVALID', // mauvais prefixe
      },
      'BS-NEW34'
    )
    expect(payload.referred_by_code).toBe(null)
  })

  it('source par defaut = online', () => {
    expect(buildInsertPayload({ phone: '+33612345678', firstName: 'X' }, 'BS-ABCDE').source).toBe(
      'online'
    )
  })

  it('source explicite in_store', () => {
    const p = buildInsertPayload(
      { phone: '+33612345678', firstName: 'X', source: 'in_store' },
      'BS-ABCDE'
    )
    expect(p.source).toBe('in_store')
  })
})

// ============================================================
// upsertLoyaltyCustomer (mocks Supabase)
// ============================================================

// Helper : construit un faux client Supabase qui retourne ce qu'on veut.
type LookupResult = { data: unknown; error: { message: string } | null }
type InsertResult = {
  data: unknown
  error: { message: string; code?: string } | null
}

function makeSupabaseMock(opts: {
  lookups: LookupResult[]
  inserts: InsertResult[]
  updates?: InsertResult[]
}) {
  let lookupIndex = 0
  let insertIndex = 0
  let updateIndex = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb: any = {
    from(_table: string) {
      // Builder shape : .select().eq().maybeSingle() | .insert().select().single() | .update().eq()
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => opts.lookups[lookupIndex++]!,
              }
            },
          }
        },
        insert(_payload: unknown) {
          return {
            select() {
              return {
                single: async () => opts.inserts[insertIndex++]!,
              }
            },
          }
        },
        update(_patch: unknown) {
          return {
            eq: async () => opts.updates?.[updateIndex++] ?? { data: null, error: null },
          }
        },
      }
    },
  }
  return sb
}

describe('upsertLoyaltyCustomer', () => {
  it('retourne le customer existant si phone deja en base (avec update minimal)', async () => {
    const existing = {
      id: 'cust-1',
      phone: '+33612345678',
      email: 'old@bs.fr',
      first_name: 'Adam',
      last_name: null,
      referral_code: 'BS-ABCDE',
      referred_by_code: null,
      loyalty_balance_cents: 500,
      has_first_purchase: true,
      source: 'online',
    }
    const supabase = makeSupabaseMock({
      lookups: [{ data: existing, error: null }],
      inserts: [],
      updates: [{ data: null, error: null }],
    })

    const result = await upsertLoyaltyCustomer(supabase, {
      phone: '+33612345678',
      firstName: 'Adam',
      email: 'new@bs.fr', // change → update declenche
    })

    expect(result.id).toBe('cust-1')
    expect(result.isNew).toBe(false)
    expect(result.email).toBe('new@bs.fr') // l'update est reflete dans la reponse
    expect(result.referralCode).toBe('BS-ABCDE')
    expect(result.loyaltyBalanceCents).toBe(500) // jamais touche
  })

  it('insert un nouveau customer si phone inconnu, genere un referral_code BS-XXXXX', async () => {
    const supabase = makeSupabaseMock({
      lookups: [{ data: null, error: null }], // pas trouve
      inserts: [
        {
          data: {
            id: 'cust-new',
            phone: '+33611111111',
            email: null,
            first_name: 'Marie',
            last_name: null,
            referral_code: 'BS-TEST1',
            referred_by_code: null,
            loyalty_balance_cents: 0,
            has_first_purchase: false,
            source: 'online',
          },
          error: null,
        },
      ],
    })

    const result = await upsertLoyaltyCustomer(supabase, {
      phone: '+33611111111',
      firstName: 'Marie',
    })

    expect(result.isNew).toBe(true)
    expect(result.id).toBe('cust-new')
    // Le mock fixe le code ; en realite le wrapper le genere via generateReferralCode
    expect(result.referralCode.startsWith(REFERRAL_CODE_PREFIX)).toBe(true)
    expect(result.loyaltyBalanceCents).toBe(0)
    expect(result.hasFirstPurchase).toBe(false)
  })

  it('retry sur collision referral_code (code 23505 sur referral_code)', async () => {
    const supabase = makeSupabaseMock({
      lookups: [{ data: null, error: null }],
      inserts: [
        // 1er insert : collision sur referral_code
        {
          data: null,
          error: { code: '23505', message: 'duplicate key value violates unique constraint "idx_loyalty_customers_referral_code"' },
        },
        // 2e insert : succes
        {
          data: {
            id: 'cust-retry',
            phone: '+33622222222',
            email: null,
            first_name: 'Lucie',
            last_name: null,
            referral_code: 'BS-OK345',
            referred_by_code: null,
            loyalty_balance_cents: 0,
            has_first_purchase: false,
            source: 'online',
          },
          error: null,
        },
      ],
    })

    const result = await upsertLoyaltyCustomer(supabase, {
      phone: '+33622222222',
      firstName: 'Lucie',
    })
    expect(result.isNew).toBe(true)
    expect(result.id).toBe('cust-retry')
  })

  it('detecte une race condition sur le phone : refait un lookup et retourne existant', async () => {
    const racedExisting = {
      id: 'cust-race',
      phone: '+33633333333',
      email: null,
      first_name: 'Race',
      last_name: null,
      referral_code: 'BS-RACE1',
      referred_by_code: null,
      loyalty_balance_cents: 0,
      has_first_purchase: false,
      source: 'online',
    }
    const supabase = makeSupabaseMock({
      lookups: [
        { data: null, error: null }, // 1er lookup : pas trouve
        { data: racedExisting, error: null }, // 2e lookup apres collision : trouve
      ],
      inserts: [
        {
          data: null,
          error: { code: '23505', message: 'duplicate key value violates unique constraint "loyalty_customers_phone_key"' },
        },
      ],
    })

    const result = await upsertLoyaltyCustomer(supabase, {
      phone: '+33633333333',
      firstName: 'Race',
    })
    expect(result.id).toBe('cust-race')
    expect(result.isNew).toBe(false)
  })

  it('throw si erreur Postgres non-unique (ex: 500)', async () => {
    const supabase = makeSupabaseMock({
      lookups: [{ data: null, error: null }],
      inserts: [
        { data: null, error: { message: 'connection terminated unexpectedly' } },
      ],
    })

    await expect(
      upsertLoyaltyCustomer(supabase, { phone: '+33644444444', firstName: 'X' })
    ).rejects.toThrow(/connection terminated/)
  })

  it('throw si lookup error', async () => {
    const supabase = makeSupabaseMock({
      lookups: [{ data: null, error: { message: 'permission denied' } }],
      inserts: [],
    })
    await expect(
      upsertLoyaltyCustomer(supabase, { phone: '+33655555555', firstName: 'X' })
    ).rejects.toThrow(/permission denied/)
  })
})
