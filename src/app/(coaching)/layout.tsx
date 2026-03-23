import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/cart/CartDrawer'
import BackToTop from '@/components/ui/BackToTop'

export default function CoachingLayout({ children }: { children: React.ReactNode }) {
  // Le layout principal pour l'univers Coaching
  // Contient le Header et Footer globaux qui s'adapteront dynamiquement
  return (
    <div className="bg-gray-950 min-h-screen text-white flex flex-col">
      <Header />
      <CartDrawer />
      <main className="flex-1">{children}</main>
      <Footer />
      <BackToTop />
    </div>
  )
}
