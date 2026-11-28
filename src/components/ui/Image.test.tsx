/**
 * Rendu serveur de components/ui/Image (28/11/2026) : aucune image ne passe par
 * /_next/image (402 depuis le 25/11), les photos locales du manifeste ont un
 * srcset vers leurs variantes, le reste part tel quel.
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Image from './Image'

function html(props: Record<string, unknown>) {
  return renderToStaticMarkup(createElement(Image, { alt: '', ...props } as never))
}

describe('components/ui/Image', () => {
  it('photo locale du manifeste : srcset vers /tailles, priorité gardée', () => {
    const h = html({
      src: '/assets/interieur.webp',
      fill: true,
      priority: true,
      fetchPriority: 'high',
      sizes: '(max-width: 640px) 70vw, 100vw',
    })
    expect(h).toContain('srcSet="/tailles/assets/interieur-640.webp 640w')
    expect(h).toContain('/tailles/assets/interieur-828.webp 828w')
    expect(h).toContain('src="/tailles/assets/interieur-1080.webp"')
    expect(h).toContain('fetchPriority="high"')
    expect(h).not.toContain('loading="lazy"')
    expect(h).not.toContain('/_next/image')
  })

  it('largeur fixe : variantes 1x / 2x', () => {
    const h = html({ src: '/boutique/rayon-isozero.webp', width: 300, height: 400 })
    expect(h).toContain('/tailles/boutique/rayon-isozero-384.webp 1x')
    expect(h).toContain('/tailles/boutique/rayon-isozero-640.webp 2x')
    expect(h).not.toContain('/_next/image')
  })

  it('logo hors manifeste et unoptimized explicite : servis tels quels', () => {
    const logo = html({ src: '/assets/logos/logo-v2-horizontal.png', width: 155, height: 50 })
    expect(logo).toContain('src="/assets/logos/logo-v2-horizontal.png"')
    expect(logo).not.toContain('srcSet')
    const fond = html({ src: '/bg-vegetal-800.webp', fill: true, unoptimized: true })
    expect(fond).toContain('src="/bg-vegetal-800.webp"')
    const force = html({ src: '/assets/interieur.webp', fill: true, unoptimized: true })
    expect(force).toContain('src="/assets/interieur.webp"')
    expect(force).not.toContain('/tailles/')
  })

  it('image Shopify : toujours le CDN Shopify', () => {
    const h = html({ src: 'https://cdn.shopify.com/s/files/1/x.jpg?v=1', fill: true, sizes: '50vw' })
    expect(h).toContain('https://cdn.shopify.com/s/files/1/x.jpg?v=1&amp;width=640 640w')
    expect(h).not.toContain('/_next/image')
  })
})
