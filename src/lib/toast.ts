// Notifications « toast » chargées À LA DEMANDE.
//
// PERF (2026-09-05) : react-hot-toast (+ goober) pesait ~20 Ko gzip dans le
// bundle initial de toutes les pages, importé statiquement par CartContext.
// Or un toast n'apparaît qu'après une action (ajout au panier, erreur…).
// Ici la bibliothèque n'est importée qu'au premier appel ; le composant
// <ToasterLazy> (root layout) se monte sur l'événement émis juste avant.
// API conservée : `toast.success(msg)` / `toast.error(msg)` (mêmes appels
// qu'avant, simplement asynchrones — personne ne lisait la valeur de retour).

export const TOAST_WAKE_EVENT = 'bs:toast'

type ToastLib = typeof import('react-hot-toast')['default']

let libPromise: Promise<ToastLib> | null = null

function load(): Promise<ToastLib> {
  if (!libPromise) libPromise = import('react-hot-toast').then((m) => m.default)
  return libPromise
}

function wake() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(TOAST_WAKE_EVENT))
}

export interface ToastOpts {
  duration?: number
  icon?: string
  id?: string
}

async function show(kind: 'success' | 'error' | 'info', message: string, opts?: ToastOpts): Promise<void> {
  wake()
  try {
    const t = await load()
    if (kind === 'info') t(message, opts)
    else t[kind](message, opts)
  } catch {
    // Bibliothèque indisponible (réseau) : on ne bloque jamais l'action métier.
  }
}

export const toast = {
  success: (message: string, opts?: ToastOpts) => show('success', message, opts),
  error: (message: string, opts?: ToastOpts) => show('error', message, opts),
  /** Toast neutre (ex. avec `{ icon: '⚠️' }`). */
  info: (message: string, opts?: ToastOpts) => show('info', message, opts),
}
