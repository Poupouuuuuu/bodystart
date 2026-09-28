import { describe, it, expect, afterEach } from 'vitest'
import { variantNumericId, metaViewContent, metaAddToCart, metaTrack, metaFlushQueue } from './meta-pixel'
import { CONSENT_KEY, CONSENT_VERSION } from './consent'

/* eslint-disable @typescript-eslint/no-explicit-any */

const VARIANT_GID = 'gid://shopify/ProductVariant/53981934813526' // ID de contenu réel du catalogue Meta
type Stored = Record<string, unknown> | null

// window factice : localStorage (choix cookies) + espion fbq optionnel.
function setWindow(consent: Stored, withFbq: boolean) {
  const store: Record<string, string> = {}
  if (consent) store[CONSENT_KEY] = JSON.stringify(consent)
  const calls: unknown[][] = []
  const w: any = {
    localStorage: {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = v
      },
    },
    dispatchEvent: () => true,
  }
  if (withFbq) w.fbq = (...args: unknown[]) => calls.push(args)
  ;(globalThis as any).window = w
  return { calls, w }
}

const REFUSED = { necessary: true, analytics: false, marketing: false, v: CONSENT_VERSION }
const ANALYTICS_ONLY = { necessary: true, analytics: true, marketing: false, v: CONSENT_VERSION }
const ALL = { necessary: true, analytics: true, marketing: true, v: CONSENT_VERSION }
const LEGACY_ALL = { necessary: true, analytics: true, marketing: true } // accord donné avant le pixel Meta

afterEach(() => {
  // Vide la file entre deux tests : fbq présent sans accord → file jetée.
  setWindow(null, true)
  metaFlushQueue()
  delete (globalThis as any).window
})

describe('variantNumericId : format des ID du catalogue Meta', () => {
  it('GID de variante → ID numérique seul', () => {
    expect(variantNumericId(VARIANT_GID)).toBe('53981934813526')
  })
  it('ID déjà numérique : inchangé ; paramètre de requête ignoré', () => {
    expect(variantNumericId('53981934813526')).toBe('53981934813526')
    expect(variantNumericId(`${VARIANT_GID}?selling_plan=1`)).toBe('53981934813526')
  })
  it('refuse un GID de produit, un autre format ou une valeur vide', () => {
    expect(variantNumericId('gid://shopify/Product/10795499585878')).toBeNull()
    expect(variantNumericId('shopify_FR_10795499585878_53981934813526')).toBeNull()
    expect(variantNumericId('')).toBeNull()
    expect(variantNumericId(undefined)).toBeNull()
  })
})

describe('Meta Pixel : aucun appel fbq sans accord publicité', () => {
  const item = { variantId: VARIANT_GID, name: 'YEAAH EAA', price: 29.9 }
  const cases: [string, Stored][] = [
    ['aucun choix enregistré', null],
    ['tout refusé', REFUSED],
    ["mesure d'audience acceptée seule", ANALYTICS_ONLY],
    ['accord publicité antérieur au pixel Meta', LEGACY_ALL],
  ]
  it.each(cases)('%s', (_label, consent) => {
    const { calls } = setWindow(consent, true)
    expect(metaViewContent(item)).toBeNull()
    expect(metaAddToCart({ ...item, quantity: 2 })).toBeNull()
    expect(metaTrack('PageView')).toBeNull()
    metaFlushQueue()
    expect(calls).toHaveLength(0)
  })

  it("un événement émis sans accord ne part pas après un accord ultérieur", () => {
    setWindow(REFUSED, false)
    metaViewContent(item)
    const { calls } = setWindow(ALL, true)
    metaFlushQueue()
    expect(calls).toHaveLength(0)
  })

  it('accord retiré avant le chargement du pixel : la file est jetée', () => {
    setWindow(ALL, false)
    expect(metaViewContent(item)).not.toBeNull() // mis en file
    const { calls } = setWindow(REFUSED, true)
    metaFlushQueue()
    expect(calls).toHaveLength(0)
  })
})

describe('Meta Pixel : avec accord publicité', () => {
  it("ViewContent : content_ids = [ID de variante], content_type 'product', EUR, eventID", () => {
    const { calls } = setWindow(ALL, true)
    const id = metaViewContent({ variantId: VARIANT_GID, name: 'YEAAH EAA', price: 29.9, category: 'Acides aminés' })
    expect(calls).toHaveLength(1)
    const [method, name, params, options] = calls[0] as [string, string, any, any]
    expect(method).toBe('track')
    expect(name).toBe('ViewContent')
    expect(params.content_ids).toEqual(['53981934813526'])
    expect(params.content_type).toBe('product')
    expect(params.currency).toBe('EUR')
    expect(params.value).toBe(29.9)
    expect(params.content_category).toBe('Acides aminés')
    expect(params.contents).toEqual([{ id: '53981934813526', quantity: 1, item_price: 29.9 }])
    expect(options.eventID).toBe(id)
  })

  it('AddToCart : value = prix × quantité, num_items', () => {
    const { calls } = setWindow(ALL, true)
    metaAddToCart({ variantId: VARIANT_GID, name: 'YEAAH EAA', price: 29.9, quantity: 3 })
    const [, name, params] = calls[0] as [string, string, any]
    expect(name).toBe('AddToCart')
    expect(params.content_ids).toEqual(['53981934813526'])
    expect(params.value).toBe(89.7)
    expect(params.num_items).toBe(3)
  })

  it('chaque événement a son propre eventID', () => {
    const { calls } = setWindow(ALL, true)
    metaTrack('PageView')
    metaViewContent({ variantId: VARIANT_GID, name: 'X', price: 1 })
    const ids = calls.map((c) => (c[3] as any).eventID)
    expect(ids.every(Boolean)).toBe(true)
    expect(new Set(ids).size).toBe(2)
  })

  it('variante invalide : rien ne part', () => {
    const { calls } = setWindow(ALL, true)
    expect(metaViewContent({ variantId: 'gid://shopify/Product/1', name: 'X' })).toBeNull()
    expect(calls).toHaveLength(0)
  })

  it('fbq pas encore chargé : file vidée une seule fois, PageView en premier', () => {
    const { w } = setWindow(ALL, false)
    metaViewContent({ variantId: VARIANT_GID, name: 'X', price: 1 })
    metaTrack('PageView')
    const calls: unknown[][] = []
    w.fbq = (...args: unknown[]) => calls.push(args)
    metaFlushQueue()
    metaFlushQueue()
    expect(calls.map((c) => c[1])).toEqual(['PageView', 'ViewContent'])
  })
})
