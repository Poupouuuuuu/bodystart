import Link from 'next/link'
import Image from 'next/image'
import type { CSSProperties } from 'react'
import { ArrowRight, ArrowUpRight, MapPin, Star } from 'lucide-react'
import { GOOGLE_LISTING_URL } from '@/lib/store-info'
import { getGoogleRating, formatRating } from '@/lib/shopify/google-rating'
import type { DecorSaisonPremium } from '@/components/saison/decors'

/**
 * HERO V3 — immersif, pleine largeur.
 *
 * Retour d'Adam sur la V2 : « visuellement identique à la V1 ». Cause : même
 * squelette (texte à gauche / photo à droite dans un cadre) et mêmes couleurs.
 * Ici la boutique DEVIENT le hero : la photo de l'intérieur (étagères noires,
 * mur végétal, bois) couvre l'écran, le titre en Fraunces est posé dessus en
 * crème, très grand (jusqu'à 104 px). C'est l'identité réelle du lieu, pas un
 * habillage.
 *
 * Perf : la photo est le candidat LCP → `priority`, jamais masquée par une
 * animation. Seuls les éléments secondaires montent en cascade (.hero-rise).
 * Le h1 reste sans animation (règle V2).
 * - `fetchPriority="high"` : `priority` seul précharge en priorité réseau
 *   basse (Next 15), derrière les polices.
 * - `sizes` à 70vw sous 640 px : le téléphone prend la variante 828 px
 *   (67 Ko) au lieu de 1200 px (128 Ko). Sur mobile on ne voit que le haut de
 *   la photo, sous un voile sombre : différence invisible (captures 390 px
 *   ×3 comparées), LCP mobile −550 ms à lui seul (mesure du 08/10/2026,
 *   4G lent + CPU ×4).
 *
 * Saison décorée (components/saison, 19/10/2026) : haut en deux parties
 * (HeroScinde), photo nette à droite et fond uni derrière le texte, aux
 * couleurs du thème. Même photo, même priorité ; textes et boutons inchangés
 * (ContenuHero, partagé par les deux mises en page).
 */
