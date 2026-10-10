// /llms.txt : présentation du site pour les assistants IA (ChatGPT, Perplexity,
// Copilot…), générée depuis Shopify et les registres du code (10/10/2026).
// Avant : fichier statique tenu à la main, périmé en quelques semaines
// (fiche en 404, prix faux, marque en arrêt mise en avant).
//
// Produits listés : ceux que renvoie l'API Storefront du site (donc publiés
// sur le canal BodyStart Site), disponibles à la vente, hors marques jamais
// mises en avant (lib/merchandising), hors pré-workout, brûleurs, boosters
// (la réserve) et hors packs. Pur : testé sans réseau.

import { BLOG_ARTICLES } from '@/content/blog'
import { CATEGORY_PAGES } from '@/lib/categories'
import { familyOf, isAutoPromotable } from '@/lib/merchandising'
import type { CardPrice } from '@/lib/product-price'
import {
  CLICK_AND_COLLECT,
  COLISSIMO,
  FREE_SHIPPING_THRESHOLD_CENTS,
  LIVRAISON_LOCALE,
  MONDIAL_RELAY,
} from '@/lib/shipping'
import { STORE } from '@/lib/store-info'

export interface LlmsProduct {
  title: string
  handle: string
  vendor: string
  productType: string
  tags?: string[]
  availableForSale?: boolean
  createdAt?: string
  cardPrice?: CardPrice | null
}

/** Types de la réserve : pas de mise en avant automatique. */
const RESERVE_FAMILIES = new Set(['pre-workout', 'bruleur', 'pack'])
const RESERVE_CATEGORY_SLUGS = new Set(['pre-workout', 'bruleurs', 'boosters'])
/** Marques maison ou génériques : pas citées comme « marques ». */
const NOT_A_BRAND = new Set(['bodystart', 'bodystart nutrition', ''])

export function isLlmsEligible(p: LlmsProduct): boolean {
  return Boolean(p.availableForSale) && isAutoPromotable(p) && !RESERVE_FAMILIES.has(familyOf(p))
}

/** « 23,90 € » (espaces simples : fichier texte lu par des robots). */
export function euros(amount: string | number): string {
  return `${Number(amount).toFixed(2).replace('.', ',')} €`
}

function priceLabel(p: LlmsProduct): string {
  if (!p.cardPrice) return ''
  return `${p.cardPrice.from ? 'dès ' : ''}${euros(p.cardPrice.price.amount)}`
}

function productLine(p: LlmsProduct, site: string): string {
  const brand = NOT_A_BRAND.has(p.vendor.trim().toLowerCase()) ? '' : ` (${p.vendor.trim()})`
  const price = priceLabel(p)
  return `- [${p.title.trim()}${brand}](${site}/products/${p.handle})${price ? `: ${price}` : ''}`
}

const centsLabel = (cents: number) => euros(cents / 100).replace(',00 €', ' €')

/** Marques présentes, de la plus représentée à la moins représentée. */
function brands(products: LlmsProduct[], max = 8): string[] {
  const count = new Map<string, number>()
  for (const p of products) {
    const v = p.vendor.trim()
    if (NOT_A_BRAND.has(v.toLowerCase())) continue
    count.set(v, (count.get(v) ?? 0) + 1)
  }
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'))
    .slice(0, max)
    .map(([v]) => v)
}

