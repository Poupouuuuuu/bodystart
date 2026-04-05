'use client'

import { useState, useEffect } from 'react'
import { Cookie, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const CONSENT_KEY = 'body-start-cookie-consent'

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES)

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (!stored) setVisible(true)
  }, [])

  function saveConsent(prefs: CookiePreferences) {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(prefs))
    setVisible(false)
  }

  function acceptAll() {
    saveConsent({ necessary: true, analytics: true, marketing: true })
  }

  function rejectAll() {
    saveConsent({ necessary: true, analytics: false, marketing: false })
  }

  function saveCustom() {
    saveConsent({ ...preferences, necessary: true })
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 sm:p-6">
      <div className="container max-w-2xl mx-auto">
        <div className="bg-[#1a2e23] border border-white/10 rounded-[24px] shadow-2xl p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <Cookie className="w-4.5 h-4.5 text-[#7cb98b]" />
            </div>
            <h3 className="text-white font-display font-black uppercase tracking-tight text-base">
              Ce site utilise des cookies
            </h3>
          </div>

          <p className="text-white/50 text-[13px] font-medium leading-relaxed mb-6 pl-12">
            Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu.
          </p>

          {/* Zone personnalisation */}
          {showCustomize && (
            <div className="mb-6 space-y-3 bg-white/5 border border-white/10 rounded-2xl p-5 ml-12">
              {/* Nécessaires — toujours actif */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white text-[11px] font-bold uppercase tracking-widest">Nécessaires</span>
                  <p className="text-white/40 text-[11px] font-medium mt-0.5">Fonctionnement du site, panier, connexion</p>
                </div>
                <div className="w-10 h-6 bg-[#7cb98b] rounded-full flex items-center justify-end px-1 cursor-not-allowed">
                  <div className="w-4 h-4 bg-white rounded-full" />
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white text-[11px] font-bold uppercase tracking-widest">Analytiques</span>
                  <p className="text-white/40 text-[11px] font-medium mt-0.5">Mesure d&apos;audience, amélioration du site</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreferences((p) => ({ ...p, analytics: !p.analytics }))}
                  className={cn(
                    'w-10 h-6 rounded-full flex items-center px-1 transition-colors',
                    preferences.analytics ? 'bg-[#7cb98b] justify-end' : 'bg-white/20 justify-start'
                  )}
                >
                  <div className="w-4 h-4 bg-white rounded-full" />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white text-[11px] font-bold uppercase tracking-widest">Marketing</span>
                  <p className="text-white/40 text-[11px] font-medium mt-0.5">Publicités personnalisées, réseaux sociaux</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreferences((p) => ({ ...p, marketing: !p.marketing }))}
                  className={cn(
                    'w-10 h-6 rounded-full flex items-center px-1 transition-colors',
                    preferences.marketing ? 'bg-[#7cb98b] justify-end' : 'bg-white/20 justify-start'
                  )}
                >
                  <div className="w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
            </div>
          )}

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-3 pl-12">
            <button
              onClick={acceptAll}
              className="flex-1 py-3.5 bg-white text-[#1a2e23] font-bold uppercase tracking-widest text-[10px] rounded-full hover:bg-white/90 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-lg"
            >
              Tout accepter
            </button>
            <button
              onClick={rejectAll}
              className="flex-1 py-3.5 text-white font-bold uppercase tracking-widest text-[10px] rounded-full border border-white/20 hover:bg-white/10 transition-all"
            >
              Tout refuser
            </button>
            {showCustomize ? (
              <button
                onClick={saveCustom}
                className="flex-1 py-3.5 bg-[#7cb98b] text-[#1a2e23] font-bold uppercase tracking-widest text-[10px] rounded-full hover:bg-[#89c897] transition-all shadow-lg"
              >
                Enregistrer
              </button>
            ) : (
              <button
                onClick={() => setShowCustomize(true)}
                className="flex-1 py-3.5 text-white font-bold uppercase tracking-widest text-[10px] rounded-full border border-white/20 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                Personnaliser
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
