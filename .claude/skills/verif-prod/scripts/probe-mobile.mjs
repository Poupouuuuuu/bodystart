#!/usr/bin/env node
// Sonde mobile de la prod : 390×844, pages clés, règles mobile first, perf médiane.
// Usage : node .claude/skills/verif-prod/scripts/probe-mobile.mjs [--url https://…] [--product <handle>] [--runs 3] [--out qa-shots]
// Sortie : rapport Markdown sur stdout + qa-shots/<horodatage>/{report.md, *.png}. Exit 1 si une page est KO.
// Prérequis : Chromium Playwright (npx playwright install chromium).
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const args = process.argv.slice(2)
const opt = (name, def) => {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1] : def
}
const BASE = opt('--url', 'https://bodystart-nutrition.fr').replace(/\/$/, '')
const RUNS = Number(opt('--runs', '3'))
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
const OUT = path.join(opt('--out', 'qa-shots'), stamp)
fs.mkdirSync(OUT, { recursive: true })

const VIEWPORT = { width: 390, height: 844 }
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

async function firstProductHandle() {
  const h = opt('--product', '')
  if (h) return h
  try {
    const xml = await (await fetch(`${BASE}/sitemap.xml`)).text()
    const m = /<loc>[^<]*\/products\/([^<\/]+)<\/loc>/.exec(xml)
    if (m) return m[1]
  } catch {}
  return null
}

// Audit d'une page : statut, SEO de base, règles mobile first, erreurs console.
async function auditPage(context, route) {
  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', (msg) => msg.type() === 'error' && consoleErrors.push(msg.text().slice(0, 140)))
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${String(err).slice(0, 140)}`))
  const res = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 60_000 }).catch(() => null)
  const status = res ? res.status() : 0
  const info = await page
    .evaluate(() => {
      const vw = window.innerWidth
      const visible = (el) => {
        const r = el.getBoundingClientRect()
        const s = getComputedStyle(el)
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && r.top < window.innerHeight && r.bottom > 0
      }
      const small = []
      for (const el of document.querySelectorAll('a, button, [role="button"], input[type="submit"]')) {
        if (!visible(el)) continue
        const r = el.getBoundingClientRect()
        if (r.height < 44 || r.width < 44) small.push(`${el.tagName.toLowerCase()} « ${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)} » ${Math.round(r.width)}×${Math.round(r.height)}`)
      }
      const smallInputs = []
      for (const el of document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea')) {
        if (!visible(el)) continue
        const fs = parseFloat(getComputedStyle(el).fontSize)
        if (fs < 16) smallInputs.push(`${el.tagName.toLowerCase()}#${el.id || el.name || '?'} ${fs}px`)
      }
      let jsonLdOk = true
      let jsonLdTypes = []
      for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
        try {
          const j = JSON.parse(s.textContent || '')
          const arr = Array.isArray(j) ? j : j['@graph'] ? j['@graph'] : [j]
          jsonLdTypes.push(...arr.map((x) => x && x['@type']).filter(Boolean))
        } catch {
          jsonLdOk = false
        }
      }
      return {
        title: document.title,
        h1: document.querySelectorAll('h1').length,
        canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href') || null,
        description: document.querySelector('meta[name=description]')?.getAttribute('content')?.length || 0,
        overflow: document.documentElement.scrollWidth > vw + 1,
        small: small.slice(0, 8),
        smallCount: small.length,
        smallInputs,
        jsonLdOk,
        jsonLdTypes: [...new Set(jsonLdTypes)],
      }
    })
    .catch(() => null)
  const shot = path.join(OUT, `${route === '/' ? 'home' : route.slice(1).replace(/\//g, '_')}.png`)
  await page.screenshot({ path: shot, fullPage: true }).catch(() => {})
  await page.close()
  const problems = []
  if (status !== 200) problems.push(`HTTP ${status}`)
  if (info) {
    if (info.h1 !== 1) problems.push(`${info.h1} h1`)
    if (!info.canonical) problems.push('pas de canonical')
    if (info.description < 50) problems.push('meta description absente ou trop courte')
    if (info.overflow) problems.push('débordement horizontal')
    if (info.smallCount) problems.push(`${info.smallCount} cible(s) < 44 px`)
    if (info.smallInputs.length) problems.push(`${info.smallInputs.length} champ(s) < 16 px`)
    if (!info.jsonLdOk) problems.push('JSON-LD invalide')
  } else problems.push('page inexploitable')
  if (consoleErrors.length) problems.push(`${consoleErrors.length} erreur(s) console`)
  return { route, status, info, consoleErrors: consoleErrors.slice(0, 5), problems, shot }
}

