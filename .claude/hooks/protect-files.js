#!/usr/bin/env node
'use strict'
/**
 * Hook PreToolUse : refuse toute écriture (Edit / Write / MultiEdit / NotebookEdit)
 * sur les fichiers protégés du projet.
 *
 *   - .env*  (sauf *.example)        secrets : à modifier à la main
 *   - backups/**                     sauvegardes Shopify : lecture seule
 *   - supabase/migrations/*.sql      déjà commitées = déjà appliquées → nouvelle migration
 *
 * Entrée  : JSON du hook sur stdin ({ tool_name, tool_input, cwd, ... }).
 * Sortie  : exit 0 = laisser passer ; exit 2 + message sur stderr = bloquer
 *           (le message est renvoyé à Claude, qui doit proposer autre chose).
 *
 * Test manuel (Git Bash ou PowerShell) :
 *   echo '{"tool_name":"Edit","tool_input":{"file_path":".env.local"}}' | node .claude/hooks/protect-files.js
 */
const path = require('path')
const { execFileSync } = require('child_process')

const WRITE_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])

/** « /c/Dev/x » (Git Bash) → « C:\Dev\x » ; les autres chemins sont rendus tels quels. */
function toNativePath(p) {
  const m = /^\/([a-zA-Z])\/(.*)$/.exec(p)
  if (process.platform === 'win32' && m) return `${m[1].toUpperCase()}:\\${m[2].replace(/\//g, '\\')}`
  return p
}

function readStdin() {
  return new Promise((resolve) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => (data += chunk))
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', () => resolve(data))
  })
}

/** Chemin relatif au projet, séparateurs « / », ou null si hors projet. */
function relativeToProject(root, filePath) {
  const abs = path.resolve(toNativePath(root), toNativePath(filePath))
  const rel = path.relative(toNativePath(root), abs)
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null
  return rel.split(path.sep).join('/')
}

function isTrackedByGit(root, rel) {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', '--', rel], { cwd: root, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/** Retourne la raison du blocage, ou null si le fichier n'est pas protégé. */
function protectedReason(root, rel) {
  const base = path.posix.basename(rel)
  // .env, .env.local, .env.production… mais pas les gabarits sans secret (.env.local.example)
  if (/^\.env(\..+)?$/i.test(base) && !/\.(example|sample|template)$/i.test(base)) {
    return `« ${rel} » contient des secrets : on ne l'édite jamais depuis Claude. Demande à Adam d'ajouter la variable à la main (et documente-la dans CLAUDE.md).`
  }
  if (rel === 'backups' || rel.startsWith('backups/')) {
    return `« ${rel} » est une sauvegarde Shopify : lecture seule. Crée un nouveau fichier horodaté si tu dois archiver un état.`
  }
  if (/^supabase\/migrations\/[^/]+\.sql$/.test(rel) && isTrackedByGit(root, rel)) {
    return `« ${rel} » est une migration déjà commitée (donc déjà appliquée en prod). Ne la modifie pas : crée une nouvelle migration numérotée à la suite.`
  }
  return null
}

async function main() {
  let input
  try {
    input = JSON.parse((await readStdin()) || '{}')
  } catch {
    return // entrée illisible : on ne bloque pas
  }
  if (!WRITE_TOOLS.has(input.tool_name)) return

  const ti = input.tool_input || {}
  const filePath = ti.file_path || ti.notebook_path
  if (typeof filePath !== 'string' || !filePath) return

  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()
  const rel = relativeToProject(root, filePath)
  if (!rel) return

  const reason = protectedReason(root, rel)
  if (reason) {
    process.stderr.write(`[protect-files] Écriture refusée. ${reason}\n`)
    process.exit(2)
  }
}

main()
