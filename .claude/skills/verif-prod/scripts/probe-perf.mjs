#!/usr/bin/env node
// Sonde perf mobile : médiane de N chargements par page, 390×844 ×3, 4G lent + CPU ×4, cache vide.
// Usage : node .claude/skills/verif-prod/scripts/probe-perf.mjs [--url https://…] [--runs 5] [route…]
// Sortie : tableau Markdown (FCP, LCP, blocage JS, Ko par type) + élément LCP de chaque page.
// Comparer deux versions (prod / preview) dans la même session : le réseau de la machine pèse
// sur le TTFB, jamais conclure sur un seul chargement.
// Navigateur : Chromium Playwright ; CHROMIUM_PATH pour un exécutable déjà installé
// (session cloud Claude : /opt/pw-browsers/chromium).
import { chromium } from 'playwright'

const args = process.argv.slice(2)
const opt = (name, def) => {
  const i = args.indexOf(name)
  if (i < 0) return def
  const v = args[i + 1]
  args.splice(i, 2)
  return v
}
const BASE = opt('--url', 'https://bodystart-nutrition.fr').replace(/\/$/, '')
const RUNS = Number(opt('--runs', '5'))
const ROUTES = args.length ? args : ['/', '/products', '/products/whey-native-protimuscle', '/categories/proteines']
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

async function load(browser, route) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA })
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const reqs = new Map()
  cdp.on('Network.responseReceived', (e) => reqs.set(e.requestId, { type: e.type }))
  cdp.on('Network.loadingFinished', (e) => { const r = reqs.get(e.requestId); if (r) r.bytes = e.encodedDataLength })
  await page.addInitScript(() => {
    window.__lcp = null
    window.__lt = []
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        const el = e.element
        window.__lcp = { t: e.startTime, url: e.url || '', el: el ? `${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 2).join('.')}` : '?' }
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true })
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]) }).observe({ type: 'longtask', buffered: true })
  })
  await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 120_000 }).catch(() => {})
  await page.waitForTimeout(4000)
  const m = await page
    .evaluate(() => {
      const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      const tbt = window.__lt.filter(([s]) => s > fcp).reduce((a, [, d]) => a + Math.max(0, d - 50), 0)
      return { ttfb: performance.getEntriesByType('navigation')[0]?.responseStart || 0, fcp, lcp: window.__lcp?.t || 0, tbt, lcpEl: window.__lcp }
    })
    .catch(() => null)
  const kb = {}
  for (const r of reqs.values()) if (r.bytes) kb[r.type] = (kb[r.type] || 0) + r.bytes / 1024
  await context.close()
  return m && { ...m, kb }
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
const ms = (v) => `${Math.round(v)} ms`
const lines = [`# Perf mobile ${BASE} (médiane de ${RUNS}, 4G lent + CPU ×4)`, '', '| Page | TTFB | FCP | LCP | Blocage JS | Script / Image / Font (Ko) | Élément LCP |', '| --- | --- | --- | --- | --- | --- | --- |']
for (const route of ROUTES) {
  const s = []
  for (let i = 0; i < RUNS; i++) {
    const r = await load(browser, route)
    if (r) s.push(r)
  }
  const med = (k) => s.map((x) => x[k]).sort((a, b) => a - b)[Math.floor(s.length / 2)] ?? 0
  const last = s.at(-1)
  const k = (t) => Math.round(last?.kb[t] || 0)
  const el = last?.lcpEl ? `${last.lcpEl.el}${last.lcpEl.url ? ` ${last.lcpEl.url.replace(BASE, '').slice(0, 60)}` : ''}` : 'n/a'
  lines.push(`| ${route} | ${ms(med('ttfb'))} | ${ms(med('fcp'))} | ${ms(med('lcp'))} | ${ms(med('tbt'))} | ${k('Script')} / ${k('Image')} / ${k('Font')} | ${el} |`)
  console.error(`${route} : LCP ${s.map((x) => Math.round(x.lcp)).join(', ')}`)
}
await browser.close()
console.log(lines.join('\n'))
