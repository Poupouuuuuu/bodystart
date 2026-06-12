import type { Metadata } from 'next'

// Page utilitaire sans interet SEO : noindex (la route est crawlable —
// volontaire, sinon Google ne voit jamais la directive).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
