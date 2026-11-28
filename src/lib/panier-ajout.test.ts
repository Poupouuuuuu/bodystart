import { describe, it, expect } from 'vitest'
import type { ShopifyCart } from '@/lib/shopify/types'
import {
  bilanAjout,
  issueErreurLevee,
  messageErreursPanier,
  panierIntrouvable,
  quantiteAuPanier,
  MESSAGES_PANIER,
} from './panier-ajout'

const V1 = 'gid://shopify/ProductVariant/1'
const V2 = 'gid://shopify/ProductVariant/2'

type Ligne = { id: string; quantity: number; attributes?: { key: string; value: string }[] }
const panier = (lignes: [string, number, Ligne['attributes']?][]): ShopifyCart =>
  ({
    id: 'gid://shopify/Cart/abc?key=1',
    lines: {
      nodes: lignes.map(([id, quantity, attributes], i) => ({
        id: `gid://shopify/CartLine/${i}`,
        quantity,
        attributes,
        merchandise: { id, title: 'Default Title', product: { handle: 'p', title: 'P' }, price: { amount: '10', currencyCode: 'EUR' } },
      })),
    },
  }) as unknown as ShopifyCart

describe('panierIntrouvable / issueErreurLevee : panier disparu ou erreur passagère', () => {
  it('userError sur cartId (réponse réelle de Shopify 2026-10) = panier disparu', () => {
    expect(
      panierIntrouvable([
        { code: 'INVALID', field: ['lines', '0', 'merchandiseId'], message: 'L’article n’existe pas.' },
        { code: 'INVALID', field: ['cartId'], message: "Le panier spécifié n'existe pas." },
      ])
    ).toBe(true)
  })

  it('erreur sur un article seulement : le panier existe', () => {
    expect(panierIntrouvable([{ code: 'INVALID', field: ['lines', '0', 'merchandiseId'], message: 'x' }])).toBe(false)
    expect(panierIntrouvable([])).toBe(false)
    expect(panierIntrouvable(undefined)).toBe(false)
  })

  it('réseau coupé, HTTP 5xx, 429, Throttled : passagère (on garde le panier)', () => {
    expect(issueErreurLevee(new TypeError('Failed to fetch'))).toBe('passagere')
    expect(issueErreurLevee(new Error('Shopify GraphQL HTTP 502'))).toBe('passagere')
    expect(issueErreurLevee(new Error('Shopify GraphQL HTTP 429'))).toBe('passagere')
    expect(issueErreurLevee(new Error('Shopify GraphQL: Throttled'))).toBe('passagere')
    expect(issueErreurLevee(new Error('Shopify GraphQL: réponse sans données'))).toBe('passagere')
    expect(issueErreurLevee('boom')).toBe('passagere')
    expect(issueErreurLevee(undefined)).toBe('passagere')
  })

  it('identifiant de panier illisible (rejeté par Shopify) : panier disparu', () => {
    expect(issueErreurLevee(new Error('Shopify GraphQL: Variable $cartId of type ID! was provided invalid value'))).toBe(
      'panier-disparu'
    )
    // Une autre variable invalide n'est pas un panier disparu.
    expect(issueErreurLevee(new Error('Shopify GraphQL: Variable $lines of type [CartLineInput!]! was provided invalid value'))).toBe(
      'passagere'
    )
  })
})

describe('messageErreursPanier : codes Shopify traduits', () => {
  it('codes connus', () => {
    expect(messageErreursPanier([{ code: 'MERCHANDISE_NOT_APPLICABLE', message: 'x' }])).toBe(MESSAGES_PANIER.plusDisponible)
    expect(messageErreursPanier([{ code: 'INVALID_MERCHANDISE_LINE', message: 'x' }])).toBe(MESSAGES_PANIER.plusDisponible)
    expect(messageErreursPanier([{ code: 'INVALID', field: ['lines', '0', 'merchandiseId'], message: 'x' }])).toBe(
      MESSAGES_PANIER.plusDisponible
    )
    expect(messageErreursPanier([{ code: 'MAXIMUM_EXCEEDED', message: 'x' }])).toBe(MESSAGES_PANIER.maximum)
    expect(messageErreursPanier([{ code: 'INVALID_INCREMENT', message: 'x' }])).toBe(MESSAGES_PANIER.quantiteInvalide)
    expect(messageErreursPanier([{ code: 'CART_TOO_LARGE', message: 'x' }])).toBe(MESSAGES_PANIER.panierPlein)
    expect(messageErreursPanier([{ code: 'SERVICE_UNAVAILABLE', message: 'x' }])).toBe(MESSAGES_PANIER.passagere)
  })

  it('code inconnu ou absent : message générique, jamais le texte brut de Shopify', () => {
    const m = messageErreursPanier([{ code: 'NOUVEAU_CODE', message: 'Raw english message' }])
    expect(m).toBe(MESSAGES_PANIER.refuseGenerique)
    expect(messageErreursPanier([{ message: 'Raw' }])).toBe(MESSAGES_PANIER.refuseGenerique)
    expect(m).toContain('07 61 84 75 80')
  })

  it('aucun tiret long dans les messages', () => {
    for (const m of Object.values(MESSAGES_PANIER)) expect(m).not.toMatch(/[—–]/)
  })
})

