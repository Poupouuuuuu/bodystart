#!/usr/bin/env node
'use strict'
/**
 * Hook Stop : avant que Claude ne rende la main, lance le typecheck et les tests
 * liés aux fichiers de code modifiés pendant le tour (marqueur posé par
 * mark-dirty.js). Rien n'a été modifié, ou seulement de la doc → exit 0 direct.
 *
 *   - tsc --noEmit sur le projet (incrémental : rapide après le premier passage)
 *   - vitest related sur les sources touchées + les fichiers de test touchés
 *   - package.json / tsconfig / vitest.config touchés → suite complète
 *
 * Échec → exit 2 + sortie sur stderr : Claude ne s'arrête pas et corrige.
 * Garde-fou anti-boucle : si stop_hook_active est vrai (on est déjà dans une
 * reprise déclenchée par ce hook), on laisse Claude s'arrêter.
 *
 * Test : echo '{"session_id":"x","stop_hook_active":false}' | node .claude/hooks/stop-check.js
 */
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')

const MARKER_DIR = path.join(os.tmpdir(), 'claude-hooks-bodystart')
const CODE_RE = /\.(ts|tsx|js|jsx|mjs|cjs)$/i
const FULL_SUITE_RE = /(^|[\\/])(package\.json|tsconfig[^\\/]*\.json|vitest\.config\.[a-z]+|next\.config\.[a-z]+)$/i
const SKIP_RE = /(^|[\\/])(\.claude|\.github|docs|tech-specs|qa-shots|backups|scratchpad|node_modules|supabase)([\\/]|$)/i
const TEST_RE = /\.(test|spec)\.(ts|tsx|js|jsx)$/i
const STEP_TIMEOUT_MS = 300_000
const TAIL_LINES = 60

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

function markerPath(sessionId) {
  return path.join(MARKER_DIR, `${String(sessionId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_')}.dirty`)
}

function cleanupOldMarkers() {
  try {
    const limit = Date.now() - 2 * 24 * 3600 * 1000
    for (const f of fs.readdirSync(MARKER_DIR)) {
      const p = path.join(MARKER_DIR, f)
      if (fs.statSync(p).mtimeMs < limit) fs.unlinkSync(p)
    }
  } catch {}
}

function tail(text) {
  const lines = String(text || '').split(/\r?\n/).filter((l) => l.trim())
  return lines.slice(-TAIL_LINES).join('\n')
}

function run(root, label, args) {
  const r = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: STEP_TIMEOUT_MS, windowsHide: true, env: { ...process.env, CI: '1', FORCE_COLOR: '0' } })
  const out = `${r.stdout || ''}\n${r.stderr || ''}`
  if (r.error && r.error.code === 'ETIMEDOUT') return { ok: false, label, out: `${label} : délai dépassé (${STEP_TIMEOUT_MS / 1000} s)` }
  return { ok: r.status === 0, label, out }
}

async function main() {
  let input
  try {
    input = JSON.parse((await readStdin()) || '{}')
  } catch {
    return
  }
  const marker = markerPath(input.session_id)
  cleanupOldMarkers()

  let files = []
  try {
    files = fs.readFileSync(marker, 'utf8').split(/\r?\n/).filter(Boolean)
    fs.unlinkSync(marker)
  } catch {
    return // rien modifié pendant ce tour
  }
  if (input.stop_hook_active) return // reprise déjà déclenchée par ce hook : on ne boucle pas

  const root = toNativePath(process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd())
  const rel = (f) => {
    const r = path.relative(root, path.resolve(root, toNativePath(f)))
    return r && !r.startsWith('..') && !path.isAbsolute(r) ? r.split(path.sep).join('/') : null
  }
  const touched = [...new Set(files.map(rel).filter(Boolean))].filter((f) => !SKIP_RE.test(f))
  const code = touched.filter((f) => CODE_RE.test(f))
  const fullSuite = touched.some((f) => FULL_SUITE_RE.test(f))
  if (code.length === 0 && !fullSuite) return // doc, contenu, config Claude : rien à vérifier

  const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc')
  const vitest = path.join(root, 'node_modules', 'vitest', 'vitest.mjs')
  if (!fs.existsSync(tsc) || !fs.existsSync(vitest)) {
    process.stderr.write('[stop-check] node_modules incomplet : lancer npm ci avant de conclure.\n')
    process.exit(2)
  }

  const results = []
  results.push(run(root, 'tsc --noEmit', [tsc, '--noEmit', '--pretty', 'false']))

  const tests = code.filter((f) => TEST_RE.test(f))
  const sources = code.filter((f) => !TEST_RE.test(f) && fs.existsSync(path.join(root, f)))
  if (fullSuite) {
    results.push(run(root, 'vitest run (suite complète)', [vitest, 'run', '--reporter=dot']))
  } else {
    if (sources.length) results.push(run(root, `vitest related (${sources.length} source(s))`, [vitest, 'related', '--run', '--reporter=dot', '--passWithNoTests', ...sources]))
    if (tests.length) results.push(run(root, `vitest run (${tests.length} fichier(s) de test)`, [vitest, 'run', '--reporter=dot', ...tests]))
  }

  const failed = results.filter((r) => !r.ok)
  if (failed.length === 0) {
    console.log(`[stop-check] OK : ${results.map((r) => r.label).join(' ; ')} (${code.length} fichier(s) de code modifié(s)).`)
    return
  }
  const msg = failed.map((r) => `── ${r.label} : ÉCHEC ──\n${tail(r.out)}`).join('\n\n')
  process.stderr.write(`[stop-check] Vérifications en échec après modification de : ${code.join(', ')}\n${msg}\nCorrige avant de conclure (ou explique pourquoi c'est attendu).\n`)
  process.exit(2)
}

main()
