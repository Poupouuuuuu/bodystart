#!/usr/bin/env node
'use strict'
/**
 * Hook PostToolUse (Edit / Write / MultiEdit / NotebookEdit) : note le fichier
 * modifié dans un marqueur de session, lu par stop-check.js à la fin du tour.
 * Toujours exit 0 : ce hook n'a pas le droit de gêner.
 */
const fs = require('fs')
const os = require('os')
const path = require('path')

function readStdin() {
  return new Promise((resolve) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => (data += chunk))
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', () => resolve(data))
  })
}

const MARKER_DIR = path.join(os.tmpdir(), 'claude-hooks-bodystart')

function markerPath(sessionId) {
  return path.join(MARKER_DIR, `${String(sessionId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_')}.dirty`)
}

async function main() {
  try {
    const input = JSON.parse((await readStdin()) || '{}')
    const ti = input.tool_input || {}
    const filePath = ti.file_path || ti.notebook_path
    if (typeof filePath !== 'string' || !filePath) return
    fs.mkdirSync(MARKER_DIR, { recursive: true })
    fs.appendFileSync(markerPath(input.session_id), filePath + '\n')
  } catch {
    // silencieux
  }
}

main()
module.exports = { MARKER_DIR, markerPath }
