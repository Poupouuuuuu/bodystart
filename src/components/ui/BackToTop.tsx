'use client'
import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

/**
 * Bouton « Retour en haut ». Masqué dès que le pied de page entre à l'écran
 * (08/10/2026) : sur mobile, il recouvrait la réassurance du pied de page
 * (paiement, livraison, retrait). En bas de page, le pied de page sert de fin
 * de parcours, le bouton n'y apporte rien.
 */
export default function BackToTop() {
  const [scrolled, setScrolled] = useState(false)
  const [footerVisible, setFooterVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 500)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    const footer = document.querySelector('footer')
    let io: IntersectionObserver | undefined
    if (footer && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([entry]) => setFooterVisible(entry.isIntersecting))
      io.observe(footer)
    }
    return () => {
      window.removeEventListener('scroll', onScroll)
      io?.disconnect()
    }
  }, [])

  if (!scrolled || footerVisible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-spruce text-canvas shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-fresh-deep hover:shadow-lift sm:right-6"
      aria-label="Retour en haut"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  )
}
