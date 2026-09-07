import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Gift } from 'lucide-react'
import { buildPageMetadata } from '@/lib/seo'

/**
 * Règlement du jeu-concours « Pack Venomette » (Instagram, 8 → 13 septembre
 * 2026, tirage le 14). Page volontairement NON indexée : elle n’a d’intérêt
 * que pendant l’opération, liée depuis le bandeau et l’email de lancement.
 * À retirer (ou archiver) après la remise du lot.
 */
export const metadata: Metadata = buildPageMetadata({
  path: '/jeu-concours',
  title: 'Règlement du jeu-concours Pack Venomette',
  description:
    'Règlement du jeu-concours BodyStart × Venomette : un pack de compléments alimentaires d’une valeur de 150 € à gagner sur Instagram, du 8 au 13 septembre 2026.',
  noIndex: true,
})

// Lien de participation : la publication Instagram de la vidéo dès qu’elle
// est en ligne (à remplacer), en attendant le compte BodyStart.
const PARTICIPATION_URL = 'https://www.instagram.com/bodystart_nutrition/'

const essentials = [
  { label: 'Quand', value: 'Du mardi 8 septembre 2026 (publication de la vidéo) au dimanche 13 septembre 2026, 23h59 (heure de Paris).' },
  { label: 'Quoi', value: 'Un pack complet d’une valeur de 150 € : gainer, créatine, whey, multivitamines et oméga-3.' },
  { label: 'Comment', value: 'Sous la vidéo sur Instagram : suivre @bodystart_nutrition et le compte de Venomette, aimer la publication, identifier un ami en commentaire.' },
  { label: 'Tirage', value: 'Lundi 14 septembre 2026. Le gagnant est prévenu par message privé et annoncé en story.' },
]

const sections = [
  {
    title: 'Article 1 — Organisateur',
    content: `La société BODYSTART NUTRITION (SASU au capital de 500 €, RCS Versailles 909 197 469), dont le siège est situé 8 Rue du Pont des Landes, 78310 Coignières, ci-après « l’Organisateur », organise un jeu-concours gratuit et sans obligation d’achat intitulé « Pack Venomette », sur le réseau social Instagram.`,
  },
  {
    title: 'Article 2 — Durée',
    content: `Le jeu se déroule du mardi 8 septembre 2026, à compter de la publication de la vidéo sur Instagram, au dimanche 13 septembre 2026 à 23h59 (heure de Paris). Les participations enregistrées après cette date ne sont pas prises en compte.`,
  },
  {
    title: 'Article 3 — Conditions de participation',
    content: `Le jeu est ouvert à toute personne physique majeure (18 ans révolus) résidant en France métropolitaine et disposant d’un compte Instagram public. Sont exclus les salariés et dirigeants de l’Organisateur, les membres de leur famille, ainsi que toute personne ayant participé à l’organisation du jeu. Une seule participation par personne et par compte Instagram est admise : les comptes multiples, automatisés ou créés pour l’occasion entraînent la disqualification.`,
  },
  {
    title: 'Article 4 — Modalités de participation',
    content: `Pour participer, il suffit, sous la publication Instagram de l’Organisateur consacrée à la vidéo : 1) de suivre le compte @bodystart_nutrition et le compte de Venomette ; 2) d’aimer la publication ; 3) de commenter la publication en identifiant un ami. La participation est gratuite et sans obligation d’achat. Le code promotionnel VENO10 diffusé à cette occasion est indépendant du jeu : son utilisation n’est ni nécessaire pour participer, ni prise en compte dans le tirage.`,
  },
  {
    title: 'Article 5 — Dotation',
    content: `Le lot mis en jeu est un pack de compléments alimentaires d’une valeur commerciale indicative de 150 € TTC, composé d’un gainer, d’une créatine, d’une whey, d’un multivitamines et d’un oméga-3. Les références et parfums sont choisis par l’Organisateur parmi les produits disponibles en stock au moment de la remise. Le lot n’est ni échangeable, ni remboursable, ni cessible, et ne peut donner lieu à aucune contrepartie en espèces. Les compléments alimentaires ne se substituent pas à une alimentation variée et équilibrée et à un mode de vie sain.`,
  },
  {
    title: 'Article 6 — Désignation du gagnant',
    content: `Un tirage au sort parmi les participations valides est effectué par l’Organisateur le lundi 14 septembre 2026. Le gagnant est contacté par message privé Instagram dans les 48 heures suivant le tirage et dispose de 7 jours pour se manifester et communiquer ses coordonnées. Passé ce délai, un nouveau tirage désigne un autre gagnant. Le prénom et la ville du gagnant peuvent être annoncés en story Instagram et dans la newsletter de l’Organisateur, avec son accord.`,
  },
  {
    title: 'Article 7 — Remise du lot',
    content: `Le lot est retiré en boutique (8 Rue du Pont des Landes, 78310 Coignières) ou expédié, en France métropolitaine, à l’adresse indiquée par le gagnant, les frais d’envoi étant pris en charge par l’Organisateur. La remise intervient dans un délai de 30 jours suivant la réception des coordonnées du gagnant.`,
  },
  {
    title: 'Article 8 — Données personnelles',
    content: `Les données collectées (identifiant Instagram, puis nom, adresse postale et email du gagnant) sont utilisées uniquement pour la gestion du jeu et la remise du lot, puis supprimées dans les 3 mois suivant la fin du jeu, sauf obligation légale. Conformément au RGPD, chaque participant dispose d’un droit d’accès, de rectification et de suppression de ses données, en écrivant à contact@bodystart-nutrition.fr.`,
  },
  {
    title: 'Article 9 — Instagram',
    content: `Ce jeu n’est ni géré, ni parrainé, ni associé à Instagram ou à Meta. Les informations communiquées par les participants sont fournies à l’Organisateur et non à Instagram. Instagram est dégagé de toute responsabilité concernant ce jeu.`,
  },
  {
    title: 'Article 10 — Responsabilité et modification',
    content: `L’Organisateur se réserve le droit d’écourter, de prolonger, de modifier ou d’annuler le jeu en cas de force majeure ou d’événement indépendant de sa volonté, sans que sa responsabilité puisse être engagée. Il ne saurait être tenu responsable d’un dysfonctionnement du réseau Internet ou de la plateforme Instagram empêchant la participation. Toute participation incomplète, frauduleuse ou non conforme au présent règlement est considérée comme nulle.`,
  },
  {
    title: 'Article 11 — Acceptation du règlement',
    content: `La participation au jeu implique l’acceptation pleine et entière du présent règlement, consultable sur cette page pendant toute la durée du jeu. Toute question peut être adressée à contact@bodystart-nutrition.fr ou au 07 61 84 75 80.`,
  },
]

