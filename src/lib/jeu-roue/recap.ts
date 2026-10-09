// Jeu de la roue : récap hebdomadaire envoyé par e-mail (cron du lundi,
// /api/jeu/recap). Serveur uniquement.
//
// Sources, toutes lisibles sur le forfait Basic (aucune donnée personnelle) :
// - les codes « Jeu roue » : un par participation (date, lot, utilisé ou non) ;
// - les clients étiquetés `jeu-roue` : date de jeu (métachamp) et case
//   « offres par e-mail et SMS » (étiquette `jeu-roue-optin`) ;
// - les commandes qui ont utilisé un code : en caisse (POS) ou en ligne ;
// - le stock des lots à Coignières (même lecture que le tirage).

import { shopifyAdminFetch } from '@/lib/shopify/client'
import { LOTS, lotById, lotLabelRemise, type Lot, type LotId } from './lots'
import { OPTIN_TAG, PARTICIPANT_TAG, lotsAvailability, readResult } from './shopify'

const API = { apiVersion: '2026-04' }
const DAY_MS = 24 * 3600 * 1000
/** Plancher du seuil « à réassortir » (unités en boutique). */
const LOW_STOCK = 3

// ─── Données ──────────────────────────────────────────────────

export interface RecapCode {
  code: string
  lotId: LotId | null
  createdAt: string
  endsAt: string | null
  /** Montant de la remise en euros (= valeur offerte si le code est utilisé). */
  amount: number
  used: boolean
}

export interface RecapParticipant {
  playedAt: string | null
  code: string | null
  lotId: LotId | null
  optIn: boolean
}

export interface RecapUse {
  code: string
  order: string
  at: string
  channel: 'caisse' | 'en ligne'
}

export interface RecapData {
  codes: RecapCode[]
  participants: RecapParticipant[]
  /** null : commandes illisibles, canal des codes utilisés inconnu. */
  uses: RecapUse[] | null
  /** null : stock illisible. */
  stock: Map<LotId, number> | null
}

/**
 * « Jeu roue : <libellé du lot> : ROUE-XXXXXX » → lot (titre posé par
 * discountInput). Libellé actuel, avec ou sans parfums, ou ancien libellé du
 * lot (codes créés avant un changement, ex. Crunch Bar le 09/10/2026).
 */
export function lotFromTitle(title: string): LotId | null {
  const label = title.split(' : ')[1]
  return (
    LOTS.find((l) => l.label === label || lotLabelRemise(l) === label || l.anciensLibelles?.includes(label))?.id ??
    null
  )
}

/** Caisse = Shopify POS ; tout le reste (site headless, brouillon) = en ligne. */
export function channelOf(sourceName: string | null): RecapUse['channel'] {
  return sourceName === 'pos' ? 'caisse' : 'en ligne'
}

interface DiscountNodesPage {
  discountNodes: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
    nodes: Array<{
      discount: {
        title?: string
        createdAt?: string
        endsAt?: string | null
        asyncUsageCount?: number
        codes?: { nodes: { code: string }[] }
        customerGets?: { value: { amount?: { amount: string } } }
      }
    }>
  }
}

async function fetchCodes(): Promise<RecapCode[]> {
  const codes: RecapCode[] = []
  let after: string | null = null
  do {
    const page: DiscountNodesPage = await shopifyAdminFetch<DiscountNodesPage>(
      `query RecapDiscounts($after: String) {
        discountNodes(first: 250, after: $after, query: "title:Jeu roue*") {
          pageInfo { hasNextPage endCursor }
          nodes { discount { ... on DiscountCodeBasic {
            title createdAt endsAt asyncUsageCount
            codes(first: 1) { nodes { code } }
            customerGets { value { ... on DiscountAmount { amount { amount } } } }
          } } }
        }
      }`,
      { after },
      API
    )
    for (const { discount: d } of page.discountNodes.nodes) {
      const code = d.codes?.nodes[0]?.code
      if (!d.title?.startsWith('Jeu roue') || !code || !d.createdAt) continue
      codes.push({
        code: code.toUpperCase(),
        lotId: lotFromTitle(d.title),
        createdAt: d.createdAt,
        endsAt: d.endsAt ?? null,
        amount: Number(d.customerGets?.value.amount?.amount) || 0,
        used: (d.asyncUsageCount ?? 0) > 0,
      })
    }
    after = page.discountNodes.pageInfo.hasNextPage ? page.discountNodes.pageInfo.endCursor : null
  } while (after)
  return codes
}

