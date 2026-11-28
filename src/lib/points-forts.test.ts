import { describe, it, expect } from 'vitest'
import { LONGUEUR_MAX, pointsForts } from './points-forts'

// Description réelle du Pack Gamer au 28/11/2026 (seule fiche du catalogue avec une liste).
const PACK_GAMER = `<p><strong>Des heures devant la console, presque plus de lumière du jour, des nuits trop courtes : le Pack Gamer BodyStart, c'est ce qu'il faut à ton corps pour suivre. Série limitée à 8 packs.</strong></p><h3>Jour : 3 essentiels</h3><ul>
<li>
<strong>Vitamine D3</strong> (2 000 UI) : le soleil que tu ne vois plus en novembre. Pour ton immunité, tes muscles et tes os.</li>
<li>
<strong>Magnésium bisglycinate</strong> (267 mg pour 2 gélules) : moins de fatigue, un système nerveux qui tient le rythme.</li>
<li>
<strong>Oméga 3</strong> (EPA et DHA) : pour ton cerveau, ta vision et ton cœur, après des heures d'écran.</li>
</ul><h3>Jour + Nuit : les 3 mêmes, plus la mélatonine</h3><ul><li>
<strong>Mélatonine</strong> (1 mg) : tu t'endors plus vite après la session.</li></ul>`

describe('pointsForts : 3 lignes tirées des <li> de la description', () => {
  it('Pack Gamer : les 3 premiers éléments, coupés au libellé avant « : »', () => {
    expect(pointsForts(PACK_GAMER)).toEqual([
      'Vitamine D3 (2 000 UI)',
      'Magnésium bisglycinate (267 mg pour 2 gélules)',
      'Oméga 3 (EPA et DHA)',
    ])
  })

  it('chaque ligne vient mot pour mot du texte, jamais plus longue que la limite', () => {
    const texte = PACK_GAMER.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')
    for (const l of pointsForts(PACK_GAMER)) {
      expect(l.length).toBeLessThanOrEqual(LONGUEUR_MAX)
      expect(texte).toContain(l)
    }
  })

  it('ligne courte gardée entière, sans point final ni puce', () => {
    expect(pointsForts('<ul><li>✅ Sans sucre ajouté.</li><li>• 25 g de protéines par dose</li><li>- Fabriqué en France !</li></ul>')).toEqual([
      'Sans sucre ajouté',
      '25 g de protéines par dose',
      'Fabriqué en France',
    ])
  })

  it('première phrase seulement, décimales intactes', () => {
    expect(pointsForts('<ul><li>3.5 g de créatine par dose. Le reste du texte ici.</li></ul>')).toEqual(['3.5 g de créatine par dose'])
  })

  it('sans « : », coupe à la fin d’une proposition, parenthèse jamais laissée ouverte', () => {
    expect(pointsForts('<ul><li>Une whey native filtrée à froid, sans additif ni arôme artificiel ajouté au mélange</li></ul>')).toEqual([
      'Une whey native filtrée à froid',
    ])
    expect(
      pointsForts('<ul><li>Protéine de lait native microfiltrée (issue de lait de pâturage français) très digeste</li></ul>'),
    ).toEqual(['Protéine de lait native microfiltrée'])
  })

  it('sans aucune borne : dernier mot entier puis « … »', () => {
    const [l] = pointsForts('<ul><li>Une texture onctueuse qui se mélange en quelques secondes dans un simple shaker sans grumeaux</li></ul>')
    expect(l.endsWith('…')).toBe(true)
    expect(l.length).toBeLessThanOrEqual(LONGUEUR_MAX)
    expect(l).toBe('Une texture onctueuse qui se mélange en…')
  })

  it('entités HTML décodées, espaces insécables à la française', () => {
    expect(pointsForts('<ul><li>Cookies &amp; Cream&nbsp;: 24&#160;g de prot&eacute;ines</li></ul>')).toEqual([
      'Cookies & Cream : 24 g de protéines',
    ])
  })

  it('mentions de précaution écartées, doublons retirés, 3 au plus', () => {
    const html =
      '<ul><li>Ne pas dépasser la dose journalière recommandée.</li><li>Tenir hors de portée des jeunes enfants.</li>' +
      '<li>Riche en protéines</li><li>Riche en protéines</li><li>Source de fibres</li><li>Sans gluten</li><li>Vegan</li></ul>'
    expect(pointsForts(html)).toEqual(['Riche en protéines', 'Source de fibres', 'Sans gluten'])
  })

  it('liste imbriquée : le texte de l’élément parent seulement, sans celui de la sous-liste', () => {
    expect(pointsForts('<ul><li>Trois saveurs<ul><li>Chocolat</li></ul></li></ul>')).toEqual(['Trois saveurs'])
  })

  it('pas de liste, description vide ou absente : rien (le bloc ne s’affiche pas)', () => {
    expect(pointsForts('<p>Le Mutant Mass, c’est le gainer des hardgainers.</p>')).toEqual([])
    expect(pointsForts('')).toEqual([])
    expect(pointsForts(null)).toEqual([])
    expect(pointsForts(undefined)).toEqual([])
    expect(pointsForts('<ul><li> </li><li><img src="x.png"></li></ul>')).toEqual([])
  })
})
