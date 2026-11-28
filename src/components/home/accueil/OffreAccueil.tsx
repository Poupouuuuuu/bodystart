'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  dateSaison,
  lireApercu,
  periodeDeRang,
  prochainChangement,
  type ApercuSaison,
  type PeriodeSaison,
} from '@/lib/saison'
import { dernierJour, offreDe, periodeOffre, periodeOffreServeur } from '@/lib/offre-accueil'

/**
 * Offre du haut de l'accueil : sur-titre, titre, phrase, bouton et lien
 * secondaire. Textes dans lib/offre-accueil, par thème. Pas de compte à
 * rebours (Gestion, 28/11/2026).
 *
 * Bascule à l'heure pile, même avec la page en cache (modèle du header) :
 * - premier rendu = la période rendue par le serveur (son rang dans le
 *   metafield) et son « dernier jour », SANS lire l'heure : le HTML en cache
 *   et l'hydratation donnent le même texte (sinon erreur React 418) ;
 * - ensuite, un effet recalcule à l'heure du navigateur, puis à la prochaine
 *   borne de période (prochainChangement) et à chaque minute pleine (passage
 *   à minuit heure de Paris : « Dernier jour »). L'état ne change que si la
 *   période ou le « dernier jour » change.
 */
export interface ClassesOffre {
  surTitre: string
  point: string
  titre: string
  accent: string
  phrase: string
  actions: string
  bouton: string
  rond: string
  second: string
}

interface EtatOffre {
  periode: PeriodeSaison | null
  dernier: boolean
}

export default function OffreAccueil({
  periodes,
  rangServeur,
  dernierJourServeur,
  apercu = null,
  previsualisation = false,
  c,
}: {
  /** Périodes du metafield bodystart.saison (lib/shopify/saison). */
  periodes: PeriodeSaison[]
  /** Rang de la période rendue par le serveur (-1 : offre permanente). */
  rangServeur: number
  /** La période rendue finit-elle le jour du rendu serveur (heure de Paris) ? */
  dernierJourServeur: boolean
  /** Thème forcé sur la preview (cookie de `?saison=`), null en production. */
  apercu?: ApercuSaison | null
  previsualisation?: boolean
  c: ClassesOffre
}) {
  const [etat, setEtat] = useState<EtatOffre>(() => ({
    periode: periodeDeRang(periodes, rangServeur),
    dernier: dernierJourServeur,
  }))

  useEffect(() => {
    const recherche = previsualisation ? new URLSearchParams(window.location.search) : null
    // Preview : thème forcé (?saison=, puis le cookie lu par le serveur) ou date forcée (?saison_date=).
    const force = (recherche && lireApercu(recherche.get('saison'))) || apercu
    const dateForcee = recherche?.get('saison_date') ?? null
    let minuterie: ReturnType<typeof setTimeout> | undefined

    const maj = () => {
      clearTimeout(minuterie)
      const now = dateForcee ? dateSaison(dateForcee, true) : new Date()
      const periode = force ? periodeOffreServeur(periodes, now, force) : periodeOffre(periodes, now)
      const dernier = dernierJour(periode, now)
      setEtat((e) => (e.periode === periode && e.dernier === dernier ? e : { periode, dernier }))
      if (dateForcee) return
      // Prochaine minute pleine, ou plus tôt la prochaine borne de période.
      const reel = Date.now()
      const minute = 60000 - (reel % 60000)
      const borne = prochainChangement(periodes, new Date(reel))
      const delai = borne ? Math.min(minute, borne.getTime() - reel) : minute
      minuterie = setTimeout(maj, Math.max(delai, 0) + 250)
    }

    maj()
    // Téléphone sorti de veille : les minuteries ont pu prendre du retard.
    const auRetour = () => {
      if (document.visibilityState === 'visible') maj()
    }
    document.addEventListener('visibilitychange', auRetour)
    return () => {
      clearTimeout(minuterie)
      document.removeEventListener('visibilitychange', auRetour)
    }
  }, [periodes, previsualisation, apercu])

  const offre = offreDe(etat.periode, etat.dernier)

  return (
    <div data-offre={offre.cle}>
      <p className={c.surTitre}>
        <span aria-hidden="true" className={c.point} />
        {offre.surTitre}
      </p>

      {/* Pas le H1 de la page (gardé mot pour mot, SEO) : un <p>. */}
      <p className={c.titre}>
        <TitreAccent titre={offre.titre} accent={offre.accent} classe={c.accent} />
      </p>

      <p className={c.phrase}>{offre.phrase}</p>

      <div className={c.actions}>
        <Link href={offre.lien} className={cn('press group', c.bouton)}>
          {offre.bouton}
          <span className={c.rond}>
            <ArrowRight
              className="h-4 w-4 transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5"
              strokeWidth={2}
              aria-hidden="true"
            />
          </span>
        </Link>
        <Link href={offre.second.lien} className={c.second}>
          {offre.second.texte}
        </Link>
      </div>
    </div>
  )
}

/** Titre avec ses mots en couleur (première occurrence de `accent`). */
function TitreAccent({ titre, accent, classe }: { titre: string; accent: string; classe: string }) {
  const i = accent ? titre.indexOf(accent) : -1
  if (i < 0) return <>{titre}</>
  return (
    <>
      {titre.slice(0, i)}
      <span className={classe}>{accent}</span>
      {titre.slice(i + accent.length)}
    </>
  )
}
