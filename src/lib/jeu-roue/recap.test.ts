import { describe, it, expect, vi, beforeEach } from 'vitest'

const adminFetch = vi.fn()
vi.mock('@/lib/shopify/client', () => ({ shopifyAdminFetch: (...a: unknown[]) => adminFetch(...a) }))

import { buildRecap, channelOf, loadRecapData, lotFromTitle, nbsp, renderRecapEmail, type RecapData } from './recap'

beforeEach(() => {
  adminFetch.mockReset()
})

// Lundi 12/10/2026, 8 h à Paris : fenêtre du lundi 5, 8 h, au lundi 12, 8 h.
const NOW = new Date('2026-10-12T06:00:00Z')

const code = (c: string, lotId: RecapData['codes'][number]['lotId'], createdAt: string, endsAt: string, amount: number, used: boolean) => ({
  code: c, lotId, createdAt, endsAt, amount, used,
})

const DATA: RecapData = {
  codes: [
    code('ROUE-AAA222', 'canette-abe', '2026-10-06T10:00:00Z', '2026-11-05T10:00:00Z', 3.1, true),
    code('ROUE-BBB333', 'bon-5', '2026-10-08T10:00:00Z', '2026-11-07T10:00:00Z', 5, true),
    code('ROUE-CCC444', 'shaker', '2026-10-10T10:00:00Z', '2026-11-09T10:00:00Z', 6.9, false),
    // Libellé de lot renommé depuis : lot retrouvé par le métachamp du client
    code('ROUE-FFF999', null, '2026-10-11T10:00:00Z', '2026-11-10T10:00:00Z', 36.9, false),
    code('ROUE-DDD555', 'whey', '2026-09-01T10:00:00Z', '2026-10-01T10:00:00Z', 44.9, false),
    // Utilisé, mais commande introuvable (trop ancienne)
    code('ROUE-EEE666', 'crunch-bar', '2026-09-20T10:00:00Z', '2026-10-20T10:00:00Z', 2.9, true),
  ],
  participants: [
    { playedAt: '2026-10-06T10:00:00Z', code: 'ROUE-AAA222', lotId: 'canette-abe', optIn: true },
    { playedAt: '2026-10-08T10:00:00Z', code: 'ROUE-BBB333', lotId: 'bon-5', optIn: false },
    { playedAt: '2026-10-10T10:00:00Z', code: 'ROUE-CCC444', lotId: 'shaker', optIn: true },
    { playedAt: '2026-10-11T10:00:00Z', code: 'ROUE-FFF999', lotId: 'creatine', optIn: false },
    { playedAt: '2026-09-01T10:00:00Z', code: 'ROUE-DDD555', lotId: 'whey', optIn: false },
    { playedAt: null, code: null, lotId: null, optIn: true },
  ],
  uses: [
    { code: 'ROUE-BBB333', order: '#1901', at: '2026-10-09T15:00:00Z', channel: 'en ligne' },
    { code: 'ROUE-AAA222', order: '#1900', at: '2026-10-07T12:00:00Z', channel: 'caisse' },
  ],
  stock: new Map([
    ['canette-abe', 2],
    ['crunch-bar', 10],
    ['shaker', 0],
    ['creatine', 1],
    ['whey', 8],
  ]),
}

describe('helpers', () => {
  it('lot lu dans le titre de la remise', () => {
    expect(lotFromTitle('Jeu roue : 5 € dès 30 € d’achat : ROUE-NAARC6')).toBe('bon-5')
    expect(lotFromTitle('Jeu roue : Une canette ABE Energy : ROUE-ARJ8YK')).toBe('canette-abe')
    expect(lotFromTitle('Jeu roue : Lot disparu : ROUE-ARJ8YK')).toBeNull()
    // Titre avec parfums (09/10/2026) et ancien titre sans parfums
    expect(lotFromTitle('Jeu roue : Une barre Crunch Bar (Dark Choco PB, PB Cup ou Cookie Dough) : ROUE-ABC234')).toBe('crunch-bar')
    expect(lotFromTitle('Jeu roue : Une barre Crunch Bar : ROUE-ECYEPX')).toBe('crunch-bar')
    expect(lotFromTitle('Jeu roue : Une whey Protimuscle 1 kg (Chocolat, Vanille, Choco-cookie ou Fraise) : ROUE-WWW222')).toBe('whey')
    expect(lotFromTitle('Jeu roue : Une whey Protimuscle 1 kg : ROUE-WWW222')).toBe('whey')
  })

  it('caisse = POS, tout le reste = en ligne', () => {
    expect(channelOf('pos')).toBe('caisse')
    expect(channelOf('371706396673')).toBe('en ligne')
    expect(channelOf('web')).toBe('en ligne')
    expect(channelOf(null)).toBe('en ligne')
  })
})

