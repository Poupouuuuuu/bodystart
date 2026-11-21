import { describe, expect, it } from 'vitest'
import { CATEGORY_PAGES, getCategoryPage } from './categories'

describe('CATEGORY_PAGES', () => {
  it('title ≤ 60 caractères avant le suffixe, meta ≤ 155, aucun tiret long', () => {
    for (const c of CATEGORY_PAGES) {
      expect([...c.metaTitle].length, c.slug).toBeLessThanOrEqual(60)
      expect([...c.metaDescription].length, c.slug).toBeLessThanOrEqual(155)
      const textes = [c.metaTitle, c.metaDescription, c.h1, ...c.intro, ...(c.faq ?? []).flatMap((f) => [f.q, f.a])]
      if (c.enBoutique) textes.push(c.enBoutique.titre, c.enBoutique.texte)
      for (const t of textes) expect(t, c.slug).not.toMatch(/[–—]/)
    }
  })

  it('slugs uniques', () => {
    const slugs = CATEGORY_PAGES.map((c) => c.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})

describe('Pré-workout en boutique (décision de Gestion du 18/11/2026)', () => {
  const cat = getCategoryPage('pre-workout')

  it('la page existe toujours, avec son encadré boutique', () => {
    expect(cat).toBeDefined()
    expect(cat?.enBoutique?.titre).toBe('Nos pré-workouts sont en boutique')
  })

  it('liens « pour composer le tien » calculés sur le stock, aucun lien en dur', () => {
    expect(cat?.featured).toEqual([])
    expect(cat?.composer?.titre).toBe('Pour composer le tien, en ligne')
    // Décision du 17/10/2026 : plus de citrulline malate mise en avant.
    expect(JSON.stringify(cat)).not.toMatch(/malate 2:1/i)
  })

  it('FAQ : mention caféine pour enfants et femmes enceintes ou allaitantes', () => {
    const faq = (cat?.faq ?? []).map((f) => f.a).join(' ')
    expect(faq).toContain('déconseillés aux enfants et aux femmes enceintes ou allaitantes')
  })
})
