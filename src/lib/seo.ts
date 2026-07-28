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
  /** Override openGraph.type (defaut 'website'). Limite a ce que Next.js Metadata accepte. */
  ogType?: 'website' | 'article'
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

  const metadata: Metadata = {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: {
      canonical: path,
    },
    openGraph: {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      url: path,
      type: ogType,
      images: [{ url: resolvedOgImage, width: 1200, height: 630 }],
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
