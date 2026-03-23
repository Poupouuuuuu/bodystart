const SHOP_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? 'bodystart-dev-store.myshopify.com'
// Le token privé est requis pour les appels API côté serveur (lecture des avis)
const API_TOKEN = process.env.JUDGEME_PRIVATE_TOKEN ?? process.env.JUDGEME_PUBLIC_TOKEN ?? ''
const BASE_URL = 'https://judge.me/api/v1'

export interface JudgemeReview {
  id: number
  title: string
  body: string
  rating: number
  reviewer: {
    name: string
    email: string
  }
  created_at: string
  product_title: string
  pictures: { urls: { original: string; small: string } }[]
  verified: boolean
}

export interface JudgemeProduct {
  id: number
  handle: string
  reviews_count: number
  rating: number
}

// Extrait l'ID numérique depuis un GID Shopify (ex: "gid://shopify/Product/12345" → "12345")
export function extractProductId(gid: string): string {
  return gid.split('/').pop() ?? gid
}

// Avis d'un produit spécifique (par handle Shopify)
export async function getProductReviews(
  handle: string,
  perPage = 10
): Promise<{ reviews: JudgemeReview[]; rating: number; count: number }> {
  try {
    // On cherche d'abord le produit Judge.me par son handle
    const productRes = await fetch(
      `${BASE_URL}/products/-1?api_token=${API_TOKEN}&shop_domain=${SHOP_DOMAIN}&handle=${handle}`,
      { next: { revalidate: 3600 } }
    )
    if (!productRes.ok) return { reviews: [], rating: 0, count: 0 }
    const productData = await productRes.json()
    const product: JudgemeProduct = productData.product

    if (!product?.id) return { reviews: [], rating: 0, count: 0 }

    const reviewsRes = await fetch(
      `${BASE_URL}/reviews?api_token=${API_TOKEN}&shop_domain=${SHOP_DOMAIN}&product_id=${product.id}&per_page=${perPage}&page=1`,
      { next: { revalidate: 3600 } }
    )
    if (!reviewsRes.ok) return { reviews: [], rating: 0, count: 0 }
    const reviewsData = await reviewsRes.json()

    return {
      reviews: reviewsData.reviews ?? [],
      rating: product.rating ?? 0,
      count: product.reviews_count ?? 0,
    }
  } catch {
    return { reviews: [], rating: 0, count: 0 }
  }
}

// Derniers avis toutes catégories (pour la home)
export async function getLatestReviews(perPage = 6): Promise<JudgemeReview[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/reviews?api_token=${API_TOKEN}&shop_domain=${SHOP_DOMAIN}&per_page=${perPage}&page=1&rating=5`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.reviews ?? []
  } catch {
    return []
  }
}
