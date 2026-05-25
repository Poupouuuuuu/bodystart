/**
 * Helpers purs pour le parsing du CSV d'import legacy.
 *
 * Utilises par le script CLI scripts/import-loyalty-customers.mjs (qui
 * reimplemente la meme logique en Node natif pour rester autonome).
 *
 * Aucune dependance I/O : tout est testable isolement.
 *
 * Format CSV attendu :
 *   - Premiere ligne = header avec au minimum 'phone' et 'first_name'
 *     ('email' optionnel)
 *   - Lignes suivantes = donnees
 *   - Support du quoting RFC4180 minimal (valeurs entre guillemets, escape "")
 *   - Lignes vides ignorees
 */

export interface ParsedCSV {
  headers: string[]
  rows: string[][]
}

export interface CSVRowInput {
  phone: string
  firstName: string
  email: string | null
}

export type RowValidation =
  | { ok: true; value: CSVRowInput }
  | { ok: false; reason: 'missing_phone' | 'missing_first_name' | 'empty_row' }

/**
 * Parse une ligne CSV en colonnes. Supporte le quoting RFC4180 basique :
 *   - Valeur entre guillemets : "..." → ...
 *   - Virgule entre guillemets preservee
 *   - Echappement guillemet : "" -> "
 *
 * Ne gere PAS les retours-ligne dans les valeurs quoted (limitation
 * volontaire pour rester simple, pas besoin pour notre use case).
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]

    if (inQuotes) {
      if (char === '"') {
        // Soit fin de quote, soit escape ""
        if (line[i + 1] === '"') {
          current += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      current += char
      i++
      continue
    }

    if (char === '"') {
      inQuotes = true
      i++
      continue
    }
    if (char === ',') {
      result.push(current)
      current = ''
      i++
      continue
    }
    current += char
    i++
  }

  result.push(current)
  return result.map((s) => s.trim())
}

/**
 * Parse un contenu CSV complet. Retourne header + rows.
 * Skip les lignes vides. Gere CRLF et LF.
 */
export function parseCSV(content: string): ParsedCSV {
  const lines = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => line.trim().length > 0)

  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase())
  const rows = lines.slice(1).map(parseCSVLine)
  return { headers, rows }
}

/**
 * Mappe une row brute vers un input typé en utilisant le header.
 * Retourne un validation result : ok si phone + first_name presents, sinon raison.
 */
export function mapRowToInput(row: string[], headers: string[]): RowValidation {
  if (row.every((v) => v === '')) {
    return { ok: false, reason: 'empty_row' }
  }

  const phoneIdx = headers.indexOf('phone')
  const firstNameIdx = headers.indexOf('first_name')
  const emailIdx = headers.indexOf('email')

  const phone = phoneIdx >= 0 ? row[phoneIdx]?.trim() ?? '' : ''
  const firstName = firstNameIdx >= 0 ? row[firstNameIdx]?.trim() ?? '' : ''
  const emailRaw = emailIdx >= 0 ? row[emailIdx]?.trim() ?? '' : ''

  if (!phone) return { ok: false, reason: 'missing_phone' }
  if (!firstName) return { ok: false, reason: 'missing_first_name' }

  return {
    ok: true,
    value: {
      phone,
      firstName,
      email: emailRaw === '' ? null : emailRaw,
    },
  }
}
