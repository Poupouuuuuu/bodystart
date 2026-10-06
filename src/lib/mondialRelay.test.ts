import { describe, it, expect } from 'vitest'
import {
  MR_BRAND,
  RELAY_ID_ATTRIBUTE_KEY,
  RELAY_ADDRESS_ATTRIBUTE_KEY,
  formatRelayId,
  formatRelayAddress,
  buildRelayAttributes,
  readRelayPickup,
  type ParcelShop,
} from './mondialRelay'

// Données réelles renvoyées par le widget pour 78310 (06/10/2026).
const shop: ParcelShop = {
  id: '039986',
  name: 'PROXI',
  address: '1 PASSAGE DU COMMERCE',
  postalCode: '78310',
  city: 'COIGNIERES',
  countryCode: 'FR',
}

describe('MR_BRAND', () => {
  it('retombe sur l’enseigne de production sans variable d’environnement', () => {
    expect(MR_BRAND).toBe('CC23Y4G1')
  })
})

describe('formatRelayId', () => {
  it('préfixe le pays comme le widget et Connect : « FR-039986 »', () => {
    expect(formatRelayId(shop)).toBe('FR-039986')
  })

  it('met le pays en majuscules et replie sur FR si absent', () => {
    expect(formatRelayId({ ...shop, countryCode: 'be' })).toBe('BE-039986')
    expect(formatRelayId({ ...shop, countryCode: '' })).toBe('FR-039986')
  })
})

describe('formatRelayAddress', () => {
  it('formate « Nom, adresse, CP Ville »', () => {
    expect(formatRelayAddress(shop)).toBe('PROXI, 1 PASSAGE DU COMMERCE, 78310 COIGNIERES')
  })

  it('normalise les espaces multiples et saute une adresse vide', () => {
    expect(formatRelayAddress({ ...shop, address: '1   PASSAGE  DU COMMERCE' })).toBe(
      'PROXI, 1 PASSAGE DU COMMERCE, 78310 COIGNIERES'
    )
    expect(formatRelayAddress({ ...shop, address: '' })).toBe('PROXI, 78310 COIGNIERES')
  })
})

describe('buildRelayAttributes', () => {
  it('produit les deux attributs du brief, dans l’ordre', () => {
    expect(buildRelayAttributes(shop)).toEqual([
      { key: 'Point relais Mondial Relay', value: 'FR-039986' },
      { key: 'Point relais (adresse)', value: 'PROXI, 1 PASSAGE DU COMMERCE, 78310 COIGNIERES' },
    ])
  })
})

describe('readRelayPickup', () => {
  it('relit numéro, nom et CP Ville depuis les attributs écrits', () => {
    expect(readRelayPickup(buildRelayAttributes(shop))).toEqual({
      id: 'FR-039986',
      name: 'PROXI',
      cpVille: '78310 COIGNIERES',
    })
  })

  it('garde le dernier segment quand l’adresse contient des virgules', () => {
    const attrs = [
      { key: RELAY_ID_ATTRIBUTE_KEY, value: 'FR-012345' },
      { key: RELAY_ADDRESS_ATTRIBUTE_KEY, value: 'Carrefour City, 3, Av. Foch, 75016 Paris' },
    ]
    expect(readRelayPickup(attrs)).toEqual({
      id: 'FR-012345',
      name: 'Carrefour City',
      cpVille: '75016 Paris',
    })
  })

  it('affiche le numéro si l’adresse manque', () => {
    expect(readRelayPickup([{ key: RELAY_ID_ATTRIBUTE_KEY, value: 'FR-012345' }])).toEqual({
      id: 'FR-012345',
      name: 'FR-012345',
      cpVille: '',
    })
  })

  it('renvoie null sans numéro de point', () => {
    expect(readRelayPickup(null)).toBeNull()
    expect(readRelayPickup(undefined)).toBeNull()
    expect(readRelayPickup([])).toBeNull()
    expect(readRelayPickup([{ key: RELAY_ID_ATTRIBUTE_KEY, value: '  ' }])).toBeNull()
    expect(
      readRelayPickup([{ key: RELAY_ADDRESS_ATTRIBUTE_KEY, value: 'PROXI, 78310 COIGNIERES' }])
    ).toBeNull()
  })
})
