// Mode saison (validé le 19/10/2026) : Halloween, Black Week, Noël, pilotés par
// le metafield boutique `bodystart.saison` (json, lecture Storefront), sans
// redéploiement à chaque saison.
//
// - Une seule période active à la fois : celle dont l'heure est entre `du` et
//   `au` (UTC). Aucune période active = site normal.
// - Le bandeau d'annonce existant prend le texte, le lien et les couleurs de
//   la période (pas de deuxième barre). L'accent sert aussi aux badges
//   « Best-seller » et aux soulignés ; boutons de paiement et prix inchangés.
// - Couleur du texte choisie pour le contraste AA (4,5:1) sur le fond.
// - Tout ce qui vient du metafield est validé : couleurs hexadécimales
//   strictes (elles partent dans du CSS), liens internes seulement.
//
// Pur, sans réseau. Testé dans saison.test.ts.

export type ThemeSaison = 'halloween' | 'black-week' | 'noel'
export type DecorSaison = 'halloween' | 'noel' | null

const THEMES: ThemeSaison[] = ['halloween', 'black-week', 'noel']
/** Décor aux deux bouts du bandeau, par thème : aucun pour la Black Week
 * (sa déco du site est dans components/saison/black-week). */
const DECORS: Record<ThemeSaison, DecorSaison> = { halloween: 'halloween', 'black-week': null, noel: 'noel' }

export interface PeriodeSaison {
  theme: ThemeSaison
  /** Bornes ISO (UTC), incluses. */
  du: string
  au: string
  texte: string
  /** Chemin interne (« /conseil »), null sans lien. */
  lien: string | null
  /** Fond du bandeau et des badges. */
  accent: string
  /** Soulignés, liseré du bandeau, détails du décor. */
  accent2: string
  /** Texte sur l'accent (blanc ou presque noir, le plus contrasté). */
  texteSurAccent: string
  decor: DecorSaison
}

const HEX = /^#[0-9a-fA-F]{6}$/
const TEXTE_MAX = 140
export const BLANC = '#FFFFFF'
export const NOIR = '#111111'

