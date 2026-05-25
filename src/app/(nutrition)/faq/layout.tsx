import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'

// /faq/page.tsx est un Client Component ('use client'), donc on injecte la
// metadata via ce layout dedie (la metadata d'un client component n'est pas
// supportee par Next.js).
export const metadata: Metadata = buildPageMetadata({
  path: '/faq',
  title: 'Questions fréquentes',
  description: 'Réponses aux questions sur les commandes, la livraison, le Click & Collect, les retours et le programme parrainage BodyStart.',
})

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children
}
