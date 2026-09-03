/**
 * Bandeau défilant — signature des sites de marque premium (Ritual, Huel).
 * Remplace BrandValuesV2 sur la home : ses 4 puces doublonnaient la bande de
 * réassurance déjà présente au-dessus du footer sur toutes les pages.
 *
 * Mouvement : CSS pur (`.marquee-track`, globals.css), pause au survol,
 * désactivé en prefers-reduced-motion. La liste est dupliquée pour boucler
 * sans couture ; la copie est masquée aux lecteurs d'écran.
 */
const ITEMS = [
  'Conseil gratuit en boutique',
  'Click & Collect en quelques minutes',
  'Livraison offerte dès 85 €',
  '13 ans de conseil à Coignières',
  'Marques sélectionnées, dosages vérifiés',
]

export default function MarqueeBand() {
  return (
    <div
      className="overflow-hidden border-y border-spruce/10 bg-canvas py-4 md:py-5"
      role="region"
      aria-label="Nos engagements"
    >
      <div className="marquee-track flex w-max items-center whitespace-nowrap">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            aria-hidden={copy === 1}
            className="flex items-center"
          >
            {ITEMS.map((t) => (
              <li
                key={t}
                className="flex items-center gap-8 pr-8 font-display text-[17px] font-semibold text-spruce md:text-[21px]"
              >
                {t}
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-mustard" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}
