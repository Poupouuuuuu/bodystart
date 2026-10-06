// Politiques légales lues depuis Shopify (source unique : l'admin Shopify).
// Server-only : appelé par les pages au rendu (ISR).

import { shopifyFetch } from './client'
import { GET_TERMS_OF_SALE } from './queries/policies'
import { parsePolicyHtml, type ParsedPolicy } from '@/lib/legal/parsePolicyHtml'

// shop.termsOfSale n'existe qu'à partir de cette version de l'API Storefront.
const TERMS_OF_SALE_API_VERSION = '2026-04'

/**
 * CGV du site = « Conditions générales de vente » de Shopify.
 *
 * LÈVE une erreur si la réponse est vide ou inexploitable (aucun article) :
 * on ne renvoie jamais un contenu vide. Côté Next.js, une erreur pendant la
 * régénération ISR garde la dernière version valide en cache ; pendant un
 * build, elle fait échouer le déploiement et la prod actuelle reste en ligne.
 */
export async function getTermsOfSale(): Promise<ParsedPolicy> {
  const data = await shopifyFetch<{ shop: { termsOfSale: { body: string } | null } }>(
    GET_TERMS_OF_SALE,
    undefined,
    { apiVersion: TERMS_OF_SALE_API_VERSION }
  )
  const body = data.shop.termsOfSale?.body ?? ''
  const policy = parsePolicyHtml(body)
  assertUsablePolicy(policy, 'CGV')
  return policy
}

export function assertUsablePolicy(policy: ParsedPolicy, label: string): void {
  const usable =
    policy.sections.length > 0 && policy.sections.every((s) => s.title && s.blocks.length > 0)
  if (!usable) {
    throw new Error(`[Shopify] ${label} : contenu vide ou sans article, dernière version conservée`)
  }
}