describe('quantiteAuPanier', () => {
  it('additionne les lignes de la variante, hors lignes cadeaux', () => {
    const c = panier([
      [V1, 2],
      [V1, 1, [{ key: '_cadeau', value: '100' }]],
      [V2, 4],
    ])
    expect(quantiteAuPanier(c, V1)).toBe(2)
    expect(quantiteAuPanier(c, V2)).toBe(4)
    expect(quantiteAuPanier(null, V1)).toBe(0)
  })
})

describe('bilanAjout', () => {
  const un = [{ merchandiseId: V2, quantity: 1 }]

  it('ajout complet', () => {
    expect(bilanAjout({ avant: panier([[V1, 1]]), apres: panier([[V1, 1], [V2, 1]]), demandes: un })).toEqual({ type: 'ajoute' })
    // Nouveau panier (avant = null)
    expect(bilanAjout({ avant: null, apres: panier([[V2, 1]]), demandes: un })).toEqual({ type: 'ajoute' })
    // Ligne existante incrémentée
    expect(
      bilanAjout({ avant: panier([[V2, 2]]), apres: panier([[V2, 3]]), demandes: un })
    ).toEqual({ type: 'ajoute' })
  })

  it('panier disparu prime sur tout', () => {
    expect(
      bilanAjout({ avant: panier([[V1, 1]]), apres: null, demandes: un, userErrors: [{ code: 'INVALID', field: ['cartId'], message: 'x' }] })
    ).toEqual({ type: 'panier-disparu' })
  })

  it('userErrors non vide = échec, même si un panier revient', () => {
    const b = bilanAjout({
      avant: panier([[V1, 1]]),
      apres: panier([[V1, 1]]),
      demandes: un,
      userErrors: [{ code: 'MERCHANDISE_NOT_APPLICABLE', field: ['lines', '0', 'merchandiseId'], message: 'x' }],
    })
    expect(b).toEqual({ type: 'rien', message: MESSAGES_PANIER.plusDisponible })
  })

  it('pas de panier sans erreur : échec générique', () => {
    expect(bilanAjout({ avant: null, apres: null, demandes: un })).toEqual({ type: 'rien', message: MESSAGES_PANIER.refuseGenerique })
  })

  it('rupture entre la page en cache et le clic : rien ajouté', () => {
    const b = bilanAjout({
      avant: panier([[V1, 1]]),
      apres: panier([[V1, 1]]),
      demandes: un,
      warnings: [{ code: 'MERCHANDISE_OUT_OF_STOCK', message: 'x', target: V2 }],
    })
    expect(b).toEqual({ type: 'rien', message: MESSAGES_PANIER.rupture })
  })

  it('quantité inchangée sans alerte : rien ajouté, dit comme tel', () => {
    const b = bilanAjout({ avant: panier([[V2, 3]]), apres: panier([[V2, 3]]), demandes: un })
    expect(b.type).toBe('rien')
    expect(b.type === 'rien' && b.message).toMatch(/plus assez de stock.*Rien n'a été ajouté/)
  })

  it('quantité ajoutée inférieure à la demande : partiel, avec les chiffres', () => {
    const b = bilanAjout({
      avant: panier([[V1, 1]]),
      apres: panier([[V1, 1], [V2, 2]]),
      demandes: [{ merchandiseId: V2, quantity: 3 }],
      warnings: [{ code: 'MERCHANDISE_NOT_ENOUGH_STOCK', message: 'x', target: 'gid://shopify/CartLine/1' }],
    })
    expect(b).toEqual({
      type: 'partiel',
      message: 'Il ne reste plus assez de stock pour cet article. On en a ajouté 2 sur les 3 demandés.',
    })
    // Même sans alerte, la quantité trahit le manque.
    expect(
      bilanAjout({ avant: null, apres: panier([[V2, 2]]), demandes: [{ merchandiseId: V2, quantity: 3 }] }).type
    ).toBe('partiel')
  })

  it('alerte de stock alors que la quantité semble bonne : on prévient quand même', () => {
    const b = bilanAjout({
      avant: null,
      apres: panier([[V2, 1]]),
      demandes: un,
      warnings: [{ code: 'MERCHANDISE_NOT_ENOUGH_STOCK', message: 'x' }],
    })
    expect(b.type).toBe('partiel')
  })

  it('alertes sans rapport avec le stock (code promo) : ajout normal', () => {
    expect(
      bilanAjout({ avant: null, apres: panier([[V2, 1]]), demandes: un, warnings: [{ code: 'DISCOUNT_NOT_FOUND', message: 'x' }] })
    ).toEqual({ type: 'ajoute' })
  })

  it('sélection de plusieurs articles : message global', () => {
    const demandes = [
      { merchandiseId: V1, quantity: 1 },
      { merchandiseId: V2, quantity: 1 },
    ]
    expect(bilanAjout({ avant: null, apres: panier([[V1, 1]]), demandes })).toEqual({
      type: 'partiel',
      message: MESSAGES_PANIER.selectionIncomplete,
    })
    expect(bilanAjout({ avant: null, apres: panier([]), demandes })).toEqual({
      type: 'rien',
      message: MESSAGES_PANIER.selectionIncomplete,
    })
  })

  it('panier de 50 lignes (tronqué) : pas de faux « rien ajouté »', () => {
    const plein = panier(Array.from({ length: 50 }, (_, i) => [`gid://shopify/ProductVariant/x${i}`, 1] as [string, number]))
    expect(bilanAjout({ avant: plein, apres: plein, demandes: un })).toEqual({ type: 'ajoute' })
  })
})
