/**
 * Debug Shopify Storefront/Admin pour les bundles "packs".
 *
 * Usage : node --env-file=.env.local scripts/debug-shopify-packs.mjs
 *
 * Ne logge JAMAIS les tokens, seulement leur presence + longueur.
 * Affiche les reponses brutes (errors + data) pour identifier ou ca casse.
 */

const SHOP_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN

const STOREFRONT_API_VERSION = '2024-04'
const ADMIN_API_VERSION = '2024-04'

const PACK_HANDLES = ['pack-prise-de-masse-propre', 'pack-routine-sante']

console.log('───────────────────────────────────────────────')
console.log('Shopify config detected')
console.log('───────────────────────────────────────────────')
console.log('Domain                 :', SHOP_DOMAIN || '✗ MISSING')
console.log('Storefront token       :', STOREFRONT_TOKEN ? `✓ set (len=${STOREFRONT_TOKEN.length})` : '✗ MISSING')
console.log('Admin token            :', ADMIN_TOKEN ? `✓ set (len=${ADMIN_TOKEN.length})` : '✗ MISSING')

if (!SHOP_DOMAIN || !STOREFRONT_TOKEN) {
  console.error('\n✗ Impossible de continuer sans domain + storefront token')
  process.exit(1)
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
  return { httpStatus: r.status, body: await r.json() }
}

async function admin(query, variables = {}) {
  if (!ADMIN_TOKEN) return { skipped: true }
  const r = await fetch(`https://${SHOP_DOMAIN}/admin/api/${ADMIN_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': ADMIN_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })
  return { httpStatus: r.status, body: await r.json() }
}

function dump(label, obj) {
  console.log(`\n=== ${label} ===`)
  console.log(JSON.stringify(obj, null, 2))
}

// ─── 1. ADMIN — recherche par titre "Pack" (verifier existence reelle) ─
console.log('\n\n───────────────────────────────────────────────')
console.log('1. ADMIN — produits dont le titre contient "Pack"')
console.log('───────────────────────────────────────────────')
const adminSearch = await admin(`
  query {
    products(first: 10, query: "title:Pack*") {
      nodes {
        id
        handle
        title
        status
        publishedAt
        productType
        tags
        vendor
        hasOnlyDefaultVariant
        totalVariants
        requiresSellingPlan
      }
    }
  }
`)
dump('Admin products(query:"title:Pack*")', adminSearch)

const adminProducts = adminSearch.body?.data?.products?.nodes ?? []
console.log(`\nTotal produits "Pack*" en Admin : ${adminProducts.length}`)
if (adminProducts.length > 0) {
  console.log('Real handles :', adminProducts.map((p) => p.handle))
  console.log('Status       :', adminProducts.map((p) => `${p.handle}=${p.status}`))
  console.log('PublishedAt  :', adminProducts.map((p) => `${p.handle}=${p.publishedAt ?? 'NULL'}`))
}

// ─── 2. ADMIN — par produit, lister les resource publications ──────
console.log('\n\n───────────────────────────────────────────────')
console.log('2. ADMIN — resourcePublications par pack (canaux publies)')
console.log('───────────────────────────────────────────────')
for (const p of adminProducts) {
  const r = await admin(
    `
    query ($id: ID!) {
      product(id: $id) {
        id
        handle
        title
        status
        publishedAt
        resourcePublicationsV2(first: 20) {
          nodes {
            isPublished
            publishDate
            publication {
              id
              name
            }
          }
        }
      }
    }
  `,
    { id: p.id }
  )
  dump(`Admin resourcePublicationsV2 — ${p.handle}`, r)
}

// ─── 3. STOREFRONT — meme handle (deja en 404) ─────────────────────
console.log('\n\n───────────────────────────────────────────────')
console.log('3. STOREFRONT — product(handle) avec REAL handles d\'Admin')
console.log('───────────────────────────────────────────────')
const realHandles = adminProducts.map((p) => p.handle)
for (const handle of realHandles) {
  const r = await storefront(
    `
    query ($handle: String!) {
      product(handle: $handle) {
        id
        handle
        title
        availableForSale
      }
    }
  `,
    { handle }
  )
  dump(`Storefront product(handle: "${handle}")`, r)
}

// ─── 4. STOREFRONT — collection "packs" recheck avec details ──────
console.log('\n\n───────────────────────────────────────────────')
console.log('4. STOREFRONT — collection(handle: "packs") detaillee')
console.log('───────────────────────────────────────────────')
const col = await storefront(`
  query {
    collection(handle: "packs") {
      id
      handle
      title
      productsCount {
        count
        precision
      }
      products(first: 50) {
        nodes {
          handle
          title
          availableForSale
        }
      }
    }
  }
`)
dump('Storefront collection("packs") with productsCount', col)

console.log('\n───────────────────────────────────────────────')
console.log('Diagnostic termine.')
console.log('───────────────────────────────────────────────')
