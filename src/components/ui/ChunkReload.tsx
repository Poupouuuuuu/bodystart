'use client'

import { useEffect, useState } from 'react'
import { autoReload, canAutoReload, isChunkLoadError } from '@/lib/chunk-reload'

/**
 * Dans un error.tsx : fichier JS introuvable → rechargement automatique une
 * fois (lib/chunk-reload). Renvoie true pendant le rechargement, pour afficher
 * <ReloadingScreen /> plutôt que la page d'erreur.
 */
export function useChunkReload(error: unknown): boolean {
  const [reloading] = useState(
    () => typeof window !== 'undefined' && isChunkLoadError(error) && canAutoReload()
  )
  useEffect(() => {
    if (reloading) autoReload()
  }, [reloading])
  return reloading
}

export function ReloadingScreen() {
  return (
    <main className="min-h-[60vh] bg-canvas" aria-busy="true">
      <p className="sr-only">Chargement de la page…</p>
    </main>
  )
}
