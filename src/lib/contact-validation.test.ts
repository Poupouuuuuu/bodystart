import { describe, it, expect } from 'vitest'
import { validerContact } from './contact-validation'

describe('validerContact', () => {
  it('prénom + téléphone suffisent (e-mail facultatif)', () => {
    expect(validerContact({ name: ' Léa ', phone: '06 12 34 56 78', objectif: 'Prendre du muscle', email: '' })).toEqual({
      name: 'Léa',
      phone: '06 12 34 56 78',
      email: null,
      objectif: 'Prendre du muscle',
      message: '',
    })
  })
  it('prénom + e-mail valide, sans téléphone : accepté', () => {
    expect(validerContact({ name: 'Léa', email: 'lea@exemple.fr', objectif: 'x' })?.email).toBe('lea@exemple.fr')
  })
  it('refusé : sans prénom, sans objectif, ni téléphone ni e-mail', () => {
    expect(validerContact({ phone: '0612345678', objectif: 'x' })).toBeNull()
    expect(validerContact({ name: 'Léa', phone: '0612345678' })).toBeNull()
    expect(validerContact({ name: 'Léa', objectif: 'x' })).toBeNull()
    expect(validerContact(null)).toBeNull()
  })
  it('refusé : e-mail saisi mais invalide, ou téléphone trop court', () => {
    expect(validerContact({ name: 'Léa', phone: '0612345678', email: 'lea@', objectif: 'x' })).toBeNull()
    expect(validerContact({ name: 'Léa', phone: '0612', objectif: 'x' })).toBeNull()
  })
})
