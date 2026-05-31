/**
 * Audit composants Shopify + check des scopes du token Admin.
 *
 * Usage : node --env-file=.env.local scripts/audit-shopify-components.mjs
 *
 * ETAPE 1 : liste les access scopes du token Admin (write_products ?).
 * ETAPE 2 : pour chaque composant, statut + visibilite Storefront
 *           (= publie sur le canal "BodyStart Site") + metafield custom.format.
 *
 * Ne logge jamais les tokens.
 */

const SHOP_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN
const ADMIN_API_VERSION = '2024-04'
const STOREFRONT_API_VERSION = '2024-04'

const COMPONENTS = ['Sub Zero', 'CLA 2400', 'Iron Ultra Fat Burner', 'L-Citrulline', 'YEAAH EAA']

async function admin(query, variables = {}) {
  const r = await fetch(`https://${SHOP_DOMAIN}/admin/api/${ADMIN_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': ADMIN_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  return r.json()
}

async function storefront(query, variables = {}) {
  const r = await fetch(`https://${SHOP_DOMAIN}/api/${STOREFRONT_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  return r.json()
}

console.log('═══════════════════════════════════════════════')
console.log('ÉTAPE 1 — Capacités du token Admin (probes non destructifs)')
console.log('═══════════════════════════════════════════════')
console.log('Domain        :', SHOP_DOMAIN)
console.log('Admin token   :', ADMIN_TOKEN ? `set (len=${ADMIN_TOKEN.length})` : '✗ MANQUANT')
console.log('Storefront tok:', STOREFRONT_TOKEN ? `set (len=${STOREFRONT_TOKEN.length})` : '✗ MANQUANT')

// Probe write_products : productUpdate sur un ID bidon (gid .../Product/0).
// Ne cree rien, ne modifie rien. ACCESS_DENIED => pas le scope ;
// userError "not found" / validation => le scope est present.
function classifyProbe(resp, mutationField) {
  const topErr = resp.errors?.[0]
  if (topErr?.extensions?.code === 'ACCESS_DENIED') {
    return { ok: false, reason: `ACCESS_DENIED (scope manquant : ${topErr.extensions.requiredAccess ?? '?'})` }
  }
  if (topErr) {
    // Autre erreur top-level (ex: champ inconnu) — on remonte tel quel
    return { ok: null, reason: topErr.message }
  }
  // Pas d'erreur top-level => le serveur a accepte d'executer la mutation
  // (les userErrors "not found" prouvent qu'on a le droit d'ecrire)
  const userErrors = resp.data?.[mutationField]?.userErrors ?? []
  return { ok: true, reason: userErrors.length ? `OK (userError attendu: ${userErrors[0].message})` : 'OK' }
}

const probeProduct = await admin(`
  mutation {
    productUpdate(input: { id: "gid://shopify/Product/0", title: "___probe___" }) {
      product { id }
      userErrors { field message }
    }
  }
`)
const wp = classifyProbe(probeProduct, 'productUpdate')
console.log('\n► write_products  :', wp.ok === true ? `✓ OUI — ${wp.reason}` : wp.ok === false ? `✗ NON — ${wp.reason}` : `? — ${wp.reason}`)

// Probe write_inventory : inventoryAdjustQuantities avec un input vide/bidon.
const probeInv = await admin(`
  mutation {
    inventorySetQuantities(input: {
      name: "available",
      reason: "correction",
      quantities: [{ inventoryItemId: "gid://shopify/InventoryItem/0", locationId: "gid://shopify/Location/0", quantity: 0, compareQuantity: 0 }]
    }) {
      userErrors { field message }
    }
  }
`)
const wi = classifyProbe(probeInv, 'inventorySetQuantities')
console.log('► write_inventory :', wi.ok === true ? `✓ OUI — ${wi.reason}` : wi.ok === false ? `✗ NON — ${wi.reason}` : `? — ${wi.reason}`)

// read_products : simple query
const probeRead = await admin(`{ products(first: 1) { nodes { id } } }`)
console.log('► read_products   :', probeRead.errors ? `✗ NON — ${probeRead.errors[0].message}` : '✓ OUI')

console.log('\n\n═══════════════════════════════════════════════')
console.log('ÉTAPE 2 — Audit des composants existants')
console.log('═══════════════════════════════════════════════')

for (const title of COMPONENTS) {
  console.log(`\n──────── ${title} ────────`)
  // Recherche Admin par titre exact
  const adm = await admin(
    `
    query ($q: String!) {
      products(first: 5, query: $q) {
        nodes {
          id
          handle
          title
          status
          publishedAt
          fmt: metafield(namespace: "custom", key: "format") { value }
          nut: metafield(namespace: "custom", key: "valeurs_nutritionnelles") { value }
          comp: metafield(namespace: "custom", key: "composition") { value }
          alg: metafield(namespace: "custom", key: "allergenes") { value }
        }
      }
    }
  `,
    { q: `title:'${title}'` }
  )

  if (adm.errors) {
    console.log('  Admin erreur :', JSON.stringify(adm.errors))
    continue
  }

  const nodes = adm.data?.products?.nodes ?? []
  // Match exact (insensible casse) en priorite, sinon premier resultat
  const match =
    nodes.find((n) => n.title.toLowerCase() === title.toLowerCase()) ?? nodes[0]

  if (!match) {
    console.log('  ✗ N\'EXISTE PAS dans Shopify (Admin)')
    continue
  }

  console.log('  ✓ Existe         :', match.title, `(${match.handle})`)
  console.log('  Status           :', match.status)
  console.log('  publishedAt      :', match.publishedAt ?? 'NULL (non publie)')
  console.log('  custom.format    :', match.fmt?.value ? `"${match.fmt.value}"` : '∅ vide')
  console.log('  valeurs_nutri.   :', match.nut?.value ? 'rempli' : '∅ vide')
  console.log('  composition      :', match.comp?.value ? 'rempli' : '∅ vide')
  console.log('  allergenes       :', match.alg?.value ? 'rempli' : '∅ vide')

  // Visibilite Storefront = publie sur le canal "BodyStart Site"
  const sf = await storefront(
    `query ($h: String!) { product(handle: $h) { id availableForSale } }`,
    { h: match.handle }
  )
  const visible = !!sf.data?.product
  console.log('  Canal BodyStart Site :', visible ? '✓ PUBLIE (visible Storefront)' : '✗ PAS publie sur ce canal')
}

console.log('\n═══════════════════════════════════════════════')
console.log('Audit termine.')
console.log('═══════════════════════════════════════════════')
