import { describe, it, expect } from 'vitest'
import { buildPageMetadata, plainTextFromHtml, truncateAtWord } from './seo'

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
    // Image fournie : dimensions inconnues, donc non déclarées
    expect(images).toEqual([{ url: '/assets/og/custom.jpg' }])
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

describe('openGraph commun', () => {
  it('site_name, locale et dimensions du visuel par défaut', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const og = buildPageMetadata({ path: '/x', title: 'X' }).openGraph as any
    expect(og.siteName).toBe('BodyStart Nutrition')
    expect(og.locale).toBe('fr_FR')
    expect(og.images).toEqual([{ url: '/assets/logos/logo-v2-og.png', width: 1200, height: 630 }])
  })
})

describe('plainTextFromHtml', () => {
  it('espace entre les paragraphes, entités décodées', () => {
    expect(plainTextFromHtml('<p>Pot de 500 g.</p><p>La créatine&nbsp;: 3 g &amp; plus</p>')).toBe(
      'Pot de 500 g. La créatine : 3 g & plus'
    )
    expect(plainTextFromHtml('<ul><li>Un</li><li>Deux</li></ul>Fin&#39;s')).toBe("Un Deux Fin's")
    expect(plainTextFromHtml(null)).toBe('')
  })
})

describe('truncateAtWord', () => {
  it('texte court : inchangé', () => {
    expect(truncateAtWord('Whey native, 1 kg.')).toBe('Whey native, 1 kg.')
  })
  it('coupe au dernier mot entier avant 155 caractères, puis « … »', () => {
    const text =
      "Iso Zero, une whey isolate à 85 % de protéines, sans acides aminés ajoutés, quasi zéro sucre (0,7 g) et zéro matière grasse ajoutée, en pot de 2 kg pour 66 doses."
    const out = truncateAtWord(text)
    expect(out.length).toBeLessThanOrEqual(156)
    expect(out.endsWith('…')).toBe(true)
    expect(text.startsWith(out.slice(0, -1))).toBe(true)
    expect(out).not.toMatch(/\sz…$/)
    expect(out).toBe(
      'Iso Zero, une whey isolate à 85 % de protéines, sans acides aminés ajoutés, quasi zéro sucre (0,7 g) et zéro matière grasse ajoutée, en pot de 2 kg pour…'
    )
  })
})

describe('og:type product', () => {
  it('pas de type dans openGraph (la page rend la balise elle-même)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((buildPageMetadata({ path: '/products/x', ogType: 'product' }).openGraph as any).type).toBeUndefined()
  })
})
