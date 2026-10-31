import { describe, expect, it } from 'vitest'
import { STORE } from './store-info'
import { VILLES_DESSERVIES, formatKm, itineraireDepuis, listeFr, villesLivraisonLocale } from './zone-locale'

describe('zone desservie', () => {
  it('les 12 communes du plan local, chacune une seule fois, triées par temps de trajet', () => {
    const noms = VILLES_DESSERVIES.map((v) => v.nom)
    expect(new Set(noms).size).toBe(12)
    expect([...noms].sort()).toEqual(
      [
        'Chevreuse', 'Guyancourt', 'La Verrière', 'Le Mesnil-Saint-Denis', 'Les Essarts-le-Roi', 'Magny-les-Hameaux',
        'Maurepas', 'Montigny-le-Bretonneux', 'Plaisir', 'Rambouillet', 'Trappes', 'Élancourt',
      ].sort()
    )
    const minutes = VILLES_DESSERVIES.map((v) => v.minutes)
    expect(minutes).toEqual([...minutes].sort((a, b) => a - b))
  })

  it('un texte d’accès propre à chaque ville, sans tiret long', () => {
    const textes = VILLES_DESSERVIES.map((v) => v.acces)
    expect(new Set(textes).size).toBe(textes.length)
    // Aucune phrase reprise telle quelle d'une ville à l'autre.
    const phrases = textes.flatMap((t) => t.split(/(?<=[.:])\s+/))
    expect(new Set(phrases).size).toBe(phrases.length)
    expect(textes.join(' ')).not.toMatch(/[–—]/)
  })

  it('livraison locale : relevé Shopify du 31/10/2026', () => {
    expect(villesLivraisonLocale('oui')).toEqual(['Les Essarts-le-Roi', 'Maurepas', 'Élancourt', 'La Verrière', 'Le Mesnil-Saint-Denis', 'Trappes'])
    expect(villesLivraisonLocale('partielle')).toEqual(['Montigny-le-Bretonneux', 'Plaisir'])
  })

  it('itinéraire vers la fiche Google de la boutique (place_id), depuis la mairie', () => {
    const url = new URL(itineraireDepuis({ nom: 'Le Mesnil-Saint-Denis', codePostal: '78320' }))
    expect(url.origin + url.pathname).toBe('https://www.google.com/maps/dir/')
    expect(url.searchParams.get('destination_place_id')).toBe(STORE.googlePlaceId)
    expect(url.searchParams.get('origin')).toBe('Mairie Le Mesnil-Saint-Denis 78320')
  })

  it('formats français', () => {
    expect(formatKm(4.4)).toBe('4,4 km')
    expect(formatKm(12)).toBe('12 km')
    expect(listeFr(['la D30', 'la D58', 'la N10'])).toBe('la D30, la D58 et la N10')
    expect(listeFr(['la N10'])).toBe('la N10')
  })
})