describe('buildRecap', () => {
  const r = buildRecap(DATA, NOW)

  it('fenêtre : les 7 jours qui précèdent', () => {
    expect(r.from.toISOString()).toBe('2026-10-05T06:00:00.000Z')
    expect(r.to).toBe(NOW)
  })

  it('semaine : participations, lots, case offres, codes utilisés, valeur', () => {
    expect(r.week.plays).toBe(4)
    expect(Object.fromEntries(r.week.byLot.map((l) => [l.lot.id, l.count]))).toEqual({
      'canette-abe': 1, 'crunch-bar': 0, shaker: 1, 'bon-5': 1, creatine: 1, whey: 0,
    })
    expect([r.week.optIns, r.week.dated]).toEqual([2, 4])
    // Triés par date d'utilisation, lot rattaché
    expect(r.week.uses.map((u) => [u.code, u.channel, u.lot?.id])).toEqual([
      ['ROUE-AAA222', 'caisse', 'canette-abe'],
      ['ROUE-BBB333', 'en ligne', 'bon-5'],
    ])
    expect(r.week.value).toBe(8.1)
  })

  it('cumul : canal inconnu pour un code utilisé sans commande retrouvée, expirés, encore valables', () => {
    expect(r.total).toEqual({
      plays: 6,
      participants: 6,
      optIns: 3,
      used: 3,
      caisse: 1,
      enLigne: 1,
      unknown: 1,
      value: 11,
      expiredUnused: 1,
      activeUnused: 2,
    })
  })

  it('stock : épuisé à 0, à réassortir sous le seuil', () => {
    expect(r.stock?.map((s) => [s.lot.id, s.units, s.status])).toEqual([
      ['canette-abe', 2, 'bas'],
      ['crunch-bar', 10, 'ok'],
      ['shaker', 0, 'epuise'],
      ['creatine', 1, 'bas'],
      ['whey', 8, 'ok'],
    ])
  })

  it('le seuil suit le rythme de la semaine', () => {
    const busy: RecapData = {
      ...DATA,
      codes: Array.from({ length: 40 }, (_, i) =>
        code(`ROUE-X${String(i).padStart(5, '0')}`, 'shaker', '2026-10-09T10:00:00Z', '2026-11-08T10:00:00Z', 6.9, false)
      ),
      stock: new Map([['canette-abe', 14], ['crunch-bar', 15]]),
    }
    // 40 tirages : 14 canettes attendues (35 %), 10 barres (25 %)
    const s = buildRecap(busy, NOW).stock!
    expect(s.find((l) => l.lot.id === 'canette-abe')?.status).toBe('bas')
    expect(s.find((l) => l.lot.id === 'crunch-bar')?.status).toBe('ok')
  })

  it('commandes ou stock illisibles : signalés, pas inventés', () => {
    const r2 = buildRecap({ ...DATA, uses: null, stock: null }, NOW)
    expect(r2.ordersReadable).toBe(false)
    expect(r2.week.uses).toEqual([])
    expect(r2.total.unknown).toBe(3)
    expect(r2.stock).toBeNull()
  })
})

