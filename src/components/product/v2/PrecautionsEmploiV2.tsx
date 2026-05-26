import { Info } from 'lucide-react'

/**
 * Precautions d'emploi V2 - statique, identique sur toutes les fiches.
 * Texte legal de base, place en bas de fiche, discret.
 * Pas un metafield (volontairement, pour ne pas creer 1000 fois la meme
 * chose cote Shopify). Si un jour un produit a des precautions specifiques
 * en plus, on pourra ajouter un metafield custom.precautions_specifiques
 * qui s'affiche EN PLUS de ce bloc generique.
 */
export default function PrecautionsEmploiV2() {
  return (
    <section className="bg-white border-t border-spruce/10">
      <div className="container py-10 md:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start gap-3 text-ink-mute">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-spruce mb-2">
                Précautions d&apos;emploi
              </p>
              <p className="text-[13px] leading-[1.6]">
                Ne pas dépasser la dose journalière recommandée. Un complément alimentaire ne se
                substitue pas à une alimentation variée et équilibrée ni à un mode de vie sain.
                Tenir hors de portée des enfants. Déconseillé aux femmes enceintes et allaitantes
                sans avis médical.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
