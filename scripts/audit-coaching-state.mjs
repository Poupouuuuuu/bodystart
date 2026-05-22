#!/usr/bin/env node
/**
 * scripts/audit-coaching-state.mjs
 *
 * Audit READ-ONLY de l'état coaching :
 *   - Stripe : subs actives sur les lookup_keys coaching, plus toutes les subs récentes
 *   - Supabase : tables coaching_orders + subscriptions + intakes + programs
 *
 * Aucune écriture nulle part. Sortie console + fichier JSON pour relecture.
 */
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[k]) process.env[k] = v
  }
}

const COACHING_LOOKUP_KEYS = ['coaching_program_oneshot', 'coaching_followup_monthly']

const report = {
  generated_at: new Date().toISOString(),
  stripe: { products: [], prices_by_lookup_key: {}, subscriptions: [], payment_intents: [] },
  supabase: { coaching_orders: [], subscriptions: [], intakes: [], programs: [] },
  errors: [],
}

// ─── STRIPE ────────────────────────────────────────────────
const stripeKey = process.env.STRIPE_SECRET_KEY
if (!stripeKey) {
  console.error('❌ STRIPE_SECRET_KEY missing')
  process.exit(1)
}
const stripe = new Stripe(stripeKey)

console.log('═══ STRIPE — Produits coaching actifs ═══')
const allProducts = await stripe.products.list({ active: true, limit: 100 })
const coachingProducts = allProducts.data.filter((p) =>
  p.name.toLowerCase().includes('coaching') ||
  p.name.toLowerCase().includes('bodystart')
)
for (const p of coachingProducts) {
  console.log(`  ▸ ${p.id} · ${p.name} · active=${p.active}`)
  report.stripe.products.push({ id: p.id, name: p.name, active: p.active, metadata: p.metadata })
}

console.log('\n═══ STRIPE — Prix par lookup_key coaching ═══')
for (const lk of COACHING_LOOKUP_KEYS) {
  const prices = await stripe.prices.list({ lookup_keys: [lk], active: true, limit: 10 })
  if (prices.data.length === 0) {
    console.log(`  ◌ ${lk} : aucun price actif`)
    report.stripe.prices_by_lookup_key[lk] = null
  } else {
    for (const pr of prices.data) {
      const amt = (pr.unit_amount ?? 0) / 100
      const rec = pr.recurring ? `/${pr.recurring.interval}` : ' one-shot'
      console.log(`  ▸ ${lk} → ${pr.id} (${amt}€${rec}) · product=${pr.product}`)
    }
    report.stripe.prices_by_lookup_key[lk] = prices.data.map((pr) => ({
      id: pr.id,
      product: pr.product,
      unit_amount: pr.unit_amount,
      recurring: pr.recurring,
    }))
  }
}

console.log('\n═══ STRIPE — Subscriptions actives (TOUS statuts hors canceled) ═══')
const subs = await stripe.subscriptions.list({ status: 'all', limit: 100 })
const relevantSubs = subs.data.filter((s) => s.status !== 'canceled')
for (const s of relevantSubs) {
  const items = s.items.data.map((i) => `${i.price.id}${i.price.lookup_key ? ` (lk=${i.price.lookup_key})` : ''}`)
  console.log(`  ▸ ${s.id} · status=${s.status} · customer=${s.customer} · ${items.join(', ')}`)
  const isCoaching = s.items.data.some((i) => COACHING_LOOKUP_KEYS.includes(i.price.lookup_key ?? ''))
  report.stripe.subscriptions.push({
    id: s.id,
    status: s.status,
    customer: s.customer,
    isCoaching,
    items: s.items.data.map((i) => ({
      price: i.price.id,
      lookup_key: i.price.lookup_key,
      unit_amount: i.price.unit_amount,
    })),
  })
}
if (relevantSubs.length === 0) {
  console.log('  (aucune subscription active)')
}

console.log('\n═══ STRIPE — Payment intents récents (50 derniers) ═══')
const pis = await stripe.paymentIntents.list({ limit: 50 })
for (const pi of pis.data) {
  if (pi.status === 'succeeded') {
    console.log(`  ▸ ${pi.id} · ${pi.amount / 100}€ ${pi.currency.toUpperCase()} · status=${pi.status} · ${pi.description ?? ''}`)
    report.stripe.payment_intents.push({
      id: pi.id,
      amount: pi.amount,
      currency: pi.currency,
      status: pi.status,
      customer: pi.customer,
      description: pi.description,
      created: pi.created,
      metadata: pi.metadata,
    })
  }
}

