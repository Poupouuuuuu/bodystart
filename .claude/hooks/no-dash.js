#!/usr/bin/env node
'use strict'
/**
 * Hook PostToolUse (Edit / Write / MultiEdit) : signale les tirets longs
 * « — » (U+2014) et « – » (U+2013) introduits dans un texte destiné aux clients.
 * Règle du gérant (24/09/2026) : aucun tiret long dans le texte client.
 *
 * Périmètre :
 *   - fichiers de contenu (.md, .mdx, .txt, .html, .json, .xml) hors dossiers internes ;
 *   - fichiers de code (.ts, .tsx, .js, .jsx, .mjs, .cjs) : uniquement les chaînes
 *     de texte visibles (littéraux de chaîne, gabarits, texte et attributs JSX),
 *     jamais les commentaires. Analyse via le compilateur TypeScript du projet.
 *   - seuls les tirets introduits par l'édition sont signalés (pas l'existant).
 *
 * Échappatoire : une ligne contenant « tiret-ok » n'est pas contrôlée.
 *
 * Sortie : exit 0 = rien à dire ; exit 2 + liste sur stderr = Claude doit corriger.
 *
 * Mode audit (sans stdin) : node .claude/hooks/no-dash.js --scan [dossier]
 * Test : node .claude/hooks/no-dash.js --root <dossier-projet> < entree.json
 */
const fs = require('fs')
const path = require('path')

const DASH_RE = /[–—]/g
const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit'])
const CONTENT_EXT = new Set(['.md', '.mdx', '.txt', '.html', '.json', '.xml'])
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const SKIP_DIRS = ['.claude/', '.github/', 'node_modules/', 'docs/', 'scripts/', 'supabase/', 'backups/', 'scratchpad/', 'qa-shots-seo/', '.next/']
const SKIP_FILES = /^(CLAUDE\.md|README\.md|SPRINT_.*\.md|package(-lock)?\.json|tsconfig.*\.json)$/i
const TEST_FILE = /(\.test\.|\.spec\.|\/__tests__\/)/
const OK_MARK = 'tiret-ok'

const CONVENTIONS =
  'Remplacements : précision en fin de phrase = virgule (ou point + majuscule) ; explication = deux-points ; ' +
  'incise = parenthèses ; plage « 20 à 30 min » ; titre SEO « Produit Marque : bénéfice ». ' +
  'Cas légitime (constante technique) : ajouter « tiret-ok » sur la ligne.'

function readStdin() {
  return new Promise((resolve) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => (data += chunk))
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', () => resolve(data))
  })
}

function toNativePath(p) {
  const m = /^\/([a-zA-Z])\/(.*)$/.exec(p)
  if (process.platform === 'win32' && m) return `${m[1].toUpperCase()}:\\${m[2].replace(/\//g, '\\')}`
  return p
}

function relativeToProject(root, filePath) {
  const abs = path.resolve(toNativePath(root), toNativePath(filePath))
  const rel = path.relative(toNativePath(root), abs)
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null
  return rel.split(path.sep).join('/')
}

function classify(rel) {
  if (SKIP_DIRS.some((d) => rel === d.slice(0, -1) || rel.startsWith(d))) return null
  if (SKIP_FILES.test(path.posix.basename(rel))) return null
  if (TEST_FILE.test(rel) || rel.endsWith('.d.ts')) return null
  const ext = path.posix.extname(rel).toLowerCase()
  if (CONTENT_EXT.has(ext)) return 'content'
  if (CODE_EXT.has(ext)) return 'code'
  return null
}

function loadTypescript(root) {
  try {
    return require(path.join(toNativePath(root), 'node_modules', 'typescript'))
  } catch {
    try {
      return require('typescript')
    } catch {
      return null
    }
  }
}

/** Plages [début, fin) des textes visibles d'un fichier de code (hors commentaires). */
function visibleRanges(ts, rel, text) {
  const kind = rel.endsWith('.tsx') || rel.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const sf = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, kind)
  const ranges = []
  const push = (node) => ranges.push([node.getStart(sf), node.getEnd()])
  const visit = (node) => {
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node) ||
      ts.isJsxText(node)
    ) {
      push(node)
      return
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return { sf, ranges }
}

/** Positions des tirets dans `text` restreintes aux plages données (ou tout le texte si null). */
function dashPositions(text, ranges) {
  const out = []
  let m
  DASH_RE.lastIndex = 0
  while ((m = DASH_RE.exec(text))) {
    const pos = m.index
    if (!ranges || ranges.some(([a, b]) => pos >= a && pos < b)) out.push(pos)
  }
  return out
}