export default async function HeroV3({
  decor = null,
  variante,
}: {
  decor?: DecorSaisonPremium | null
  /** Variante de couleur du thème (`?hero=` hors production). */
  variante?: string
}) {
  const rating = await getGoogleRating()
  if (decor) return <HeroScinde hero={decor.hero} variante={variante} rating={rating} />

  return (
    <section className="relative isolate flex min-h-[92dvh] items-end overflow-hidden bg-[#0f160f]">
      <Image
        src="/assets/interieur.webp"
        alt={ALT_PHOTO}
        fill
        priority
        fetchPriority="high"
        quality={72}
        sizes="(max-width: 640px) 70vw, 100vw"
        className="object-cover object-[50%_38%]"
      />
      {/* Voiles : sombre en bas (lisibilité du texte), plus léger en haut
          pour laisser respirer la photo ; second voile latéral côté texte. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,22,15,0.97)_0%,rgba(15,22,15,0.74)_36%,rgba(15,22,15,0.28)_68%,rgba(15,22,15,0.38)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(100deg,rgba(15,22,15,0.6)_0%,rgba(15,22,15,0)_58%)]"
      />

      <div className="container relative pb-10 pt-36 md:pb-14 md:pt-44">
        <ContenuHero c={CLASSES_PHOTO} rating={rating} />
      </div>
    </section>
  )
}

const ALT_PHOTO =
  'Intérieur de la boutique BodyStart Nutrition à Coignières : rayons de compléments, mur végétal et comptoir'

type Note = Awaited<ReturnType<typeof getGoogleRating>>

/**
 * Haut de page en deux parties (saison décorée) : photo nette à droite
 * (la moitié de l'écran, à partir de lg) ou en bandeau en haut (240 px, en
 * dessous), fond uni derrière le texte. Les couleurs viennent de la palette
 * du thème (variables --h-*, components/saison/decors.ts).
 * - `sizes` : 70vw sous 640 px comme hors saison (variante 828 px au
 *   téléphone) ; à partir de lg, un peu plus que la moitié de l'écran (photo
 *   agrandie ×1,22 pour la cadrer).
 * - Photo cadrée sur le mur végétal et les étagères éclairées (zoom léger,
 *   moins de plafond).
 * - À partir de lg, la carte boutique est posée en bas de la photo : le
 *   texte tient dans le premier écran.
 */
function HeroScinde({
  hero,
  variante,
  rating,
}: {
  hero: DecorSaisonPremium['hero']
  variante?: string
  rating: Note
}) {
  const palette = (variante && hero.palettes[variante]) || hero.palettes[hero.defaut]
  const DecorPhoto = hero.DecorPhoto
  return (
    <section
      className="relative isolate overflow-hidden bg-[color:var(--h-fond)]"
      style={palette as CSSProperties}
    >
      <div className="relative h-[240px] overflow-hidden sm:h-[260px] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-1/2">
        <Image
          src="/assets/interieur.webp"
          alt={ALT_PHOTO}
          fill
          priority
          fetchPriority="high"
          quality={72}
          sizes="(max-width: 640px) 70vw, (max-width: 1023px) 100vw, 64vw"
          className="origin-[50%_58%] scale-[1.22] object-cover object-[50%_48%] lg:origin-[55%_62%] lg:object-[55%_55%]"
        />
        <DecorPhoto />
        {/* Jonction franche entre la photo et le fond uni. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[3px] bg-[color:var(--h-liseret)] lg:inset-y-0 lg:left-0 lg:right-auto lg:h-auto lg:w-[3px]"
        />
      </div>

      <div className="container relative pb-10 pt-9 lg:static lg:flex lg:min-h-[calc(100dvh-7.25rem)] lg:items-center lg:py-14">
        <div className="lg:w-[calc(50vw_-_max(2rem,50vw_-_568px)_-_3rem)]">
          <ContenuHero c={CLASSES_SCINDE} rating={rating} />
        </div>
      </div>
    </section>
  )
}

/** Classes du contenu, selon la mise en page (texte et liens identiques). */
interface ClassesHero {
  grille: string
  colonne: string
  surTitre: string
  trait?: string
  puce: string
  etoiles: string
  titre: string
  accent: string
  paragraphe: string
  boutonPrincipal: string
  rond: string
  boutonSecondaire: string
  carteBloc: string
  carteExterieur: string
  carteInterieur: string
  carteLibelle: string
  carteTitre: string
  carteTexte: string
  carteLien: string
  chiffres: string
  chiffreValeur: string
  chiffreLibelle: string
}

/** Hors saison : texte crème posé sur la photo voilée. */
const CLASSES_PHOTO: ClassesHero = {
  grille: 'grid items-end gap-10 lg:grid-cols-[1fr_auto] lg:gap-16',
  colonne: 'max-w-[920px]',
  surTitre: 'mb-5 max-w-[640px] text-[14px] font-semibold leading-snug text-white/85 md:text-[15px]',
  puce: 'inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[12px] font-semibold text-white backdrop-blur-md transition-colors duration-500 ease-out-expo group-hover:bg-white/20',
  etoiles: 'h-3.5 w-3.5 fill-mustard text-mustard',
  titre:
    'display-hero font-display text-[46px] font-extrabold leading-[0.94] tracking-[-0.025em] text-canvas sm:text-[60px] md:text-[76px] lg:text-[92px] xl:text-[104px]',
  accent: 'text-sage',
  paragraphe: 'hero-rise hero-rise-1 mt-7 max-w-[560px] text-[17px] leading-[1.6] text-white/80 md:text-[19px]',
  boutonPrincipal:
    'press group inline-flex items-center gap-3 rounded-full bg-canvas py-2 pl-6 pr-2 text-[15px] font-semibold text-spruce shadow-hero transition-all duration-500 ease-out-expo hover:bg-white',
  rond: 'flex h-9 w-9 items-center justify-center rounded-full bg-spruce text-canvas transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:scale-105',
  boutonSecondaire:
    'press group inline-flex min-h-[52px] items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 text-[15px] font-semibold text-white backdrop-blur-md transition-colors duration-500 ease-out-expo hover:bg-white/20',
  carteBloc: 'hero-rise hero-rise-3 lg:justify-self-end',
  carteExterieur: 'rounded-[1.6rem] border border-white/10 bg-white/[0.06] p-1.5 backdrop-blur-xl',
  carteInterieur:
    'rounded-[calc(1.6rem-0.375rem)] bg-white/[0.08] px-5 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]',
  // Blanc 75 % : 10 px, il faut 4,5:1 sur le verre (60 % donnait 3,6:1).
  carteLibelle: 'text-[10px] font-medium uppercase tracking-[0.2em] text-white/75',
  carteTitre: 'mt-1.5 font-display text-[21px] font-bold leading-tight text-canvas',
  carteTexte: 'mt-1.5 flex items-center gap-1.5 text-[13px] text-white/70',
  carteLien:
    'group mt-1 inline-flex min-h-[44px] items-center gap-1.5 text-[13px] font-semibold text-sage transition-colors duration-500 ease-out-expo hover:text-white',
  chiffres: 'hero-rise hero-rise-3 mt-12 flex flex-wrap gap-x-10 gap-y-3 border-t border-white/10 pt-6',
  chiffreValeur: 'font-display text-[17px] font-bold text-canvas',
  chiffreLibelle: 'text-[13px] text-white/60',
}

/** Saison : couleurs de la palette du thème (variables --h-*), sur fond uni.
 * Titre plus petit à partir de lg : il tient dans la moitié gauche. */
const CLASSES_SCINDE: ClassesHero = {
  grille: 'grid gap-8',
  colonne: '',
  surTitre:
    'mb-5 max-w-[640px] text-[14px] font-semibold leading-snug text-[color:var(--h-sur-titre)] md:text-[15px]',
  trait: 'mr-3 inline-block h-px w-8 -translate-y-[0.3em] bg-[color:var(--h-trait)] align-middle',
  puce: 'inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[color:var(--h-ligne)] bg-[color:var(--h-voile)] px-3.5 py-1.5 text-[12px] font-semibold text-[color:var(--h-texte)] transition-colors duration-500 ease-out-expo group-hover:bg-[color:var(--h-voile-fort)]',
  etoiles: 'h-3.5 w-3.5 fill-[color:var(--h-trait)] text-[color:var(--h-trait)]',
  titre:
    'display-hero font-display text-[46px] font-extrabold leading-[0.94] tracking-[-0.025em] text-[color:var(--h-texte)] sm:text-[60px] md:text-[72px] lg:text-[58px] xl:text-[68px]',
  accent: 'text-[color:var(--h-accent)]',
  paragraphe:
    'hero-rise hero-rise-1 mt-7 max-w-[560px] text-[17px] leading-[1.6] text-[color:var(--h-texte-doux)] md:text-[18px]',
  boutonPrincipal:
    'press group inline-flex items-center gap-3 rounded-full bg-[color:var(--h-bouton)] py-2 pl-6 pr-2 text-[15px] font-semibold text-[color:var(--h-bouton-texte)] transition-opacity duration-500 ease-out-expo hover:opacity-90',
  rond: 'flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--h-rond)] text-[color:var(--h-rond-texte)] transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:scale-105',
  boutonSecondaire:
    'press group inline-flex min-h-[52px] items-center gap-2 rounded-full border border-[color:var(--h-ligne-forte)] bg-[color:var(--h-voile)] px-6 text-[15px] font-semibold text-[color:var(--h-texte)] transition-colors duration-500 ease-out-expo hover:bg-[color:var(--h-voile-fort)]',
  carteBloc:
    'hero-rise hero-rise-3 max-w-[440px] lg:absolute lg:bottom-10 lg:left-[calc(50%_+_2.5rem)] lg:z-10 lg:w-[360px]',
  carteExterieur:
    'rounded-[1.6rem] border border-[color:var(--h-ligne)] p-1.5 lg:bg-[color:var(--h-fond)] lg:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)]',
  carteInterieur: 'rounded-[calc(1.6rem-0.375rem)] bg-[color:var(--h-voile)] px-5 py-4',
  carteLibelle: 'text-[10px] font-medium uppercase tracking-[0.2em] text-[color:var(--h-texte-doux)]',
  carteTitre: 'mt-1.5 font-display text-[21px] font-bold leading-tight text-[color:var(--h-texte)]',
  carteTexte: 'mt-1.5 flex items-center gap-1.5 text-[13px] text-[color:var(--h-texte-doux)]',
  carteLien:
    'group mt-1 inline-flex min-h-[44px] items-center gap-1.5 text-[13px] font-semibold text-[color:var(--h-lien)] underline-offset-4 hover:underline',
  chiffres:
    'hero-rise hero-rise-3 mt-10 flex flex-wrap gap-x-10 gap-y-3 border-t border-[color:var(--h-ligne)] pt-6',
  chiffreValeur: 'font-display text-[17px] font-bold text-[color:var(--h-texte)]',
  chiffreLibelle: 'text-[13px] text-[color:var(--h-texte-doux)]',
}

/** Textes, liens et boutons du haut de l'accueil (identiques en saison). */
function ContenuHero({ c, rating }: { c: ClassesHero; rating: Note }) {
  return (
    <>
      <div className={c.grille}>
        {/* ─── Titre ─── */}
        <div className={c.colonne}>
          {/* h1 = la requête visée (audit SEO du 10/10/2026), en surtitre ; le
              slogan reste l'élément dominant (et l'élément LCP texte), en <p>.
              Pas d'animation sur le h1 (règle V2). */}
          <h1 className={c.surTitre}>
            {c.trait && <span aria-hidden="true" className={c.trait} />}
            Compléments alimentaires et nutrition sportive à Coignières
          </h1>

          <div className="hero-rise mb-6 flex flex-wrap items-center gap-2.5">
            {/* Cible tactile de 44 px ; la pastille visible garde ses 36 px et -my-1
                laisse la ligne à la même hauteur. */}
            <a
              href={GOOGLE_LISTING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group -my-1 inline-flex min-h-[44px] items-center"
            >
              <span className={c.puce}>
                <Star className={c.etoiles} aria-hidden="true" />
                {formatRating(rating)}/5 · {rating.count} avis Google
              </span>
            </a>
          </div>

          <p className={c.titre}>
            Les bons compléments.
            <br />
            <span className={c.accent}>Le bon conseil.</span>
          </p>

          <p className={c.paragraphe}>
            BodyStart Nutrition est une boutique de compléments alimentaires et de
            nutrition sportive à Coignières (78), anciennement BodyFit&nbsp;: conseil en
            boutique, Click &amp; Collect et livraison partout en France.
          </p>

          <div className="hero-rise hero-rise-2 mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link href="/products" className={c.boutonPrincipal}>
              Voir les produits
              <span className={c.rond}>
                <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              </span>
            </Link>
            <Link href="/conseil" className={c.boutonSecondaire}>
              Trouve ton produit en 1 min
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-500 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>

        {/* ─── Carte boutique (verre, double enceinte) ─── */}
        <div className={c.carteBloc}>
          <div className={c.carteExterieur}>
            <div className={c.carteInterieur}>
              <p className={c.carteLibelle}>La boutique</p>
              <p className={c.carteTitre}>Lun. au sam. · 11h à 19h</p>
              <p className={c.carteTexte}>
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                8 rue du Pont des Landes, Coignières
              </p>
              <Link href="/stores" className={c.carteLien}>
                Itinéraire &amp; infos
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-500 ease-out-expo group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Faits réels (pas de chiffres inventés) */}
      <dl className={c.chiffres}>
        {[
          { value: '13 ans', label: 'de conseil au comptoir' },
          { value: '+2 600', label: 'clients conseillés' },
          { value: 'Click & Collect', label: 'retrait immédiat si en stock' },
        ].map((f) => (
          <div key={f.value} className="flex items-baseline gap-2">
            <dt className="sr-only">{f.label}</dt>
            <dd className={c.chiffreValeur}>{f.value}</dd>
            <dd className={c.chiffreLibelle}>{f.label}</dd>
          </div>
        ))}
      </dl>
    </>
  )
}
