'use client'

import NextImage, { type ImageProps } from 'next/image'
import { estImageShopify, shopifyLoader } from '@/lib/images'

/**
 * next/image sans l'optimiseur Vercel (quota épuisé le 25/11/2026, /_next/image
 * en 402 ; décision de Gestion) :
 * - images de cdn.shopify.com : redimensionnées par le CDN Shopify (lib/images) ;
 * - toutes les autres (public/, imports statiques) : servies telles quelles
 *   (unoptimized). Aucune image du site ne passe plus par /_next/image.
 */
export default function Image(props: ImageProps) {
  const { src, unoptimized } = props
  if (!unoptimized && typeof src === 'string' && estImageShopify(src)) {
    return <NextImage {...props} loader={shopifyLoader} />
  }
  return <NextImage {...props} unoptimized />
}
