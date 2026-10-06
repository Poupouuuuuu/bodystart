// Politiques Shopify (Storefront API). termsOfSale (« Conditions générales de
// vente ») et legalNotice (« Mentions légales ») n'existent qu'à partir de
// l'API 2026-04 ; refundPolicy (« Politique de remboursement ») est lu sur la
// même version par cohérence.
export const GET_TERMS_OF_SALE = `
  query GetTermsOfSale {
    shop {
      termsOfSale {
        body
      }
    }
  }
`

export const GET_LEGAL_NOTICE = `
  query GetLegalNotice {
    shop {
      legalNotice {
        body
      }
    }
  }
`

export const GET_REFUND_POLICY = `
  query GetRefundPolicy {
    shop {
      refundPolicy {
        body
      }
    }
  }
`
