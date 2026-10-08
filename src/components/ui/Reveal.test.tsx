// @vitest-environment jsdom
/**
 * Contenu visible par défaut (08/10/2026) : <Reveal> ne masque qu'un bloc
 * HORS de l'écran une fois le JS chargé, jamais avant ni un bloc déjà vu.
 */
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, act } from '@testing-library/react'
import Reveal from './Reveal'

type IOCallback = (entries: { isIntersecting: boolean }[]) => void
let ioCallback: IOCallback | null = null
class FakeIO {
  constructor(cb: IOCallback) { ioCallback = cb }
  observe() {}
  disconnect() {}
}

function at(top: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top, bottom: top + 200 } as DOMRect)
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  ioCallback = null
})

const block = () => createElement(Reveal, null, createElement('p', null, 'Contenu'))

describe('Reveal', () => {
  it('rendu serveur : jamais masqué', () => {
    const html = renderToString(block())
    expect(html).toContain('class="reveal "')
    expect(html).not.toContain('is-armed')
  })

  it('bloc hors écran : masqué puis révélé à l’entrée dans l’écran', () => {
    vi.stubGlobal('IntersectionObserver', FakeIO)
    at(2000)
    const { container } = render(block())
    const el = container.querySelector('.reveal')!
    expect(el.classList.contains('is-armed')).toBe(true)
    act(() => ioCallback?.([{ isIntersecting: true }]))
    expect(el.classList.contains('is-in')).toBe(true)
  })

  it('bloc déjà à l’écran (défilement avant le JS) : jamais masqué', () => {
    vi.stubGlobal('IntersectionObserver', FakeIO)
    at(100)
    const { container } = render(block())
    expect(container.querySelector('.reveal')!.classList.contains('is-armed')).toBe(false)
  })

  it('mouvement réduit ou navigateur sans IntersectionObserver : jamais masqué', () => {
    at(2000)
    const r1 = render(block())
    expect(r1.container.querySelector('.reveal')!.classList.contains('is-armed')).toBe(false)
    cleanup()
    vi.stubGlobal('IntersectionObserver', FakeIO)
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce') }))
    const r2 = render(block())
    expect(r2.container.querySelector('.reveal')!.classList.contains('is-armed')).toBe(false)
  })
})