// ─── Contraste (WCAG 2.1) ───────────────────────────────────

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Rapport de contraste entre deux couleurs « #RRGGBB » (1 à 21). */
export function contraste(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

/** Blanc ou presque noir : celui qui contraste le plus avec le fond. */
export function texteLisible(fond: string): string {
  return contraste(fond, BLANC) >= contraste(fond, NOIR) ? BLANC : NOIR
}

// ─── Lecture du metafield ───────────────────────────────────

/** Lien interne seulement (« /conseil », « /coffrets-noel ») ; le reste est ignoré. */
function lienSur(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const lien = v.trim()
  return /^\/(?!\/)[^\s<>"'\\]*$/.test(lien) ? lien : null
}

function texteSur(v: unknown): string | null {
  if (typeof v !== 'string') return null
  // Caractères de contrôle retirés, espaces regroupés.
  const t = v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
  return t ? t.slice(0, TEXTE_MAX) : null
}

function dateSure(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = Date.parse(v)
  return Number.isNaN(t) ? null : new Date(t).toISOString()
}

/**
 * Périodes valides du metafield (chaîne JSON ou objet), triées par début.
 * Une période invalide (thème inconnu, date ou couleur illisible, sans texte)
 * est écartée sans faire tomber les autres.
 */
export function lireSaison(brut: unknown): PeriodeSaison[] {
  let data = brut
  if (typeof brut === 'string') {
    try {
      data = JSON.parse(brut)
    } catch {
      return []
    }
  }
  const periodes = (data as { periodes?: unknown } | null)?.periodes
  if (!Array.isArray(periodes)) return []

  const out: PeriodeSaison[] = []
  for (const p of periodes as Record<string, unknown>[]) {
    const theme = p?.theme as ThemeSaison
    if (!THEMES.includes(theme)) continue
    const du = dateSure(p.du)
    const au = dateSure(p.au)
    const bandeau = (p.bandeau ?? {}) as Record<string, unknown>
    const couleurs = (p.couleurs ?? {}) as Record<string, unknown>
    const texte = texteSur(bandeau.texte)
    const accent = typeof couleurs.accent === 'string' && HEX.test(couleurs.accent) ? couleurs.accent.toUpperCase() : null
    const accent2 =
      typeof couleurs.accent_2 === 'string' && HEX.test(couleurs.accent_2) ? couleurs.accent_2.toUpperCase() : accent
    if (!du || !au || du > au || !texte || !accent || !accent2) continue
    out.push({
      theme,
      du,
      au,
      texte,
      lien: lienSur(bandeau.lien),
      accent,
      accent2,
      texteSurAccent: texteLisible(accent),
      decor: DECORS[theme],
    })
  }
  return out.sort((a, b) => a.du.localeCompare(b.du))
}

// ─── Période active ─────────────────────────────────────────

/** La période en cours (la première si deux se chevauchent), null sinon. */
export function periodeActive(periodes: PeriodeSaison[], now: Date): PeriodeSaison | null {
  const t = now.toISOString()
  return periodes.find((p) => p.du <= t && t <= p.au) ?? null
}

/** Prochain début ou fin de période après `now` (pour changer de thème à l'heure pile). */
export function prochainChangement(periodes: PeriodeSaison[], now: Date): Date | null {
  const t = now.getTime()
  const bornes = periodes
    .flatMap((p) => [Date.parse(p.du), Date.parse(p.au) + 1000])
    .filter((b) => b > t)
  return bornes.length ? new Date(Math.min(...bornes)) : null
}

// ─── Aperçu d'un thème (hors production) ────────────────────

/** Cookie de l'aperçu, posé par le header à partir de `?saison=` (preview). */
export const COOKIE_APERCU_SAISON = 'bs-saison-apercu'

/** Thème forcé sur la preview, ou « aucun » pour voir le site normal. */
export type ApercuSaison = ThemeSaison | 'aucun'

/** Valeur de `?saison=` ou du cookie : un thème, « aucun », sinon null (« auto » compris). */
export function lireApercu(v: unknown): ApercuSaison | null {
  if (v === 'aucun') return 'aucun'
  return THEMES.includes(v as ThemeSaison) ? (v as ThemeSaison) : null
}

/**
 * Période à rendre : celle du thème forcé (sa première période du metafield,
 * pour en prendre textes et couleurs), aucune pour « aucun », sinon la période
 * active à `now`. L'aperçu n'est lu qu'hors production (lib/shopify/saison).
 */
export function periodeServeur(periodes: PeriodeSaison[], now: Date, apercu: ApercuSaison | null): PeriodeSaison | null {
  if (apercu === 'aucun') return null
  if (apercu) return periodes.find((p) => p.theme === apercu) ?? null
  return periodeActive(periodes, now)
}

/**
 * Date de référence : maintenant, ou celle de `?saison_date=` hors production
 * (vérifier les thèmes sur la preview avant leurs dates). Ignorée en production.
 */
export function dateSaison(forcee: string | null | undefined, previsualisation: boolean, now = new Date()): Date {
  if (!previsualisation || !forcee) return now
  const t = Date.parse(forcee)
  return Number.isNaN(t) ? now : new Date(t)
}

// Toile d'araignée (coin haut droit des badges « Best-seller », Halloween), de
// la couleur du texte du badge, lisible sur l'accent. Image de fond et pas
// masque CSS : Safari mobile rate certains masques (19/10/2026).
const toile = (couleur: string) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='${couleur.replace('#', '%23')}' stroke-width='.6'%3E%3Cpath d='M16 0V16M16 0 3 13M16 0 0 7M16 0H0M16 5 12.5 3.5 11.4 2 11 0M16 10 8.9 7.1 6.8 4 6 0M16 14.5 5.7 10.3 2.7 5.8 1.5 0'/%3E%3C/svg%3E")`

/**
 * Règles propres à chaque thème, en plus de l'accent : décor léger des cartes
 * produit, des badges et de l'en-tête (déco Halloween du 19/10/2026), qui
 * basculent à l'heure pile avec le header. Couleurs tirées des
 * variables validées, jamais du metafield en clair.
 */
const CSS_THEME: Partial<Record<ThemeSaison, (p: PeriodeSaison) => string>> = {
  halloween: (p) =>
    `.carte-produit:hover{box-shadow:0 0 0 1px color-mix(in srgb,var(--saison-accent) 32%,transparent),0 18px 44px -14px color-mix(in srgb,var(--saison-accent) 60%,transparent)!important}` +
    `.badge-saison:not(.absolute){position:relative}` +
    `.badge-saison::after{content:"";position:absolute;top:0;right:0;width:15px;height:15px;pointer-events:none;opacity:.5;background:${toile(p.texteSurAccent)} top right/contain no-repeat}` +
    // En-tête (Header : saison-entete, saison-lien-nav) : liseré orange sous
    // la barre, soulignement orange du lien actif et au survol. Sans
    // changement de hauteur (ombre intérieure, soulignement).
    `.saison-entete{box-shadow:inset 0 -2px 0 var(--saison-accent)}` +
    `.saison-lien-nav{text-decoration-line:underline;text-decoration-thickness:2px;text-underline-offset:6px;text-decoration-color:transparent;transition:text-decoration-color .3s}` +
    `.saison-lien-nav:hover,.saison-lien-nav[aria-current=page]{text-decoration-color:var(--saison-accent)}`,
  // Black Week (accent noir, accent_2 jaune) : liseré et soulignés jaunes,
  // contour jaune des cartes au survol (jamais d'ombre noire sur le crème).
  'black-week': () =>
    `.carte-produit:hover{box-shadow:0 0 0 2px color-mix(in srgb,var(--saison-accent-2) 80%,transparent),0 18px 44px -16px color-mix(in srgb,var(--saison-accent-2) 45%,transparent)!important}` +
    `.saison-entete{box-shadow:inset 0 -3px 0 var(--saison-accent-2)}` +
    `.saison-lien-nav{text-decoration-line:underline;text-decoration-thickness:3px;text-underline-offset:6px;text-decoration-color:transparent;transition:text-decoration-color .3s}` +
    `.saison-lien-nav:hover,.saison-lien-nav[aria-current=page]{text-decoration-color:var(--saison-accent-2)}`,
}

/**
 * Règles CSS de la période : variables d'accent, badges « Best-seller »,
 * soulignés et décor des cartes du thème. Émises seulement pendant une
 * période : hors saison, rien ne change. Les couleurs sont validées par
 * lireSaison (#RRGGBB).
 */
export function cssSaison(p: PeriodeSaison): string {
  return (
    `:root{--saison-accent:${p.accent};--saison-accent-texte:${p.texteSurAccent};--saison-accent-2:${p.accent2}}` +
    `.badge-saison{background-color:var(--saison-accent)!important;color:var(--saison-accent-texte)!important}` +
    `.souligne-saison{text-decoration-color:var(--saison-accent-2)!important}` +
    (CSS_THEME[p.theme]?.(p) ?? '')
  )
}

/** Dernier jour de la période, heure de Paris (« 31/10 »). */
export function finPeriode(p: PeriodeSaison): string {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Paris' }).format(
    new Date(p.au)
  )
}
