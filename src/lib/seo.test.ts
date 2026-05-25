import { describe, it, expect } from 'vitest'
import { buildPageMetadata } from './seo'

describe('buildPageMetadata', () => {
  it('alternates.canonical = path relatif', () => {
    const meta = buildPageMetadata({ path: '/parrainage' })
    expect(meta.alternates?.canonical).toBe('/parrainage')
  })

  it('openGraph.url = path relatif', () => {
    const meta = buildPageMetadata({ path: '/stores' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((meta.openGraph as any)?.url).toBe('/stores')
  })

  it('title + description renseignes dans meta et openGraph', () => {
    const meta = buildPageMetadata({
      path: '/conseil',
      title: 'Nos conseils',
      description: 'Tu sais quoi prendre ?',
    })
    expect(meta.title).toBe('Nos conseils')
    expect(meta.description).toBe('Tu sais quoi prendre ?')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((meta.openGraph as any)?.title).toBe('Nos conseils')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((meta.openGraph as any)?.description).toBe('Tu sais quoi prendre ?')
  })

  it('throw si le path ne commence pas par /', () => {
    expect(() => buildPageMetadata({ path: 'parrainage' })).toThrow()
    expect(() => buildPageMetadata({ path: 'https://example.com' })).toThrow()
  })

  it('ogImage est utilise dans openGraph et twitter', () => {
    const meta = buildPageMetadata({
      path: '/x',
      title: 'X',
      ogImage: '/assets/og/custom.jpg',
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const images = (meta.openGraph as any)?.images
    expect(images).toEqual([{ url: '/assets/og/custom.jpg', width: 1200, height: 630 }])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((meta.twitter as any)?.images).toEqual(['/assets/og/custom.jpg'])
  })

  it('noIndex=true ajoute robots index:false', () => {
    const meta = buildPageMetadata({ path: '/account', title: 'Compte', noIndex: true })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((meta.robots as any)?.index).toBe(false)
  })

  it('twitter card absente si pas de title ni description', () => {
    const meta = buildPageMetadata({ path: '/raw' })
    expect(meta.twitter).toBeUndefined()
  })

  it('ogType custom (article, product)', () => {
    const meta = buildPageMetadata({ path: '/x', ogType: 'article' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((meta.openGraph as any)?.type).toBe('article')
  })
})