interface CustomersPage {
  customers: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
    nodes: Array<{ tags: string[]; jeuRoue: { value: string } | null }>
  }
}

async function fetchParticipants(): Promise<RecapParticipant[]> {
  const participants: RecapParticipant[] = []
  let after: string | null = null
  do {
    const page: CustomersPage = await shopifyAdminFetch<CustomersPage>(
      `query RecapParticipants($after: String) {
        customers(first: 250, after: $after, query: "tag:${PARTICIPANT_TAG}") {
          pageInfo { hasNextPage endCursor }
          nodes { tags jeuRoue: metafield(namespace: "bodystart", key: "jeu_roue") { value } }
        }
      }`,
      { after },
      API
    )
    for (const c of page.customers.nodes) {
      // La recherche par étiquette peut ratisser large : on revérifie.
      if (!c.tags.includes(PARTICIPANT_TAG)) continue
      const r = readResult(c)
      participants.push({
        playedAt: r?.playedAt || null,
        code: r?.code ?? null,
        lotId: r?.lotId ?? null,
        optIn: c.tags.includes(OPTIN_TAG),
      })
    }
    after = page.customers.pageInfo.hasNextPage ? page.customers.pageInfo.endCursor : null
  } while (after)
  return participants
}

/** Commandes ayant utilisé les codes donnés (20 codes par requête, recherche OR). */
async function fetchUses(codes: string[]): Promise<RecapUse[]> {
  const uses: RecapUse[] = []
  for (let i = 0; i < codes.length; i += 20) {
    const batch = codes.slice(i, i + 20)
    const data = await shopifyAdminFetch<{
      orders: { nodes: Array<{ name: string; createdAt: string; sourceName: string | null; discountCodes: string[] }> }
    }>(
      `query RecapOrders($q: String!) { orders(first: 50, query: $q) { nodes { name createdAt sourceName discountCodes } } }`,
      { q: batch.map((c) => `discount_code:${c}`).join(' OR ') },
      API
    )
    // Rapprochement exact sur la liste des codes de la commande : un filtre de
    // recherche mal interprété par Shopify ne peut pas créer de faux usage.
    const wanted = new Set(batch)
    for (const o of data.orders.nodes) {
      for (const c of o.discountCodes) {
        const code = c.toUpperCase()
        if (wanted.has(code)) uses.push({ code, order: o.name, at: o.createdAt, channel: channelOf(o.sourceName) })
      }
    }
  }
  return uses
}

/**
 * Codes et participants sont indispensables (erreur levée) ; commandes et
 * stock sont facultatifs : le récap part quand même, avec la mention.
 */
export async function loadRecapData(): Promise<RecapData> {
  const [codes, participants] = await Promise.all([fetchCodes(), fetchParticipants()])
  const [uses, stock] = await Promise.all([
    fetchUses(codes.filter((c) => c.used).map((c) => c.code)).catch((e) => {
      console.error('[jeu-roue/recap] commandes :', e)
      return null
    }),
    lotsAvailability()
      .then((a) => a.stock)
      .catch((e) => {
        console.error('[jeu-roue/recap] stock :', e)
        return null
      }),
  ])
  return { codes, participants, uses, stock }
}

// ─── Calcul ───────────────────────────────────────────────────

export interface RecapStockLine {
  lot: Lot
  units: number
  status: 'ok' | 'bas' | 'epuise'
}

export interface Recap {
  from: Date
  to: Date
  week: {
    plays: number
    /** Participants de la semaine (métachamp daté) et, parmi eux, opt-in. */
    dated: number
    optIns: number
    byLot: Array<{ lot: Lot; count: number }>
    uses: Array<RecapUse & { lot: Lot | null }>
    value: number
  }
  total: {
    plays: number
    participants: number
    optIns: number
    used: number
    caisse: number
    enLigne: number
    /** Utilisés mais commande introuvable (lecture en échec ou trop ancienne). */
    unknown: number
    value: number
    expiredUnused: number
    activeUnused: number
  }
  stock: RecapStockLine[] | null
  ordersReadable: boolean
}

