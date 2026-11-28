import { describe, it, expect } from 'vitest'
import { MESSAGES_COMPTE, messageErreurConnexion, messagesErreursInscription } from './erreurs-compte'

describe('messagesErreursInscription : customerUserErrors traduits par code', () => {
  it('TAKEN : un compte existe déjà', () => {
    expect(
      messagesErreursInscription([{ code: 'TAKEN', field: ['input', 'email'], message: 'Email has already been taken' }])
    ).toEqual(['Un compte existe déjà avec cet e-mail. Connecte-toi, ou réinitialise ton mot de passe si tu l\'as oublié.'])
  })

  it('mot de passe trop court, trop long, avec espaces', () => {
    expect(messagesErreursInscription([{ code: 'TOO_SHORT', field: ['input', 'password'], message: 'x' }])).toEqual([
      MESSAGES_COMPTE.motDePasseCourt,
    ])
    expect(messagesErreursInscription([{ code: 'TOO_LONG', field: ['input', 'password'], message: 'x' }])).toEqual([
      MESSAGES_COMPTE.motDePasseLong,
    ])
    expect(
      messagesErreursInscription([{ code: 'PASSWORD_STARTS_OR_ENDS_WITH_WHITESPACE', field: ['input', 'password'], message: 'x' }])
    ).toEqual([MESSAGES_COMPTE.motDePasseEspace])
  })

  it('e-mail invalide ou domaine invalide', () => {
    expect(messagesErreursInscription([{ code: 'INVALID', field: ['input', 'email'], message: 'Email is invalid' }])).toEqual([
      MESSAGES_COMPTE.emailInvalide,
    ])
    expect(messagesErreursInscription([{ code: 'BAD_DOMAIN', field: ['input', 'email'], message: 'x' }])).toEqual([
      MESSAGES_COMPTE.emailDomaine,
    ])
  })

  it('champs vides', () => {
    expect(messagesErreursInscription([{ code: 'BLANK', field: ['input', 'email'], message: 'x' }])).toEqual([
      MESSAGES_COMPTE.emailVide,
    ])
    expect(
      messagesErreursInscription([
        { code: 'BLANK', field: ['input', 'firstName'], message: 'x' },
        { code: 'BLANK', field: ['input', 'lastName'], message: 'x' },
      ])
    ).toEqual([MESSAGES_COMPTE.nomVide])
  })

  it('client de la boutique sans compte en ligne : e-mail d\'activation envoyé', () => {
    expect(
      messagesErreursInscription([
        { code: 'CUSTOMER_DISABLED', field: ['input'], message: 'We have sent an email to x, please click the link included to verify your email address.' },
      ])
    ).toEqual([MESSAGES_COMPTE.activationEnvoyee])
  })

  it('code inconnu ou absent : repli générique, jamais le texte brut', () => {
    expect(messagesErreursInscription([{ code: 'NOUVEAU', field: null, message: 'Raw english' }])).toEqual([
      MESSAGES_COMPTE.inscriptionGenerique,
    ])
    expect(messagesErreursInscription([{ message: 'Raw english' }])).toEqual([MESSAGES_COMPTE.inscriptionGenerique])
    expect(messagesErreursInscription([])).toEqual([MESSAGES_COMPTE.inscriptionGenerique])
  })

  it('un message précis l\'emporte sur le générique', () => {
    expect(
      messagesErreursInscription([
        { code: 'NOUVEAU', message: 'x' },
        { code: 'TAKEN', field: ['input', 'email'], message: 'x' },
      ])
    ).toEqual([MESSAGES_COMPTE.emailPris])
  })

  it('aucun tiret long, tutoiement', () => {
    for (const m of Object.values(MESSAGES_COMPTE)) {
      expect(m).not.toMatch(/[—–]/)
      expect(m).not.toMatch(/\bvous\b|\bvotre\b|\bvos\b/i)
    }
  })
})

describe('messageErreurConnexion', () => {
  it('identifiants refusés', () => {
    expect(messageErreurConnexion([{ code: 'UNIDENTIFIED_CUSTOMER', field: ['input'], message: 'Unidentified customer' }])).toBe(
      MESSAGES_COMPTE.identifiantsIncorrects
    )
  })
  it('compte pas encore activé', () => {
    expect(messageErreurConnexion([{ code: 'CUSTOMER_DISABLED', message: 'x' }])).toBe(MESSAGES_COMPTE.compteDesactive)
  })
})
