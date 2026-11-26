import { describe, expect, it } from 'vitest'
import { estImageShopify, shopifyLoader } from './images'

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