// ─── SUPABASE ──────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (supabaseUrl && supabaseKey) {
  const sb = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('\n═══ SUPABASE — coaching_orders ═══')
  const { data: orders, error: ordersErr } = await sb
    .from('coaching_orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (ordersErr) {
    console.log(`  ⚠ ${ordersErr.message} (table absente ou inaccessible)`)
    report.errors.push({ table: 'coaching_orders', message: ordersErr.message })
  } else {
    console.log(`  ▸ ${orders?.length ?? 0} row(s)`)
    for (const o of orders ?? []) {
      console.log(`    - ${o.id} · status=${o.status} · ${o.amount_eur}EUR · session=${o.stripe_checkout_session_id}`)
    }
    report.supabase.coaching_orders = orders ?? []
  }

  console.log('\n═══ SUPABASE — subscriptions ═══')
  const { data: ss, error: ssErr } = await sb
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false })
  if (ssErr) {
    console.log(`  ⚠ ${ssErr.message}`)
    report.errors.push({ table: 'subscriptions', message: ssErr.message })
  } else {
    console.log(`  ▸ ${ss?.length ?? 0} row(s)`)
    for (const s of ss ?? []) {
      console.log(`    - ${s.id} · status=${s.status} · stripe_sub=${s.stripe_subscription_id}`)
    }
    report.supabase.subscriptions = ss ?? []
  }

  console.log('\n═══ SUPABASE — intakes ═══')
  const { data: ii, error: iiErr } = await sb
    .from('intakes')
    .select('id, status, source, created_at, submitted_at, user_id')
    .order('created_at', { ascending: false })
  if (iiErr) {
    console.log(`  ⚠ ${iiErr.message}`)
    report.errors.push({ table: 'intakes', message: iiErr.message })
  } else {
    console.log(`  ▸ ${ii?.length ?? 0} row(s)`)
    for (const i of ii ?? []) {
      console.log(`    - ${i.id.slice(0, 8)} · status=${i.status} · source=${i.source}`)
    }
    report.supabase.intakes = ii ?? []
  }

  console.log('\n═══ SUPABASE — programs ═══')
  const { data: prg, error: prgErr } = await sb
    .from('programs')
    .select('id, type, delivered_at, validated_by_coach_at, user_id')
    .order('created_at', { ascending: false })
  if (prgErr) {
    console.log(`  ⚠ ${prgErr.message}`)
    report.errors.push({ table: 'programs', message: prgErr.message })
  } else {
    console.log(`  ▸ ${prg?.length ?? 0} row(s)`)
    for (const p of prg ?? []) {
      console.log(`    - ${p.id.slice(0, 8)} · type=${p.type} · delivered=${p.delivered_at ? 'OUI' : 'non'}`)
    }
    report.supabase.programs = prg ?? []
  }
} else {
  console.log('\n⚠️  Supabase env vars manquantes — skip audit DB')
  report.errors.push({ table: 'supabase', message: 'env vars missing' })
}

// ─── Output JSON ───
const outPath = resolve(__dirname, 'audit-coaching-report.json')
writeFileSync(outPath, JSON.stringify(report, null, 2))
console.log(`\n📁 Rapport JSON : ${outPath}`)

const coachingSubsCount = report.stripe.subscriptions.filter((s) => s.isCoaching && s.status === 'active').length
console.log(`\n═══════════════════════════════════════════════════`)
console.log(`  CONCLUSION`)
console.log(`═══════════════════════════════════════════════════`)
console.log(`  Subs ACTIVES sur produits coaching : ${coachingSubsCount}`)
console.log(`  Total coaching_orders en DB         : ${report.supabase.coaching_orders.length}`)
console.log(`  Total subscriptions en DB           : ${report.supabase.subscriptions.length}`)
console.log(`  Intakes (incl. pending/test)        : ${report.supabase.intakes.length}`)
console.log(`  Programs (incl. non delivrés)       : ${report.supabase.programs.length}`)
if (coachingSubsCount === 0 && report.supabase.coaching_orders.length === 0) {
  console.log(`\n✅ Aucun client réel détecté. Archivage Stripe safe.`)
} else {
  console.log(`\n⚠️  Données coaching présentes — relire ${outPath} avant archivage.`)
}
