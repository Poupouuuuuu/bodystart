import { describe, it, expect, afterEach } from 'vitest'
import {
  CONSENT_KEY,
  CONSENT_EVENT,
  CONSENT_VERSION,
  readConsent,
  writeConsent,
  isAnalyticsGranted,
  isMarketingGranted,
} from './consent'

/* eslint-disable @typescript-eslint/no-explicit-any */

function setWindow(raw: string | null) {
  const store: Record<string, string> = {}
  if (raw !== null) store[CONSENT_KEY] = raw
  const events: string[] = []
  ;(globalThis as any).window = {
    localStorage: {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = v
      },
    },
    dispatchEvent: (e: Event) => {
      events.push(e.type)
      return true
    },
  }
  return { store, events }
}

afterEach(() => {
  delete (globalThis as any).window
})

describe("consentement : mesure d'audience et publicité sont deux choix séparés", () => {
  it('writeConsent enregistre la version du recueil et prévient la page', () => {
    const { store, events } = setWindow(null)
    writeConsent({ necessary: true, analytics: true, marketing: false })
    expect(JSON.parse(store[CONSENT_KEY])).toMatchObject({ analytics: true, marketing: false, v: CONSENT_VERSION })
    expect(events).toEqual([CONSENT_EVENT])
    expect(isAnalyticsGranted()).toBe(true)
    expect(isMarketingGranted()).toBe(false)
  })

  it('publicité acceptée sans la mesure d’audience', () => {
    setWindow(null)
    writeConsent({ necessary: true, analytics: false, marketing: true })
    expect(isAnalyticsGranted()).toBe(false)
    expect(isMarketingGranted()).toBe(true)
  })

  it('accord publicité donné avant le pixel Meta : plus valable, le bandeau se réaffiche', () => {
    setWindow(JSON.stringify({ necessary: true, analytics: true, marketing: true }))
    expect(readConsent()).toBeNull()
    expect(isMarketingGranted()).toBe(false)
    expect(isAnalyticsGranted()).toBe(false)
  })

  it('refus donné avant le pixel Meta : reste valable', () => {
    setWindow(JSON.stringify({ necessary: true, analytics: false, marketing: false }))
    expect(readConsent()).toEqual({ necessary: true, analytics: false, marketing: false })
  })

  it('valeur illisible : aucun consentement', () => {
    setWindow('{oops')
    expect(readConsent()).toBeNull()
  })
})
