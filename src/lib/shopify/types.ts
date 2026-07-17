// ============================================================
// TYPES SHOPIFY — BodyStart
// ============================================================

export interface ShopifyImage {
  url: string
  altText: string | null
  width: number
  height: number
}

export interface ShopifyMoney {
  amount: string
  currencyCode: string
}

export interface ShopifyBundleComponent {
  quantity: number
  productVariant: {
    id: string
    title: string
    // Image variant-specific (ex: Iso Zero chocolat aura sa propre photo).
    // Si null, fallback sur product.featuredImage cote helper.
    image: ShopifyImage | null
    product: {
      id: string
      handle: string
      title: string
      featuredImage: ShopifyImage | null
      // Metafields produit du composant (au moins custom.format pour
      // afficher le grammage dans le label du selecteur de la fiche pack).
      metafields?: (ShopifyMetafield | null)[]
    }
  }
}

export interface ShopifyProductVariant {
  id: string
  title: string
  availableForSale: boolean
  quantityAvailable: number
  price: ShopifyMoney
  compareAtPrice: ShopifyMoney | null
  image?: ShopifyImage | null
  selectedOptions: {
    name: string
    value: string
  }[]
  // Bundles : presents uniquement si la variante est un bundle
  // (Shopify Bundles app). requiresComponents = true alors.
  requiresComponents?: boolean
  components?: {
    nodes: ShopifyBundleComponent[]
  }
}

export interface ShopifyProduct {
  id: string
  handle: string
  title: string
  description?: string
  descriptionHtml?: string
  tags: string[]
  vendor: string
  productType: string
  // Agrégat Storefront : true si AU MOINS une variante est disponible.
  // false = toutes les variantes épuisées → badge « Épuisé » sur les cartes.
  availableForSale?: boolean
  featuredImage: ShopifyImage | null
  images?: {
    nodes: ShopifyImage[]
  }
  variants: {
    nodes: ShopifyProductVariant[]
  }
  priceRange: {
    minVariantPrice: ShopifyMoney
    maxVariantPrice: ShopifyMoney
  }
  collections?: {
    nodes: { handle: string; title: string }[]
  }
  metafields?: ShopifyMetafield[]
  // Champs SEO dédiés Shopify (Storefront API). Nullables si non remplis.
  seo?: {
    title: string | null
    description: string | null
  }
}

export interface ShopifyMetafield {
  namespace: string
  key: string
  value: string
  type: string
}

export interface ShopifyCollection {
  id: string
  handle: string
  title: string
  description: string
  image: ShopifyImage | null
  products: {
    nodes: ShopifyProduct[]
  }
}

// Inventory par location (Click & Collect)
export interface ShopifyLocation {
  id: string
  name: string
  address: {
    address1: string
    city: string
    zip: string
  }
}

export interface InventoryLevel {
  location: ShopifyLocation
  available: number
}

// Cart
export interface CartItem {
  id: string
  quantity: number
  merchandise: {
    id: string
    title: string
    product: {
      id: string
      handle: string
      title: string
      featuredImage: ShopifyImage | null
    }
    price: ShopifyMoney
    selectedOptions: {
      name: string
      value: string
    }[]
    // Composants du bundle (présent uniquement si la merchandise est un
    // bundle Shopify). Repli visuel pour la vignette panier quand le
    // bundle n'a pas de featuredImage.
    components?: {
      nodes: {
        productVariant: {
          image: ShopifyImage | null
          product: {
            title: string
            featuredImage: ShopifyImage | null
          }
        }
      }[]
    } | null
  }
  cost: {
    totalAmount: ShopifyMoney
  }
}

export interface CartDiscountCode {
  code: string
  applicable: boolean
}

export interface ShopifyCart {
  id: string
  checkoutUrl: string
  totalQuantity: number
  lines: {
    nodes: CartItem[]
  }
  cost: {
    subtotalAmount: ShopifyMoney
    totalAmount: ShopifyMoney
    totalTaxAmount: ShopifyMoney | null
  }
  discountCodes: CartDiscountCode[]
  // Montants déduits par remise (code présent si remise par code promo).
  discountAllocations?: { discountedAmount: ShopifyMoney; code?: string }[]
  // Attributs personnalisés (dont "Point Relais" Mondial Relay).
  attributes?: { key: string; value: string | null }[]
  // Adresses de livraison posées sur le cart (Storefront cartDeliveryAddresses).
  delivery?: {
    addresses: { id: string; selected: boolean }[]
  }
}

// Blog
export interface ShopifyArticle {
  id: string
  handle: string
  title: string
  excerpt?: string
  excerptHtml?: string
  contentHtml?: string
  publishedAt: string
  image?: {
    url: string
    altText: string | null
    width: number
    height: number
  }
  author: { name: string }
  tags: string[]
}

export interface ShopifyBlog {
  id: string
  handle: string
  title: string
  articles: { nodes: ShopifyArticle[] }
}

// Boutiques BodyStart (Click & Collect)
export interface BodyStartStore {
  id: string
  name: string
  shopifyLocationId: string
  isActive: boolean
  address: string
  city: string
  phone: string
  hours: {
    day: string
    open: string
    close: string
  }[]
}

export const BODY_START_STORES: BodyStartStore[] = [
  {
    id: 'boutique-coignieres',
    name: 'BodyStart Nutrition, Coignières',
    // ID Shopify de l'emplacement "BodyStart Coignières" sur le store
    // bodystart-nutrition-2 (mis a jour 2026-05-26 : l'ancien
    // 114075795838 pointait vers une location obsolete, le stock
    // affichait toujours "Indisponible en boutique" malgre 50 unites
    // reelles activees par Click & Collect).
    shopifyLocationId: 'gid://shopify/Location/119350657366',
    isActive: true,
    address: '8 Rue du Pont des Landes',
    city: '78310 Coignières',
    phone: '07 61 84 75 80',
    // Ouvert du lundi au samedi, FERMÉ le dimanche (MAJ 2026-07). Détaillé par
    // jour (nom FR exact) : StoreStatusV2 mappe le jour courant (Europe/Paris)
    // sur ces entrées pour son statut « ouvert/fermé » en direct. L'entrée
    // Dimanche 'Fermé' est explicite (le widget filtre open==='Fermé').
    hours: [
      { day: 'Lundi', open: '11:00', close: '19:00' },
      { day: 'Mardi', open: '11:00', close: '19:00' },
      { day: 'Mercredi', open: '11:00', close: '19:00' },
      { day: 'Jeudi', open: '11:00', close: '19:00' },
      { day: 'Vendredi', open: '11:00', close: '19:00' },
      { day: 'Samedi', open: '11:00', close: '19:00' },
      { day: 'Dimanche', open: 'Fermé', close: 'Fermé' },
    ],
  },
]

// Boutique B — ouverture prochaine
export const COMING_SOON_STORES = [
  {
    id: 'boutique-b',
    name: 'BodyStart Nutrition, Boutique 2',
    city: 'Bientôt disponible',
    openingDate: 'Ouverture prochaine',
  },
]
