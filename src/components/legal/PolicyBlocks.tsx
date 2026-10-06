// Rendu des politiques Shopify (CGV, mentions légales, remboursement) à partir
// de la structure produite par parsePolicyHtml : composants React uniquement,
// jamais de HTML injecté. Server Component (aucun état, aucun hook).

import { Fragment, type ReactNode } from 'react'
import { frenchSpacing } from '@/lib/typo'
import type { InlineRun, PolicyBlock } from '@/lib/legal/parsePolicyHtml'

export interface PolicyRenderOptions {
  /** « Libellé : valeur » en début de ligne → libellé en gras (fiches éditeur, hébergeur). */
  boldLabels?: boolean
  /** Paragraphe qui commence par un texte en gras suivi d'un retour à la ligne → intertitre h3. */
  leadHeadings?: boolean
  /** Adresses email du texte → liens mailto. */
  linkEmails?: boolean
}

const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g

function linkEmailsIn(runs: InlineRun[]): InlineRun[] {
  return runs.flatMap((r) => {
    if (r.br || r.href) return [r]
    const out: InlineRun[] = []
    let last = 0
    for (const m of r.text.matchAll(EMAIL_RE)) {
      const start = m.index ?? 0
      if (start > last) out.push({ ...r, text: r.text.slice(last, start) })
      out.push({ ...r, text: m[0], href: `mailto:${m[0]}` })
      last = start + m[0].length
    }
    if (last === 0) return [r]
    if (last < r.text.length) out.push({ ...r, text: r.text.slice(last) })
    return out
  })
}

/** Découpe un paragraphe en lignes aux <br>. */
function splitLines(runs: InlineRun[]): InlineRun[][] {
  const lines: InlineRun[][] = [[]]
  for (const r of runs) {
    if (r.br) lines.push([])
    else lines[lines.length - 1].push(r)
  }
  return lines.filter((l) => l.length > 0)
}

function Runs({ runs, boldLabel }: { runs: InlineRun[]; boldLabel?: boolean }) {
  let items = runs
  let label: string | null = null
  if (boldLabel && items[0] && !items[0].href && !items[0].strong) {
    // La valeur peut suivre dans le même texte ou dans un lien (« Email : <a> »).
    const m = items[0].text.match(/^(.{1,60}?)[ \u00a0]: ?/)
    const hasValue = m && (items[0].text.slice(m[0].length).trim() !== '' || items.length > 1)
    if (m && hasValue) {
      label = `${m[1]} :`
      items = [{ ...items[0], text: items[0].text.slice(m[0].length) }, ...items.slice(1)]
    }
  }
  return (
    <>
      {label && <strong className="font-semibold text-spruce">{frenchSpacing(label)} </strong>}
      {items.map((r, i) => {
        if (r.br) return <br key={i} />
        let node: ReactNode = frenchSpacing(r.text)
        if (r.em) node = <em>{node}</em>
        if (r.strong) node = <strong className="font-semibold">{node}</strong>
        if (r.href) {
          const external = /^https?:/i.test(r.href)
          node = (
            <a
              href={r.href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="text-fresh underline underline-offset-2 break-words hover:text-fresh-deep transition-colors"
            >
              {node}
            </a>
          )
        }
        return <Fragment key={i}>{node}</Fragment>
      })}
    </>
  )
}

/** Paragraphe : tel quel s'il n'a pas de saut de ligne, sinon une ligne par <br>. */
function Lines({ runs, boldLabels }: { runs: InlineRun[]; boldLabels?: boolean }) {
  if (!runs.some((r) => r.br)) return <Runs runs={runs} boldLabel={boldLabels} />
  return (
    <>
      {splitLines(runs).map((line, i) => (
        <span key={i} className={i === 0 ? 'block' : boldLabels ? 'block mt-3' : 'block mt-1.5'}>
          <Runs runs={line} boldLabel={boldLabels} />
        </span>
      ))}
    </>
  )
}

function ListBlock({ block, options }: { block: Extract<PolicyBlock, { type: 'ul' | 'ol' }>; options: PolicyRenderOptions }) {
  const className = `${block.type === 'ul' ? 'list-disc' : 'list-decimal'} pl-5 space-y-1.5 text-ink leading-relaxed text-base`
  const items = block.items.map((runs, j) => (
    <li key={j}>
      <Lines runs={options.linkEmails ? linkEmailsIn(runs) : runs} boldLabels={options.boldLabels} />
    </li>
  ))
  return block.type === 'ul' ? <ul className={className}>{items}</ul> : <ol className={className}>{items}</ol>
}

function Paragraph({ runs, options }: { runs: InlineRun[]; options: PolicyRenderOptions }) {
  const all = options.linkEmails ? linkEmailsIn(runs) : runs
  // Intertitre : « <strong>Titre</strong><br>texte… »
  if (options.leadHeadings && all[0]?.strong && !all[0].href && all[1]?.br) {
    const title = all[0].text.trim()
    const rest = all.slice(2)
    // Le formulaire de rétractation est encadré pour se détacher du texte.
    const isForm = /formulaire/i.test(title)
    return (
      <div>
        <h3 className="font-display text-[17px] font-extrabold tracking-tight text-spruce mb-2">
          {frenchSpacing(title)}
        </h3>
        {rest.length > 0 && (
          <p
            className={
              isForm
                ? 'text-ink leading-relaxed text-base rounded-xl border border-dashed border-spruce/25 bg-canvas p-4 md:p-5'
                : 'text-ink leading-relaxed text-base'
            }
          >
            <Lines runs={rest} boldLabels={options.boldLabels} />
          </p>
        )}
      </div>
    )
  }
  return (
    <p className="text-ink leading-relaxed text-base">
      <Lines runs={all} boldLabels={options.boldLabels} />
    </p>
  )
}

export default function PolicyBlocks({
  blocks,
  className = 'space-y-4',
  ...options
}: { blocks: PolicyBlock[]; className?: string } & PolicyRenderOptions) {
  return (
    <div className={className}>
      {blocks.map((b, i) =>
        b.type === 'p' ? (
          <Paragraph key={i} runs={b.runs} options={options} />
        ) : (
          <ListBlock key={i} block={b} options={options} />
        )
      )}
    </div>
  )
}
