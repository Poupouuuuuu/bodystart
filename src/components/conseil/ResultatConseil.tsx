'use client'

import { useEffect, useMemo, useRef, useState, type Ref } from 'react'
import { Info, RotateCcw, ArrowLeft, Store, Truck } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { BODY_START_STORES } from '@/lib/shopify/types'
import { LIBELLES_BUDGET, LIBELLES_CONTRAINTES, LIBELLES_SEANCES, formatCents } from '@/lib/conseil/libelles'
import type { Ligne, Reponses, Resultat, VarianteProposee } from '@/lib/conseil/types'
import { frenchSpacing } from '@/lib/typo'
import { cn } from '@/lib/utils'
import CarteProduitConseil from './CarteProduitConseil'
import BoutiqueConseil from './BoutiqueConseil'
import RappelForm from './RappelForm'

const boutique = BODY_START_STORES.find((s) => s.isActive)

const RECAP_SEANCES: Record<Reponses['seances'], string> = {
  '0-1': '0 à 1 séance par semaine',
  '2-3': '2 à 3 séances par semaine',
  '4-plus': '4 séances et plus par semaine',
}

interface Props {
  resultat: Resultat
  reponses: Reponses
  objectifLibelle: string
  titreRef: Ref<HTMLHeadingElement>
  onRetour: () => void
  onRecommencer: () => void
}

interface LigneEffective {
  ligne: Ligne
  variantes: VarianteProposee[]
  choisie: VarianteProposee | null
}

function effective(ligne: Ligne, epuisees: Set<string>, choixId: string | undefined): LigneEffective {
  const variantes = ligne.variantes.filter((v) => !epuisees.has(v.id))
  return { ligne, variantes, choisie: variantes.find((v) => v.id === choixId) ?? variantes[0] ?? null }
}

function descriptionLigne({ ligne, choisie }: LigneEffective): string {
  const details = [ligne.format, choisie?.libelle].filter(Boolean).join(', ')
  return `${ligne.titre}${details ? ` (${details})` : ''}${choisie ? ` : ${formatCents(choisie.prixCents)}` : ''}`
}

/** Mention obligatoire dès qu'une allégation santé est affichée (règlement CE 1924/2006, art. 10.2.a). */
const MENTION_ALIMENTATION =
  'Les compléments alimentaires ne se substituent pas à une alimentation variée et équilibrée et à un mode de vie sain. Respecte la dose journalière indiquée sur chaque produit.'

