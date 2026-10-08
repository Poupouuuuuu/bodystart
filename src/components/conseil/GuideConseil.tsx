'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Activity, ArrowLeft, Check, CircleHelp, Dumbbell, Leaf, Moon, Target, Zap, type LucideIcon } from 'lucide-react'
import {
  REPONSES_VIDES,
  basculerContrainte,
  choisirObjectif,
  etapeAccessible,
  etapePrecedente,
  etapeSuivante,
  lireEtape,
  lireReponses,
  progression,
  reponsesCompletes,
  trouverObjectif,
  type Etape,
  type ReponsesPartielles,
} from '@/lib/conseil/etapes'
import { LIBELLES_BUDGET, LIBELLES_CONTRAINTES, LIBELLES_SEANCES } from '@/lib/conseil/libelles'
import { recommander } from '@/lib/conseil/moteur'
import { BUDGETS, CONTRAINTES, SEANCES, type Catalogue, type Contrainte, type Guide } from '@/lib/conseil/types'
import { frenchSpacing } from '@/lib/typo'
import { cn } from '@/lib/utils'
import ResultatConseil from './ResultatConseil'

/**
 * Guide /conseil : une question par écran, sélection immédiate, sans
 * coordonnées obligatoires.
 *
 * - Rendu serveur de l'écran 1 (la page est en ISR) ; l'URL n'est lue qu'au
 *   montage (pas de useSearchParams, donc pas de bascule en rendu navigateur).
 * - Chaque écran est une entrée d'historique (?objectif=…&etape=…) : la mesure
 *   voit le parcours et le bouton retour du téléphone revient à la question
 *   précédente (history.pushState + popstate).
 * - Les contraintes alimentaires (données de santé possibles) restent dans
 *   l'état du navigateur (et sessionStorage, pour survivre à un rechargement
 *   ou à un aller-retour vers une fiche) : jamais dans l'URL, une requête ou
 *   le panier.
 */

const CLE_SESSION = 'bs-guide-conseil'

type Icone = LucideIcon
const ICONES: Record<string, Icone> = {
  muscle: Dumbbell,
  affiner: Activity,
  endurance: Zap,
  recuperation: Moon,
  sante: Leaf,
  'ne-sait-pas': CircleHelp,
}

const QUESTION_SEANCES = 'Combien de séances de sport par semaine ?'
const QUESTION_CONTRAINTES = 'Une contrainte dans ton alimentation ?'
const QUESTION_BUDGET = 'Ton budget par mois ?'

function lireSession(): ReponsesPartielles | null {
  try {
    const brut = sessionStorage.getItem(CLE_SESSION)
    return brut ? lireReponses(JSON.parse(brut)) : null
  } catch {
    return null
  }
}

function sauverSession(r: ReponsesPartielles) {
  try {
    sessionStorage.setItem(CLE_SESSION, JSON.stringify(r))
  } catch {
    /* navigation privée : le guide marche sans */
  }
}

/** URL de l'écran : garde les autres paramètres (utm…), jamais les contraintes. */
function urlEcran(etape: Etape, objectif: string | null): string {
  const params = new URLSearchParams(window.location.search)
  params.delete('etape')
  params.delete('objectif')
  if (etape !== 'objectif') {
    if (objectif) params.set('objectif', objectif)
    params.set('etape', etape)
  }
  const qs = params.toString()
  return qs ? `${window.location.pathname}?${qs}` : window.location.pathname
}

interface Props {
  guide: Guide
  catalogue: Catalogue
}

