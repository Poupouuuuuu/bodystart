'use client'

import { useState, useEffect } from 'react'
import { X, Cookie, ChevronDown } from 'lucide-react'
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
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 sm:p-6 animate-slide-up">
      <div className="container max-w-3xl mx-auto">
        <div className="bg-gray-950 border-2 border-gray-800 rounded-sm shadow-[8px_8px_0_theme(colors.gray.900)] p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Cookie className="w-5 h-5 text-brand-500 flex-shrink-0" />
              <h3 className="text-white font-black uppercase tracking-tight text-lg">
                Ce site utilise des cookies
              </h3>
            </div>
          </div>

          <p className="text-gray-400 text-sm font-medium leading-relaxed mb-6">
            Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu.
            Vous pouvez accepter, refuser ou personnaliser vos préférences.
          </p>

          {/* Zone personnalisation */}
          {showCustomize && (
            <div className="mb-6 space-y-3 border-2 border-gray-800 rounded-sm p-4">
              {/* Nécessaires — toujours actif */}
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-white text-xs font-black uppercase tracking-widest">Nécessaires</span>
                  <p className="text-gray-500 text-[11px] font-medium mt-0.5">Fonctionnement du site, panier, connexion</p>
                </div>
                <div className="w-10 h-6 bg-brand-600 rounded-sm flex items-center justify-end px-1 cursor-not-allowed">
                  <div className="w-4 h-4 bg-white rounded-sm" />
                </div>
              </label>

              {/* Analytics */}
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-white text-xs font-black uppercase tracking-widest">Analytiques</span>
                  <p className="text-gray-500 text-[11px] font-medium mt-0.5">Mesure d'audience, amélioration du site</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreferences((p) => ({ ...p, analytics: !p.analytics }))}
                  className={cn(
                    'w-10 h-6 rounded-sm flex items-center px-1 transition-colors',
                    preferences.analytics ? 'bg-brand-600 justify-end' : 'bg-gray-700 justify-start'
                  )}
                >
                  <div className="w-4 h-4 bg-white rounded-sm" />
                </button>
              </label>

              {/* Marketing */}
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-white text-xs font-black uppercase tracking-widest">Marketing</span>
                  <p className="text-gray-500 text-[11px] font-medium mt-0.5">Publicités personnalisées, réseaux sociaux</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreferences((p) => ({ ...p, marketing: !p.marketing }))}
                  className={cn(
                    'w-10 h-6 rounded-sm flex items-center px-1 transition-colors',
                    preferences.marketing ? 'bg-brand-600 justify-end' : 'bg-gray-700 justify-start'
                  )}
                >
                  <div className="w-4 h-4 bg-white rounded-sm" />
                </button>
              </label>
            </div>
          )}

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={acceptAll}
              className="flex-1 py-3.5 bg-brand-700 text-white font-black uppercase tracking-widest text-[10px] rounded-sm border-2 border-transparent hover:border-white hover:shadow-[4px_4px_0_theme(colors.white)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
            >
              Tout accepter
            </button>
            <button
              onClick={rejectAll}
              className="flex-1 py-3.5 bg-transparent text-white font-black uppercase tracking-widest text-[10px] rounded-sm border-2 border-gray-700 hover:border-white hover:bg-white/5 transition-all"
            >
              Tout refuser
            </button>
            {showCustomize ? (
              <button
                onClick={saveCustom}
                className="flex-1 py-3.5 bg-gray-800 text-white font-black uppercase tracking-widest text-[10px] rounded-sm border-2 border-gray-700 hover:border-brand-500 transition-all"
              >
                Enregistrer
              </button>
            ) : (
              <button
                onClick={() => setShowCustomize(true)}
                className="flex-1 py-3.5 bg-gray-800 text-white font-black uppercase tracking-widest text-[10px] rounded-sm border-2 border-gray-700 hover:border-brand-500 transition-all flex items-center justify-center gap-2"
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
