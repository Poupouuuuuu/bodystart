// Entité locale unique (10/10/2026) : une Organization et UN Store, même @id
// sur toutes les pages (layout Nutrition). Avant : un LocalBusiness sans geo
// partout, plus un Store sans @id sur /stores, donc deux entités pour Google.
// Pas d'aggregateRating sur l'établissement : Google n'affiche pas les avis
// d'un commerce publiés sur son propre site.

import { CONTACT_EMAIL, GOOGLE_MAPS_URL, SAME_AS, STORE } from '@/lib/store-info'

export const organizationId = (site: string) => `${site}/#organization`
export const storeId = (site: string) => `${site}/#boutique-coignieres`

const address = () => ({
  '@type': 'PostalAddress',
  streetAddress: STORE.streetAddress,
  postalCode: STORE.postalCode,
  addressLocality: STORE.locality,
  addressRegion: STORE.region,
  addressCountry: STORE.country,
})

export function organizationJsonLd(site: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': organizationId(site),
    name: STORE.name,
    url: site,
    logo: `${site}/assets/logos/logo-v2-carre.png`,
    description:
      'Boutique de compléments alimentaires et de nutrition sportive à Coignières (78), anciennement BodyFit, avec vente en ligne et Click & Collect.',
    email: CONTACT_EMAIL,
    address: address(),
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: STORE.phoneE164,
      email: CONTACT_EMAIL,
      contactType: 'customer service',
      availableLanguage: 'French',
    },
    sameAs: SAME_AS,
  }
}

export function storeJsonLd(site: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': storeId(site),
    name: STORE.name,
    alternateName: STORE.alternateName,
    description:
      'Boutique de compléments alimentaires et de nutrition sportive à Coignières (78) : conseil gratuit en boutique, Click & Collect.',
    url: `${site}/stores`,
    image: `${site}/assets/logos/logo-v2-og.png`,
    telephone: STORE.phoneE164,
    email: CONTACT_EMAIL,
    priceRange: '€€',
    address: address(),
    geo: { '@type': 'GeoCoordinates', latitude: STORE.geo.latitude, longitude: STORE.geo.longitude },
    hasMap: GOOGLE_MAPS_URL,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [...STORE.openingDays],
        opens: STORE.opens,
        closes: STORE.closes,
      },
    ],
    parentOrganization: { '@id': organizationId(site) },
    sameAs: SAME_AS,
  }
}
