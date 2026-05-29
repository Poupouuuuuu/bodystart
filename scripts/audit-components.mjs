/**
 * Audit pre-creation des composants de packs + verification d'acces.
 *
 * Usage : node --env-file=.env.local scripts/audit-components.mjs
 *
 * Lecture seule. Ne cree / ne modifie RIEN.
 * Ne logge jamais les tokens.
 */

const SHOP_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN

const ADMIN_API_VERSION = '2024-04'
const STOREFRONT_API_VERSION = '2024-04'

const COMPONENTS = ['Sub Zero', 'CLA 2400', 'Iron Ultra Fat Burner', 'L-Citrulline', 'YEAAH EAA']
const TO_CREATE = ['L-Carnitine Pro Zero', 'French Pump']

async function admin(query, variables = {}) {
  const r = await fetch(`https://${SHOP_DOMAIN}/admin/api/${ADMIN_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': ADMIN_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })
  return r.json()
}

async function storefront(query, variables = {}) {
  const r = await fetch(`https://${SHOP_DOMAIN}/api/${STOREFRONT_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })
  return r.json()
}

console.log('═══════════════════════════════════════════════')
console.log('ÉTAPE 1 — Vérification accès Admin API')
console.log('═══════════════════════════════════════════════')
console.log('Domain        :', SHOP_DOMAIN || '✗ MISSING')
console.log('Admin token   :', ADMIN_TOKEN ? `✓ set (len=${ADMIN_TOKEN.length})` : '✗ MISSING')
console.log('Storefront tok:', STOREFRONT_TOKEN ? `✓ set (len=${STOREFRONT_TOKEN.length})` : '✗ MISSING')

if (!SHOP_DOMAIN || !ADMIN_TOKEN) {
  console.error('\n✗ Pas de domain/admin token — stop')
  process.exit(1)
}

const scopesResp = await admin(`
  query {
    currentAppInstallation {
      accessScopes {
        handle
      }
    }
  }
`)

const scopes = scopesResp?.data?.currentAppInstallation?.accessScopes?.map((s) => s.handle) ?? []
if (scopesResp.errors) {
  console.log('\n⚠ Erreur lecture scopes :', JSON.stringify(scopesResp.errors, null, 2))
}
console.log('\nScopes accordés au token Admin :')
console.log(scopes.length ? scopes.map((s) => `  - ${s}`).join('\n') : '  (aucun retourné)')

const WRITE_NEEDED = ['write_products', 'write_inventory']
const READ_NICE = ['read_publications', 'read_product_listings']
console.log('\nVérif scopes nécessaires pour ÉTAPE 3 (création) :')
for (const s of WRITE_NEEDED) {
  console.log(`  ${scopes.includes(s) ? '✓' : '✗'} ${s}`)
}
console.log('\nScopes "confort" pour audit publication (optionnels) :')
for (const s of READ_NICE) {
  console.log(`  ${scopes.includes(s) ? '✓' : '✗'} ${s}`)
}

// ─── ÉTAPE 2 — Audit des 5 composants ───────────────────────────────
console.log('\n\n═══════════════════════════════════════════════')
console.log('ÉTAPE 2 — Audit des composants existants')
console.log('═══════════════════════════════════════════════')

async function auditByTitle(title) {
  const resp = await admin(
    `
    query ($q: String!) {
      products(first: 5, query: $q) {
        nodes {
          id
          title
          handle
          status
          vendor
          productType
          totalInventory
          formatMf: metafield(namespace: "custom", key: "format") { value }
          vnMf: metafield(namespace: "custom", key: "valeurs_nutritionnelles") { value }
          compMf: metafield(namespace: "custom", key: "composition") { value }
          allergMf: metafield(namespace: "custom", key: "allergenes") { value }
        }
      }
    }
  `,
    { q: `title:${JSON.stringify(title)}` }
  )
  return resp?.data?.products?.nodes ?? []
}

async function isOnBodyStartSite(handle) {
  // Si le produit est visible via le token Storefront (lié au canal headless
  // "BodyStart Site"), c'est qu'il est publié sur ce canal.
  const resp = await storefront(
    `query ($h: String!) { product(handle: $h) { id } }`,
    { h: handle }
  )
  return !!resp?.data?.product
}

for (const name of COMPONENTS) {
  const matches = await auditByTitle(name)
  console.log(`\n── ${name} ──`)
  if (matches.length === 0) {
    console.log('  ✗ N\'EXISTE PAS dans Shopify Admin')
    continue
  }
  // On affiche le(s) match(s) (peut y avoir homonymes)
  for (const p of matches) {
    const onSite = await isOnBodyStartSite(p.handle)
    console.log(`  ✓ Existe : "${p.title}"`)
    console.log(`     id           : ${p.id}`)
    console.log(`     handle       : ${p.handle}`)
    console.log(`     status       : ${p.status}`)
    console.log(`     vendor       : ${p.vendor || '(vide)'}`)
    console.log(`     productType  : ${p.productType || '(vide)'}`)
    console.log(`     totalInv     : ${p.totalInventory}`)
    console.log(`     BodyStart Site (Storefront visible) : ${onSite ? '✓ OUI' : '✗ NON'}`)
    console.log(`     custom.format               : ${p.formatMf?.value ? `"${p.formatMf.value}"` : '✗ vide'}`)
    console.log(`     custom.valeurs_nutritionn.  : ${p.vnMf?.value ? '✓ rempli' : '✗ vide'}`)
    console.log(`     custom.composition          : ${p.compMf?.value ? '✓ rempli' : '✗ vide'}`)
    console.log(`     custom.allergenes           : ${p.allergMf?.value ? '✓ rempli' : '✗ vide'}`)
  }
}

// ─── Dedup check : les 2 produits a creer existent-ils deja ? ───────
console.log('\n\n═══════════════════════════════════════════════')
console.log('Contrôle anti-doublon — produits à créer (ÉTAPE 3)')
console.log('═══════════════════════════════════════════════')
for (const name of TO_CREATE) {
  const matches = await auditByTitle(name)
  if (matches.length === 0) {
    console.log(`\n── ${name} ──\n  ✓ N'existe pas → création OK`)
  } else {
    console.log(`\n── ${name} ──\n  ⚠ EXISTE DÉJÀ (ne pas recréer) :`)
    for (const p of matches) {
      console.log(`     ${p.id} — "${p.title}" — status=${p.status} — handle=${p.handle}`)
    }
  }
}

console.log('\n═══════════════════════════════════════════════')
console.log('Audit terminé. Lecture seule, rien créé.')
console.log('═══════════════════════════════════════════════')
