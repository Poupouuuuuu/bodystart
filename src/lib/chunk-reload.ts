// Fichier JS qui ne se charge pas (le plus souvent : page ouverte avant une
// mise en ligne, l'ancien fichier n'existe plus ; ou coupure réseau) → au lieu
// de la page d'erreur, on recharge UNE fois. Garde-fou : pas de second
// rechargement automatique dans la minute (sinon boucle si le problème dure),
// la page d'erreur s'affiche alors normalement.

const KEY = 'bs_chunk_reload'
const MIN_INTERVAL_MS = 60_000

export function isChunkLoadError(err: unknown): boolean {
  const e = err as { name?: string; message?: string } | null | undefined
  const text = `${e?.name ?? ''} ${e?.message ?? ''}`
  return /ChunkLoadError|Loading (CSS )?chunk [\w-]+ failed|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    text
  )
}

/** Lecture seule : un rechargement automatique est-il permis maintenant ? */
export function canAutoReload(now = Date.now()): boolean {
  try {
    return now - Number(sessionStorage.getItem(KEY) ?? 0) >= MIN_INTERVAL_MS
  } catch {
    return false // sessionStorage indisponible : pas de garde-fou, pas de rechargement
  }
}

export function autoReload(now = Date.now()): void {
  try {
    sessionStorage.setItem(KEY, String(now))
  } catch {
    return
  }
  window.location.reload()
}
