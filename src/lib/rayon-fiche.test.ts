import { describe, it, expect } from 'vitest'
import { GUIDES_PAR_ETIQUETTE, GUIDES_PAR_TYPE, guidesDeFiche, rayonDeFiche } from './rayon-fiche'
import { BLOG_ARTICLES } from '@/content/blog'

describe('rayonDeFiche', () => {
  it('page catégorie quand elle existe, libellé du menu', () => {
    expect(rayonDeFiche({ productType: 'Protéines' })).toEqual({ label: 'Protéines', href: '/categories/proteines' })
    expect(rayonDeFiche({ productType: 'Brûleur' })).toEqual({ label: 'Brûleurs', href: '/categories/bruleurs' })
    expect(rayonDeFiche({ productType: 'Santé' })).toEqual({ label: 'Santé & bien-être', href: '/categories/sante' })
  })
  it('filtre du catalogue pour les types sans page, packs, repli', () => {
    expect(rayonDeFiche({ productType: 'Accessoires' })).toEqual({ label: 'Accessoires', href: '/products?cat=accessoires' })
    expect(rayonDeFiche({ productType: 'Snacks' }).href).toBe('/products?cat=snacks')
    expect(rayonDeFiche({ productType: 'Pack' })).toEqual({ label: 'Packs', href: '/packs' })
    expect(rayonDeFiche({ productType: '' })).toEqual({ label: 'Tous les produits', href: '/products' })
  })
  it('coffrets de Noël : rayon Packs, quel que soit leur type Shopify', () => {
    const packs = { label: 'Packs', href: '/packs' }
    expect(rayonDeFiche({ productType: 'Coffret', tags: ['coffret-noel'] })).toEqual(packs)
    // Étiquette en casse libre, type vide ou type d'un rayon qui a sa page : le tag l'emporte.
    expect(rayonDeFiche({ productType: '', tags: ['Coffret-Noel '] })).toEqual(packs)
    expect(rayonDeFiche({ productType: 'Protéines', tags: ['whey', 'coffret-noel'] })).toEqual(packs)
    // Sans l'étiquette, le type Coffret suffit (Pack Gamer, listé dans /packs).
    expect(rayonDeFiche({ productType: 'Coffret', tags: ['gamer'] })).toEqual(packs)
    expect(rayonDeFiche({ productType: ' coffrets ' })).toEqual(packs)
  })
  it('un produit ordinaire ne passe pas en Packs pour un mot proche dans ses étiquettes', () => {
    expect(rayonDeFiche({ productType: 'Protéines', tags: ['coffret', 'noel', 'pack'] })).toEqual({
      label: 'Protéines',
      href: '/categories/proteines',
    })
  })
})

describe('guidesDeFiche', () => {
  it("d'après les étiquettes, 2 au plus", () => {
    expect(guidesDeFiche({ productType: 'Protéines', tags: ['gainer', 'whey'] })).toEqual([
      'gainer-prise-de-masse-comment-choisir',
      'combien-de-proteines-par-jour',
    ])
    expect(guidesDeFiche({ productType: 'Protéines', tags: ['isolate', 'whey'] })[0]).toBe('whey-ou-isolate-quelle-difference')
    // Sous-catégories du 18/11/2026
    expect(guidesDeFiche({ productType: 'Protéines', tags: ['isolate'] })[0]).toBe('whey-ou-isolate-quelle-difference')
    expect(guidesDeFiche({ productType: 'Protéines', tags: ['clear-whey'] })[0]).toBe('whey-ou-isolate-quelle-difference')
    expect(guidesDeFiche({ productType: 'Protéines', tags: ['caseine', 'isolate', 'mix', 'whey'] })).toEqual([
      'quelle-whey-choisir-debutant',
      'combien-de-proteines-par-jour',
    ])
    expect(guidesDeFiche({ productType: 'Protéines', tags: ['oeuf'] })).toEqual(['combien-de-proteines-par-jour'])
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
