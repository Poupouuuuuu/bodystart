// ============================================================
// Mondial Relay : point relais (widget ParcelShopPicker v4)
// Intégration GRATUITE du widget officiel, sans app Shopify payante.
// Doc : https://widget.mondialrelay.com
//
// Le client choisit son relais dans le panier, AVANT le checkout. Le relais
// part dans la commande Shopify via deux attributs de cart (bloc « Attributs
// supplémentaires » de la commande dans l'admin) : la boutique y lit le numéro
// exact du point pour créer l'étiquette dans Mondial Relay Connect.
//
// Choix FACULTATIF : sans relais choisi, la boutique prend le plus proche de
// l'adresse du client. Si le client prend Colissimo ou le retrait en boutique
// au paiement, les attributs sont simplement ignorés.
//
// L'adresse de livraison du cart n'est JAMAIS modifiée (brief du 06/10/2026) :
// le client garde son adresse au paiement.
// ============================================================

// Enseigne (Brand) Mondial Relay du compte Connect BodyStart. Identifiant
// public (il circule en clair dans les appels du widget), pas un secret.
// NEXT_PUBLIC_MR_ENSEIGNE permet de le surcharger sans toucher au code.
const PRODUCTION_BRAND = 'CC23Y4G1'

const RAW_BRAND = process.env.NEXT_PUBLIC_MR_ENSEIGNE
export const MR_BRAND: string =
  RAW_BRAND && RAW_BRAND.trim().length > 0 ? RAW_BRAND : PRODUCTION_BRAND

// Clés des attributs de cart, visibles telles quelles dans l'admin Shopify.
// La boutique s'appuie sur ces libellés : ne pas les renommer sans prévenir.
export const RELAY_ID_ATTRIBUTE_KEY = 'Point relais Mondial Relay'
export const RELAY_ADDRESS_ATTRIBUTE_KEY = 'Point relais (adresse)'
export const RELAY_ATTRIBUTE_KEYS = [RELAY_ID_ATTRIBUTE_KEY, RELAY_ADDRESS_ATTRIBUTE_KEY]

export interface ParcelShop {
  id: string
  name: string
  address: string
  postalCode: string
  city: string
  countryCode: string
}

export interface RelayPickup {
  id: string
  name: string
  cpVille: string
}

// Numéro du point au format du widget et de Connect : « FR-039986 ».
export function formatRelayId(shop: ParcelShop): string {
  const country = (shop.countryCode || 'FR').trim().toUpperCase()
  return `${country}-${shop.id.trim()}`
}

// « Nom du point, adresse, CP Ville ».
export function formatRelayAddress(shop: ParcelShop): string {
  const addr = shop.address.trim().replace(/\s+/g, ' ')
  return [shop.name.trim(), addr, `${shop.postalCode} ${shop.city}`.trim()]
    .filter(Boolean)
    .join(', ')
}

export function buildRelayAttributes(shop: ParcelShop): { key: string; value: string }[] {
  return [
    { key: RELAY_ID_ATTRIBUTE_KEY, value: formatRelayId(shop) },
    { key: RELAY_ADDRESS_ATTRIBUTE_KEY, value: formatRelayAddress(shop) },
  ]
}

// Relit le relais depuis les attributs du cart (réaffichage après reload).
// Le numéro est obligatoire ; le nom et le « CP Ville » viennent de l'adresse
// (1er segment et dernier segment, l'adresse pouvant contenir des virgules).
export function readRelayPickup(
  attributes: { key: string; value: string | null }[] | null | undefined
): RelayPickup | null {
  const id = attributes?.find((a) => a.key === RELAY_ID_ATTRIBUTE_KEY)?.value?.trim()
  if (!id) return null
  const address = attributes?.find((a) => a.key === RELAY_ADDRESS_ATTRIBUTE_KEY)?.value ?? ''
  const parts = address
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  return {
    id,
    name: parts[0] ?? id,
    cpVille: parts.length > 1 ? parts[parts.length - 1] : '',
  }
}
