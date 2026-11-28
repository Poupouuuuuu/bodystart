'use client'

/**
 * Feuille d'ajout rapide des cartes produit (nuit du 28/11/2026).
 *
 * Produit à plusieurs parfums ou formats : la carte ouvre cette feuille au
 * lieu d'envoyer sur la fiche. Elle monte du bas sur téléphone et s'ouvre en
 * fenêtre au centre sur ordinateur. Chargée à la demande (next/dynamic dans
 * ProductCardShop) : rien dans le JS initial des pages de liste.
 *
 * Les variantes sont lues à l'ouverture (./donnees). Variantes en rupture
 * grisées et non choisissables (./selection). Produit composé (pack, coffret :
 * requiresComponents) : pas de choix ici, lien vers la fiche, qui seule sait
 * composer un pack.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { X } from 'lucide-react'
import Image from '@/components/ui/Image'
import { cn, formatPrice } from '@/lib/utils'
import { discountPctOf } from '@/lib/product-price'
import { chargerProduitAjout, type ProduitAjout } from './donnees'
import { choisir, choixInitial, etatValeur, optionsAChoisir, varianteDuChoix, type Choix } from './selection'

export interface FeuilleAjoutRapideProps {
  handle: string
  titre: string
  href: string
  image: { url: string; altText: string | null } | null
  /** Numéro de variante trouvée par la recherche (« whey vanille ») : la feuille s'ouvre dessus si elle est en stock. */
  varianteInitiale?: string | null
  onFermer: () => void
  /** Ajout demandé : la carte ferme la feuille puis ajoute (tiroir panier ouvert par le panier). */
  onAjouter: (variantId: string) => void
}