export function buildLlmsTxt(allProducts: LlmsProduct[], siteUrl: string): string {
  const site = siteUrl.replace(/\/$/, '')
  // L'ordre reçu est celui des ventes (BEST_SELLING) : conservé dans chaque groupe.
  const products = allProducts.filter(isLlmsEligible)
  const categories = CATEGORY_PAGES.filter((c) => !RESERVE_CATEGORY_SLUGS.has(c.slug))
  const marques = brands(products)

  const out: string[] = []
  out.push('# BodyStart Nutrition', '')
  out.push(
    `> Boutique de compléments alimentaires et de nutrition sportive à ${STORE.locality} (78), anciennement BodyFit, avec vente en ligne livrée partout en France et Click & Collect gratuit. Conseil gratuit en boutique.`,
    ''
  )
  out.push(
    `BodyStart Nutrition est une boutique physique située ${STORE.streetAddress}, ${STORE.postalCode} ${STORE.locality} (Yvelines), anciennement BodyFit Coignières, doublée du site ${site.replace(/^https?:\/\//, '')}. ` +
      `On y trouve des compléments alimentaires de plusieurs marques${marques.length ? ` (${marques.join(', ')}…)` : ''} : protéines (whey, isolat, gainer), créatine, glucides, acides aminés, barres protéinées et produits santé (vitamines, magnésium, oméga 3, collagène). ` +
      `Retrait gratuit en boutique (Click & Collect), livraison en France (${MONDIAL_RELAY.label} ${centsLabel(MONDIAL_RELAY.priceCents)}, ${COLISSIMO.label} ${centsLabel(COLISSIMO.priceCents)}, offerte dès ${centsLabel(FREE_SHIPPING_THRESHOLD_CENTS)}). ` +
      `Ouvert du lundi au samedi, de 11 h à 19 h, fermé le dimanche.`,
    ''
  )

  out.push('## Pages clés', '')
  out.push(
    `- [Accueil](${site}/): la boutique, les meilleures ventes et l'accès au catalogue.`,
    `- [Tous les produits](${site}/products): catalogue complet, filtrable par catégorie, marque et objectif.`,
    `- [Guide conseil](${site}/conseil): en une minute, ton objectif, ton budget et ta fréquence d'entraînement, et le guide propose une sélection de produits en stock à la boutique.`,
    `- [La boutique de ${STORE.locality}](${site}/stores): adresse, horaires, itinéraire, Click & Collect.`,
    `- [Compléments alimentaires à ${STORE.locality}](${site}/complements-alimentaires-coignieres): whey, créatine et vitamines près de Coignières, Maurepas, Élancourt et Plaisir.`,
    `- [Compléments alimentaires dans les Yvelines](${site}/complements-alimentaires-yvelines): Click & Collect et livraison dans tout le 78.`,
    `- [Parrainage](${site}/parrainage): ton filleul a 10 € dès 60 € sur sa première commande, tu gagnes 5 % de ses achats en cagnotte, à vie.`,
    `- [Livraison](${site}/livraison): ${MONDIAL_RELAY.label} ${centsLabel(MONDIAL_RELAY.priceCents)}, ${COLISSIMO.label} ${centsLabel(COLISSIMO.priceCents)}, livraison locale ${centsLabel(LIVRAISON_LOCALE.priceCents)}, ${CLICK_AND_COLLECT.label} gratuit, offerte dès ${centsLabel(FREE_SHIPPING_THRESHOLD_CENTS)}.`,
    `- [FAQ](${site}/faq): commande, retrait en boutique, paiement, produits.`,
    `- [À propos](${site}/about): qui est BodyStart, reprise de BodyFit Coignières.`,
    ''
  )

  out.push('## Catégories', '')
  for (const c of categories) out.push(`- [${c.label}](${site}/categories/${c.slug}): ${c.metaDescription}`)
  out.push('')

  out.push('## Guides', '')
  out.push(`- [Tous les guides](${site}/blog): conseils chiffrés et comparatifs, écrits par l'équipe de la boutique.`)
  for (const a of BLOG_ARTICLES) out.push(`- [${a.title}](${site}/blog/${a.slug}): ${a.metaDescription}`)
  out.push('')

  const nouveautes = products
    .filter((p) => p.createdAt)
    .sort((a, b) => Date.parse(b.createdAt!) - Date.parse(a.createdAt!))
    .slice(0, 8)
  if (nouveautes.length) {
    out.push('## Nouveautés', '')
    for (const p of nouveautes) out.push(productLine(p, site))
    out.push('')
  }

  if (products.length) {
    out.push('## Produits en stock, par catégorie', '')
    const used = new Set<string>()
    for (const c of categories) {
      const group = products.filter((p) => p.productType === c.productType)
      if (!group.length) continue
      out.push(`### ${c.label}`, '')
      for (const p of group) {
        out.push(productLine(p, site))
        used.add(p.handle)
      }
      out.push('')
    }
    const autres = products.filter((p) => !used.has(p.handle))
    if (autres.length) {
      out.push('### Boissons, snacks et accessoires', '')
      for (const p of autres) out.push(productLine(p, site))
      out.push('')
    }
  }

  out.push('## Infos pratiques', '')
  out.push(
    `- Boutique : ${STORE.name}, ${STORE.streetAddress}, ${STORE.postalCode} ${STORE.locality}, ${STORE.phoneDisplay}.`,
    '- Horaires : du lundi au samedi, de 11 h à 19 h, fermé le dimanche. Conseil gratuit en boutique.',
    `- Click & Collect gratuit, livraison en France, offerte dès ${centsLabel(FREE_SHIPPING_THRESHOLD_CENTS)}.`
  )
  return out.join('\n') + '\n'
}
