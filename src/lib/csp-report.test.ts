import { describe, it, expect } from 'vitest'
import { summarizeCspReport } from './csp-report'

describe('summarizeCspReport', () => {
  it('format report-uri : directive, ressource et page, sans query string', () => {
    const raw = JSON.stringify({
      'csp-report': {
        'document-uri': 'https://bodystart-nutrition.fr/products/whey?email=lea@exemple.fr',
        'effective-directive': 'script-src-elem',
        'blocked-uri': 'https://evil.example/x.js?token=abc',
        'source-file': 'https://bodystart-nutrition.fr/_next/static/chunks/a.js',
        'line-number': 12,
        disposition: 'enforce',
      },
    })
    expect(summarizeCspReport(raw)).toEqual([
      'script-src-elem bloqué : https://evil.example/x.js sur /products/whey (source https://bodystart-nutrition.fr/_next/static/chunks/a.js:12)',
    ])
  })

  it('format Reporting API (liste) et mention du mode signalement seul', () => {
    const raw = JSON.stringify([
      { type: 'csp-violation', body: { documentURL: 'https://bodystart-nutrition.fr/', effectiveDirective: 'script-src', blockedURL: 'eval', disposition: 'report' } },
      { type: 'deprecation', body: {} },
    ])
    expect(summarizeCspReport(raw)).toEqual(['script-src bloqué : eval sur / [signalement seul]'])
  })

  it('contenu illisible ou étranger : rien', () => {
    expect(summarizeCspReport('pas du json')).toEqual([])
    expect(summarizeCspReport('{"foo":1}')).toEqual([])
  })
})
