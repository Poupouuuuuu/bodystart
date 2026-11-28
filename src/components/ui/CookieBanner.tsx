'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { Cookie } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import { OPEN_CONSENT_EVENT, readConsent, writeConsent, type CookiePreferences } from '@/lib/consent'

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
}

// « Tout refuser » et « Tout accepter » : même format, même couleur, même taille
// (CNIL : refuser doit être aussi simple et aussi visible qu'accepter).
const CHOICE_BTN =
  'inline-flex h-11 md:w-36 items-center justify-center text-[14px] font-semibold text-white bg-fresh hover:bg-fresh-deep transition-colors px-4 rounded-full press'

// Liens dans la phrase : la zone tactile est agrandie à 44 px de haut par un
// pseudo-élément, sans changer la hauteur des lignes (bandeau compact).
const LIEN_PHRASE =
  'relative whitespace-nowrap font-semibold text-spruce underline underline-offset-2 hover:text-fresh-deep after:absolute after:-inset-x-1 after:-inset-y-[13px]'

// Hauteur du bandeau, publiée sur <html> : les barres fixées en bas (achat de la
// fiche, résultat du conseil, retour en haut) se placent juste au-dessus.
const VAR_HAUTEUR = '--bandeau-cookies'

/**
 * Bandeau cookies compact (27/11/2026) : une phrase de 2 lignes au plus avec
 * « Personnaliser » dedans, puis « Tout refuser » et « Tout accepter » côte à
 * côte. Environ 117 px de haut sur mobile (197 px avant).
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES)
  // Le panier (CartDrawer) est en z-50 ; cette barre en z-[60] la recouvrait.
  // Sur mobile, en 1re visite, ça masquait le bouton de paiement du panier.
  // On masque donc la bannière tant que le drawer panier est ouvert ; elle
  // réapparaît à la fermeture si le consentement n'a pas encore été donné.
  const { isOpen: cartOpen } = useCart()
  const bandeauRef = useRef<HTMLDivElement>(null)
  const affiche = visible && !cartOpen

  useEffect(() => {
    // Aucun choix valable (jamais fait, ou accord publicitaire antérieur au pixel Meta).
    if (readConsent() === null) setVisible(true)
    const open = () => {
      window.__bsOpenConsent = false
      const current = readConsent()
      setPreferences(current ? { ...current, necessary: true } : DEFAULT_PREFERENCES)
      setShowCustomize(true)
      setVisible(true)
    }
    // Clic sur « Gérer mes cookies » avant le chargement de ce composant (lazy).
    if (window.__bsOpenConsent) open()
    window.addEventListener(OPEN_CONSENT_EVENT, open)
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open)
  }, [])

  // Avant l'affichage (layout effect) : pas d'image où la barre d'achat reste sous le bandeau.
  useLayoutEffect(() => {
    const root = document.documentElement
    const el = bandeauRef.current
    const remettre = () => root.style.setProperty(VAR_HAUTEUR, '0px')
    if (!affiche || !el) {
      remettre()
      return
    }
    const publier = () => root.style.setProperty(VAR_HAUTEUR, `${Math.ceil(el.getBoundingClientRect().height)}px`)
    publier()
    if (typeof ResizeObserver === 'undefined') return remettre
    const ro = new ResizeObserver(publier)
    ro.observe(el)
    return () => {
      ro.disconnect()
      remettre()
    }
  }, [affiche])

  function saveConsent(prefs: CookiePreferences) {
    // writeConsent persiste + diffuse l'événement consenti → GA et le pixel Meta
    // réagissent en direct (chargement à l'accord, coupure au refus ou au retrait).
    writeConsent(prefs)
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

  if (!affiche) return null

  return (
    <div
      ref={bandeauRef}
      role="region"
      aria-label="Préférences cookies"
      className="fixed bottom-0 left-0 right-0 z-[60] max-h-[100dvh] overflow-y-auto bg-white border-t border-spruce/15 shadow-[0_-4px_20px_rgba(45,90,45,0.06)]"
    >
      <div className="container pt-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] md:py-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3.5 md:gap-6">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="hidden md:flex flex-shrink-0 w-8 h-8 rounded-full bg-sage items-center justify-center">
              <Cookie className="w-4 h-4 text-spruce" strokeWidth={2} aria-hidden="true" />
            </span>
            <p className="text-[13px] leading-[18px] text-ink">
              <a href="/cookies" className={LIEN_PHRASE}>
                Cookies
              </a>
              &nbsp;: avec ton accord, on mesure l&apos;audience et on cible nos pubs Facebook et Instagram.{' '}
              <button
                type="button"
                onClick={() => setShowCustomize((v) => !v)}
                className={LIEN_PHRASE}
                aria-expanded={showCustomize}
                aria-controls="cookies-personnaliser"
              >
                Personnaliser
              </button>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:flex md:flex-shrink-0">
            <button type="button" onClick={rejectAll} className={CHOICE_BTN}>
              Tout refuser
            </button>
            <button type="button" onClick={acceptAll} className={CHOICE_BTN}>
              Tout accepter
            </button>
          </div>
        </div>

        {/* ─── Panneau personnalisation ─── */}
        {showCustomize && (
          <div
            id="cookies-personnaliser"
            className="mt-3 pt-3 md:mt-4 md:pt-4 border-t border-spruce/10 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4"
          >
            <CategoryRow
              label="Nécessaires"
              desc="Panier, connexion, ton choix de cookies"
              checked={true}
              disabled
            />
            <CategoryRow
              label="Mesure d'audience"
              desc="Google Analytics : pages vues et parcours, sans pub"
              checked={preferences.analytics}
              onChange={(v) => setPreferences((p) => ({ ...p, analytics: v }))}
            />
            <CategoryRow
              label="Publicité"
              desc="Meta : nos produits en pub sur Facebook et Instagram"
              checked={preferences.marketing}
              onChange={(v) => setPreferences((p) => ({ ...p, marketing: v }))}
            />
            <div className="md:col-span-3 flex items-center justify-between gap-4">
              <a
                href="/cookies"
                className="inline-flex min-h-[44px] items-center text-[13px] text-spruce underline underline-offset-2 hover:text-fresh-deep"
              >
                En savoir plus
              </a>
              <button
                type="button"
                onClick={saveCustom}
                className="inline-flex min-h-[44px] items-center text-[13px] font-semibold text-white bg-fresh hover:bg-fresh-deep transition-colors px-5 rounded-full"
              >
                Enregistrer mes choix
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CategoryRow({
  label,
  desc,
  checked,
  disabled,
  onChange,
}: {
  label: string
  desc: string
  checked: boolean
  disabled?: boolean
  onChange?: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-3 bg-canvas border border-spruce/10 rounded-xl p-3">
      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-ink leading-tight">{label}</p>
        <p className="text-[11px] text-ink-mute leading-snug mt-0.5">{desc}</p>
      </div>
      {/* Cible tactile de 44 × 44 px ; les marges négatives laissent l'interrupteur (36 × 20) à sa place. */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={cn(
          'flex-shrink-0 w-11 h-11 -my-3 -mr-1 flex items-center justify-center',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
        aria-checked={checked}
        aria-label={label}
        role="switch"
      >
        <span
          aria-hidden="true"
          className={cn(
            'w-9 h-5 rounded-full flex items-center px-0.5 transition-colors',
            checked ? 'bg-fresh justify-end' : 'bg-spruce/15 justify-start'
          )}
        >
          <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
        </span>
      </button>
    </div>
  )
}
