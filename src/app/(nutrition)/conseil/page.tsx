import type { Metadata } from 'next'
import GuideConseil from '@/components/conseil/GuideConseil'
import ConseilRepli from '@/components/conseil/ConseilRepli'
import { chargerGuideConseil } from '@/lib/conseil/donnees'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...buildPageMetadata({
    path: '/conseil',
    title: 'Conseil nutrition gratuit à Coignières (78)',
    description:
      'Réponds à quelques questions et découvre tout de suite ta sélection de compléments en stock à Coignières, à retirer en boutique. Conseil gratuit.',
  }),
  // Title exact (bypass du template '%s | BodyStart').
  title: {
    absolute: 'Conseil nutrition gratuit à Coignières (78) | BodyStart Nutrition',
  },
}

// Guide lu dans le metafield boutique `bodystart.guide_conseil` et stock de la
// boutique lu dans Shopify : la page est régénérée au plus toutes les 15 min
// (ISR). Le stock est revérifié au moment de réserver.
export const revalidate = 900

export default async function ConseilPage() {
  const donnees = await chargerGuideConseil()

  return (
    <div className="min-h-screen bg-canvas">
      {donnees.ok ? <GuideConseil guide={donnees.guide} catalogue={donnees.catalogue} /> : <ConseilRepli />}
    </div>
  )
}
