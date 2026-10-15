// IndexNow (SEO 2, Claude Gestion le 10/10/2026) : prévenir Bing (utilisé par
// ChatGPT Search et Copilot), Yandex, Seznam… qu'une URL a changé, au lieu
// d'attendre leur prochain passage.
//
// Quoi soumettre, d'après le sitemap (seule liste d'URL publiques) :
// - une URL jamais soumise (nouvelle fiche, nouveau guide) ;
// - une URL dont la version a changé. Guide : dateModified. Fiche : empreinte
//   du titre, de la description, des prix et de la disponibilité (pas
//   updatedAt : Shopify le change à chaque vente, IndexNow recevrait chaque
//   jour des fiches inchangées) ;
// - une URL sortie du sitemap (fiche retirée) : IndexNow sert aussi à
//   signaler une suppression.
// Rien d'autre : IndexNow demande de ne pas renvoyer une URL inchangée. Les
// pages sans date (accueil, catégories, pages fixes) ne partent qu'au premier
// passage, qui soumet tout le site (admis après une refonte).
// L'état (URL → version soumise) vit dans Upstash. Sans Upstash, rien n'est
// soumis : sans mémoire, tout repartirait à chaque appel.
//
// Le cœur est pur (pas de réseau) et testé dans indexnow.test.ts.

export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'
/** Limite du protocole par requête. */
export const MAX_URLS = 10_000

/** Clé IndexNow : 8 à 128 caractères, lettres, chiffres et tirets. */
export function cleValide(cle: string | undefined | null): cle is string {
  return !!cle && /^[a-zA-Z0-9-]{8,128}$/.test(cle)
}

/** Une URL publique et sa version (date, empreinte, ou « - » sans version). */
export interface EntreeIndexNow {
  url: string
  version: string
}

/** URL → version soumise. */
export type EtatIndexNow = Record<string, string>

export const SANS_VERSION = '-'

/** Version d'une date du sitemap (ISO), « - » si absente ou illisible. */
export function versionDeDate(d: string | Date | null | undefined): string {
  if (!d) return SANS_VERSION
  const date = d instanceof Date ? d : new Date(d)
  return Number.isNaN(date.getTime()) ? SANS_VERSION : date.toISOString()
}

/** Ce qui compte dans une fiche pour IndexNow, à hacher par l'appelant. */
export function contenuFiche(p: {
  title: string
  description?: string | null
  availableForSale: boolean
  priceRange: { minVariantPrice: { amount: string }; maxVariantPrice: { amount: string } }
}): string {
  return JSON.stringify([
    p.title,
    (p.description ?? '').replace(/\s+/g, ' ').trim(),
    p.availableForSale,
    Number(p.priceRange.minVariantPrice.amount),
    Number(p.priceRange.maxVariantPrice.amount),
  ])
}

/** URL à soumettre et nouvel état, d'après les URL actuelles et l'état enregistré. */
export function aSoumettre(entrees: EntreeIndexNow[], etat: EtatIndexNow): { urls: string[]; etat: EtatIndexNow } {
  const nouvelEtat: EtatIndexNow = {}
  const urls: string[] = []
  for (const e of entrees) {
    nouvelEtat[e.url] = e.version
    if (etat[e.url] !== e.version) urls.push(e.url)
  }
  for (const url of Object.keys(etat)) if (!(url in nouvelEtat)) urls.push(url)
  return { urls: [...new Set(urls)].slice(0, MAX_URLS), etat: nouvelEtat }
}

/** Corps de la requête IndexNow (soumission groupée). */
export function corpsIndexNow(site: string, cle: string, urls: string[]) {
  const base = site.replace(/\/+$/, '')
  return {
    host: new URL(base).host,
    key: cle,
    keyLocation: `${base}/${cle}.txt`,
    urlList: urls,
  }
}

/**
 * Envoi à IndexNow. 200 (reçu) et 202 (reçu, clé en cours de vérification)
 * sont des succès ; le reste est renvoyé tel quel pour le journal.
 */
export async function soumettre(
  site: string,
  cle: string,
  urls: string[],
  envoyer: typeof fetch = fetch,
): Promise<{ ok: boolean; status: number }> {
  if (urls.length === 0) return { ok: true, status: 204 }
  const res = await envoyer(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(corpsIndexNow(site, cle, urls)),
  })
  return { ok: res.status === 200 || res.status === 202, status: res.status }
}
