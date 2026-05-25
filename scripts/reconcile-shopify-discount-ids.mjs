#!/usr/bin/env node
/**
 * Reconciliation des shopify_referral_discount_id manquants.
 *
 * CONTEXTE : l'import legacy du 2026-05-25 a cree 2676 clients ET 2676 codes
 * Shopify, mais l'UPDATE qui stocke l'ID Shopify dans Supabase a echoue pour
 * tous (la colonne shopify_referral_discount_id n'etait pas visible via le
 * cache PostgREST a ce moment-la). Ce script retrouve l'ID Shopify de chaque
 * code (lecture seule cote Shopify) et le persiste cote Supabase.
 *
 * USAGE :
 *   node scripts/reconcile-shopify-discount-ids.mjs [--dry-run]
 *
 * COMPORTEMENT :
 *   - Lit en DB tous les loyalty_customers avec source='import_legacy'
 *     ET shopify_referral_discount_id IS NULL
 *   - Pour chaque, query Shopify Admin via codeDiscountNodeByCode(code=referral_code)
 *   - Si le node existe : UPDATE shopify_referral_discount_id + last_attempt_at
 *   - Sinon : ajoute a la liste "introuvables" (a investiguer)
 *   - NE CREE / NE MODIFIE RIEN cote Shopify (read-only Shopify, write-only Supabase)
 *   - Throttle 250 ms entre appels Shopify (rate limit Admin GraphQL)
 *
 * ENV VARS : memes que scripts/import-loyalty-customers.mjs
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// ─── Chargement .env.local (parseur inline, pas de dep dotenv) ───
function loadDotEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return
  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let value = trimmed.slice(eqIdx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}
loadDotEnvLocal()

// ─── Helpers ───
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const CODE_DISCOUNT_BY_CODE = `
  query GetCodeDiscountByCode($code: String!) {
    codeDiscountNodeByCode(code: $code) {
      id
      codeDiscount {
        ... on DiscountCodeBasic {
          title
          status
        }
      }
    }
  }
`

async function findShopifyDiscountByCode({ shopifyDomain, adminToken, code }) {
  const res = await fetch(`https://${shopifyDomain}/admin/api/2024-04/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': adminToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: CODE_DISCOUNT_BY_CODE, variables: { code } }),
  })
  if (!res.ok) throw new Error(`Shopify HTTP ${res.status} : ${await res.text()}`)
  const json = await res.json()
  if (json.errors) throw new Error(`Shopify GraphQL errors : ${JSON.stringify(json.errors)}`)
  const node = json.data?.codeDiscountNodeByCode
  return node ?? null
}

// ─── Main ───
async function main() {
  const dryRun = process.argv.includes('--dry-run')

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const SHOPIFY_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
  const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN

  const missing = []
  if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!SUPABASE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (!SHOPIFY_DOMAIN) missing.push('NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN')
  if (!SHOPIFY_TOKEN) missing.push('SHOPIFY_ADMIN_API_ACCESS_TOKEN')
  if (missing.length > 0) {
    console.error(`Env vars manquantes : ${missing.join(', ')}`)
    process.exit(1)
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`MODE : ${dryRun ? 'DRY-RUN (aucune ecriture)' : 'RUN REEL'}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  // Phase 1 : lister les customers a reconcilier
  console.log('Phase 1 : lookup loyalty_customers source=import_legacy ET shopify_referral_discount_id IS NULL ...')
  // Pagination Supabase : .range() par chunks de 1000 (limite par defaut)
  const all = []
  let from = 0
  const chunkSize = 1000
  while (true) {
    const { data, error } = await supabase
      .from('loyalty_customers')
      .select('id, referral_code, phone, email')
      .eq('source', 'import_legacy')
      .is('shopify_referral_discount_id', null)
      .order('created_at', { ascending: true })
      .range(from, from + chunkSize - 1)
    if (error) {
      console.error(`Erreur lookup Supabase : ${error.message}`)
      process.exit(1)
    }
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < chunkSize) break
    from += chunkSize
  }
  console.log(`  → ${all.length} customers a reconcilier\n`)

  if (all.length === 0) {
    console.log('Rien a faire. Sortie.')
    process.exit(0)
  }

  // Phase 2 : pour chaque, find Shopify + update Supabase
  console.log(`━━━ ${dryRun ? 'SIMULATION' : 'EXECUTION'} ━━━\n`)

  const backfilled = []
  const notFound = []
  const failed = []

  for (let i = 0; i < all.length; i++) {
    const customer = all[i]
    const idx = i + 1
    process.stdout.write(`[${idx}/${all.length}] ${customer.referral_code} ... `)

    try {
      const node = await findShopifyDiscountByCode({
        shopifyDomain: SHOPIFY_DOMAIN,
        adminToken: SHOPIFY_TOKEN,
        code: customer.referral_code,
      })
      if (!node) {
        process.stdout.write('INTROUVABLE cote Shopify\n')
        notFound.push({ id: customer.id, code: customer.referral_code, phone: customer.phone })
      } else {
        if (dryRun) {
          process.stdout.write(`trouve (${node.id.slice(-20)}) — DRY-RUN, pas d'UPDATE\n`)
        } else {
          const { error: upErr } = await supabase
            .from('loyalty_customers')
            .update({
              shopify_referral_discount_id: node.id,
              shopify_referral_discount_last_error: null,
              shopify_referral_discount_last_attempt_at: new Date().toISOString(),
            })
            .eq('id', customer.id)
          if (upErr) {
            process.stdout.write(`UPDATE DB ECHEC : ${upErr.message}\n`)
            failed.push({ id: customer.id, code: customer.referral_code, reason: upErr.message })
          } else {
            process.stdout.write(`backfille (${node.id.slice(-20)})\n`)
            backfilled.push({ id: customer.id, code: customer.referral_code })
          }
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      process.stdout.write(`ERREUR query Shopify : ${errMsg.slice(0, 80)}\n`)
      failed.push({ id: customer.id, code: customer.referral_code, reason: errMsg })
    }

    // Throttle 250ms (rate limit Shopify Admin)
    await sleep(250)
  }

  // Phase 3 : rapport
  console.log(`\n━━━ RAPPORT FINAL ━━━`)
  console.log(`  A reconcilier (total)   : ${all.length}`)
  console.log(`  Backfilles              : ${dryRun ? '(skipped : dry-run)' : backfilled.length}`)
  console.log(`  Introuvables Shopify    : ${notFound.length}`)
  console.log(`  Erreurs (DB ou Shopify) : ${failed.length}`)
  console.log(``)

  if (notFound.length > 0) {
    console.log(`Codes introuvables cote Shopify (${notFound.length}) :`)
    for (const nf of notFound.slice(0, 50)) {
      console.log(`  ${nf.code} (phone=${nf.phone}, id=${nf.id.slice(0, 8)})`)
    }
    if (notFound.length > 50) {
      console.log(`  ... et ${notFound.length - 50} autres (limite affichage 50)`)
    }
    console.log(``)
    console.log(`Ces codes peuvent etre crees manuellement via Shopify Admin OU`)
    console.log(`via createReferralDiscountCode (cf. src/lib/shopify/loyalty-discounts.ts).`)
    console.log(``)
  }

  if (failed.length > 0) {
    console.log(`Erreurs (${failed.length}) :`)
    for (const f of failed.slice(0, 30)) {
      console.log(`  ${f.code} : ${f.reason.slice(0, 120)}`)
    }
    if (failed.length > 30) {
      console.log(`  ... et ${failed.length - 30} autres`)
    }
  }

  process.exit(failed.length > 0 ? 2 : 0)
}

main().catch((err) => {
  console.error('\nERREUR FATALE :', err)
  process.exit(1)
})
