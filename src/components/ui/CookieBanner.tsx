'use client'

import { useState, useEffect } from 'react'
import { Cookie, X, ChevronDown } from 'lucide-react'
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
  'inline-flex flex-1 md:flex-none md:min-w-[8.5rem] min-h-[44px] items-center justify-center text-[13px] font-semibold text-white bg-fresh hover:bg-fresh-deep transition-colors px-4 rounded-full'

/**
 * Cookie banner V2 (redesign 2026-05-26) — barre discrete bas de page,
 * non bloquante, dans la palette DA claire.
 * Cf. tech-specs/redesign-v2-direction-artistique.md §A.Palette + §A.Composants
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES)
  // Bandeau rouvert par « Gérer mes cookies » alors qu'un choix existe déjà :
  // la croix ferme sans rien changer (au 1er affichage, elle vaut refus).
  const [hadChoice, setHadChoice] = useState(false)
  // Le panier (CartDrawer) est en z-50 ; cette barre en z-[60] la recouvrait.
  // Sur mobile, en 1re visite, ça masquait le bouton de paiement du panier.
  // On masque donc la bannière tant que le drawer panier est ouvert ; elle
  // réapparaît à la fermeture si le consentement n'a pas encore été donné.
  const { isOpen: cartOpen } = useCart()

  useEffect(() => {
    // Aucun choix valable (jamais fait, ou accord publicitaire antérieur au pixel Meta).
    if (readConsent() === null) setVisible(true)
    const open = () => {
      window.__bsOpenConsent = false
      const current = readConsent()
      setPreferences(current ? { ...current, necessary: true } : DEFAULT_PREFERENCES)
      setHadChoice(current !== null)
      setShowCustomize(true)
      setVisible(true)
    }
    // Clic sur « Gérer mes cookies » avant le chargement de ce composant (lazy).
    if (window.__bsOpenConsent) open()
    window.addEventListener(OPEN_CONSENT_EVENT, open)
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open)
  }, [])

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

  if (!visible || cartOpen) return null

  return (
    <div
      role="region"
      aria-label="Préférences cookies"
      className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-spruce/15 shadow-[0_-4px_20px_rgba(45,90,45,0.06)]"
    >
      <div className="container py-3 md:py-4">
        {/* ─── Ligne principale : texte court + actions, en flex (compact) ─── */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-5">
          <div className="flex items-start md:items-center gap-3 flex-1 min-w-0">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-sage flex items-center justify-center mt-0.5 md:mt-0">
              <Cookie className="w-4 h-4 text-spruce" strokeWidth={2} />
            </span>
            <p className="text-[13px] text-ink leading-snug">
              On utilise des cookies pour faire tourner le site. Avec ton accord, on mesure aussi
              l&apos;audience et on te montre nos produits en pub sur Facebook et Instagram.
              {/* Mobile : le lien passe sur la ligne « Personnaliser », en cible de 44 px. */}
              <span className="hidden md:inline">
                {' '}
                <a href="/cookies" className="underline underline-offset-2 text-spruce hover:text-fresh-deep">
                  En savoir plus
                </a>
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0">
            <button
              onClick={() => setShowCustomize((v) => !v)}
              className="hidden md:inline-flex items-center gap-1 text-[12px] font-semibold text-ink-mute hover:text-spruce transition-colors px-3 py-2"
              aria-expanded={showCustomize}
            >
              Personnaliser
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showCustomize && 'rotate-180')} />
            </button>
            <button onClick={rejectAll} className={CHOICE_BTN}>
              Tout refuser
            </button>
            <button onClick={acceptAll} className={CHOICE_BTN}>
              Tout accepter
            </button>
            <button
              onClick={hadChoice ? () => setVisible(false) : rejectAll}
              aria-label={hadChoice ? 'Fermer sans rien changer' : 'Fermer (refuser non-essentiels)'}
              className="md:hidden flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-ink-mute hover:bg-spruce/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── Ligne mobile : Personnaliser + En savoir plus, cibles de 44 px (desktop : déjà en ligne) ─── */}
        <div className="md:hidden flex items-center gap-5">
          <button
            onClick={() => setShowCustomize((v) => !v)}
            className="inline-flex min-h-[44px] items-center gap-1 text-[13px] font-semibold text-ink-mute hover:text-spruce transition-colors"
            aria-expanded={showCustomize}
          >
            Personnaliser
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showCustomize && 'rotate-180')} />
          </button>
          <a
            href="/cookies"
            className="inline-flex min-h-[44px] items-center text-[13px] text-spruce underline underline-offset-2 hover:text-fresh-deep"
          >
            En savoir plus
          </a>
        </div>

        {/* ─── Panneau personnalisation, slide-in compact au-dessus ─── */}
        {showCustomize && (
          <div className="mt-4 pt-4 border-t border-spruce/10 grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="md:col-span-3 flex justify-end">
              <button
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
