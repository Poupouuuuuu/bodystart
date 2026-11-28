'use client'

import { useEffect } from 'react'
import { useChunkReload } from '@/components/ui/ChunkReload'

/**
 * Dernier filet : erreur dans le layout racine lui-même (error.tsx ne la
 * rattrape pas). Remplace tout le document, d'où ses propres <html> et
 * <body>, et des styles en ligne : la feuille du site n'est pas garantie ici.
 * Couleurs du design system (canvas, spruce, fresh, ink).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Fichier JS introuvable juste après une mise en ligne : un rechargement suffit.
  const reloading = useChunkReload(error)
  useEffect(() => {
    console.error('[Global Error]', error)
  }, [error])

  const bouton = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    padding: '0 22px',
    borderRadius: 999,
    fontSize: 15,
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as const

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background: '#FAF8F3',
          color: '#2A2A2A',
          fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <main style={{ maxWidth: 560, margin: '0 auto', padding: '64px 16px' }}>
          {reloading ? (
            <p style={{ fontSize: 17, color: '#6B6B66' }}>Mise à jour du site, un instant…</p>
          ) : (
            <>
              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: '#6B6B66',
                }}
              >
                Erreur
              </p>
              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.05, fontWeight: 800, color: '#2D5A2D' }}>
                Une erreur est survenue.
              </h1>
              <p style={{ margin: '20px 0 0', fontSize: 17, lineHeight: 1.65, color: '#6B6B66' }}>
                Quelque chose s&apos;est mal passé de notre côté. Tu peux réessayer, ou revenir à l&apos;accueil.
                Besoin d&apos;aide&nbsp;? Appelle-nous au{' '}
                <a href="tel:+33761847580" style={{ color: '#2D5A2D', fontWeight: 600 }}>
                  07&nbsp;61&nbsp;84&nbsp;75&nbsp;80
                </a>
                .
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 32 }}>
                <button
                  type="button"
                  onClick={reset}
                  style={{ ...bouton, border: 'none', background: '#3B7A3F', color: '#FFFFFF' }}
                >
                  Réessayer
                </button>
                {/* Lien HTML simple : le routeur peut être hors service ici. */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a href="/" style={{ ...bouton, border: '1px solid rgba(45,90,45,0.25)', color: '#2D5A2D' }}>
                  Retour à l&apos;accueil
                </a>
              </div>
              {error.digest && (
                <p style={{ marginTop: 32, fontSize: 12, color: '#6B6B66' }}>
                  Référence&nbsp;: <span style={{ color: '#2A2A2A', fontWeight: 500 }}>{error.digest}</span>
                </p>
              )}
            </>
          )}
        </main>
      </body>
    </html>
  )
}
