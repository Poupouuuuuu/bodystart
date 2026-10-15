import { describe, it, expect, vi } from 'vitest'
import { aSoumettre, cleValide, contenuFiche, corpsIndexNow, soumettre, versionDeDate } from './indexnow'

const SITE = 'https://bodystart-nutrition.fr'
const u = (p: string) => `${SITE}${p}`

describe('cleValide', () => {
  it('8 à 128 caractères, lettres, chiffres, tirets', () => {
    expect(cleValide('a1b2c3d4')).toBe(true)
    expect(cleValide('a'.repeat(128))).toBe(true)
    expect(cleValide('a1b2c3')).toBe(false)
    expect(cleValide('a'.repeat(129))).toBe(false)
    expect(cleValide('cle avec espace')).toBe(false)
    expect(cleValide(undefined)).toBe(false)
  })
})

describe('aSoumettre', () => {
  const entrees = [
    { url: u('/'), version: '-' },
    { url: u('/blog/eaa-ou-bcaa-lequel-prendre'), version: versionDeDate('2026-10-20T12:00:00Z') },
    { url: u('/products/crunch-bar'), version: 'abc' },
  ]
  it('premier passage : tout le site', () => {
    const { urls, etat } = aSoumettre(entrees, {})
    expect(urls).toHaveLength(3)
    expect(etat[u('/products/crunch-bar')]).toBe('abc')
  })
  it('rien de changé : rien à soumettre (pas de renvoi d’une URL inchangée)', () => {
    const { etat } = aSoumettre(entrees, {})
    expect(aSoumettre(entrees, etat).urls).toEqual([])
  })
  it('fiche modifiée, nouveau guide, fiche retirée', () => {
    const { etat } = aSoumettre(entrees, {})
    const apres = [
      ...entrees.filter((e) => !e.url.endsWith('crunch-bar')),
      { url: u('/blog/nouveau'), version: versionDeDate('2026-10-21') },
      { url: u('/products/whey'), version: 'x' },
    ]
    const ensuite = aSoumettre(apres, { ...etat, [u('/products/whey')]: 'w' })
    expect(ensuite.urls.sort()).toEqual([u('/blog/nouveau'), u('/products/crunch-bar'), u('/products/whey')].sort())
    expect(u('/products/crunch-bar') in ensuite.etat).toBe(false)
  })
})

describe('contenuFiche', () => {
  const fiche = {
    title: 'Crunch Bar',
    description: 'Barre  protéinée',
    availableForSale: true,
    priceRange: { minVariantPrice: { amount: '2.9' }, maxVariantPrice: { amount: '2.90' } },
  }
  it('stable aux espaces et au format des prix, sensible à la disponibilité et au prix', () => {
    expect(contenuFiche({ ...fiche, description: 'Barre protéinée' })).toBe(contenuFiche(fiche))
    expect(contenuFiche({ ...fiche, availableForSale: false })).not.toBe(contenuFiche(fiche))
    expect(
      contenuFiche({ ...fiche, priceRange: { ...fiche.priceRange, minVariantPrice: { amount: '2.5' } } }),
    ).not.toBe(contenuFiche(fiche))
  })
})

describe('soumission', () => {
  it('corps IndexNow : hôte, clé, fichier de clé à la racine', () => {
    expect(corpsIndexNow(`${SITE}/`, 'a1b2c3d4', [u('/')])).toEqual({
      host: 'bodystart-nutrition.fr',
      key: 'a1b2c3d4',
      keyLocation: `${SITE}/a1b2c3d4.txt`,
      urlList: [u('/')],
    })
  })
  it('200 et 202 sont des succès, liste vide : aucun appel', async () => {
    const envoyer = vi.fn(async () => new Response(null, { status: 202 }))
    expect(await soumettre(SITE, 'a1b2c3d4', [u('/')], envoyer)).toEqual({ ok: true, status: 202 })
    expect(await soumettre(SITE, 'a1b2c3d4', [], envoyer)).toEqual({ ok: true, status: 204 })
    expect(envoyer).toHaveBeenCalledTimes(1)
    const refus = vi.fn(async () => new Response(null, { status: 403 }))
    expect(await soumettre(SITE, 'a1b2c3d4', [u('/')], refus)).toEqual({ ok: false, status: 403 })
  })
})
