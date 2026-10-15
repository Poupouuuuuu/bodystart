import { describe, it, expect } from 'vitest'
import { GUIDES_PAR_ETIQUETTE, GUIDES_PAR_TYPE, guidesDeFiche, rayonDeFiche } from './rayon-fiche'
import { BLOG_ARTICLES } from '@/content/blog'

const ouvert = { coffretsOuverts: true }
const ferme = { coffretsOuverts: false }

describe('rayonDeFiche', () => {
  it('page catégorie quand elle existe, libellé du menu', () => {
    expect(rayonDeFiche({ productType: 'Protéines' }, ferme)).toEqual({ label: 'Protéines', href: '/categories/proteines' })
    expect(rayonDeFiche({ productType: 'Brûleur' }, ferme)).toEqual({ label: 'Brûleurs', href: '/categories/bruleurs' })
    expect(rayonDeFiche({ productType: 'Santé' }, ferme)).toEqual({ label: 'Santé & bien-être', href: '/categories/sante' })
  })
  it('filtre du catalogue pour les types sans page, packs, repli', () => {
    expect(rayonDeFiche({ productType: 'Accessoires' }, ferme)).toEqual({ label: 'Accessoires', href: '/products?cat=accessoires' })
    expect(rayonDeFiche({ productType: 'Snacks' }, ferme).href).toBe('/products?cat=snacks')
    expect(rayonDeFiche({ productType: 'Pack' }, ferme)).toEqual({ label: 'Packs', href: '/packs' })
    expect(rayonDeFiche({ productType: '' }, ferme)).toEqual({ label: 'Tous les produits', href: '/products' })
  })
  it('coffrets : leur page pendant la période, le catalogue sinon', () => {
    const coffret = { productType: 'Coffret', tags: ['coffret-noel'] }
    expect(rayonDeFiche(coffret, ouvert)).toEqual({ label: 'Coffrets de Noël', href: '/coffrets-noel' })
    expect(rayonDeFiche(coffret, ferme).href).toBe('/products')
  })
})

describe('guidesDeFiche', () => {
  it("d'après les étiquettes, 2 au plus", () => {
    expect(guidesDeFiche({ productType: 'Protéines', tags: ['gainer', 'whey'] })).toEqual([
      'gainer-prise-de-masse-comment-choisir',
      'combien-de-proteines-par-jour',
    ])
    expect(guidesDeFiche({ productType: 'Protéines', tags: ['isolate', 'whey'] })[0]).toBe('whey-ou-isolate-quelle-difference')
    expect(guidesDeFiche({ productType: 'Acides aminés', tags: ['eaa'] })).toEqual(['eaa-ou-bcaa-lequel-prendre'])
    expect(guidesDeFiche({ productType: 'Santé', tags: ['magnesium'] })[0]).toBe('magnesium-bienfaits-quelle-forme-choisir')
  })
  it('par le titre quand l’étiquette manque (vitamine D)', () => {
    expect(guidesDeFiche({ productType: 'Santé', title: 'Vitamine D3 gouttes', tags: ['vitamine'] })).toEqual([
      'vitamine-d-combien-quand-pourquoi',
    ])
  })
  it('guides du rayon par défaut, rien pour accessoires, packs et coffrets', () => {
    expect(guidesDeFiche({ productType: 'Créatine', tags: [] })).toEqual(['creatine-avant-ou-apres-seance', 'creatine-pour-les-femmes'])
    expect(guidesDeFiche({ productType: 'Accessoires', tags: ['shaker'] })).toEqual([])
    expect(guidesDeFiche({ productType: 'Pack', tags: ['pack'] })).toEqual([])
    expect(guidesDeFiche({ productType: 'Coffret', tags: ['coffret-noel'] })).toEqual([])
  })
  it('chaque guide cité existe dans le blog', () => {
    const slugs = [...GUIDES_PAR_ETIQUETTE.flatMap((r) => r.guides), ...Object.values(GUIDES_PAR_TYPE).flat()]
    const connus = new Set(BLOG_ARTICLES.map((a) => a.slug))
    for (const s of slugs) expect(connus.has(s), s).toBe(true)
  })
})