const inWindow = (iso: string | null, from: Date, to: Date) => {
  if (!iso) return false
  const t = Date.parse(iso)
  return t >= from.getTime() && t < to.getTime()
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Récap des 7 jours qui précèdent `now` (lundi 8 h → lundi 8 h pour le cron). */
export function buildRecap(data: RecapData, now: Date): Recap {
  const to = now
  const from = new Date(now.getTime() - 7 * DAY_MS)

  const lotOfCode = new Map<string, LotId>()
  for (const p of data.participants) if (p.code && p.lotId) lotOfCode.set(p.code.toUpperCase(), p.lotId)
  const codes = data.codes.map((c) => ({ ...c, lotId: c.lotId ?? lotOfCode.get(c.code) ?? null }))
  const byCode = new Map(codes.map((c) => [c.code, c]))

  const weekCodes = codes.filter((c) => inWindow(c.createdAt, from, to))
  const byLot = LOTS.map((lot) => ({ lot, count: weekCodes.filter((c) => c.lotId === lot.id).length }))

  const weekPlayers = data.participants.filter((p) => inWindow(p.playedAt, from, to))

  const uses = (data.uses ?? []).filter((u) => byCode.get(u.code)?.used)
  const usedCodes = new Set(uses.map((u) => u.code))
  const weekUses = uses
    .filter((u) => inWindow(u.at, from, to))
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((u) => {
      const lotId = byCode.get(u.code)?.lotId
      return { ...u, lot: lotId ? (lotById(lotId) ?? null) : null }
    })

  const used = codes.filter((c) => c.used)
  const unused = codes.filter((c) => !c.used)
  const expired = (c: RecapCode) => c.endsAt !== null && Date.parse(c.endsAt) < now.getTime()

  const stock = data.stock
    ? LOTS.filter((l) => l.type === 'product').map((lot): RecapStockLine => {
        const units = data.stock?.get(lot.id) ?? 0
        // Seuil : au moins LOW_STOCK, ou ce que le rythme de la semaine écoulée
        // ferait sortir de ce lot en une semaine.
        const need = Math.max(LOW_STOCK, Math.ceil((weekCodes.length * lot.weight) / 100))
        return { lot, units, status: units <= 0 ? 'epuise' : units <= need ? 'bas' : 'ok' }
      })
    : null

  return {
    from,
    to,
    week: {
      plays: weekCodes.length,
      dated: weekPlayers.length,
      optIns: weekPlayers.filter((p) => p.optIn).length,
      byLot,
      uses: weekUses,
      value: round2(weekUses.reduce((s, u) => s + (byCode.get(u.code)?.amount ?? 0), 0)),
    },
    total: {
      plays: codes.length,
      participants: data.participants.length,
      optIns: data.participants.filter((p) => p.optIn).length,
      used: used.length,
      caisse: uses.filter((u) => u.channel === 'caisse').length,
      enLigne: uses.filter((u) => u.channel === 'en ligne').length,
      unknown: used.filter((c) => !usedCodes.has(c.code)).length,
      value: round2(used.reduce((s, c) => s + c.amount, 0)),
      expiredUnused: unused.filter(expired).length,
      activeUnused: unused.filter((c) => !expired(c)).length,
    },
    stock,
    ordersReadable: data.uses !== null,
  }
}

// ─── E-mail ───────────────────────────────────────────────────

const TZ = 'Europe/Paris'
const fmtDay = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(d)
const fmtShort = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(iso))
const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)} %` : 'n/a')
const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** Espaces insécables de la typo française : « cochée : 3 » ne se coupe pas avant les deux-points. */
export const nbsp = (s: string) => s.replace(/ ([:;!?%»€])/g, '&nbsp;$1').replace(/« /g, '«&nbsp;')

const STOCK_NOTE: Record<RecapStockLine['status'], string> = {
  ok: '',
  bas: 'à réassortir',
  epuise: 'épuisé : retiré du tirage',
}

function channelSplit(caisse: number, enLigne: number, unknown = 0): string {
  const parts = [`${caisse} en caisse`, `${enLigne} en ligne`]
  if (unknown) parts.push(`${unknown} canal inconnu`)
  return parts.join(', ')
}

/** Les deux versions (HTML et texte) partent des mêmes sections. */
function sections(r: Recap): Array<{ title: string; lines: Array<{ text: string; alert?: boolean }> }> {
  const w = r.week
  const t = r.total
  const weekUsesLine = `${w.uses.length} (${channelSplit(
    w.uses.filter((u) => u.channel === 'caisse').length,
    w.uses.filter((u) => u.channel === 'en ligne').length
  )})`

  const out: ReturnType<typeof sections> = [
    {
      title: 'Cette semaine',
      lines: [
        { text: `Participations : ${w.plays}` },
        { text: `Case « offres par e-mail et SMS » cochée : ${w.optIns} sur ${w.dated} (${pct(w.optIns, w.dated)})` },
        { text: `Codes utilisés : ${r.ordersReadable ? weekUsesLine : 'commandes illisibles cette fois'}` },
        { text: `Valeur offerte : ${fmtEur(w.value)}` },
      ],
    },
  ]

  if (w.plays > 0) {
    out.push({
      title: 'Lots tirés cette semaine',
      lines: w.byLot
        .filter((l) => l.count > 0)
        .map((l) => ({ text: `${l.lot.wheelLabel} : ${l.count} (chance : ${l.lot.weight} %)` })),
    })
  }

  if (w.uses.length > 0) {
    out.push({
      title: 'Codes utilisés cette semaine',
      lines: w.uses.map((u) => ({
        text: `${u.code} · ${u.lot?.wheelLabel ?? 'lot inconnu'} · ${u.channel} · commande ${u.order} · ${fmtShort(u.at)}`,
      })),
    })
  }

  out.push({
    title: 'Depuis le lancement',
    lines: [
      { text: `Participations : ${t.plays}` },
      { text: `Case offres cochée : ${t.optIns} sur ${t.participants} (${pct(t.optIns, t.participants)})` },
      {
        text: `Codes utilisés : ${t.used} sur ${t.plays} (${pct(t.used, t.plays)})${
          t.used ? ` : ${channelSplit(t.caisse, t.enLigne, t.unknown)}` : ''
        }`,
      },
      { text: `Codes encore valables : ${t.activeUnused} · expirés sans usage : ${t.expiredUnused}` },
      { text: `Valeur offerte : ${fmtEur(t.value)}` },
    ],
  })

  out.push({
    title: 'Stock des lots à Coignières',
    lines: r.stock
      ? r.stock.map((s) => ({
          text: `${s.lot.wheelLabel} : ${s.units}${s.status === 'ok' ? '' : ` · ${STOCK_NOTE[s.status]}`}`,
          alert: s.status !== 'ok',
        }))
      : [{ text: 'Stock illisible cette fois (erreur Shopify, voir les journaux Vercel).', alert: true }],
  })

  return out
}

export function renderRecapEmail(r: Recap): { subject: string; html: string; text: string } {
  const period = `du ${fmtDay(r.from)} au ${fmtDay(r.to)}`
  const subject = `Jeu de la roue : ${plural(r.week.plays, 'participation', 'participations')} ${period}`
  const intro = `Récap des 7 derniers jours, ${period}.`
  const footer = 'Envoyé automatiquement chaque lundi par bodystart-nutrition.fr.'
  const blocks = sections(r)

  const text = [
    'Jeu de la roue : récap de la semaine',
    intro,
    ...blocks.map((b) => [`\n${b.title.toUpperCase()}`, ...b.lines.map((l) => `- ${l.text}`)].join('\n')),
    `\n${footer}`,
  ].join('\n')

  const html = `<!doctype html>
<html lang="fr"><body style="margin:0;padding:24px 12px;background:#FAF8F3;font-family:Inter,Helvetica,Arial,sans-serif;color:#2A2A2A">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;padding:28px 24px">
<h1 style="margin:0 0 6px;font-family:Georgia,serif;font-size:24px;color:#2D5A2D">Jeu de la roue&nbsp;: récap de la semaine</h1>
<p style="margin:0 0 8px;font-size:14px;color:#6B6B66">${nbsp(esc(intro))}</p>
${blocks
  .map(
    (b) => `<h2 style="margin:24px 0 8px;font-size:16px;color:#2D5A2D">${esc(b.title)}</h2>
<ul style="margin:0;padding-left:18px;font-size:15px;line-height:1.6">
${b.lines.map((l) => `<li${l.alert ? ' style="color:#A44F33;font-weight:600"' : ''}>${nbsp(esc(l.text))}</li>`).join('\n')}
</ul>`
  )
  .join('\n')}
<p style="margin:28px 0 0;font-size:12px;color:#6B6B66">${esc(footer)}</p>
</div></body></html>`

  return { subject, html, text }
}