const FOCUSABLES = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function FeuilleAjoutRapide({
  handle,
  titre,
  href,
  image,
  varianteInitiale,
  onFermer,
  onAjouter,
}: FeuilleAjoutRapideProps) {
  const [produit, setProduit] = useState<ProduitAjout | null>(null)
  const [erreur, setErreur] = useState(false)
  const [choix, setChoix] = useState<Choix>({})
  const panneau = useRef<HTMLDivElement>(null)
  const titreId = useId()

  useEffect(() => {
    let actif = true
    chargerProduitAjout(handle)
      .then((p) => {
        if (!actif) return
        if (!p) {
          setErreur(true)
          return
        }
        setProduit(p)
        const demandee = varianteInitiale
          ? p.variants.find((v) => v.availableForSale && v.id.split('/').pop() === varianteInitiale)
          : undefined
        setChoix(demandee ? Object.fromEntries(demandee.selectedOptions.map((o) => [o.name, o.value])) : choixInitial(p.variants))
      })
      .catch(() => {
        if (actif) setErreur(true)
      })
    return () => {
      actif = false
    }
  }, [handle, varianteInitiale])

  // Page figée derrière la feuille ; Échap ferme ; Tab reste dans la feuille.
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const avantHtml = html.style.overflow
    const avantBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    panneau.current?.focus()
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onFermer()
        return
      }
      if (e.key !== 'Tab' || !panneau.current) return
      const elements = Array.from(panneau.current.querySelectorAll<HTMLElement>(FOCUSABLES))
      if (elements.length === 0) return
      const premier = elements[0]
      const dernier = elements[elements.length - 1]
      if (e.shiftKey && (document.activeElement === premier || document.activeElement === panneau.current)) {
        e.preventDefault()
        dernier.focus()
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault()
        premier.focus()
      }
    }
    document.addEventListener('keydown', auClavier)
    return () => {
      document.removeEventListener('keydown', auClavier)
      html.style.overflow = avantHtml
      body.style.overflow = avantBody
    }
  }, [onFermer])

  const compose = !!produit?.variants.some((v) => v.requiresComponents)
  const options = useMemo(
    () => (produit && !compose ? optionsAChoisir(produit.options, produit.variants) : []),
    [produit, compose]
  )
  const variante = produit ? varianteDuChoix(produit.variants, choix) : undefined
  const remise = variante ? discountPctOf(variante) : null
  const visuel = variante?.image ?? image
  const disponible = !!variante?.availableForSale

  // Portail vers <body> : la carte a un transform au survol et overflow-hidden,
  // qui rogneraient et décaleraient une feuille en position fixe.
  return createPortal(
    // Centrage en flex (et pas en translate) : l'animation d'entrée anime
    // transform, elle écraserait un translate de centrage sur ordinateur.
    <div className="fixed inset-0 z-[60] flex items-end md:items-center md:justify-center" role="presentation">
      <div
        className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px] motion-reduce:animate-none"
        onClick={onFermer}
        aria-hidden="true"
      />
      <div
        ref={panneau}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titreId}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[85vh] w-full animate-slide-up flex-col rounded-t-[24px] bg-white shadow-hero outline-none motion-reduce:animate-none',
          'md:max-h-[80vh] md:w-[460px] md:rounded-[20px]'
        )}
      >
        {/* Poignée : repère visuel de la feuille sur téléphone. */}
        <div className="flex justify-center pt-2.5 md:hidden" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-spruce/15" />
        </div>

        <div className="flex items-start gap-3 px-5 pb-4 pt-3 md:pt-5">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-sage">
            {visuel && (
              <Image
                src={visuel.url}
                alt={visuel.altText || titre}
                width={64}
                height={64}
                className="h-full w-full object-contain p-1"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id={titreId} className="font-display text-[17px] font-bold leading-snug text-spruce line-clamp-2">
              {produit?.title ?? titre}
            </h2>
            {variante && (
              <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
                <span className="font-display text-[19px] font-extrabold tracking-tight text-spruce">
                  {formatPrice(variante.price)}
                </span>
                {remise && variante.compareAtPrice && (
                  <span className="text-[13px] text-ink-mute line-through">{formatPrice(variante.compareAtPrice)}</span>
                )}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="-mr-2 -mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-ink-mute transition-colors hover:bg-spruce/5 hover:text-spruce"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5">
          {erreur ? (
            <p className="pb-4 text-[15px] leading-relaxed text-ink">
              On n&apos;arrive pas à charger les choix pour l&apos;instant. Tu les retrouves sur la fiche.
            </p>
          ) : !produit ? (
            <div className="space-y-3 pb-4" aria-busy="true" aria-label="Chargement des parfums et formats">
              <div className="h-4 w-24 rounded bg-sage" />
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-11 w-24 rounded-full bg-sage/70" />
                ))}
              </div>
            </div>
          ) : compose ? (
            <p className="pb-4 text-[15px] leading-relaxed text-ink">
              Ce pack se compose sur sa fiche : tu y choisis chaque produit.
            </p>
          ) : (
            options.map((option) => (
              <fieldset key={option.name} className="mb-5">
                <legend className="mb-2.5 text-[13px] font-semibold text-ink">
                  {option.name}
                  {choix[option.name] && <span className="font-normal text-ink-mute"> : {choix[option.name]}</span>}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {option.optionValues.map(({ name: valeur }) => {
                    const etat = etatValeur(produit.variants, choix, option.name, valeur)
                    return (
                      <button
                        key={valeur}
                        type="button"
                        disabled={etat === 'rupture'}
                        aria-pressed={etat === 'choisie'}
                        onClick={() => setChoix((c) => choisir(produit.variants, c, option.name, valeur))}
                        className={cn(
                          'inline-flex min-h-[44px] items-center rounded-full border px-4 text-[14px] font-medium transition-colors',
                          etat === 'choisie' && 'border-spruce bg-spruce text-white',
                          etat === 'dispo' && 'border-spruce/20 bg-white text-ink hover:border-spruce/50',
                          etat === 'rupture' && 'cursor-not-allowed border-dashed border-spruce/15 bg-canvas text-ink-mute/70 line-through'
                        )}
                      >
                        {valeur}
                        {etat === 'rupture' && <span className="sr-only"> (épuisé)</span>}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ))
          )}
        </div>

        <div className="border-t border-spruce/10 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {produit && !compose && !erreur ? (
            <button
              type="button"
              disabled={!disponible}
              onClick={() => variante && onAjouter(variante.id)}
              className={cn(
                'press inline-flex h-12 w-full items-center justify-center rounded-full text-[15px] font-semibold transition-colors',
                disponible ? 'bg-fresh text-white hover:bg-fresh-deep' : 'cursor-not-allowed bg-spruce/10 text-spruce/40'
              )}
            >
              {disponible && variante ? `Ajouter · ${formatPrice(variante.price)}` : 'Épuisé'}
            </button>
          ) : (
            (erreur || compose) && (
              <Link
                href={href}
                className="press inline-flex h-12 w-full items-center justify-center rounded-full bg-fresh text-[15px] font-semibold text-white hover:bg-fresh-deep"
              >
                Voir la fiche
              </Link>
            )
          )}
          {produit && !compose && !erreur && (
            <Link
              href={href}
              className="mt-1 flex min-h-[44px] items-center justify-center text-[14px] font-semibold text-spruce underline underline-offset-4 hover:text-fresh-deep"
            >
              Voir la fiche complète
            </Link>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
