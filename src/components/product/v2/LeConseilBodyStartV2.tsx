import { CheckCircle2, AlertCircle, MessageCircle } from 'lucide-react'

/**
 * Bloc "Le conseil BodyStart" V2 — differenciateur "conseil de pote".
 * Cf. tech-specs/site-rewrite-copy-v1.md §4.3
 *      tech-specs/redesign-v2-direction-artistique.md §B.Fiche produit.2
 *
 * 4 champs : Pour qui · Comment · Le detail qui compte · Tu n'en as PAS besoin si...
 * Le 4e champ est l'anti-bullshit en action (cree la confiance).
 */
interface ConseilContent {
  pourQui: string
  comment: string
  detail: string
  pasBesoinSi: string
}

const CONSEILS_BY_HANDLE: Record<string, ConseilContent> = {
  'iso-zero-100-whey': {
    pourQui:
      "Si tu t'entraînes 3-4x/semaine et que tu veux compléter tes apports en protéines, surtout en post-séance.",
    comment:
      "1 dose (30 g) dans 250 ml d'eau ou de lait, après la séance ou en collation. Pas plus de 2 doses/jour sauf besoin spécifique.",
    detail:
      "85 % de protéines, sans acides aminés ajoutés pour gonfler le taux affiché. C'est rare dans l'industrie.",
    pasBesoinSi:
      "Tu manges déjà assez de protéines dans la journée (1,6-2 g/kg). La whey est un complément, pas un miracle.",
  },
}

const DEFAULT_CONSEIL: ConseilContent = {
  pourQui:
    "Si tu cherches un coup de pouce sur cet objectif précis et que tu as déjà les bases (entraînement régulier, alimentation correcte).",
  comment:
    "Lis attentivement la posologie sur l'étiquette et respecte les dosages. En cas de doute, demande-nous en boutique ou via le formulaire conseil.",
  detail:
    "On sélectionne nos produits sur la qualité des ingrédients, la transparence du fabricant et le bon dosage des actifs. Pas de poudre de perlimpinpin.",
  pasBesoinSi:
    "Tes apports alimentaires couvrent déjà le besoin, ou si tu n'as pas les bases en place (sommeil, alimentation, régularité à l'entraînement).",
}

export default function LeConseilBodyStartV2({ handle }: { handle: string }) {
  const content = CONSEILS_BY_HANDLE[handle] ?? DEFAULT_CONSEIL

  return (
    <section className="bg-white rounded-2xl border border-spruce/10 p-7 md:p-10">
      <div className="flex items-center gap-3 mb-6">
        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-sage text-spruce font-bold text-[13px]">
          BS
        </span>
        <h2 className="font-display text-[20px] md:text-[24px] font-extrabold text-spruce leading-tight">
          Le conseil BodyStart
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        <Field label="Pour qui" value={content.pourQui} />
        <Field label="Comment" value={content.comment} />
        <Field label="Le détail qui compte" value={content.detail} />
        <Field label="Tu n'en as PAS besoin si…" value={content.pasBesoinSi} variant="caution" />
      </div>

      <p className="mt-7 pt-5 border-t border-spruce/10 text-[13px] text-ink-mute leading-relaxed flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-spruce flex-shrink-0" />
        Une question ? Passe nous voir à Coignières ou{' '}
        <a href="/conseil" className="text-spruce font-semibold hover:text-fresh-deep underline underline-offset-2">
          remplis le formulaire conseil
        </a>
        . On répond sous 24h.
      </p>
    </section>
  )
}

function Field({
  label,
  value,
  variant,
}: {
  label: string
  value: string
  variant?: 'caution'
}) {
  const Icon = variant === 'caution' ? AlertCircle : CheckCircle2
  const iconColor = variant === 'caution' ? 'text-terracotta' : 'text-spruce'
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <p className="text-[12px] font-semibold uppercase tracking-widest text-ink">{label}</p>
      </div>
      <p className="text-[14px] text-ink-mute leading-[1.6] pl-6">{value}</p>
    </div>
  )
}
