import { describe, it, expect } from 'vitest'
import { lireReponse, relancerInscription } from './reponse'

describe('lireReponse', () => {
  it('réponses normales : lisibles, pas d’échec', () => {
    expect(lireReponse(200, '{"status":"ready","customerId":"gid://shopify/Customer/1"}').echec).toBeNull()
    expect(lireReponse(200, '{"status":"played","result":null}').echec).toBeNull()
    expect(lireReponse(503, '{"error":"Petit souci de connexion avec la boutique. Réessaie dans un instant."}').json?.error).toMatch(/boutique/)
    expect(lireReponse(400, '{"error":"Indique un portable","field":"phone"}').echec).toBeNull()
  })
  it('délai dépassé chez la plateforme (corps texte) : échec « réponse », avec un extrait pour le journal', () => {
    const r = lireReponse(504, 'An error occurred with your deployment\n\nFUNCTION_INVOCATION_TIMEOUT\n\ncdg1::abc')
    expect(r.json).toBeNull()
    expect(r.echec).toEqual({ type: 'reponse', http: 504, extrait: 'An error occurred with your deployment FUNCTION_INVOCATION_TIMEOUT cdg1::abc' })
  })
  it('JSON sans statut ni message, ou « ready » sans fiche client : échec « réponse »', () => {
    expect(lireReponse(200, '{}').echec?.type).toBe('reponse')
    expect(lireReponse(200, '{"status":"ready"}').echec?.type).toBe('reponse')
    expect(lireReponse(200, '[]').echec?.type).toBe('reponse')
    expect(lireReponse(200, '').echec).toEqual({ type: 'reponse', http: 200, extrait: '' })
  })
})

describe('relancerInscription', () => {
  it('relance une fois sur un échec réseau, une réponse illisible ou une erreur serveur', () => {
    expect(relancerInscription({ httpStatus: 0 }, { type: 'reseau', http: 0, extrait: '' })).toBe(true)
    expect(relancerInscription({ httpStatus: 504 }, { type: 'reponse', http: 504, extrait: '' })).toBe(true)
    expect(relancerInscription({ httpStatus: 503 }, null)).toBe(true)
  })
  it('jamais sur un refus (champ invalide, trop de tentatives) ni sur un statut', () => {
    expect(relancerInscription({ httpStatus: 400, field: 'phone' }, null)).toBe(false)
    expect(relancerInscription({ httpStatus: 429 }, null)).toBe(false)
    expect(relancerInscription({ httpStatus: 200, status: 'played' }, null)).toBe(false)
  })
})
