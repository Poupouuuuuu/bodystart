// @vitest-environment jsdom
/**
 * Variante d'ouverture de la fiche produit (29/09/2026) :
 * - sans paramètre : la première saveur EN STOCK (YEAAH EAA s'ouvrait sur
 *   Fruit Punch épuisé alors que Tropical et Watermelon étaient disponibles) ;
 * - avec ?variant=<ID> (pubs dynamiques Meta) : cette variante, même épuisée ;
 * - un seul ViewContent Meta, avec la variante réellement affichée.
 */
import { createElement } from 'react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import type { ShopifyProductVariant } from '@/lib/shopify/types'

const viewContent = vi.fn()
vi.mock('@/lib/meta-pixel', () => ({
  metaViewContent: (item: unknown) => {
    viewContent(item)
    return 'event-id'
  },
}))
vi.mock('@/lib/analytics', () => ({ gaViewItem: vi.fn() }))
vi.mock('@/hooks/useCart', () => ({ useCart: () => ({ addItem: vi.fn(async () => true), isOpen: false }) }))
vi.mock('next/image', () => ({
  default: (props: { src: string; alt: string }) => createElement('img', { src: props.src, alt: props.alt }),
}))
vi.mock('next/link', () => ({
  default: (props: { href: string; children: React.ReactNode }) => createElement('a', { href: props.href }, props.children),
}))

import BuyBoxV2 from './BuyBoxV2'

// Données réelles de YEAAH EAA au 29/09/2026.
const img = (name: string) => ({ url: `https://cdn.shopify.com/${name}.png`, altText: name, width: 800, height: 800 })
const variant = (id: string, flavor: string, available: boolean): ShopifyProductVariant => ({
  id: `gid://shopify/ProductVariant/${id}`,
  title: `${flavor} / 400g`,
  availableForSale: available,
  quantityAvailable: available ? 10 : 0,
  price: { amount: '29.9', currencyCode: 'EUR' },
  compareAtPrice: null,
  image: img(flavor),
  selectedOptions: [
    { name: 'Saveur', value: flavor },
    { name: 'Format', value: '400g' },
  ],
})
const VARIANTS = [
  variant('53981934813526', 'Fruit Punch', false),
  variant('53981934846294', 'Tropical', true),
  variant('53981934879062', 'Watermelon', true),
]

function renderFiche(search: string) {
  window.history.replaceState({}, '', `/products/yeaah-eaa${search}`)
  return render(
    createElement(BuyBoxV2, {
      images: VARIANTS.map((v) => v.image!),
      variants: VARIANTS,
      title: 'YEAAH EAA',
      handle: 'yeaah-eaa',
      productType: 'Acides aminés',
      collectionName: null,
      collectionHandle: null,
      vendor: 'Dedicated',
    })
  )
}

const pressedFlavor = () =>
  screen
    .getAllByRole('button', { pressed: true })
    .map((b) => b.textContent ?? '')
    .find((t) => /Fruit Punch|Tropical|Watermelon/.test(t))