export default function GuideConseil({ guide, catalogue }: Props) {
  const [reponses, setReponses] = useState<ReponsesPartielles>(REPONSES_VIDES)
  const [etape, setEtape] = useState<Etape>('objectif')

  const reponsesRef = useRef(reponses)
  useEffect(() => {
    reponsesRef.current = reponses
  }, [reponses])

  // Rang de l'entrée d'historique courante parmi celles poussées par le guide
  // (0 = entrée d'arrivée) : le bouton « Retour » ne fait history.back() que
  // s'il reste une étape du guide derrière.
  const rangRef = useRef(0)
  const focaliserRef = useRef(false)
  const titreRef = useRef<HTMLHeadingElement>(null)
  const zoneRef = useRef<HTMLDivElement>(null)
  const cheminRef = useRef('')

  // ─── Arrivée : ?objectif= (présélection), ?etape= (rechargement, retour) ───
  useEffect(() => {
    cheminRef.current = window.location.pathname
    const params = new URLSearchParams(window.location.search)
    const demandee = lireEtape(params.get('etape'))
    const objectifUrl = params.get('objectif')

    let r: ReponsesPartielles = REPONSES_VIDES
    if (demandee && demandee !== 'objectif') r = lireSession() ?? REPONSES_VIDES
    if (objectifUrl && trouverObjectif(guide, objectifUrl)) r = choisirObjectif(r, objectifUrl)

    const cible: Etape = demandee
      ? etapeAccessible(guide, r, demandee)
      : r.objectif
        ? etapeSuivante(guide, r, 'objectif')
        : 'objectif'

    reponsesRef.current = r
    setReponses(r)
    setEtape(cible)
    if (r.objectif) sauverSession(r)
    window.history.replaceState({ conseilRang: 0 }, '', urlEcran(cible, r.objectif))
  }, [guide])

  // ─── Bouton retour du téléphone / du navigateur ───
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if (window.location.pathname !== cheminRef.current) return
      const rang = (e.state as { conseilRang?: unknown } | null)?.conseilRang
      rangRef.current = typeof rang === 'number' ? rang : 0
      const demandee = lireEtape(new URLSearchParams(window.location.search).get('etape')) ?? 'objectif'
      focaliserRef.current = true
      setEtape(etapeAccessible(guide, reponsesRef.current, demandee))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [guide])

  // ─── Focus et défilement à chaque changement d'écran ───
  useEffect(() => {
    if (!focaliserRef.current) return
    focaliserRef.current = false
    titreRef.current?.focus({ preventScroll: true })
    const zone = zoneRef.current
    if (zone && zone.getBoundingClientRect().top < 0) {
      const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      zone.scrollIntoView({ block: 'start', behavior: reduit ? 'auto' : 'smooth' })
    }
  }, [etape])

  const aller = useCallback((r: ReponsesPartielles, suivante: Etape) => {
    reponsesRef.current = r
    setReponses(r)
    setEtape(suivante)
    sauverSession(r)
    rangRef.current += 1
    focaliserRef.current = true
    window.history.pushState({ conseilRang: rangRef.current }, '', urlEcran(suivante, r.objectif))
  }, [])

  const repondre = (r: ReponsesPartielles) => aller(r, etapeSuivante(guide, r, etape))

  const retour = () => {
    const precedente = etapePrecedente(guide, reponses, etape)
    if (!precedente) return
    if (rangRef.current > 0) {
      window.history.back()
      return
    }
    focaliserRef.current = true
    setEtape(precedente)
    window.history.replaceState({ conseilRang: 0 }, '', urlEcran(precedente, reponses.objectif))
  }

  const recommencer = () => aller(REPONSES_VIDES, 'objectif')

  const calcul = useMemo(() => {
    if (etape !== 'resultat') return null
    const completes = reponsesCompletes(guide, reponses)
    return completes ? { reponses: completes, resultat: recommander(guide, completes, catalogue) } : null
  }, [etape, guide, reponses, catalogue])

  const objectif = trouverObjectif(guide, reponses.objectif)

  if (etape === 'resultat' && calcul) {
    return (
      <div ref={zoneRef} className="scroll-mt-24">
        <ResultatConseil
          key={JSON.stringify(calcul.reponses)}
          resultat={calcul.resultat}
          reponses={calcul.reponses}
          objectifLibelle={objectif?.libelle ?? ''}
          titreRef={titreRef}
          onRetour={retour}
          onRecommencer={recommencer}
        />
      </div>
    )
  }

  const ecran: Etape = etape === 'resultat' ? 'objectif' : etape
  const { x, n } = progression(guide, reponses, ecran)
  const premier = ecran === 'objectif'

  return (
    <div ref={zoneRef} className="container max-w-2xl scroll-mt-24 pb-16 pt-8 md:pb-24 md:pt-14">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mustard-ink">
        Conseil gratuit · Coignières
      </p>
      <h1
        className={cn(
          'mt-3 font-display font-extrabold tracking-tight text-spruce',
          premier ? 'text-[34px] leading-[1.05] sm:text-[44px]' : 'text-[20px] leading-tight'
        )}
      >
        Trouve ton produit en 1 minute
      </h1>
      {premier && (
        <p className="mt-4 text-[16px] leading-[1.6] text-ink-mute md:text-[17px]">
          {frenchSpacing(
            'Réponds à quelques questions : on te montre tout de suite ce qu’on te conseillerait au comptoir, parmi les produits en stock dans notre boutique de Coignières. Pas besoin de laisser tes coordonnées.'
          )}
        </p>
      )}

      <div className="mt-8 flex min-h-[44px] items-center justify-between gap-4">
        {premier ? (
          <span />
        ) : (
          <button type="button" onClick={retour} className="btn-ghost -ml-4">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour
          </button>
        )}
        <p className="text-[13px] font-semibold tabular-nums text-ink-mute">
          Étape {x}/{n}
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sage" aria-hidden="true">
        <div
          className="h-full rounded-full bg-fresh transition-[width] duration-500 ease-out-expo"
          style={{ width: `${(x / n) * 100}%` }}
        />
      </div>

      <div className="mt-8">
        {ecran === 'objectif' && (
          <Question titre="Quel est ton objectif ?" titreRef={titreRef}>
            {guide.objectifs.map((o) => (
              <Choix
                key={o.cle}
                libelle={o.libelle}
                icone={ICONES[o.cle] ?? Target}
                choisi={reponses.objectif === o.cle}
                onClick={() => repondre(choisirObjectif(reponses, o.cle))}
              />
            ))}
          </Question>
        )}

        {ecran === 'seances' && (
          <Question titre={QUESTION_SEANCES} titreRef={titreRef}>
            {SEANCES.map((s) => (
              <Choix
                key={s}
                libelle={LIBELLES_SEANCES[s]}
                choisi={reponses.seances === s}
                onClick={() => repondre({ ...reponses, seances: s })}
              />
            ))}
          </Question>
        )}

        {ecran === 'question' && objectif?.type === 'parcours' && objectif.questionSup && (
          <Question titre={objectif.questionSup.texte} titreRef={titreRef}>
            {[
              { valeur: true, libelle: 'Oui' },
              { valeur: false, libelle: 'Non' },
            ].map((c) => (
              <Choix
                key={c.libelle}
                libelle={c.libelle}
                choisi={reponses.questionSup === c.valeur}
                onClick={() => repondre({ ...reponses, questionSup: c.valeur })}
              />
            ))}
          </Question>
        )}

        {ecran === 'contraintes' && (
          <EcranContraintes
            initiales={reponses.contraintes}
            titreRef={titreRef}
            onContinuer={(contraintes) => repondre({ ...reponses, contraintes })}
          />
        )}

        {ecran === 'budget' && (
          <Question titre={QUESTION_BUDGET} titreRef={titreRef}>
            {BUDGETS.map((b) => (
              <Choix
                key={b}
                libelle={LIBELLES_BUDGET[b]}
                choisi={reponses.budget === b}
                onClick={() => repondre({ ...reponses, budget: b })}
              />
            ))}
          </Question>
        )}
      </div>
    </div>
  )
}

