// Rapports de violation CSP envoyés par les navigateurs (report-uri), résumés
// en une ligne lisible pour les journaux Vercel. Sans query string ni
// fragment : une URL de page peut contenir un e-mail ou un jeton.

interface LegacyReport {
  'csp-report'?: {
    'document-uri'?: string
    'effective-directive'?: string
    'violated-directive'?: string
    'blocked-uri'?: string
    'source-file'?: string
    'line-number'?: number
    disposition?: string
  }
}

interface ReportingApiReport {
  type?: string
  body?: {
    documentURL?: string
    effectiveDirective?: string
    blockedURL?: string
    sourceFile?: string
    lineNumber?: number
    disposition?: string
  }
}

function clean(url: string | undefined): string {
  if (!url) return '?'
  if (!/^https?:/i.test(url)) return url.slice(0, 40) // inline, eval, data…
  try {
    const u = new URL(url)
    return `${u.origin}${u.pathname}`.slice(0, 160)
  } catch {
    return url.slice(0, 60)
  }
}

function pathOf(url: string | undefined): string {
  if (!url) return '?'
  try {
    return new URL(url).pathname.slice(0, 120)
  } catch {
    return '?'
  }
}

function line(directive?: string, blocked?: string, documentUrl?: string, source?: string, lineNo?: number, disposition?: string) {
  const where = source ? ` (source ${clean(source)}${lineNo ? `:${lineNo}` : ''})` : ''
  const mode = disposition === 'report' ? ' [signalement seul]' : ''
  return `${directive ?? '?'} bloqué : ${clean(blocked)} sur ${pathOf(documentUrl)}${where}${mode}`
}

/** Une ligne par violation ; [] si le contenu n'est pas un rapport CSP. */
export function summarizeCspReport(raw: string): string[] {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return []
  }
  const items = Array.isArray(data) ? data : [data]
  const out: string[] = []
  for (const item of items.slice(0, 20)) {
    const legacy = (item as LegacyReport)?.['csp-report']
    if (legacy) {
      out.push(
        line(
          legacy['effective-directive'] ?? legacy['violated-directive']?.split(' ')[0],
          legacy['blocked-uri'],
          legacy['document-uri'],
          legacy['source-file'],
          legacy['line-number'],
          legacy.disposition
        )
      )
      continue
    }
    const r = item as ReportingApiReport
    if (r?.type === 'csp-violation' && r.body) {
      out.push(line(r.body.effectiveDirective, r.body.blockedURL, r.body.documentURL, r.body.sourceFile, r.body.lineNumber, r.body.disposition))
    }
  }
  return out
}