beforeEach(() => {
  viewContent.mockClear()
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("BuyBoxV2 : variante d'ouverture", () => {
  it('sans paramètre : première saveur en stock (Tropical), pas Fruit Punch épuisé', async () => {
    renderFiche('')
    await waitFor(() => expect(viewContent).toHaveBeenCalledTimes(1))
    expect(pressedFlavor()).toMatch(/Tropical/)
    expect(viewContent.mock.calls[0][0]).toMatchObject({ variantId: 'gid://shopify/ProductVariant/53981934846294' })
  })

  it('?variant= de la pub (Watermelon) : la fiche s’ouvre sur Watermelon, un seul ViewContent', async () => {
    renderFiche('?utm_source=instagram&variant=53981934879062&fbclid=abc123')
    await waitFor(() => expect(pressedFlavor()).toMatch(/Watermelon/))
    await waitFor(() => expect(viewContent).toHaveBeenCalledTimes(1))
    expect(viewContent.mock.calls[0][0]).toMatchObject({ variantId: 'gid://shopify/ProductVariant/53981934879062' })
  })

  it('?variant= d’une saveur épuisée : respectée, avec le bandeau épuisé', async () => {
    renderFiche('?variant=53981934813526')
    await waitFor(() => expect(pressedFlavor()).toMatch(/Fruit Punch/))
    expect(screen.getByText(/momentanément épuisé/)).toBeTruthy()
    await waitFor(() => expect(viewContent).toHaveBeenCalledTimes(1))
    expect(viewContent.mock.calls[0][0]).toMatchObject({ variantId: 'gid://shopify/ProductVariant/53981934813526' })
  })

  it('?variant= inconnu : retour à la première saveur en stock', async () => {
    renderFiche('?variant=123456')
    await waitFor(() => expect(viewContent).toHaveBeenCalledTimes(1))
    expect(pressedFlavor()).toMatch(/Tropical/)
  })
})

describe('formats affichés à la française (Mutant Mass)', () => {
  it('« 2.27kg » et « 6.8kg » s’affichent « 2,27 kg » et « 6,8 kg », titres Shopify intacts', () => {
    window.history.replaceState({}, '', '/products/mutant-mass')
    const mm = (id: string, size: string): ShopifyProductVariant => ({
      ...variant(id, 'Triple Chocolate', true),
      title: `Triple Chocolate / ${size}`,
      selectedOptions: [
        { name: 'Saveur', value: 'Triple Chocolate' },
        { name: 'Format', value: size },
      ],
    })
    const variants = [mm('1', '2.27kg'), mm('2', '6.8kg')]
    render(
      createElement(BuyBoxV2, {
        images: [img('mutant')],
        variants,
        title: 'Mutant Mass',
        handle: 'mutant-mass',
        productType: 'Protéines',
        collectionName: null,
        collectionHandle: null,
        vendor: 'Mutant',
      })
    )
    expect(screen.getByRole('button', { name: /^2,27\s+kg$/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^6,8\s+kg$/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /2\.27kg/ })).toBeNull()
    expect(variants[0].title).toBe('Triple Chocolate / 2.27kg')
  })
})

describe('barre d’achat fixe : la variante choisie à côté du prix', () => {
  it('rappelle la saveur choisie et suit le changement de saveur', async () => {
    renderFiche('')
    await waitFor(() => expect(viewContent).toHaveBeenCalledTimes(1))
    // Format 400 g identique partout : seule la saveur est rappelée.
    expect(screen.getByTitle('Tropical')).toBeTruthy()
    screen.getByRole('button', { name: 'Watermelon' }).click()
    await waitFor(() => expect(screen.getByTitle('Watermelon')).toBeTruthy())
    expect(screen.queryByTitle('Tropical')).toBeNull()
  })
})

describe('barre d’achat fixe : visibilité du bouton principal', () => {
  type Rappel = (entries: { intersectionRatio: number }[]) => void
  const observateurs: { rappel: Rappel; marge: string }[] = []
  beforeEach(() => {
    observateurs.length = 0
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(rappel: Rappel, options: { rootMargin: string }) {
          observateurs.push({ rappel, marge: options.rootMargin })
        }
        observe() {}
        disconnect() {}
      },
    )
  })
  afterEach(() => document.documentElement.style.removeProperty('--bandeau-cookies'))

  const barre = () => screen.getByTitle('Tropical').closest('div.fixed') as HTMLElement

  it('cachée quand le bouton est visible à 90 %, affichée s’il ne dépasse qu’à moitié', async () => {
    renderFiche('')
    await waitFor(() => expect(observateurs.length).toBe(1))
    const { rappel } = observateurs[0]
    rappel([{ intersectionRatio: 1 }])
    await waitFor(() => expect(barre().hasAttribute('inert')).toBe(true))
    rappel([{ intersectionRatio: 0.5 }])
    await waitFor(() => expect(barre().hasAttribute('inert')).toBe(false))
  })

  it('la partie cachée par le bandeau cookies ne compte pas (marge refaite quand il change)', async () => {
    document.documentElement.style.setProperty('--bandeau-cookies', '117px')
    renderFiche('')
    await waitFor(() => expect(observateurs.length).toBe(1))
    expect(observateurs[0].marge).toBe('0px 0px -125px 0px')
    document.documentElement.style.setProperty('--bandeau-cookies', '0px')
    await waitFor(() => expect(observateurs.length).toBe(2))
    expect(observateurs[1].marge).toBe('0px 0px -8px 0px')
  })
})