// ─── Briques d'écran ─────────────────────────────────────────

function Question({
  titre,
  titreRef,
  children,
}: {
  titre: string
  titreRef: React.Ref<HTMLHeadingElement>
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby="conseil-question">
      <h2
        id="conseil-question"
        ref={titreRef}
        tabIndex={-1}
        className="font-display text-[24px] font-extrabold leading-tight tracking-tight text-spruce outline-none md:text-[30px]"
      >
        {frenchSpacing(titre)}
      </h2>
      <div className="mt-6 space-y-3">{children}</div>
    </section>
  )
}

function Choix({
  libelle,
  icone: Icone,
  choisi,
  onClick,
}: {
  libelle: string
  icone?: Icone
  choisi: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={choisi}
      className={cn(
        'press flex min-h-[60px] w-full items-center gap-4 rounded-[20px] bg-white px-5 py-3.5 text-left shadow-card transition-shadow hover:shadow-lift',
        choisi && 'ring-2 ring-fresh'
      )}
    >
      {Icone && (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-spruce">
          <Icone className="h-5 w-5" strokeWidth={1.75} aria-hidden={true} />
        </span>
      )}
      <span className="flex-1 text-[16px] font-semibold leading-snug text-ink">{frenchSpacing(libelle)}</span>
      {choisi && <Check className="h-5 w-5 shrink-0 text-fresh" aria-hidden="true" />}
    </button>
  )
}

function EcranContraintes({
  initiales,
  titreRef,
  onContinuer,
}: {
  initiales: Contrainte[] | null
  titreRef: React.Ref<HTMLHeadingElement>
  onContinuer: (contraintes: Contrainte[]) => void
}) {
  const [selection, setSelection] = useState(() => ({
    aucune: initiales !== null && initiales.length === 0,
    contraintes: initiales ?? [],
  }))
  const options: { valeur: Contrainte | 'aucune'; libelle: string; coche: boolean }[] = [
    ...CONTRAINTES.map((c) => ({ valeur: c, libelle: LIBELLES_CONTRAINTES[c], coche: selection.contraintes.includes(c) })),
    { valeur: 'aucune', libelle: 'Aucune', coche: selection.aucune },
  ]

  return (
    <section aria-labelledby="conseil-question">
      <h2
        id="conseil-question"
        ref={titreRef}
        tabIndex={-1}
        className="font-display text-[24px] font-extrabold leading-tight tracking-tight text-spruce outline-none md:text-[30px]"
      >
        {frenchSpacing(QUESTION_CONTRAINTES)}
      </h2>
      <p className="mt-2 text-[14px] leading-[1.55] text-ink-mute">
        {frenchSpacing('Plusieurs choix possibles. Tes réponses restent dans ton navigateur : on ne les enregistre pas.')}
      </p>
      <fieldset className="mt-6 space-y-3" aria-labelledby="conseil-question">
        {options.map((o) => (
          <label
            key={o.valeur}
            className={cn(
              'flex min-h-[60px] cursor-pointer items-center gap-4 rounded-[20px] bg-white px-5 py-3.5 shadow-card transition-shadow hover:shadow-lift',
              o.coche && 'ring-2 ring-fresh'
            )}
          >
            <input
              type="checkbox"
              checked={o.coche}
              onChange={() => setSelection((s) => basculerContrainte(s, o.valeur))}
              className="h-5 w-5 shrink-0 accent-fresh"
            />
            <span className="flex-1 text-[16px] font-semibold text-ink">{o.libelle}</span>
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        onClick={() => onContinuer(selection.aucune ? [] : selection.contraintes)}
        className="btn-primary press mt-8 min-h-[48px] w-full"
      >
        Continuer
      </button>
    </section>
  )
}