describe('renderRecapEmail', () => {
  it('objet, sections, alertes de stock, sans tiret long', () => {
    const mail = renderRecapEmail(buildRecap(DATA, NOW))
    expect(mail.subject).toBe('Jeu de la roue : 4 participations du lundi 5 octobre au lundi 12 octobre')
    for (const s of [
      'Participations : 4',
      'Case « offres par e-mail et SMS » cochée : 2 sur 4 (50 %)',
      'Codes utilisés : 2 (1 en caisse, 1 en ligne)',
      'Canette ABE : 1 (chance : 35 %)',
      'ROUE-AAA222 · Canette ABE · caisse · commande #1900',
      'Codes utilisés : 3 sur 6 (50 %) : 1 en caisse, 1 en ligne, 1 canal inconnu',
      'Codes encore valables : 2 · expirés sans usage : 1',
      'Shaker : 0 · épuisé : retiré du tirage',
      'Créatine : 1 · à réassortir',
    ]) {
      expect(mail.text).toContain(s)
      expect(mail.html).toContain(nbsp(s.replace(/&/g, '&amp;')))
    }
    expect(mail.html).toContain('color:#A44F33')
    expect(mail.html).toContain('cochée&nbsp;: 2 sur 4 (50&nbsp;%)')
    expect(`${mail.subject}${mail.text}${mail.html}`).not.toMatch(/[–—]/)
  })

  it('semaine vide : le récap part quand même', () => {
    const mail = renderRecapEmail(buildRecap({ codes: [], participants: [], uses: [], stock: new Map() }, NOW))
    expect(mail.subject).toContain('0 participation du')
    expect(mail.text).toContain('Case « offres par e-mail et SMS » cochée : 0 sur 0 (n/a)')
    expect(mail.text).not.toContain('Lots tirés cette semaine')
  })

  it('stock et commandes illisibles : mention explicite', () => {
    const mail = renderRecapEmail(buildRecap({ ...DATA, uses: null, stock: null }, NOW))
    expect(mail.text).toContain('Codes utilisés : commandes illisibles cette fois')
    expect(mail.text).toContain('Stock illisible cette fois')
  })
})

describe('loadRecapData', () => {
  const discount = (title: string, c: string, used: number) => ({
    discount: {
      title,
      createdAt: '2026-10-08T13:40:37Z',
      endsAt: '2026-11-07T13:40:37Z',
      asyncUsageCount: used,
      codes: { nodes: [{ code: c }] },
      customerGets: { value: { amount: { amount: '5.0' } } },
    },
  })

  it('pagine, filtre, rapproche les commandes ; stock en échec toléré', async () => {
    adminFetch.mockImplementation(async (query: string, vars: Record<string, unknown>) => {
      if (query.includes('RecapDiscounts')) {
        return vars.after
          ? { discountNodes: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [discount('Jeu roue : Un shaker : ROUE-SSS222', 'ROUE-SSS222', 0)] } }
          : {
              discountNodes: {
                pageInfo: { hasNextPage: true, endCursor: 'c1' },
                nodes: [
                  discount('Jeu roue : 5 € dès 30 € d’achat : ROUE-NAARC6', 'ROUE-NAARC6', 1),
                  discount('Autre promo', 'PROMO10', 3),
                  { discount: {} },
                ],
              },
            }
      }
      if (query.includes('RecapParticipants')) {
        return {
          customers: {
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: [
              { tags: ['jeu-roue', 'jeu-roue-bon-5', 'jeu-roue-optin'], jeuRoue: { value: JSON.stringify({ lotId: 'bon-5', code: 'ROUE-NAARC6', endsAt: 'e', playedAt: '2026-10-08T13:40:37Z' }) } },
              { tags: ['autre'], jeuRoue: null },
            ],
          },
        }
      }
      if (query.includes('RecapOrders')) {
        return {
          orders: {
            nodes: [
              { name: '#1890', createdAt: '2026-10-09T10:00:00Z', sourceName: 'pos', discountCodes: ['roue-naarc6'] },
              { name: '#1891', createdAt: '2026-10-09T11:00:00Z', sourceName: 'pos', discountCodes: ['Réduction'] },
            ],
          },
        }
      }
      throw new Error('Shopify GraphQL: stock indisponible')
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const data = await loadRecapData()
    expect(data.codes.map((c) => [c.code, c.lotId, c.used, c.amount])).toEqual([
      ['ROUE-NAARC6', 'bon-5', true, 5],
      ['ROUE-SSS222', 'shaker', false, 5],
    ])
    expect(data.participants).toEqual([{ playedAt: '2026-10-08T13:40:37Z', code: 'ROUE-NAARC6', lotId: 'bon-5', optIn: true }])
    expect(data.uses).toEqual([{ code: 'ROUE-NAARC6', order: '#1890', at: '2026-10-09T10:00:00Z', channel: 'caisse' }])
    expect(data.stock).toBeNull()

    const ordersCall = adminFetch.mock.calls.find((c) => String(c[0]).includes('RecapOrders'))!
    expect(ordersCall[1]).toEqual({ q: 'discount_code:ROUE-NAARC6' })
    expect(adminFetch.mock.calls.every((c) => c[2]?.apiVersion === '2026-04')).toBe(true)
  })

  it('codes illisibles : erreur levée (pas de récap faux)', async () => {
    adminFetch.mockRejectedValue(new Error('Shopify GraphQL: access denied'))
    await expect(loadRecapData()).rejects.toThrow('access denied')
  })
})
