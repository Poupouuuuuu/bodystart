import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'

// /conseil/page.tsx est un Client Component ('use client'), donc on injecte la
// metadata via ce layout dedie.
export const metadata: Metadata = buildPageMetadata({
  path: '/conseil',
  title: 'Nos conseils',
  description: 'Tu ne sais pas par où commencer ? On te guide selon ton objectif : prise de muscle, perte de poids, énergie, récupération, immunité.',
})

export default function ConseilLayout({ children }: { children: React.ReactNode }) {
  return children
}
