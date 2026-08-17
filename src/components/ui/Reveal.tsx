'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  /** Décalage d'entrée en ms — sert à cascader plusieurs blocs (stagger). */
  delay?: number
  className?: string
}

/**
 * Révélation au scroll — PREMIUM V2 (2026-08).
 *
 * Pourquoi maison plutôt qu'une librairie d'animation : un IntersectionObserver
 * + 2 règles CSS pèsent ~0 ko de plus dans le bundle, là où framer-motion en
 * ajoute ~40 ko sur un site dont les Core Web Vitals sont un actif SEO.
 *
 * ⚠️ RÈGLE ABSOLUE : ce composant masque du contenu réel. Un contenu masqué qui
 * ne se révèle pas est un bug GRAVE (sections blanches en production). D'où
 * quatre filets, du plus général au plus fin :
 *  1. Le masquage vit sous `html.js-reveal`, posée par le script du root layout
 *     → sans JS, rien n'est jamais masqué (contenu visible et indexable).
 *  2. Ce script ne pose pas la classe en prefers-reduced-motion, et la RETIRE
 *     au bout de 2,5 s si aucun Reveal n'a signalé son hydratation.
 *  3. Ici : si le bloc est déjà à l'écran au montage, on révèle sans attendre
 *     l'observer (couvre le cas d'un onglet ouvert en arrière-plan, où le moteur
 *     de rendu est inactif et où l'observer reste muet).
 *  4. Ici : secours au scroll, mesuré à la main (getBoundingClientRect marche
 *     même sans frames composités), au cas où l'observer ne rapporte rien.
 */
export default function Reveal({ children, delay = 0, className = '' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Signale au filet du root layout que l'hydratation a eu lieu : sans ce
    // marqueur, il retire `js-reveal` à 2,5 s et tout redevient visible.
    document.documentElement.dataset.revealReady = '1'

    // Pas de masquage en cours (JS tardif, mouvement refusé) → rien à faire.
    if (!document.documentElement.classList.contains('js-reveal')) return

    const show = () => el.classList.add('is-in')

    // 94 % de la hauteur d'écran : cohérent avec le rootMargin de l'observer.
    const isOnScreen = () => {
      const r = el.getBoundingClientRect()
      return r.top < window.innerHeight * 0.94 && r.bottom > 0
    }

    // Filet 3 — déjà visible : on révèle tout de suite.
    if (isOnScreen()) {
      show()
      return
    }

    // Navigateur sans IntersectionObserver → visible d'emblée plutôt
    // qu'invisible pour toujours.
    if (typeof IntersectionObserver === 'undefined') {
      show()
      return
    }

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

    // Filet 4 — secours indépendant de l'observer.
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
    return cleanup
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
