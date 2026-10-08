// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { canAutoReload, isChunkLoadError } from './chunk-reload'

beforeEach(() => sessionStorage.clear())

describe('isChunkLoadError', () => {
  it('erreurs de chargement de fichier JS (Chrome, Safari, Firefox, webpack)', () => {
    expect(isChunkLoadError({ name: 'ChunkLoadError', message: 'Loading chunk 123 failed.' })).toBe(true)
    expect(isChunkLoadError(new Error('Loading CSS chunk app-layout failed'))).toBe(true)
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://x/_next/a.js'))).toBe(true)
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true)
  })
  it('autres erreurs : non', () => {
    expect(isChunkLoadError(new Error('Shopify GraphQL: boom'))).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
  })
})

describe('canAutoReload', () => {
  it('une fois, puis pas avant une minute', () => {
    const now = 1_000_000
    expect(canAutoReload(now)).toBe(true)
    sessionStorage.setItem('bs_chunk_reload', String(now))
    expect(canAutoReload(now + 30_000)).toBe(false)
    expect(canAutoReload(now + 61_000)).toBe(true)
  })
})
