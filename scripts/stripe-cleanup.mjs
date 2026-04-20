#!/usr/bin/env node
/**
 * scripts/stripe-cleanup.mjs
 *
 * Sprint 1 — Coaching cleanup Stripe.
 *
 * Mode --dry-run : affiche ce qui serait fait, n'exécute rien
 * Mode --apply   : exécute pour de vrai
 *
 * Étapes :
 *   1. Liste les 5 anciens produits coaching (par price ID hardcodés ci-dessous)
 *   2. Pour chacun, vérifie qu'AUCUNE subscription active ne le référence
 *   3. Archive le product (active=false)
 *   4. Crée les 2 nouveaux produits + prices avec lookup_key :
 *      - coaching_program_oneshot : 49€ EUR one-shot
 *      - coaching_followup_monthly : 89€ EUR mensuel
 *   5. Génère un rapport scripts/stripe-cleanup-report.json
 *
 * Usage :
 *   node scripts/stripe-cleanup.mjs --dry-run
 *   node scripts/stripe-cleanup.mjs --apply
 */
import Stripe from 'stripe'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ─── Charger .env.local manuellement (pas de dotenv en dep) ───
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')

if (existsSync(envPath)) {
  const raw = readFileSync(envPath, 'utf-8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

// ─── Mode ───
const APPLY = process.argv.includes('--apply')
const DRY_RUN = process.argv.includes('--dry-run') || !APPLY

if (!DRY_RUN && !APPLY) {
  console.error('Usage: node scripts/stripe-cleanup.mjs --dry-run | --apply')
  process.exit(1)
}

console.log('═══════════════════════════════════════════════════')
console.log('  Body Start Coaching — Stripe Cleanup Script')
console.log('  Mode :', APPLY ? '⚠️  APPLY (live)' : '🔍 DRY RUN')
console.log('═══════════════════════════════════════════════════\n')

// ─── Stripe ───
const stripeKey = process.env.STRIPE_SECRET_KEY
if (!stripeKey) {
  console.error('❌ STRIPE_SECRET_KEY introuvable dans .env.local')
  process.exit(1)
}
const stripe = new Stripe(stripeKey)

// ─── Anciens price IDs (Sprint 1 — à archiver) ───
const OLD_PRICE_IDS = [
  { name: 'Programme Prise de Masse',        priceId: 'price_1TEIme2zH06v4keUeH709ANN' },
  { name: 'Programme Perte de Poids',        priceId: 'price_1TEImt2zH06v4keUU3JxqGPg' },
  { name: 'Séance coaching individuel',      priceId: 'price_1TEIn62zH06v4keU07YMD66F' },
  { name: 'Coaching mensuel illimité',       priceId: 'price_1TEInQ2zH06v4keUZh6mc208' },
  { name: 'Pack 3 mois',                     priceId: 'price_1TEInk2zH06v4keUUD0OyEqt' },
]

// ─── Nouveaux produits ───
const NEW_PRODUCTS = [
  {
    lookup_key: 'coaching_program_oneshot',
    name: 'BodyStart Coaching — Programme Personnalisé',
    description:
      'Programme sport/nutrition/complet personnalisé, généré sur-mesure et validé par notre coach. Livré en PDF, accompagné de recommandations produits.',
    unit_amount: 4900, // 49€ en cents
    recurring: null,
    metadata: { tier: 'oneshot', delivery: 'digital_pdf' },
  },
  {
    lookup_key: 'coaching_followup_monthly',
    name: 'BodyStart Coaching — Suivi Personnalisé',
    description:
      'Programme personnalisé + check-in hebdomadaire avec le coach + appel mensuel 30 min. Code promo -15% permanent sur tout le shop.',
    unit_amount: 8900, // 89€ en cents
    recurring: { interval: 'month', interval_count: 1 },
    metadata: { tier: 'monthly_followup', delivery: 'digital_pdf+coaching' },
  },
]

const report = {
  mode: APPLY ? 'apply' : 'dry-run',
  started_at: new Date().toISOString(),
  archived: [],
  created: [],
  skipped: [],
  errors: [],
}

// ─── 1. Vérifier subscriptions actives sur les anciens prices ───
async function checkActiveSubscriptions(priceId, name, isRecurring) {
  // Stripe API : `subscriptions.list({ price })` ne marche que pour les prices récurrents.
  // Pour un price one-shot, pas de subscription possible par définition → safe to archive.
  if (!isRecurring) return true

  const subs = await stripe.subscriptions.list({ price: priceId, status: 'active', limit: 1 })
  if (subs.data.length > 0) {
    console.log(`  ⚠️  ${name} a ${subs.data.length}+ subscription(s) active(s) — SKIP archivage`)
    report.skipped.push({ priceId, name, reason: 'active_subscription_exists' })
    return false
  }
  return true
}

// ─── 2. Archiver un produit (via son price → product) ───
async function archiveByPriceId({ name, priceId }) {
  try {
    console.log(`▶ ${name} (${priceId})`)
    let price
    try {
      price = await stripe.prices.retrieve(priceId)
    } catch (err) {
      if (err.code === 'resource_missing') {
        console.log('  ↪ Price introuvable (déjà supprimé ?). SKIP.')
        report.skipped.push({ priceId, name, reason: 'price_not_found' })
        return
      }
      throw err
    }

    const isRecurring = price.recurring !== null
    const safe = await checkActiveSubscriptions(priceId, name, isRecurring)
    if (!safe) return

    const productId = typeof price.product === 'string' ? price.product : price.product.id
    const product = await stripe.products.retrieve(productId)

    if (!product.active) {
      console.log(`  ↪ Product déjà archivé : ${product.name}`)
      report.skipped.push({ priceId, productId, name, reason: 'already_archived' })
      return
    }

    if (DRY_RUN) {
      console.log(`  🔍 [dry-run] Archiverait product ${productId} (${product.name})`)
    } else {
      await stripe.products.update(productId, { active: false })
      console.log(`  ✅ Archivé product ${productId}`)
    }
    report.archived.push({ priceId, productId, name: product.name })
  } catch (err) {
    console.error(`  ❌ Erreur sur ${name}:`, err.message)
    report.errors.push({ priceId, name, error: err.message })
  }
}

// ─── 3. Créer les nouveaux produits ───
async function createNewProduct(spec) {
  console.log(`▶ Création : ${spec.name}`)
  try {
    // Vérifier qu'un product avec le même lookup_key n'existe pas déjà
    const existing = await stripe.prices.list({ lookup_keys: [spec.lookup_key], limit: 1 })
    if (existing.data.length > 0) {
      console.log(`  ↪ Lookup_key "${spec.lookup_key}" existe déjà (price ${existing.data[0].id}). SKIP.`)
      report.skipped.push({ lookup_key: spec.lookup_key, reason: 'lookup_key_already_exists' })
      return
    }

    if (DRY_RUN) {
      console.log(`  🔍 [dry-run] Créerait product + price (${spec.unit_amount / 100}€${spec.recurring ? '/mois' : ''})`)
      report.created.push({ lookup_key: spec.lookup_key, name: spec.name, dryRun: true })
      return
    }

    const product = await stripe.products.create({
      name: spec.name,
      description: spec.description,
      metadata: spec.metadata,
    })
    const priceParams = {
      product: product.id,
      currency: 'eur',
      unit_amount: spec.unit_amount,
      lookup_key: spec.lookup_key,
      transfer_lookup_key: true, // si lookup_key existait sur un autre price (déjà géré ci-dessus)
    }
    if (spec.recurring) priceParams.recurring = spec.recurring

    const price = await stripe.prices.create(priceParams)
    console.log(`  ✅ Créé : product=${product.id}, price=${price.id}, lookup_key=${spec.lookup_key}`)
    report.created.push({ lookup_key: spec.lookup_key, productId: product.id, priceId: price.id })
  } catch (err) {
    console.error(`  ❌ Erreur création ${spec.name}:`, err.message)
    report.errors.push({ lookup_key: spec.lookup_key, error: err.message })
  }
}

// ─── Run ───
async function main() {
  console.log('━━━ ÉTAPE 1 : Archivage des 5 anciens produits coaching ━━━\n')
  for (const old of OLD_PRICE_IDS) {
    await archiveByPriceId(old)
  }

  console.log('\n━━━ ÉTAPE 2 : Création des 2 nouveaux produits ━━━\n')
  for (const spec of NEW_PRODUCTS) {
    await createNewProduct(spec)
  }

  // ─── Rapport ───
  report.finished_at = new Date().toISOString()
  const reportPath = resolve(__dirname, 'stripe-cleanup-report.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log('\n═══════════════════════════════════════════════════')
  console.log('  RÉSUMÉ')
  console.log('═══════════════════════════════════════════════════')
  console.log(`  Archived :  ${report.archived.length}`)
  console.log(`  Created  :  ${report.created.length}`)
  console.log(`  Skipped  :  ${report.skipped.length}`)
  console.log(`  Errors   :  ${report.errors.length}`)
  console.log(`  Rapport  :  ${reportPath}`)
  if (DRY_RUN) {
    console.log('\n  ℹ️  Aucune modification réelle effectuée (--dry-run).')
    console.log('  ▶ Pour appliquer : node scripts/stripe-cleanup.mjs --apply')
  }
}

main().catch((err) => {
  console.error('\n❌ Erreur fatale :', err)
  process.exit(1)
})
