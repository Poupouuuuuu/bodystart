// Politiques Shopify (Storefront). termsOfSale = « Conditions générales de
// vente » de l'admin ; n'existe qu'à partir de l'API 2026-04.
export const GET_TERMS_OF_SALE = `
  query GetTermsOfSale {
    shop {
      termsOfSale {
        body
      }
    }
  }
`
