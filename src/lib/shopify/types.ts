// ============================================================
// TYPES SHOPIFY — Body Start
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

export interface ShopifyProductVariant {
  id: string
  title: string
  availableForSale: boolean
  quantityAvailable: number
  price: ShopifyMoney
  compareAtPrice: ShopifyMoney | null
  selectedOptions: {
    name: string
    value: string
  }[]
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
  metafields?: ShopifyMetafield[]
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
  }
  cost: {
    totalAmount: ShopifyMoney
  }
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

// Boutiques Body Start (Click & Collect)
export interface BodyStartStore {
  id: string
  name: string
  shopifyLocationId: string
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
    name: 'Body Start Nutrition — Coignières',
    shopifyLocationId: '',
    address: '8 Rue du Pont des Landes',
    city: '78310 Coignières',
    phone: '07 61 84 75 80',
    hours: [
      { day: 'Lundi – Dimanche', open: '11:00', close: '19:00' },
    ],
  },
]

// Boutique B — ouverture prochaine
export const COMING_SOON_STORES = [
  {
    id: 'boutique-b',
    name: 'Body Start Nutrition — Boutique 2',
    city: 'Bientôt disponible',
    openingDate: 'Ouverture prochaine',
  },
]
