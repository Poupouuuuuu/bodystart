/**
 * Skeleton fiche produit — reproduit la structure réelle (BackButton + galerie
 * gauche / buy box droite) aux bonnes proportions pour éviter tout saut de
 * layout à l'arrivée du contenu. Affiché pendant les MISS ISR (~400 ms) ;
 * avant, l'App Router attendait la réponse complète sans aucun feedback.
 */
export default function ProductLoading() {
  return (
    <div className="animate-pulse">
      {/* Barre retour */}
      <div className="bg-canvas border-b border-spruce/10">
        <div className="container py-4">
          <div className="h-9 w-28 rounded-full bg-sage/60" />
        </div>
      </div>

      {/* Buy box : galerie + panneau achat */}
      <section className="bg-canvas">
        <div className="container py-10 md:py-14">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">
            {/* Galerie */}
            <div>
              <div className="aspect-square rounded-2xl bg-white border border-spruce/10" />
              <div className="mt-4 flex gap-3">
                <div className="w-20 h-20 rounded-xl bg-sage/60" />
                <div className="w-20 h-20 rounded-xl bg-sage/40" />
                <div className="w-20 h-20 rounded-xl bg-sage/40" />
              </div>
            </div>

            {/* Panneau achat */}
            <div>
              <div className="h-3 w-32 rounded bg-sage/60 mb-4" />
              <div className="h-9 w-4/5 rounded bg-sage/60 mb-2" />
              <div className="h-9 w-3/5 rounded bg-sage/40 mb-6" />
              <div className="h-8 w-28 rounded bg-sage/60 mb-8" />

              {/* Pastilles saveur */}
              <div className="h-3 w-20 rounded bg-sage/40 mb-3" />
              <div className="flex flex-wrap gap-2 mb-6">
                <div className="h-10 w-24 rounded-full bg-sage/60" />
                <div className="h-10 w-28 rounded-full bg-sage/40" />
                <div className="h-10 w-20 rounded-full bg-sage/40" />
              </div>

              {/* Format */}
              <div className="h-3 w-16 rounded bg-sage/40 mb-3" />
              <div className="flex gap-2 mb-8">
                <div className="h-10 w-20 rounded-full bg-sage/60" />
                <div className="h-10 w-20 rounded-full bg-sage/40" />
              </div>

              {/* Quantité + CTA */}
              <div className="flex gap-3 mb-6">
                <div className="h-14 w-32 rounded-full bg-sage/60" />
                <div className="h-14 flex-1 rounded-full bg-sage/70" />
              </div>

              {/* Réassurance */}
              <div className="space-y-2.5">
                <div className="h-4 w-3/4 rounded bg-sage/40" />
                <div className="h-4 w-2/3 rounded bg-sage/40" />
                <div className="h-4 w-1/2 rounded bg-sage/40" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