/** Plages couvertes par le texte écrit (occurrences de chaque fragment dans le fichier). */
function writtenRanges(text, fragments) {
  const out = []
  for (const frag of fragments) {
    if (!frag) continue
    let from = 0
    for (;;) {
      const i = text.indexOf(frag, from)
      if (i < 0) break
      out.push([i, i + frag.length])
      from = i + Math.max(frag.length, 1)
    }
  }
  return out
}

function lineOf(text, pos) {
  return text.slice(0, pos).split('\n').length
}

function lineText(text, pos) {
  const start = text.lastIndexOf('\n', pos - 1) + 1
  let end = text.indexOf('\n', pos)
  if (end < 0) end = text.length
  return text.slice(start, end).replace(/\r$/, '')
}

function findings(root, rel, text, fragments) {
  const type = classify(rel)
  if (!type) return []
  let positions
  if (type === 'code') {
    const ts = loadTypescript(root)
    if (ts) {
      const { ranges } = visibleRanges(ts, rel, text)
      positions = dashPositions(text, ranges)
    } else {
      // Sans TypeScript : on ignore seulement les lignes de commentaire évidentes.
      positions = dashPositions(text, null).filter((p) => !/^\s*(\/\/|\*|\/\*)/.test(lineText(text, p)))
    }
  } else {
    positions = dashPositions(text, null)
  }
  if (fragments) {
    const written = writtenRanges(text, fragments)
    if (written.length > 0) {
      positions = positions.filter((p) => written.some(([a, b]) => p >= a && p < b))
    }
  }
  const seen = new Set()
  const out = []
  for (const p of positions) {
    const line = lineOf(text, p)
    if (seen.has(line)) continue
    seen.add(line)
    const lt = lineText(text, p)
    if (lt.includes(OK_MARK)) continue
    out.push({ line, snippet: lt.trim().slice(0, 110) })
  }
  return out
}

function report(rel, items) {
  const lines = items.map((f) => `  ${rel}:${f.line}  ${f.snippet}`)
  return `[no-dash] ${items.length} tiret(s) long(s) dans du texte client :\n${lines.join('\n')}\n${CONVENTIONS}\n`
}

async function main() {
  const args = process.argv.slice(2)
  const rootArg = args.indexOf('--root') >= 0 ? args[args.indexOf('--root') + 1] : null

  // ── Mode audit : parcourt le dépôt (ou un dossier) et liste tout, sans stdin ──
  if (args.includes('--scan')) {
    const root = rootArg || process.env.CLAUDE_PROJECT_DIR || process.cwd()
    const start = args[args.indexOf('--scan') + 1] && !args[args.indexOf('--scan') + 1].startsWith('--') ? args[args.indexOf('--scan') + 1] : '.'
    let total = 0
    const files = []
    const walk = (dir) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, ent.name)
        const rel = relativeToProject(root, full)
        if (!rel) continue
        if (ent.isDirectory()) {
          if (!SKIP_DIRS.some((d) => rel === d.slice(0, -1) || rel.startsWith(d))) walk(full)
        } else if (classify(rel)) {
          const text = fs.readFileSync(full, 'utf8')
          const items = findings(root, rel, text, null)
          if (items.length) {
            total += items.length
            files.push([rel, items.length])
            for (const f of items) console.log(`${rel}:${f.line}  ${f.snippet}`)
          }
        }
      }
    }
    walk(path.resolve(toNativePath(root), start))
    console.log(`\n${total} ligne(s) avec tiret long dans ${files.length} fichier(s).`)
    process.exit(0)
  }

  // ── Mode hook ──
  let input
  try {
    input = JSON.parse((await readStdin()) || '{}')
  } catch {
    return
  }
  if (!EDIT_TOOLS.has(input.tool_name)) return
  const ti = input.tool_input || {}
  if (typeof ti.file_path !== 'string') return

  const fragments =
    input.tool_name === 'Write'
      ? [ti.content]
      : input.tool_name === 'MultiEdit'
        ? (ti.edits || []).map((e) => e && e.new_string)
        : [ti.new_string]
  if (!fragments.some((f) => typeof f === 'string' && DASH_RE.test(f))) return
  DASH_RE.lastIndex = 0

  const root = rootArg || process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()
  const rel = relativeToProject(root, ti.file_path)
  if (!rel || !classify(rel)) return

  let text
  try {
    text = fs.readFileSync(path.resolve(toNativePath(root), rel), 'utf8')
  } catch {
    return
  }
  const items = findings(root, rel, text, input.tool_name === 'Write' ? null : fragments.filter((f) => typeof f === 'string'))
  if (items.length === 0) return
  process.stderr.write(report(rel, items))
  process.exit(2)
}

main()
