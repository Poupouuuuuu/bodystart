/**
 * LeConseilBodyStart — bloc differentiateur "conseil de pote"
 * Affiche sur chaque fiche produit. Contenu par handle (si renseigne dans
 * `CONSEILS_BY_HANDLE`), sinon fallback generique.
 *
 * Specs : tech-specs/site-rewrite-copy-v1.md §4.3
 * "Pour qui · Comment · Le detail qui compte · Tu n'en as PAS besoin si"
 */
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface ConseilContent {
  pourQui: string
  comment: string
  detail: string
  pasBesoinSi: string
}

const CONSEILS_BY_HANDLE: Record<string, ConseilContent> = {
  // Exemple de reference (Iso Zero) — le reste viendra produit-par-produit
  'iso-zero-100-whey': {
    pourQui:
      "Si tu t'entraines 3-4x/semaine et que tu veux completer tes apports en proteines, surtout en post-seance.",
    comment:
      '1 dose (30 g) dans 250 ml d\'eau ou de lait, apres la seance ou en collation. Pas plus de 2 doses/jour sauf besoin specifique.',
    detail:
      '85 % de proteines, sans acides amines ajoutes pour gonfler le taux affiche. C\'est rare dans l\'industrie.',
    pasBesoinSi:
      "Tu manges deja assez de proteines dans la journee (1,6-2 g/kg). La whey est un complement, pas un miracle.",
  },
}

const DEFAULT_CONSEIL: ConseilContent = {
  pourQui:
    "Si tu cherches un coup de pouce sur cet objectif precis et que tu as deja les bases (entrainement regulier, alimentation correcte).",
  comment:
    "Lis attentivement la posologie sur l'etiquette et respecte les dosages. En cas de doute, demande-nous en boutique ou via le formulaire conseil.",
  detail:
    "On selectionne nos produits sur la qualite des ingredients, la transparence du fabricant et le bon dosage des actifs. Pas de poudre de perlimpinpin.",
  pasBesoinSi:
    "Tes apports alimentaires couvrent deja le besoin, ou si tu n'as pas les bases en place (sommeil, alimentation, regularite a l'entrainement).",
}

export default function LeConseilBodyStart({ handle }: { handle: string }) {
  const content = CONSEILS_BY_HANDLE[handle] ?? DEFAULT_CONSEIL

  return (
    <section className="bg-cream-50 border border-cream-300 rounded-3xl p-8 md:p-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">BS</span>
        </div>
        <h3 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-[#1a2e23]">
          Le conseil BodyStart
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        <Field label="Pour qui" value={content.pourQui} />
        <Field label="Comment" value={content.comment} />
        <Field label="Le detail qui compte" value={content.detail} />
        <Field label="Tu n'en as PAS besoin si" value={content.pasBesoinSi} variant="caution" />
      </div>

      <p className="mt-6 pt-5 border-t border-cream-300 text-xs text-[#4a5f4c] leading-relaxed">
        Une question ? Passe nous voir a Coignieres ou{' '}
        <a href="/conseil" className="text-brand-500 font-semibold hover:underline">
          remplis le formulaire conseil
        </a>
        . On repond sous 24h.
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
  const iconColor = variant === 'caution' ? 'text-amber-600' : 'text-brand-500'
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <p className="text-xs font-bold uppercase tracking-widest text-[#1a2e23]">{label}</p>
      </div>
      <p className="text-sm text-[#4a5f4c] leading-relaxed pl-6">{value}</p>
    </div>
  )
}