export default function JeuConcoursPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="container py-12 md:py-24 max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 min-h-[44px] text-sm font-semibold text-ink-mute hover:text-spruce mb-6 md:mb-10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
        </Link>

        <div className="bg-white rounded-2xl border border-spruce/10 p-6 md:p-12 mb-6 md:mb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center flex-shrink-0">
              <Gift className="w-6 h-6 text-spruce" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-1">
                Jeu-concours Instagram
              </p>
              <h1 className="font-display text-[28px] md:text-[40px] font-extrabold text-spruce leading-[1.1] tracking-tight">
                Pack Venomette : 150 € à gagner
              </h1>
            </div>
          </div>

          <dl className="space-y-4 border-t border-spruce/10 pt-6">
            {essentials.map(({ label, value }) => (
              <div key={label} className="grid grid-cols-[88px_1fr] md:grid-cols-[120px_1fr] gap-3">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-spruce pt-0.5">
                  {label}
                </dt>
                <dd className="text-ink leading-relaxed text-[15px] md:text-base">{value}</dd>
              </div>
            ))}
          </dl>

          <a
            href={PARTICIPATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary press mt-8 w-full sm:w-auto"
          >
            Participer sur Instagram
          </a>
          <p className="text-ink-mute text-sm mt-4">
            Le code <strong className="text-ink">VENO10</strong> (−10 % sur tout le site) est offert à tout
            le monde pendant l&apos;opération, que vous participiez ou non.
          </p>
        </div>

        <div className="space-y-4 md:space-y-6">
          {sections.map(({ title, content }) => (
            <section key={title} className="bg-white rounded-2xl border border-spruce/10 p-6 md:p-8">
              <h2 className="font-display text-lg md:text-2xl font-extrabold tracking-tight text-spruce mb-3 md:mb-4">
                {title}
              </h2>
              <p className="text-ink leading-relaxed text-[15px] md:text-base">{content}</p>
            </section>
          ))}
        </div>

        <p className="text-ink-mute text-sm mt-8">
          Pour le traitement de vos données, voir aussi notre{' '}
          <Link href="/confidentialite" className="underline underline-offset-2 hover:text-spruce">
            politique de confidentialité
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