export default function ResultatConseil({ resultat, reponses, objectifLibelle, titreRef, onRetour, onRecommencer }: Props) {
  const { addItems, isOpen } = useCart()
  const [choix, setChoix] = useState<Record<string, string>>({})
  const [epuisees, setEpuisees] = useState<Set<string>>(() => new Set())
  const [avecShaker, setAvecShaker] = useState(false)
  const [enCours, setEnCours] = useState<null | 'retrait' | 'livraison'>(null)
  const [alerte, setAlerte] = useState<string | null>(null)

  const lignes = useMemo(
    () => (resultat.type === 'selection' ? resultat.lignes : resultat.suggestions).map((l) => effective(l, epuisees, choix[l.cle])),
    [resultat, epuisees, choix]
  )
  const shaker = useMemo(
    () => (resultat.type === 'selection' && resultat.shaker ? effective(resultat.shaker, epuisees, choix[resultat.shaker.cle]) : null),
    [resultat, epuisees, choix]
  )
  const shakerPris = Boolean(avecShaker && shaker?.choisie)
  const aReserver = [...lignes, ...(shakerPris && shaker ? [shaker] : [])].filter((l) => l.choisie)
  const totalCents = aReserver.reduce((s, l) => s + (l.choisie?.prixCents ?? 0), 0)

  // Barre fixe mobile : visible quand le bloc d'achat est plus bas que l'écran.
  const ctaRef = useRef<HTMLDivElement>(null)
  const [barre, setBarre] = useState(false)
  useEffect(() => {
    const el = ctaRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setBarre(!e.isIntersecting && e.boundingClientRect.top > 0))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const attributsGuide = [
    { key: 'source', value: 'guide-conseil' },
    { key: 'objectif', value: reponses.objectif },
    { key: 'budget', value: reponses.budget },
  ]
  const lignesPanier = aReserver.map((l) => ({ merchandiseId: l.choisie!.id, quantity: 1 }))

  async function reserver() {
    if (lignesPanier.length === 0 || enCours || !boutique) return
    setEnCours('retrait')
    setAlerte(null)
    // Revérification du stock boutique juste avant de réserver (la page est
    // en cache 15 min). Si elle échoue (réseau, limite), on s'en tient au
    // stock lu au chargement : le retrait reste vérifié par la boutique.
    try {
      const params = new URLSearchParams({
        variantIds: lignesPanier.map((l) => l.merchandiseId).join(','),
        locationId: boutique.shopifyLocationId,
      })
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 6000)
      const res = await fetch(`/api/inventory?${params}`, { signal: ctrl.signal, cache: 'no-store' })
      clearTimeout(t)
      if (res.ok) {
        const data = (await res.json()) as { variants?: { variantId: string; available: number }[] }
        const parties = (data.variants ?? []).filter((v) => !(v.available > 0)).map((v) => v.variantId)
        if (parties.length > 0) {
          setEpuisees((prev) => new Set([...Array.from(prev), ...parties]))
          setAlerte(
            frenchSpacing(
              'Un produit de ta sélection vient de partir. On a mis la sélection à jour : vérifie-la, puis réserve à nouveau.'
            )
          )
          setEnCours(null)
          return
        }
      }
    } catch {
      /* revérification impossible : on continue avec le stock du chargement */
    }
    await addItems(lignesPanier, {
      attributes: [
        // Mêmes attributs que le passage en « Retrait » du tiroir panier.
        { key: '__click_and_collect', value: 'true' },
        { key: 'pickup_location_id', value: boutique.shopifyLocationId },
        ...attributsGuide,
      ],
      clearRelay: true,
    })
    setEnCours(null)
  }

  async function ajouterLivraison() {
    if (lignesPanier.length === 0 || enCours) return
    setEnCours('livraison')
    setAlerte(null)
    await addItems(lignesPanier, {
      attributes: [
        // Mêmes attributs que le passage en « Livraison » du tiroir panier.
        { key: '__click_and_collect', value: 'false' },
        { key: 'pickup_location_id', value: '' },
        ...attributsGuide,
      ],
    })
    setEnCours(null)
  }

  // Contexte du rappel : objectif, séances, budget, sélection. Jamais les contraintes.
  const contexteRappel = [
    'Demande envoyée depuis le guide /conseil.',
    `Objectif : ${objectifLibelle}`,
    ...(resultat.type === 'selection'
      ? [
          `Séances par semaine : ${LIBELLES_SEANCES[reponses.seances]}`,
          `Budget par mois : ${LIBELLES_BUDGET[reponses.budget]}`,
          'Sélection proposée :',
          ...aReserver.map((l) => `- ${descriptionLigne(l)}`),
        ]
      : resultat.suggestions.length > 0
        ? ['Suggestions affichées :', ...lignes.map((l) => `- ${descriptionLigne(l)}`)]
        : []),
  ].join('\n')

  const recap =
    resultat.type === 'selection'
      ? [
          objectifLibelle,
          RECAP_SEANCES[reponses.seances],
          LIBELLES_BUDGET[reponses.budget],
          ...reponses.contraintes.map((c) => LIBELLES_CONTRAINTES[c]),
        ].join(' · ')
      : objectifLibelle

  const titre = resultat.type === 'selection' ? 'Ta sélection' : 'On en parle en boutique'

  return (
    <div className="container max-w-2xl pb-16 pt-8 md:pb-24 md:pt-14">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mustard-ink">{recap}</p>
      <h1
        ref={titreRef}
        tabIndex={-1}
        className="mt-3 font-display text-[34px] font-extrabold leading-[1.05] tracking-tight text-spruce outline-none sm:text-[44px]"
      >
        {titre}
      </h1>

      {resultat.type === 'selection' ? (
        <p className="mt-4 text-[16px] leading-[1.6] text-ink-mute md:text-[17px]">
          {frenchSpacing('Tout est en stock dans notre boutique de Coignières : retrait immédiat en boutique.')}
        </p>
      ) : (
        <p className="mt-4 text-[16px] leading-[1.6] text-ink md:text-[17px]">
          {resultat.raison === 'rupture'
            ? frenchSpacing(
                'Les produits qu’on te conseillerait ne sont pas en stock à Coignières en ce moment. Passe nous voir : on trouve une solution ensemble, sans engagement.'
              )
            : frenchSpacing(resultat.texte ?? '')}
        </p>
      )}

      {resultat.messages.length > 0 && (
        <div className="mt-6 space-y-2 rounded-2xl bg-sage p-4 sm:p-5">
          {resultat.messages.map((m) => (
            <p key={m} className="flex items-start gap-3 text-[15px] leading-[1.55] text-ink">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-spruce" aria-hidden="true" />
              <span>{frenchSpacing(m)}</span>
            </p>
          ))}
        </div>
      )}

      {resultat.type === 'selection' && (
        <>
          <ul className="mt-8 space-y-4">
            {lignes.map((l) => (
              <CarteProduitConseil
                key={l.ligne.cle}
                ligne={l.ligne}
                variantes={l.variantes}
                choisie={l.choisie}
                onChoisir={(id) => setChoix((c) => ({ ...c, [l.ligne.cle]: id }))}
                badge={l.ligne.role === 'essentiel' ? 'L’essentiel' : 'En complément'}
              />
            ))}
          </ul>
          <p className="mt-4 text-[13px] leading-[1.55] text-ink-mute">{MENTION_ALIMENTATION}</p>

          {shaker?.choisie && (
            <label className="mt-4 flex min-h-[44px] cursor-pointer items-start gap-4 rounded-[20px] bg-white p-4 shadow-card sm:p-5">
              <input
                type="checkbox"
                checked={avecShaker}
                onChange={(e) => setAvecShaker(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-fresh"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="text-[15px] font-semibold text-ink">En option : {shaker.ligne.titre}</span>
                  <span className="font-semibold tabular-nums text-spruce">{formatCents(shaker.choisie.prixCents)}</span>
                </span>
                <span className="mt-1 block text-[14px] leading-[1.55] text-ink-mute">
                  {frenchSpacing(shaker.ligne.pourquoi)}
                </span>
              </span>
            </label>
          )}

          {alerte && (
            <p role="alert" className="mt-6 rounded-xl bg-terracotta/10 px-4 py-3 text-[14px] font-medium text-terracotta">
              {alerte}
            </p>
          )}

          <div ref={ctaRef} className="mt-6 rounded-[20px] bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[15px] font-semibold text-ink">Total</span>
              <span className="font-display text-[26px] font-extrabold tabular-nums text-spruce">{formatCents(totalCents)}</span>
            </div>
            <button
              type="button"
              onClick={reserver}
              disabled={lignesPanier.length === 0 || enCours !== null}
              className="btn-primary mt-5 min-h-[52px] w-full px-5 text-center"
            >
              <Store className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden="true" />
              {enCours === 'retrait' ? 'Réservation…' : 'Je réserve, retrait immédiat en boutique'}
            </button>
            <p className="mt-2 text-center text-[13px] text-ink-mute">Retrait gratuit à Coignières.</p>
            <button
              type="button"
              onClick={ajouterLivraison}
              disabled={lignesPanier.length === 0 || enCours !== null}
              className="btn-secondary mt-4 min-h-[48px] w-full px-5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Truck className="h-4 w-4 shrink-0" aria-hidden="true" />
              {enCours === 'livraison' ? 'Ajout…' : 'Ajouter au panier'}
            </button>
            <p className="mt-2 text-center text-[13px] text-ink-mute">Livraison à domicile ou en point relais.</p>
          </div>
        </>
      )}

      <section className="mt-12" aria-labelledby="conseil-boutique">
        <h2 id="conseil-boutique" className="font-display text-[24px] font-extrabold tracking-tight text-spruce">
          {resultat.type === 'selection' ? 'Je préfère en parler en boutique' : 'Notre boutique'}
        </h2>
        <div className="mt-4">
          <BoutiqueConseil />
        </div>
      </section>

      {resultat.type === 'boutique' && lignes.length > 0 && (
        <section className="mt-12" aria-labelledby="conseil-idees">
          <h2 id="conseil-idees" className="font-display text-[24px] font-extrabold tracking-tight text-spruce">
            Pour te donner une idée
          </h2>
          <ul className="mt-4 space-y-4">
            {lignes.map((l) => (
              <CarteProduitConseil key={l.ligne.cle} ligne={l.ligne} variantes={l.variantes} choisie={l.choisie} />
            ))}
          </ul>
          <p className="mt-4 text-[13px] leading-[1.55] text-ink-mute">{MENTION_ALIMENTATION}</p>
        </section>
      )}

      <details className="group mt-8 rounded-[20px] bg-white shadow-card">
        <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-[16px] font-semibold text-ink">Être rappelé</span>
            <span className="block text-[13px] text-ink-mute">Facultatif : on t’appelle pour en parler.</span>
          </span>
          <span
            aria-hidden="true"
            className="text-[22px] font-light leading-none text-spruce transition-transform group-open:rotate-45"
          >
            +
          </span>
        </summary>
        <div className="px-5 pb-5">
          <RappelForm objectif={objectifLibelle} contexte={contexteRappel} />
        </div>
      </details>

      <div className="mt-8 flex flex-wrap gap-x-2 gap-y-1">
        <button type="button" onClick={onRetour} className="btn-ghost -ml-4">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Modifier mes réponses
        </button>
        <button type="button" onClick={onRecommencer} className="btn-ghost">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Recommencer
        </button>
      </div>

      {resultat.type === 'selection' && (
        <div
          inert={!barre || isOpen}
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 border-t border-spruce/10 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_20px_rgba(45,90,45,0.06)] backdrop-blur-md transition-transform duration-300 md:hidden',
            barre && !isOpen ? 'translate-y-0' : 'translate-y-full'
          )}
        >
          <div className="flex items-center gap-4">
            <span className="whitespace-nowrap font-display text-[20px] font-extrabold tabular-nums text-spruce">
              {formatCents(totalCents)}
            </span>
            <button
              type="button"
              onClick={reserver}
              disabled={lignesPanier.length === 0 || enCours !== null}
              className="flex h-12 flex-1 items-center justify-center rounded-full bg-fresh px-5 text-[15px] font-semibold text-white transition-colors hover:bg-fresh-deep disabled:opacity-50"
            >
              {enCours === 'retrait' ? 'Réservation…' : 'Je réserve en boutique'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
