'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Met en pause les animations de la déco de saison hors de l'écran : chaque
 * bloc [data-anim-saison] reçoit data-pause quand il n'est pas visible (CSS du
 * thème : animation-play-state paused). Rien sans IntersectionObserver.
 * Monté une fois par le layout, seulement pendant une période décorée.
 */
export default function AnimationsSaison() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.toggleAttribute('data-pause', !e.isIntersecting)
      },
      { rootMargin: '80px 0px' }
    )
    document.querySelectorAll('[data-anim-saison]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [pathname])

  return null
}
