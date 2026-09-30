import { describe, it, expect } from 'vitest'
import { BLOG_ARTICLES } from './index'
import { PRICE_TOKEN } from '@/lib/blog-prices'

/**
 * Garde-fou éditorial : un prix de produit dans un article passe par un jeton
 * {{prix:handle|repli}} (résolu au rendu avec le prix Shopify du moment), jamais
 * en dur à côté d'un lien produit. Les montants génériques (« 30 à 50 € par
 * mois », fourchettes) restent en texte libre.
 */

// Champs rendus par la page article, seuls endroits où un jeton est résolu.
function renderedStrings(article: (typeof BLOG_ARTICLES)[number]): string[] {
  const out: string[] = []
  for (const s of article.sections) {
    for (const b of s.blocks) {
      if (b.type === 'table') b.rows.forEach((r) => out.push(...r))
      else if (b.type === 'list' || b.type === 'steps') out.push(...b.items)
      else out.push(b.text)
    }
  }
  article.faq.forEach(({ q, a }) => out.push(q, a))
  article.howToSteps?.forEach(({ name, text }) => out.push(name, text))
  return out
}

describe('prix des articles du blog', () => {
  it('chaque jeton est bien formé : handle Shopify et prix de repli « 12,90 € »', () => {
    for (const article of BLOG_ARTICLES) {
      for (const s of renderedStrings(article)) {
        for (const m of s.matchAll(PRICE_TOKEN)) {
          expect(m[1], `${article.slug} : ${m[0]}`).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
          expect(m[2], `${article.slug} : ${m[0]}`).toMatch(/^\d+,\d{2} €$/)
        }
      }
    }
  })

  it('aucun jeton hors des textes rendus (titre, metas, chapeau restent du texte simple)', () => {
    for (const a of BLOG_ARTICLES) {
      for (const field of [a.title, a.metaTitle, a.metaDescription, a.excerpt]) {
        expect(field, a.slug).not.toContain('{{')
      }
    }
  })

  it('aucun prix en dur juste après un lien produit', () => {
    // Un prix à moins de 40 caractères d'un lien /products/… est un prix DE CE produit.
    const hardCoded = /\(\/products\/[a-z0-9-]+\)[^{]{0,40}?\d+(?:,\d{2})? €/
    for (const article of BLOG_ARTICLES) {
      for (const s of renderedStrings(article)) {
        const withoutTokens = s.replace(PRICE_TOKEN, '')
        expect(withoutTokens, `${article.slug} : « ${s.slice(0, 120)} »`).not.toMatch(hardCoded)
      }
    }
  })

  it('les 20 articles citent des prix par jeton (la migration du 30/09/2026 a bien tenu)', () => {
    const withTokens = BLOG_ARTICLES.filter((a) => renderedStrings(a).some((s) => PRICE_TOKEN.test(s)))
    expect(withTokens.length).toBeGreaterThanOrEqual(20)
  })
})
