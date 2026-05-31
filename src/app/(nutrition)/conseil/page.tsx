import type { Metadata } from 'next'
import ConseilForm from '@/components/conseil/ConseilForm'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...buildPageMetadata({
    path: '/conseil',
    title: 'Conseil nutrition gratuit à Coignières (78)',
    description:
      'Dis-nous ton objectif, on te prépare une sélection sur-mesure à récupérer en boutique à Coignières. Conseil gratuit, sans engagement.',
  }),
  // Title exact (bypass du template '%s | BodyStart').
  title: {
    absolute: 'Conseil nutrition gratuit à Coignières (78) | BodyStart Nutrition',
  },
}

export default function ConseilPage() {
  return <ConseilForm />
}
