import type { Metadata } from 'next'

/**
 * Helper pour construire la metadata d'une page avec canonical + og:url
 * auto-referents, le tout aligne sur NEXT_PUBLIC_SITE_URL via metadataBase
 * (defini dans src/app/layout.tsx).
 *
 * Les paths sont relatifs (ex. '/parrainage'), Next.js les resout absolument
 * en utilisant metadataBase, donc aucune URL en dur dans le code et tout suit
 * quand on change de domaine.
 */
export interface PageMetadataInput {
  /** Path absolu sans le domaine (ex. '/parrainage', '/stores'). Doit commencer par '/'. */
  path: string
  /** Title de la page. Le template '%s | BodyStart' du root layout s'applique. */
  title?: string
  /** Description meta + og:description. */
  description?: string
  /** Image og custom (path absolu). Defaut : logo BodyStart du root layout. */
  ogImage?: string
  /**
   * openGraph.type (defaut 'website'). 'product' : Next ne le connait pas, le
   * type est alors omis ici et la page rend elle-meme
   * <meta property="og:type" content="product" /> (hissee dans <head> par React 19).
   */
  ogType?: 'website' | 'article' | 'product'
  /** Si true, ajoute robots.index=false (pages noindex). */
  noIndex?: boolean
}

// Visuel de marque par defaut pour og:image / twitter image quand la page
// n'en fournit pas. Necessaire car Next.js ecrase l'openGraph parent (pas de
// merge profond) des qu'une page definit son propre openGraph.
const DEFAULT_OG_IMAGE = '/assets/logos/logo-v2-og.png'

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const { path, title, description, ogImage, ogType = 'website', noIndex = false } = input

  if (!path.startsWith('/')) {
    throw new Error(`buildPageMetadata: path must start with '/', got '${path}'`)
  }

  const resolvedOgImage = ogImage ?? DEFAULT_OG_IMAGE
  // Dimensions déclarées seulement pour le visuel par défaut (1200×630 réel).
  // Une photo produit Shopify n'a pas ce format : mieux vaut ne rien dire
  // qu'annoncer des dimensions fausses.
  const ogImageEntry = ogImage ? { url: ogImage } : { url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }

  const metadata: Metadata = {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: {
      canonical: path,
    },
    // siteName et locale répétés ici : Next remplace tout l'openGraph du
    // layout dès qu'une page définit le sien (pas de fusion).
    openGraph: {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      url: path,
      siteName: 'BodyStart Nutrition',
      locale: 'fr_FR',
      ...(ogType === 'product' ? {} : { type: ogType }),
      images: [ogImageEntry],
    },
    ...(title || description
      ? {
          twitter: {
            card: 'summary_large_image',
            ...(title ? { title } : {}),
            ...(description ? { description } : {}),
            images: [resolvedOgImage],
          },
        }
      : {}),
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: true,
            googleBot: { index: false, follow: true },
          },
        }
      : {}),
  }

  return metadata
}

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘',
  laquo: '«', raquo: '»', hellip: '…', eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç',
}

/**
 * Texte brut d'une description HTML Shopify, avec un espace entre les blocs.
 * Le champ `description` de Shopify colle les paragraphes (« 500 g.La
 * créatine ») : on repart du HTML.
 */
export function plainTextFromHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html
    .replace(/<(br|\/p|\/li|\/h[1-6]|\/div|\/tr|\/td|\/th|\/ul|\/ol)\b[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/[\s ]+/g, ' ')
    .trim()
}

/**
 * Meta description de repli : coupée au dernier mot entier avant `max`
 * caractères, suivie de « … » (avant : coupe nette à 160, en plein mot).
 */
export function truncateAtWord(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  let head = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut
  // Parenthèse ouverte et non refermée (« sucre (0,7… ») : on coupe avant.
  const open = head.lastIndexOf('(')
  if (open > head.lastIndexOf(')') && open > max * 0.6) head = head.slice(0, open)
  return `${head.replace(/[\s,;:.(«-]+$/, '')}…`
}
