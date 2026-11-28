import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { choisirLargeur, estImageShopify, largeursLocales, localLoader, shopifyLoader, varianteLocale } from './images'
import { IMAGES_LOCALES } from './images-locales'

const PACK = 'https://cdn.shopify.com/s/files/1/1030/7679/0614/files/pack-gamer-graphique-1200.jpg?v=1795625988'

describe('images Shopify (CDN Shopify, incident du 25/11/2026)', () => {
  it('reconnaît le CDN Shopify, et lui seul', () => {
    expect(estImageShopify(PACK)).toBe(true)
    expect(estImageShopify('/assets/interieur.webp')).toBe(false)
    expect(estImageShopify('/bg-vegetal-800.webp')).toBe(false)
    expect(estImageShopify('https://images.unsplash.com/photo-1?w=800')).toBe(false)
    expect(estImageShopify('http://cdn.shopify.com/s/files/x.jpg')).toBe(false)
    expect(estImageShopify('https://cdn.shopify.com.example.com/x.jpg')).toBe(false)
    expect(estImageShopify('')).toBe(false)
  })

  it('ajoute la largeur en gardant la version de l’image', () => {
    expect(shopifyLoader({ src: PACK, width: 640, quality: 75 })).toBe(`${PACK}&width=640`)
    expect(shopifyLoader({ src: 'https://cdn.shopify.com/s/files/x.png', width: 384 })).toBe('https://cdn.shopify.com/s/files/x.png?width=384')
  })

  it('remplace une largeur déjà présente au lieu de la doubler', () => {
    expect(shopifyLoader({ src: 'https://cdn.shopify.com/s/files/x.jpg?width=200&v=1', width: 828 })).toBe(
      'https://cdn.shopify.com/s/files/x.jpg?width=828&v=1'
    )
  })
})

describe('photos locales en variantes à largeurs fixes (28/11/2026)', () => {
  const MANIFESTE = { '/boutique/x.webp': [384, 640, 828, 1080], '/assets/petite.jpg': [300] }

  it('prend la plus petite variante qui suffit', () => {
    expect(choisirLargeur([384, 640, 828, 1080], 640)).toBe(640)
    expect(choisirLargeur([384, 640, 828, 1080], 641)).toBe(828)
    expect(choisirLargeur([384, 640, 828, 1080], 750)).toBe(828)
    expect(choisirLargeur([384, 640, 828, 1080], 16)).toBe(384)
    // ordre du manifeste indifférent
    expect(choisirLargeur([1080, 384, 828, 640], 700)).toBe(828)
  })

  it('sinon la plus grande, jamais au-delà de l’original', () => {
    expect(choisirLargeur([384, 640, 828, 1080], 1200)).toBe(1080)
    expect(choisirLargeur([384, 640, 828, 1080], 3840)).toBe(1080)
    expect(choisirLargeur([300], 1920)).toBe(300)
    expect(choisirLargeur([], 640)).toBeNull()
  })

  it('donne l’URL de la variante sous /tailles, en WebP', () => {
    expect(varianteLocale('/boutique/x.webp', 750, MANIFESTE)).toBe('/tailles/boutique/x-828.webp')
    expect(varianteLocale('/boutique/x.webp', 2048, MANIFESTE)).toBe('/tailles/boutique/x-1080.webp')
    expect(varianteLocale('/assets/petite.jpg', 640, MANIFESTE)).toBe('/tailles/assets/petite-300.webp')
  })

  it('ignore ce qui n’est pas dans le manifeste (servi tel quel)', () => {
    expect(varianteLocale('/assets/logos/logo-v2-horizontal.png', 384, MANIFESTE)).toBeNull()
    expect(varianteLocale('/boutique/x.webp?v=2', 640, MANIFESTE)).toBeNull()
    expect(varianteLocale('constructor', 640, MANIFESTE)).toBeNull()
    expect(largeursLocales('toString', MANIFESTE)).toBeUndefined()
    expect(localLoader({ src: '/inconnue.webp', width: 640 })).toBe('/inconnue.webp')
  })

  it('ne passe jamais par /_next/image', () => {
    for (const src of Object.keys(IMAGES_LOCALES)) {
      for (const w of [16, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]) {
        const url = localLoader({ src, width: w, quality: 75 })
        expect(url.startsWith('/tailles/')).toBe(true)
        expect(url).not.toContain('/_next/image')
      }
    }
  })

  it('chaque variante du manifeste existe dans public/ (sinon relancer scripts/images-tailles.mjs)', () => {
    const publicDir = join(__dirname, '..', '..', 'public')
    expect(Object.keys(IMAGES_LOCALES).length).toBeGreaterThan(0)
    for (const [src, largeurs] of Object.entries(IMAGES_LOCALES)) {
      expect(existsSync(join(publicDir, src)), src).toBe(true)
      for (const l of largeurs) {
        const variante = varianteLocale(src, l)!
        expect(variante).toMatch(new RegExp(`-${l}\\.webp$`))
        expect(existsSync(join(publicDir, variante)), variante).toBe(true)
      }
    }
  })

  it('le hero de l’accueil a ses variantes', () => {
    expect(largeursLocales('/assets/interieur.webp')).toEqual([384, 640, 828, 1080])
    // 70vw d’un téléphone de 390 px en ×3 : 819 px, donc la variante 828
    expect(localLoader({ src: '/assets/interieur.webp', width: 828 })).toBe('/tailles/assets/interieur-828.webp')
  })
})
