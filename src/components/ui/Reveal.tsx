'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  /** Décalage d'entrée en ms — sert à cascader plusieurs blocs (stagger). */
  delay?: number
  className?: string
}

/**
 * Révélation au scroll — PREMIUM V2 (2026-08), contenu visible par défaut
 * depuis le 08/10/2026.
 *
 * Pourquoi maison plutôt qu'une librairie d'animation : un IntersectionObserver
 * + 2 règles CSS pèsent ~0 ko de plus dans le bundle, là où framer-motion en
 * ajoute ~40 ko sur un site dont les Core Web Vitals sont un actif SEO.
 *
 * ⚠️ RÈGLE ABSOLUE : un contenu masqué qui ne se révèle pas est un bug GRAVE
 * (sections blanches en production). D'où :
 *  1. Le rendu serveur est VISIBLE : rien n'est masqué avant ce composant
 *     (sans JS, JS lent ou en échec, tout s'affiche).
 *  2. Au montage, on ne masque (`is-armed`) que si le bloc est HORS de
 *     l'écran : un bloc déjà vu (défilement avant le chargement du JS) n'est
 *     jamais caché après coup. Mouvement réduit demandé : rien n'est masqué.
 *  3. Révélation par IntersectionObserver, avec un secours au scroll mesuré à
 *     la main (getBoundingClientRect marche même sans frames composités).
 *  4. Navigateur sans IntersectionObserver : on ne masque pas.
 */
export default function Reveal({ children, delay = 0, className = '' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    // 94 % de la hauteur d'écran : cohérent avec le rootMargin de l'observer.
    const isOnScreen = () => {
      const r = el.getBoundingClientRect()
      return r.top < window.innerHeight * 0.94 && r.bottom > 0
    }

    // Déjà à l'écran (ou au-dessus, déjà parcouru) : on le laisse tel quel.
    if (isOnScreen() || el.getBoundingClientRect().bottom <= 0) return

    el.classList.add('is-armed')
    const show = () => el.classList.add('is-in')

    let cleanup = () => {}

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          show()
          cleanup()
        }
      },
      // -6 % en bas : le bloc se révèle quand il est franchement entré dans
      // l'écran, pas au premier pixel (sinon l'animation passe inaperçue).
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' }
    )

    // Secours indépendant de l'observer.
    const onScroll = () => {
      if (!isOnScreen()) return
      show()
      cleanup()
    }

    cleanup = () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }

    io.observe(el)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cleanup()
      // Démontage avant révélation (navigation) : rien ne reste masqué.
      el.classList.remove('is-armed')
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  )
}
