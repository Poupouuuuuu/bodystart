/**
 * Description longue produit V2.
 * Cf. tech-specs/redesign-v2-direction-artistique.md §B.Fiche produit.5
 *      tech-specs/site-rewrite-copy-v1.md §4.4
 *
 * Affiche descriptionHtml Shopify dans la palette V2.
 * Le copy doit etre reecrit produit-par-produit cote Shopify Admin
 * pour respecter les regles brand (pas de superlatif, voix on/nous).
 */
interface ProductDescriptionV2Props {
  descriptionHtml?: string
  description?: string
}

export default function ProductDescriptionV2({
  descriptionHtml,
  description,
}: ProductDescriptionV2Props) {
  const content = descriptionHtml || (description ? `<p>${description}</p>` : null)
  if (!content) return null

  return (
    <section className="bg-canvas">
      <div className="container py-14 md:py-18">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
              Description
            </p>
            <h2 className="font-display text-[28px] md:text-[36px] font-extrabold text-spruce leading-[1.1] tracking-tight">
              Pourquoi on l&apos;a sélectionné
            </h2>
          </div>

          <div
            className="prose-v2 text-[16px] text-ink leading-[1.7] [&>p]:mb-5 [&>p:last-child]:mb-0 [&>h3]:font-display [&>h3]:text-[20px] [&>h3]:font-bold [&>h3]:text-spruce [&>h3]:mt-7 [&>h3]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-5 [&>ul>li]:mb-1.5 [&>a]:text-spruce [&>a]:underline [&>a]:underline-offset-2 [&>strong]:text-ink [&>strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </section>
  )
}
