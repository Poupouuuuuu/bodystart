'use client'

import NextImage, { type ImageProps } from 'next/image'
import { estImageShopify, shopifyLoader } from '@/lib/images'

/**
 * next/image, sauf pour les images de cdn.shopify.com : redimensionnées par
 * le CDN Shopify (lib/images), pas par l'optimiseur Vercel (quota épuisé le
 * 25/11/2026). Toute autre image (public/, imports statiques, unoptimized)
 * passe telle quelle à next/image : rendu identique à avant.
 */
export default function Image(props: ImageProps) {
  const { src, unoptimized } = props
  if (!unoptimized && typeof src === 'string' && estImageShopify(src)) {
    return <NextImage {...props} loader={shopifyLoader} />
  }
  return <NextImage {...props} />
}
