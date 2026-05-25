#!/usr/bin/env node
/**
 * Import des clients legacy dans la fidelite BodyStart.
 *
 * USAGE :
 *   node scripts/import-loyalty-customers.mjs <chemin-csv> [--dry-run]
 *
 * EXEMPLES :
 *   # Dry-run (lance EN PREMIER, ne touche a rien) :
 *   node scripts/import-loyalty-customers.mjs ./data/clients-legacy.csv --dry-run
 *
 *   # Run reel (apres validation du dry-run) :
 *   node scripts/import-loyalty-customers.mjs ./data/clients-legacy.csv
 *
 * FORMAT CSV ATTENDU :
 *   - Header obligatoire avec au minimum 'phone' et 'first_name'
 *   - 'email' optionnel (colonne ou valeur peuvent etre absentes)
 *   - Phone : format francais (0612345678, +33612345678, +33 6 12 34 56 78) ou autre pays avec +
 *   - Lignes vides ignorees, valeurs entre guillemets supportees (RFC4180 basique)
 *
 *   Exemple :
 *     phone,first_name,email
 *     +33612345678,Adam,adam@example.fr
 *     0687654321,Theo,
 *     "+33 6 11 22 33 44","Marie","marie@example.fr"
 *
 * COMPORTEMENT :
 *   - Telephone normalise en E.164 via libphonenumber-js (FR par defaut)
 *   - Dedoublonnage par telephone (lookup Supabase, skip si existe)
 *   - Insert avec source='import_legacy', referral_code BS-XXXXX genere
 *   - Pas de credit cagnotte (decision : import membres seulement)
 *   - Best-effort : creation code Shopify -5€/40€ associe au referral_code
 *     (echec n'empeche pas la creation du client, juste loggue pour retry)
 *   - Throttle 250 ms entre appels Shopify Admin (respect rate limit)
 *
 * ENV VARS REQUISES (lues depuis .env.local en local, ou env shell) :
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY (clé service_role, BYPASS RLS)
 *   - NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
 *   - SHOPIFY_ADMIN_API_ACCESS_TOKEN
 *
 * SECURITE :
 *   - Ce script utilise le service_role : aucune verification staff, garde le
 *     CSV et les env vars en local (ne commit jamais le CSV).
 *   - Ne pas runner contre la prod sans avoir valide le dry-run d'abord.
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// ─── Chargement .env.local si present (pas de dep dotenv : on parse a la main) ───
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
    // strip quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}
loadDotEnvLocal()

// ─── CSV parsing (logique identique a src/lib/loyalty/import-csv.ts) ───
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  let i = 0
  while (i < line.length) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      current += char
      i++
      continue
    }
    if (char === '"') {
      inQuotes = true
      i++
      continue
    }
    if (char === ',') {
      result.push(current)
      current = ''
      i++
      continue
    }
    current += char
    i++
  }
  result.push(current)
  return result.map((s) => s.trim())
}

function parseCSV(content) {
  const lines = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => line.trim().length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase())
  const rows = lines.slice(1).map(parseCSVLine)
  return { headers, rows }
}

function mapRow(row, headers) {
  if (row.every((v) => v === '')) return { ok: false, reason: 'empty_row' }
  const phoneIdx = headers.indexOf('phone')
  const firstNameIdx = headers.indexOf('first_name')
  const emailIdx = headers.indexOf('email')
  const phone = phoneIdx >= 0 ? (row[phoneIdx] ?? '').trim() : ''
  const firstName = firstNameIdx >= 0 ? (row[firstNameIdx] ?? '').trim() : ''
  const emailRaw = emailIdx >= 0 ? (row[emailIdx] ?? '').trim() : ''
  if (!phone) return { ok: false, reason: 'missing_phone' }
  if (!firstName) return { ok: false, reason: 'missing_first_name' }
  return { ok: true, value: { phone, firstName, email: emailRaw === '' ? null : emailRaw } }
}

// ─── Generation referral_code (alphabet identique a src/lib/loyalty/calculate.ts) ───
const REFERRAL_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const REFERRAL_LENGTH = 5
function generateReferralCode() {
  let code = 'BS-'
  for (let i = 0; i < REFERRAL_LENGTH; i++) {
    code += REFERRAL_ALPHABET[Math.floor(Math.random() * REFERRAL_ALPHABET.length)]
  }
  return code
}

// ─── Shopify Admin : creation code parrainage (logique identique a loyalty-discounts.ts) ───
async function createReferralDiscountCode({ shopifyDomain, adminToken, referralCode, parrainEmail }) {
  const titleSuffix = parrainEmail ? ` (${parrainEmail})` : ''
  const query = `
    mutation CreateBasicDiscount($input: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $input) {
        codeDiscountNode { id }
        userErrors { field message code }
      }
    }
  `
  const variables = {
    input: {
      title: `Parrainage ${referralCode}${titleSuffix}`,
      code: referralCode,
      startsAt: new Date().toISOString(),
      customerSelection: { all: true },
      customerGets: {
        value: { discountAmount: { amount: 5.0, appliesOnEachItem: false } },
        items: { all: true },
      },
      minimumRequirement: { subtotal: { greaterThanOrEqualToSubtotal: 40.0 } },
      appliesOncePerCustomer: true,
      usageLimit: null,
      combinesWith: { orderDiscounts: false, productDiscounts: false, shippingDiscounts: true },
    },
  }

  const res = await fetch(`https://${shopifyDomain}/admin/api/2024-04/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': adminToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) {
    throw new Error(`Shopify HTTP ${res.status} : ${await res.text()}`)
  }
  const json = await res.json()
  if (json.errors) {
    throw new Error(`Shopify GraphQL errors : ${JSON.stringify(json.errors)}`)
  }
  const result = json.data?.discountCodeBasicCreate
  if (!result) throw new Error('Reponse Shopify mal formee (pas de discountCodeBasicCreate)')
  if (result.userErrors?.length > 0) {
    const msg = result.userErrors.map((e) => `${e.field?.join('.') ?? ''}: ${e.message}`).join(' | ')
    throw new Error(`Shopify userErrors : ${msg}`)
  }
  if (!result.codeDiscountNode?.id) throw new Error('Pas de codeDiscountNode dans la reponse')
  return result.codeDiscountNode.id
}

// ─── Helpers ───
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function formatReason(reason) {
  return ({
    missing_phone: 'phone manquant',
    missing_first_name: 'first_name manquant',
    empty_row: 'ligne vide',
    invalid_phone: 'telephone invalide (format non reconnu par libphonenumber-js)',
  })[reason] ?? reason
}

// ─── Main ───
async function main() {
  const args = process.argv.slice(2)
  const csvPath = args.find((a) => !a.startsWith('--'))
  const dryRun = args.includes('--dry-run')

  if (!csvPath) {
    console.error('USAGE : node scripts/import-loyalty-customers.mjs <chemin-csv> [--dry-run]')
    process.exit(1)
  }
  const absPath = resolve(process.cwd(), csvPath)
  if (!existsSync(absPath)) {
    console.error(`Fichier introuvable : ${absPath}`)
    process.exit(1)
  }

  // Check env
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const SHOPIFY_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
  const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN

  const missing = []
  if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!SUPABASE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (!dryRun) {
    if (!SHOPIFY_DOMAIN) missing.push('NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN')
    if (!SHOPIFY_TOKEN) missing.push('SHOPIFY_ADMIN_API_ACCESS_TOKEN')
  }
  if (missing.length > 0) {
    console.error(`Env vars manquantes : ${missing.join(', ')}`)
    console.error('Verifie .env.local ou exporte-les avant de lancer.')
    process.exit(1)
  }

  // Dynamic imports (libs ESM)
  const { parsePhoneNumberFromString } = await import('libphonenumber-js')
  const { createClient } = await import('@supabase/supabase-js')

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })

  // Parse CSV
  const content = readFileSync(absPath, 'utf-8')
  const { headers, rows } = parseCSV(content)

  if (headers.length === 0) {
    console.error('CSV vide ou header manquant.')
    process.exit(1)
  }
  if (!headers.includes('phone') || !headers.includes('first_name')) {
    console.error(`Header invalide : '${headers.join(',')}'. Requis : phone, first_name (email optionnel).`)
    process.exit(1)
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`MODE : ${dryRun ? 'DRY-RUN (aucune ecriture)' : 'RUN REEL'}`)
  console.log(`Fichier : ${absPath}`)
  console.log(`Lignes detectees : ${rows.length}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  // Phase 1 : parse + normalize + dedupe (en memoire)
  const valid = [] // { e164, firstName, email, originalRow }
  const invalidRows = [] // { line, originalPhone, reason }
  const duplicatesInFile = [] // { line, e164, reason: 'doublon dans le csv' }

  const seenInFile = new Set()
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const lineNum = i + 2 // +1 pour header, +1 pour 1-indexed
    const mapped = mapRow(row, headers)
    if (!mapped.ok) {
      invalidRows.push({ line: lineNum, originalPhone: row[headers.indexOf('phone')] ?? '', reason: mapped.reason })
      continue
    }

    const parsed = parsePhoneNumberFromString(mapped.value.phone, 'FR')
    if (!parsed || !parsed.isValid()) {
      invalidRows.push({ line: lineNum, originalPhone: mapped.value.phone, reason: 'invalid_phone' })
      continue
    }
    const e164 = parsed.number

    if (seenInFile.has(e164)) {
      duplicatesInFile.push({ line: lineNum, e164 })
      continue
    }
    seenInFile.add(e164)

    valid.push({
      e164,
      firstName: mapped.value.firstName,
      email: mapped.value.email,
      originalRow: row.join(','),
    })
  }

  // Phase 2 : check existants en DB
  const dbExisting = new Set()
  if (valid.length > 0) {
    console.log(`Phase 1 : ${valid.length} lignes valides en memoire, check Supabase...`)
    // Lookup en batch (chunks de 500 pour eviter URL trop longue)
    const chunkSize = 500
    for (let i = 0; i < valid.length; i += chunkSize) {
      const chunk = valid.slice(i, i + chunkSize).map((v) => v.e164)
      const { data, error } = await supabase
        .from('loyalty_customers')
        .select('phone')
        .in('phone', chunk)
      if (error) {
        console.error(`Erreur lookup Supabase : ${error.message}`)
        process.exit(1)
      }
      for (const r of data ?? []) dbExisting.add(r.phone)
    }
  }

  const toCreate = valid.filter((v) => !dbExisting.has(v.e164))
  const dbDuplicates = valid.filter((v) => dbExisting.has(v.e164))

  // Phase 3 : rapport dry-run OU execution
  console.log(`\n━━━ RAPPORT ${dryRun ? '(DRY-RUN)' : 'AVANT ECRITURE'} ━━━`)
  console.log(`  Lignes CSV totales      : ${rows.length}`)
  console.log(`  Valides apres parsing   : ${valid.length}`)
  console.log(`  Invalides (skip)        : ${invalidRows.length}`)
  console.log(`  Doublons dans le CSV    : ${duplicatesInFile.length}`)
  console.log(`  Deja en DB (skip)       : ${dbDuplicates.length}`)
  console.log(`  → A creer               : ${toCreate.length}`)
  console.log(``)

  if (invalidRows.length > 0) {
    console.log(`Lignes invalides detaillees (${invalidRows.length}) :`)
    for (const inv of invalidRows.slice(0, 50)) {
      console.log(`  L${inv.line} : "${inv.originalPhone}" — ${formatReason(inv.reason)}`)
    }
    if (invalidRows.length > 50) {
      console.log(`  ... et ${invalidRows.length - 50} autres (limite affichage 50)`)
    }
    console.log(``)
  }

  if (duplicatesInFile.length > 0) {
    console.log(`Doublons dans le CSV (${duplicatesInFile.length}) :`)
    for (const d of duplicatesInFile.slice(0, 20)) {
      console.log(`  L${d.line} : ${d.e164}`)
    }
    if (duplicatesInFile.length > 20) {
      console.log(`  ... et ${duplicatesInFile.length - 20} autres`)
    }
    console.log(``)
  }

  if (dryRun) {
    console.log('━━━ FIN DRY-RUN ━━━')
    console.log('Aucune ecriture effectuee. Relance sans --dry-run pour appliquer.')
    process.exit(0)
  }

  // Phase 4 : insert reel + creation code Shopify (best-effort)
  if (toCreate.length === 0) {
    console.log('Rien a creer. Sortie.')
    process.exit(0)
  }

  console.log(`━━━ EXECUTION : creation de ${toCreate.length} clients ━━━\n`)

  const created = []
  const insertFailures = []
  const shopifyFailures = []
  // Client cree + code Shopify cree mais UPDATE Supabase de l'ID Shopify a echoue.
  // Cas typique : colonne shopify_referral_discount_id non visible (cache PostgREST,
  // migration manquante). Distinct de shopifyFailures car le code Shopify EXISTE bien,
  // c'est juste le lien reverse en DB qui manque. A reparer via le script
  // scripts/reconcile-shopify-discount-ids.mjs.
  const linkFailures = []

  for (let i = 0; i < toCreate.length; i++) {
    const customer = toCreate[i]
    const idx = i + 1
    process.stdout.write(`[${idx}/${toCreate.length}] ${customer.e164} ${customer.firstName} ... `)

    // Generation referral_code avec retry sur collision (peu probable mais possible)
    let inserted = null
    let lastInsertError = null
    for (let attempt = 0; attempt < 8 && !inserted; attempt++) {
      const referralCode = generateReferralCode()
      const { data, error } = await supabase
        .from('loyalty_customers')
        .insert({
          phone: customer.e164,
          first_name: customer.firstName,
          email: customer.email,
          referral_code: referralCode,
          source: 'import_legacy',
        })
        .select('id, referral_code, email')
        .single()
      if (!error) {
        inserted = data
        break
      }
      lastInsertError = error
      if (error.code === '23505' && (error.message?.includes('referral_code') || error.message?.includes('idx_loyalty_customers_referral_code'))) {
        continue // collision, retry
      }
      // Autre conflit (phone race condition par ex.) : on sort
      break
    }

    if (!inserted) {
      process.stdout.write(`ECHEC insert : ${lastInsertError?.message ?? 'unknown'}\n`)
      insertFailures.push({ e164: customer.e164, reason: lastInsertError?.message ?? 'unknown' })
      continue
    }

    process.stdout.write(`OK (id=${inserted.id.slice(0, 8)} code=${inserted.referral_code}) `)

    // Best-effort : creation code Shopify
    try {
      const shopifyId = await createReferralDiscountCode({
        shopifyDomain: SHOPIFY_DOMAIN,
        adminToken: SHOPIFY_TOKEN,
        referralCode: inserted.referral_code,
        parrainEmail: inserted.email,
      })
      // Persiste l'ID Shopify
      const { error: updateErr } = await supabase
        .from('loyalty_customers')
        .update({
          shopify_referral_discount_id: shopifyId,
          shopify_referral_discount_last_error: null,
          shopify_referral_discount_last_attempt_at: new Date().toISOString(),
        })
        .eq('id', inserted.id)
      if (updateErr) {
        process.stdout.write(`shopify=OK mais update DB ECHEC : ${updateErr.message}\n`)
        linkFailures.push({
          e164: customer.e164,
          id: inserted.id,
          code: inserted.referral_code,
          shopifyId,
          reason: updateErr.message,
        })
      } else {
        process.stdout.write(`shopify=OK\n`)
      }
      created.push({ e164: customer.e164, id: inserted.id, code: inserted.referral_code })
    } catch (shopifyErr) {
      const errMsg = shopifyErr instanceof Error ? shopifyErr.message : String(shopifyErr)
      process.stdout.write(`shopify=ECHEC (${errMsg.slice(0, 80)})\n`)
      // Persiste l'erreur pour retry futur
      await supabase
        .from('loyalty_customers')
        .update({
          shopify_referral_discount_last_error: errMsg.slice(0, 1000),
          shopify_referral_discount_last_attempt_at: new Date().toISOString(),
        })
        .eq('id', inserted.id)
        .then(() => {})
        .catch(() => {})
      shopifyFailures.push({ e164: customer.e164, id: inserted.id, code: inserted.referral_code, reason: errMsg })
      // Le customer est cree, on continue
      created.push({ e164: customer.e164, id: inserted.id, code: inserted.referral_code })
    }

    // Throttle Admin API : 250ms entre 2 appels (Shopify Basic = 2 req/s pour Admin GraphQL,
    // on reste a 4 req/s pour avoir une marge meme avec les operations DB)
    await sleep(250)
  }

  // Phase 5 : rapport final
  const partialSuccess = created.length - linkFailures.length
  console.log(`\n━━━ RAPPORT FINAL ━━━`)
  console.log(`  Crees DB + code Shopify OK + lien stocke : ${partialSuccess}`)
  console.log(`  Crees DB + code Shopify OK MAIS lien manquant : ${linkFailures.length} (a reconcilier)`)
  console.log(`  Echecs insert DB                              : ${insertFailures.length}`)
  console.log(`  Echecs creation code Shopify                  : ${shopifyFailures.length} (a retry)`)
  console.log(``)
  console.log(`  → Total clients crees en DB : ${created.length}`)
  console.log(`  → Total echecs partiels     : ${linkFailures.length + shopifyFailures.length}`)
  console.log(`  → Total echecs durs         : ${insertFailures.length}`)
  console.log(``)

  if (insertFailures.length > 0) {
    console.log(`Echecs insert DB :`)
    for (const f of insertFailures) {
      console.log(`  ${f.e164} : ${f.reason}`)
    }
    console.log(``)
  }

  if (shopifyFailures.length > 0) {
    console.log(`Echecs creation code Shopify (clients crees, code a recreer manuellement) :`)
    for (const f of shopifyFailures) {
      console.log(`  ${f.e164} (id=${f.id.slice(0, 8)} code=${f.code}) : ${f.reason.slice(0, 120)}`)
    }
    console.log(``)
    console.log(`Pour retry les codes Shopify failed, query SQL :`)
    console.log(`  SELECT id, phone, referral_code, shopify_referral_discount_last_error`)
    console.log(`  FROM loyalty_customers_with_failed_referral_code;`)
    console.log(``)
  }

  if (linkFailures.length > 0) {
    console.log(`Liens DB ↔ Shopify manquants (code Shopify cree, ID non persiste cote DB) :`)
    for (const f of linkFailures.slice(0, 30)) {
      console.log(`  ${f.e164} (id=${f.id.slice(0, 8)} code=${f.code}) : ${f.reason.slice(0, 120)}`)
    }
    if (linkFailures.length > 30) {
      console.log(`  ... et ${linkFailures.length - 30} autres`)
    }
    console.log(``)
    console.log(`Cause typique : colonne shopify_referral_discount_id absente (migration 00006)`)
    console.log(`OU cache PostgREST pas refresh (Supabase Dashboard > Settings > API > Reload schema).`)
    console.log(`Une fois la colonne accessible, lance :`)
    console.log(`  node scripts/reconcile-shopify-discount-ids.mjs`)
    console.log(``)
  }

  // Exit code :
  //   0 = tout OK
  //   2 = au moins un echec partiel (linkFailures OU shopifyFailures, clients crees)
  //   3 = au moins un echec dur (insertFailures, client pas cree)
  if (insertFailures.length > 0) process.exit(3)
  if (linkFailures.length > 0 || shopifyFailures.length > 0) process.exit(2)
  process.exit(0)
}

main().catch((err) => {
  console.error('\nERREUR FATALE :', err)
  process.exit(1)
})
