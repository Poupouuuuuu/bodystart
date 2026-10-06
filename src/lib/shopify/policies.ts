// Politiques légales lues depuis Shopify (source unique : l'admin Shopify).
// Server-only : appelé par les pages au rendu (ISR, revalidate 900).

import { shopifyFetch } from './client'
import { GET_TERMS_OF_SALE, GET_LEGAL_NOTICE, GET_REFUND_POLICY } from './queries/policies'
import { parsePolicyHtml, type ParsedPolicy } from '@/lib/legal/parsePolicyHtml'

// termsOfSale et legalNotice n'existent qu'à partir de cette version.
const POLICIES_API_VERSION = '2026-04'

type PolicyField = 'termsOfSale' | 'legalNotice' | 'refundPolicy'

/**
 * Lit une politique Shopify et la découpe en blocs.
 *
 * LÈVE une erreur si la réponse est vide ou inexploitable : on ne renvoie
 * jamais un contenu vide. Côté Next.js, une erreur pendant la régénération
 * ISR garde la dernière version valide en cache ; pendant un build, elle fait
 * échouer le déploiement et la prod actuelle reste en ligne.
 */
async function getPolicy(
  query: string,
  field: PolicyField,
  label: string,
  { requireSections }: { requireSections: boolean }
): Promise<ParsedPolicy> {
  const data = await shopifyFetch<{ shop: Partial<Record<PolicyField, { body: string } | null>> }>(
    query,
    undefined,
    { apiVersion: POLICIES_API_VERSION }
  )
  const policy = parsePolicyHtml(data.shop[field]?.body ?? '')
  assertUsablePolicy(policy, label, { requireSections })
  return policy
}

/** CGV du site = « Conditions générales de vente » de Shopify (articles en h3). */
export function getTermsOfSale(): Promise<ParsedPolicy> {
  return getPolicy(GET_TERMS_OF_SALE, 'termsOfSale', 'CGV', { requireSections: true })
}

/** /mentions-legales = « Mentions légales » de Shopify (rubriques en h3). */
export function getLegalNotice(): Promise<ParsedPolicy> {
  return getPolicy(GET_LEGAL_NOTICE, 'legalNotice', 'Mentions légales', { requireSections: true })
}

/** Section retours de /livraison = « Politique de remboursement » de Shopify (sans titres h3). */
export function getRefundPolicy(): Promise<ParsedPolicy> {
  return getPolicy(GET_REFUND_POLICY, 'refundPolicy', 'Politique de remboursement', {
    requireSections: false,
  })
}

export function assertUsablePolicy(
  policy: ParsedPolicy,
  label: string,
  { requireSections = true }: { requireSections?: boolean } = {}
): void {
  const sectionsOk = policy.sections.every((s) => s.title && s.blocks.length > 0)
  const hasContent = policy.sections.length > 0 || policy.intro.length > 0
  const usable = sectionsOk && (requireSections ? policy.sections.length > 0 : hasContent)
  if (!usable) {
    throw new Error(`[Shopify] ${label} : contenu vide ou sans article, dernière version conservée`)
  }
}
