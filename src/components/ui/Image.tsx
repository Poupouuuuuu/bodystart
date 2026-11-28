'use client'

// Seul fichier autorisé à importer next/image (no-restricted-imports, .eslintrc.json).
import NextImage, { type ImageProps } from 'next/image'
import { estImageShopify, largeursLocales, localLoader, shopifyLoader } from '@/lib/images'

/**
 * next/image sans l'optimiseur Vercel (quota épuisé le 25/11/2026, /_next/image
 * en 402 ; décision de Gestion) :
 * - images de cdn.shopify.com : redimensionnées par le CDN Shopify (lib/images) ;
 * - photos locales du manifeste (lib/images-locales, scripts/images-tailles.mjs) :
 *   srcset vers leurs variantes WebP à largeurs fixes (public/tailles/) ;
 * - tout le reste (logos, SVG, imports statiques, `unoptimized` explicite) :
 *   servi tel quel. Aucune image du site ne passe par /_next/image.
 */
export default function Image(props: ImageProps) {
  const { src, unoptimized } = props
  if (!unoptimized && typeof src === 'string') {
    if (estImageShopify(src)) return <NextImage {...props} loader={shopifyLoader} />
    if (largeursLocales(src)) return <NextImage {...props} loader={localLoader} />
  }
  return <NextImage {...props} unoptimized />
}
