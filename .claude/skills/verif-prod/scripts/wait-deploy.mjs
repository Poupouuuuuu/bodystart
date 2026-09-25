#!/usr/bin/env node
// Attend que la prod Vercel serve un commit donné (par défaut : HEAD local).
// Usage : node .claude/skills/verif-prod/scripts/wait-deploy.mjs [--url https://bodystart-nutrition.fr] [--sha <sha>] [--timeout 600]
// Sortie : exit 0 dès que /api/version renvoie le SHA attendu ; exit 1 après le délai.
import { execFileSync } from 'node:child_process'

const args = process.argv.slice(2)
const opt = (name, def) => {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1] : def
}
const url = opt('--url', 'https://bodystart-nutrition.fr').replace(/\/$/, '')
const want = (opt('--sha', '') || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()).slice(0, 12)
const timeoutS = Number(opt('--timeout', '600'))
const every = 15_000
const started = Date.now()

const fmt = (ms) => `${Math.round(ms / 1000)} s`

for (;;) {
  let got = null
  let env = null
  try {
    const res = await fetch(`${url}/api/version`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
    if (res.ok) {
      const j = await res.json()
      got = j.sha
      env = j.env
    } else {
      got = `HTTP ${res.status}`
    }
  } catch (e) {
    got = `erreur réseau (${e.message})`
  }
  const elapsed = Date.now() - started
  if (got === want) {
    console.log(`OK : la prod sert ${want} (${env}) après ${fmt(elapsed)}.`)
    process.exit(0)
  }
  if (elapsed > timeoutS * 1000) {
    console.error(`Délai dépassé (${timeoutS} s) : la prod sert « ${got} », attendu ${want}. Vérifier le déploiement sur Vercel.`)
    process.exit(1)
  }
  console.log(`… prod = ${got ?? 'inconnu'} | attendu ${want} | ${fmt(elapsed)}`)
  await new Promise((r) => setTimeout(r, every))
}
