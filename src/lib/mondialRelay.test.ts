import { describe, it, expect } from 'vitest'
import {
  formatRelayAttributeValue,
  parseRelayAttributeValue,
  buildRelayDeliveryAddress,
  type ParcelShop,
} from './mondialRelay'

const shop: ParcelShop = {
  id: '12345',
  name: 'Tabac de la Gare',
  address: '12 Rue des Lilas',
  postalCode: '78310',
  city: 'Coignières',
  countryCode: 'FR',
}

describe('formatRelayAttributeValue', () => {
  it('formate "[ID] — [Nom], [Adresse], [CP] [Ville]"', () => {
    expect(formatRelayAttributeValue(shop)).toBe(
      '12345 — Tabac de la Gare, 12 Rue des Lilas, 78310 Coignières'
    )
  })

  it('normalise les espaces multiples de l’adresse', () => {
    expect(formatRelayAttributeValue({ ...shop, address: '12   Rue   des  Lilas' })).toBe(
      '12345 — Tabac de la Gare, 12 Rue des Lilas, 78310 Coignières'
    )
  })
})

describe('parseRelayAttributeValue', () => {
  it('relit le nom + le CP Ville depuis la valeur formatée', () => {
    const value = formatRelayAttributeValue(shop)
    expect(parseRelayAttributeValue(value)).toEqual({
      id: '12345',
      name: 'Tabac de la Gare',
      cpVille: '78310 Coignières',
    })
  })

  it('gère une adresse contenant des virgules (garde le dernier segment)', () => {
    const value = '999 — Carrefour City, 3, Av. Foch, 75016 Paris'
    expect(parseRelayAttributeValue(value)).toEqual({
      id: '999',
      name: 'Carrefour City',
      cpVille: '75016 Paris',
    })
  })

  it('renvoie null sur valeur vide ou sans séparateur', () => {
    expect(parseRelayAttributeValue('')).toBeNull()
    expect(parseRelayAttributeValue(null)).toBeNull()
    expect(parseRelayAttributeValue(undefined)).toBeNull()
    expect(parseRelayAttributeValue('pas-de-separateur')).toBeNull()
  })
})

describe('buildRelayDeliveryAddress', () => {
  it('encode l’ID relais dans company + force FR', () => {
    const addr = buildRelayDeliveryAddress(shop)
    expect(addr.company).toBe('Point Relais 12345')
    expect(addr.countryCode).toBe('FR')
    expect(addr.zip).toBe('78310')
    expect(addr.city).toBe('Coignières')
    expect(addr.address1).toBe('12 Rue des Lilas')
  })

  it('replie sur le nom si l’adresse est vide', () => {
    const addr = buildRelayDeliveryAddress({ ...shop, address: '' })
    expect(addr.address1).toBe('Tabac de la Gare')
  })
})
