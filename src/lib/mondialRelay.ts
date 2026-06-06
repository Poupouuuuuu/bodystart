// ============================================================
// Mondial Relay — point relais (widget ParcelShopPicker v4)
// Intégration GRATUITE du widget officiel, sans app Shopify payante.
// Doc : https://widget.mondialrelay.com
//
// Le client choisit son relais AVANT le checkout. Le relais part dans la
// commande Shopify via :
//   1. un attribut de cart "Point Relais" (visible dans l'admin → sert à
//      générer l'étiquette manuellement) ;
//   2. l'adresse de livraison du cart (pré-remplissage du checkout).
// ============================================================

// Enseigne (Brand) Mondial Relay — 8 caractères. Pilotée par feature flag :
//   - prod : NEXT_PUBLIC_MR_ENSEIGNE = la vraie enseigne du compte MR ;
//   - absente en prod → bloc point relais MASQUÉ (le code part éteint) ;
//   - dev/local sans env → enseigne de TEST officielle documentée par MR.
//
// Valeur de test : la doc du widget utilise « BDTEST » (padding espace). On la
// conserve telle quelle (espace de fin compris) — ne pas trimmer une vraie
// enseigne, certaines sont padées à 8 caractères.
const TEST_BRAND = 'BDTEST '

const RAW_BRAND = process.env.NEXT_PUBLIC_MR_ENSEIGNE
export const MR_BRAND: string =
  RAW_BRAND && RAW_BRAND.trim().length > 0
    ? RAW_BRAND
    : process.env.NODE_ENV !== 'production'
      ? TEST_BRAND
      : ''

// Feature flag : tout le bloc point relais ne s'affiche que si une enseigne
// est disponible (env prod définie, ou fallback test en dev).
export const isMondialRelayEnabled = MR_BRAND.length > 0

// Clé de l'attribut de cart visible dans l'admin Shopify sur la commande.
// C'est CE texte que la boutique lit pour générer l'étiquette Mondial Relay.
export const RELAY_ATTRIBUTE_KEY = 'Point Relais'

export interface ParcelShop {
  id: string
  name: string
  address: string
  postalCode: string
  city: string
  countryCode: string
}

// "[ID] — [Nom], [Adresse], [CP] [Ville]" — format lisible côté admin.
export function formatRelayAttributeValue(shop: ParcelShop): string {
  const addr = shop.address.trim().replace(/\s+/g, ' ')
  return `${shop.id} — ${shop.name}, ${addr}, ${shop.postalCode} ${shop.city}`
}

// Relecture minimale de l'attribut pour réafficher la confirmation après un
// reload de page (on n'a besoin que du nom et du « CP Ville »). Tolérant aux
// virgules dans l'adresse : on prend le 1er segment (nom) et le dernier
// (CP Ville). Renvoie null si la valeur est vide ou non parsable.
export function parseRelayAttributeValue(
  value: string | null | undefined
): { id: string; name: string; cpVille: string } | null {
  if (!value) return null
  const sepIndex = value.indexOf(' — ')
  if (sepIndex === -1) return null
  const id = value.slice(0, sepIndex).trim()
  const rest = value.slice(sepIndex + 3).trim()
  if (!id || !rest) return null
  const parts = rest
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  const name = parts[0] ?? rest
  const cpVille = parts.length > 1 ? parts[parts.length - 1] : ''
  return { id, name, cpVille }
}

// Adresse de livraison du relais pour pré-remplir le checkout
// (cartDeliveryAddressesAdd → CartDeliveryAddressInput). company encode l'ID
// du relais afin qu'il soit lisible dans le checkout et l'admin.
export interface RelayDeliveryAddress {
  company: string
  address1: string
  city: string
  zip: string
  countryCode: string
}

export function buildRelayDeliveryAddress(shop: ParcelShop): RelayDeliveryAddress {
  return {
    company: `Point Relais ${shop.id}`,
    address1: shop.address.trim().replace(/\s+/g, ' ') || shop.name,
    city: shop.city,
    zip: shop.postalCode,
    countryCode: (shop.countryCode || 'FR').toUpperCase(),
  }
}
