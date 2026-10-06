// Découpe le HTML d'une politique Shopify (CGV, etc.) en structure simple,
// rendue ensuite en composants React : jamais de dangerouslySetInnerHTML.
//
// Sous-ensemble géré (celui de l'éditeur de politiques Shopify) :
//   - titres h2 / h3 / h4 → un article (section) par titre ;
//   - blocs p, ul / ol + li ; texte hors bloc = paragraphe implicite ;
//   - en ligne : a (http, https, mailto uniquement), strong / b, em / i, br.
// Toute autre balise est ignorée, son texte est conservé.

export interface InlineRun {
  text: string
  href?: string
  strong?: boolean
  em?: boolean
  /** Saut de ligne (<br>). */
  br?: boolean
}

export type PolicyBlock =
  | { type: 'p'; runs: InlineRun[] }
  | { type: 'ul' | 'ol'; items: InlineRun[][] }

export interface PolicySection {
  title: string
  blocks: PolicyBlock[]
}

export interface ParsedPolicy {
  /** « Dernière mise à jour : … » s'il est présent avant le premier titre. */
  updatedLine: string | null
  /** Autres paragraphes placés avant le premier titre. */
  intro: PolicyBlock[]
  sections: PolicySection[]
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  laquo: '«',
  raquo: '»',
  rsquo: '’',
  lsquo: '‘',
  hellip: '…',
  euro: '€',
}

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === '#') {
      const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(n) ? String.fromCodePoint(n) : m
    }
    return ENTITIES[code.toLowerCase()] ?? m
  })
}

function safeHref(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const href = decodeEntities(raw).trim()
  return /^(https?:\/\/|mailto:)/i.test(href) ? href : undefined
}

function attr(attrs: string, name: string): string | undefined {
  const m = attrs.match(new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined
}

/** Fusionne les espaces, supprime ceux de début et de fin de bloc. */
function tidy(runs: InlineRun[]): InlineRun[] {
  const out: InlineRun[] = []
  for (const r of runs) {
    if (r.br) {
      out.push(r)
      continue
    }
    const text = r.text.replace(/[ \t\r\n\f]+/g, ' ')
    if (!text) continue
    const prev = out[out.length - 1]
    if (prev && !prev.br && prev.href === r.href && prev.strong === r.strong && prev.em === r.em) {
      prev.text += text
    } else {
      out.push({ ...r, text })
    }
  }
  // Espaces en bord de bloc et autour des sauts de ligne
  for (let i = 0; i < out.length; i++) {
    const r = out[i]
    if (r.br) continue
    if (i === 0 || out[i - 1].br) r.text = r.text.replace(/^ +/, '')
    if (i === out.length - 1 || out[i + 1].br) r.text = r.text.replace(/ +$/, '')
  }
  const cleaned = out.filter((r) => r.br || r.text.length > 0)
  while (cleaned[0]?.br) cleaned.shift()
  while (cleaned[cleaned.length - 1]?.br) cleaned.pop()
  return cleaned
}

export function runsText(runs: InlineRun[]): string {
  return runs.map((r) => (r.br ? '\n' : r.text)).join('')
}

export function parsePolicyHtml(html: string): ParsedPolicy {
  const preamble: PolicyBlock[] = []
  const sections: PolicySection[] = []
  let target: PolicyBlock[] = preamble

  let heading: string | null = null // texte du titre en cours de lecture
  let para: InlineRun[] | null = null
  let list: { type: 'ul' | 'ol'; items: InlineRun[][] } | null = null
  let item: InlineRun[] | null = null
  let href: string | undefined
  let strong = 0
  let em = 0

  const closePara = () => {
    if (para) {
      const runs = tidy(para)
      if (runs.length) target.push({ type: 'p', runs })
    }
    para = null
  }
  const closeItem = () => {
    if (item && list) {
      const runs = tidy(item)
      if (runs.length) list.items.push(runs)
    }
    item = null
  }
  const closeList = () => {
    closeItem()
    if (list && list.items.length) target.push(list)
    list = null
  }
  const pushRun = (run: InlineRun) => {
    if (heading !== null) {
      heading += run.br ? ' ' : run.text
      return
    }
    if (list) {
      if (!item) item = []
      item.push(run)
      return
    }
    if (!para) para = []
    para.push(run)
  }

  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>|([^<]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const [, closing, rawTag, attrs, text] = m
    if (text !== undefined) {
      const t = decodeEntities(text)
      if (heading === null && !para && !item && !t.trim()) continue
      pushRun({
        text: t,
        href,
        ...(strong > 0 ? { strong: true } : {}),
        ...(em > 0 ? { em: true } : {}),
      })
      continue
    }
    const tag = rawTag.toLowerCase()
    const isClose = closing === '/'
    switch (tag) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
        if (!isClose) {
          closePara()
          closeList()
          heading = ''
        } else if (heading !== null) {
          const title = decodeEntities(heading).replace(/\s+/g, ' ').trim()
          heading = null
          if (title) {
            const section: PolicySection = { title, blocks: [] }
            sections.push(section)
            target = section.blocks
          }
        }
        break
      case 'p':
      case 'div':
        closePara()
        if (!isClose && tag === 'p') para = []
        break
      case 'ul':
      case 'ol':
        closePara()
        if (!isClose) {
          closeList()
          list = { type: tag as 'ul' | 'ol', items: [] }
        } else {
          closeList()
        }
        break
      case 'li':
        if (!isClose) {
          closeItem()
          item = []
        } else {
          closeItem()
        }
        break
      case 'br':
        pushRun({ text: '', br: true })
        break
      case 'a':
        href = isClose ? undefined : safeHref(attr(attrs, 'href'))
        break
      case 'strong':
      case 'b':
        strong += isClose ? -1 : 1
        strong = Math.max(0, strong)
        break
      case 'em':
      case 'i':
        em += isClose ? -1 : 1
        em = Math.max(0, em)
        break
      default:
        break
    }
  }
  closePara()
  closeList()

  let updatedLine: string | null = null
  const intro = preamble.filter((b) => {
    if (updatedLine === null && b.type === 'p' && /^derni[eè]re mise à jour/i.test(runsText(b.runs).trim())) {
      updatedLine = runsText(b.runs).replace(/\s+/g, ' ').trim()
      return false
    }
    return true
  })

  return { updatedLine, intro, sections }
}
