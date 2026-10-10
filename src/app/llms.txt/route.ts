import { getProducts } from '@/lib/shopify'
import { buildLlmsTxt } from '@/lib/llms'

// Régénéré toutes les heures (prix, stock, nouveautés suivent Shopify).
export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart-nutrition.fr'

export async function GET() {
  let products: Awaited<ReturnType<typeof getProducts>>['nodes'] = []
  try {
    products = (await getProducts({ first: 250 })).nodes
  } catch (err) {
    // Au build : fichier sans liste de produits plutôt qu'un déploiement en
    // échec (régénéré dans l'heure). En production : on lève, l'ISR garde la
    // version précédente.
    if (process.env.NEXT_PHASE !== 'phase-production-build') throw err
    console.error('[llms.txt] produits illisibles au build :', err)
  }
  return new Response(buildLlmsTxt(products, SITE_URL), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
