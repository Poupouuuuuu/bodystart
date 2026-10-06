import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import { parsePolicyHtml, runsText, decodeEntities, type PolicyBlock } from './parsePolicyHtml'
import { assertUsablePolicy } from '@/lib/shopify/policies'

// HTML réel de shop.termsOfSale (Storefront 2026-04), relevé le 06/10/2026.
const CGV_HTML = fs.readFileSync(path.join(__dirname, 'fixtures/cgv-shopify-2026-10-06.html'), 'utf8')

const blockText = (b: PolicyBlock) => (b.type === 'p' ? runsText(b.runs) : b.items.map(runsText).join(' | '))

describe('parsePolicyHtml : CGV Shopify réelles', () => {
  const policy = parsePolicyHtml(CGV_HTML)

  it('extrait la date et les 11 articles dans l’ordre', () => {
    expect(policy.updatedLine).toBe('Dernière mise à jour : 6 octobre 2026')
    expect(policy.intro).toEqual([])
    expect(policy.sections.map((s) => s.title)).toEqual([
      '1. Objet',
      '2. Produits',
      '3. Prix',
      '4. Commandes',
      '5. Paiement',
      '6. Livraison',
      '7. Droit de rétractation',
      '8. Garanties',
      '9. Données personnelles',
      '10. Litiges',
      '11. Médiateur de la consommation',
    ])
    expect(policy.sections.every((s) => s.blocks.length === 1 && s.blocks[0].type === 'p')).toBe(true)
  })

  it('décode les entités (Click & Collect)', () => {
    expect(blockText(policy.sections[5].blocks[0])).toContain('le Click & Collect en boutique')
  })

  it('garde le lien du médiateur, sans espace parasite autour', () => {
    const art11 = policy.sections[10].blocks[0]
    expect(art11.type).toBe('p')
    if (art11.type !== 'p') return
    const link = art11.runs.find((r) => r.href)
    expect(link).toEqual({ text: 'https://www.cm2c.net', href: 'https://www.cm2c.net' })
    expect(runsText(art11.runs)).toContain('75008 Paris, https://www.cm2c.net. La demande de médiation')
  })
})

describe('parsePolicyHtml : balises gérées', () => {
  it('mise en forme en ligne, sauts de ligne, liens sûrs uniquement', () => {
    const { sections } = parsePolicyHtml(
      '<h3>A</h3><p>Écris à <a href="mailto:x@y.fr">x@y.fr</a>, <strong>vite</strong> et <em>bien</em>.<br>Suite <a href="javascript:alert(1)">piège</a></p>'
    )
    const b = sections[0].blocks[0]
    if (b.type !== 'p') throw new Error('paragraphe attendu')
    expect(b.runs).toEqual([
      { text: 'Écris à ' },
      { text: 'x@y.fr', href: 'mailto:x@y.fr' },
      { text: ', ' },
      { text: 'vite', strong: true },
      { text: ' et ' },
      { text: 'bien', em: true },
      { text: '.' },
      { text: '', br: true },
      { text: 'Suite piège' },
    ])
  })

  it('listes (avec p imbriqué dans li), div englobant, texte hors bloc', () => {
    const { intro, sections } = parsePolicyHtml(
      '<div>Préambule libre<h2>Titre</h2><ul>\n<li>\n<strong>Un</strong> premier</li><li><p>Deux</p></li></ul><ol><li>Trois</li></ol></div>'
    )
    expect(intro.map(blockText)).toEqual(['Préambule libre'])
    expect(sections[0].title).toBe('Titre')
    expect(sections[0].blocks.map((b) => b.type)).toEqual(['ul', 'ol'])
    expect(sections[0].blocks.map(blockText)).toEqual(['Un premier | Deux', 'Trois'])
  })

  it('accepte h2, h3 et h4 comme titres d’article', () => {
    const { sections } = parsePolicyHtml('<h2>A</h2><p>a</p><h4>B</h4><p>b</p>')
    expect(sections.map((s) => s.title)).toEqual(['A', 'B'])
  })

  it('décode les entités nommées et numériques', () => {
    expect(decodeEntities('l&#39;offre&nbsp;: 5&#x20AC; &laquo;ok&raquo; &inconnu;')).toBe(
      "l'offre : 5€ «ok» &inconnu;"
    )
  })
})

describe('assertUsablePolicy', () => {
  it('accepte les CGV réelles', () => {
    expect(() => assertUsablePolicy(parsePolicyHtml(CGV_HTML), 'CGV')).not.toThrow()
  })

  it('refuse un texte vide, sans article ou avec un article vide', () => {
    expect(() => assertUsablePolicy(parsePolicyHtml(''), 'CGV')).toThrow(/dernière version conservée/)
    expect(() => assertUsablePolicy(parsePolicyHtml('<p>Juste un paragraphe</p>'), 'CGV')).toThrow()
    expect(() => assertUsablePolicy(parsePolicyHtml('<h3>1. Objet</h3><p> </p>'), 'CGV')).toThrow()
  })
})
