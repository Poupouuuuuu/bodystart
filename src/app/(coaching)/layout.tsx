// STANDBY 2026-05-23 : route masquee (redirect 301 vers /products via middleware).
// Code conserve volontairement — voir tech-specs/site-rewrite-copy-v1.md §7.4 et brief recentrage.
// Pour relancer : retirer le path de STANDBY_PATHS dans src/middleware.ts.
import { Suspense } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/cart/CartDrawer'
import BackToTop from '@/components/ui/BackToTop'

export default function CoachingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-950 min-h-screen text-white flex flex-col">
      <Suspense fallback={<div className="h-[104px] bg-gray-950 border-b border-gray-800" />}>
        <Header />
      </Suspense>
      <Suspense fallback={null}>
        <CartDrawer />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      <BackToTop />
    </div>
  )
}