// Perf : médiane de N chargements, 4G lent + CPU ×4 (Chromium, CDP).
async function perf(browser, route) {
  const samples = []
  for (let i = 0; i < RUNS; i++) {
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA })
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 })
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await page.addInitScript(() => {
      window.__lcp = 0
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__lcp = e.startTime
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    })
    const t0 = Date.now()
    await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 90_000 }).catch(() => {})
    await page.waitForTimeout(2500)
    const m = await page
      .evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0]
        return { ttfb: nav ? nav.responseStart : 0, dcl: nav ? nav.domContentLoadedEventEnd : 0, load: nav ? nav.loadEventEnd : 0, lcp: window.__lcp || 0 }
      })
      .catch(() => ({ ttfb: 0, dcl: 0, load: 0, lcp: 0 }))
    m.wall = Date.now() - t0
    samples.push(m)
    await context.close()
  }
  const med = (k) => {
    const v = samples.map((s) => s[k]).sort((a, b) => a - b)
    return v[Math.floor(v.length / 2)]
  }
  return { runs: samples.length, ttfb: med('ttfb'), dcl: med('dcl'), load: med('load'), lcp: med('lcp') }
}

async function isr(route) {
  const hdr = async () => {
    const r = await fetch(`${BASE}${route}`, { redirect: 'manual' })
    return { status: r.status, cache: r.headers.get('x-vercel-cache'), cc: r.headers.get('cache-control') }
  }
  const a = await hdr()
  const b = await hdr()
  return { first: a.cache, second: b.cache, cacheControl: b.cc, status: b.status }
}

const handle = await firstProductHandle()
const routes = ['/', '/products', handle ? `/products/${handle}` : null, '/stores', '/conseil', '/blog'].filter(Boolean)

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA })
const results = []
for (const r of routes) results.push(await auditPage(context, r))
await context.close()
const perfRoute = handle ? `/products/${handle}` : '/'
const p = await perf(browser, perfRoute)
await browser.close()
const cache = await isr(perfRoute)

const ms = (v) => (v ? `${Math.round(v)} ms` : 'n/a')
const lines = []
lines.push(`# Sonde mobile ${BASE} (${stamp}, 390×844)`, '')
lines.push('| Page | HTTP | Problèmes | Capture |', '| --- | --- | --- | --- |')
for (const r of results) lines.push(`| ${r.route} | ${r.status} | ${r.problems.length ? r.problems.join(', ') : 'OK'} | ${path.basename(r.shot)} |`)
lines.push('', `## Perf ${perfRoute} (médiane de ${p.runs} chargements, 4G lent + CPU ×4)`, '')
lines.push('| TTFB | DOMContentLoaded | load | LCP |', '| --- | --- | --- | --- |', `| ${ms(p.ttfb)} | ${ms(p.dcl)} | ${ms(p.load)} | ${ms(p.lcp)} |`)
lines.push('', `## ISR ${perfRoute}`, '', `x-vercel-cache : ${cache.first} puis ${cache.second} (HTTP ${cache.status}) ; cache-control : ${cache.cacheControl}`)
const details = results.filter((r) => r.info && (r.info.small.length || r.info.smallInputs.length || r.consoleErrors.length))
if (details.length) {
  lines.push('', '## Détails', '')
  for (const r of details) {
    lines.push(`### ${r.route}`)
    for (const s of r.info.small) lines.push(`- cible < 44 px : ${s}`)
    for (const s of r.info.smallInputs) lines.push(`- champ < 16 px : ${s}`)
    for (const s of r.consoleErrors) lines.push(`- console : ${s}`)
    lines.push('')
  }
}
lines.push('', 'Rappel : Lighthouse simulé varie de ±10 points d\'un run à l\'autre, ne jamais conclure sur un seul run.')
const report = lines.join('\n')
fs.writeFileSync(path.join(OUT, 'report.md'), report)
console.log(report)
console.log(`\nCaptures et rapport : ${OUT}`)
process.exit(results.some((r) => r.status !== 200 || r.problems.includes('débordement horizontal')) ? 1 : 0)
