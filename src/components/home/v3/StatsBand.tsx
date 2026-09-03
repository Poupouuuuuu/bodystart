import { GOOGLE_LISTING_URL, GOOGLE_RATING } from '@/lib/store-info'

/**
 * Bande de preuves — chiffres géants en Fraunces sur vert sapin.
 *
 * Seul aplat sombre de la page (avec le hero photo) : un CHAPITRE délibéré
 * de ~260 px, pas un fond de page. Les trois faits sont réels et déjà
 * utilisés ailleurs (13 ans, +2 600 clients, note Google lue sur la fiche).
 */
const FACTS = [
  { value: '13', unit: 'ans', label: 'de conseil à Coignières' },
  { value: '+2 600', unit: '', label: 'clients conseillés au comptoir' },
  {
    value: GOOGLE_RATING.value.toLocaleString('fr-FR'),
    unit: '/5',
    label: `${GOOGLE_RATING.count} avis Google`,
    href: GOOGLE_LISTING_URL,
  },
]

export default function StatsBand() {
  return (
    <section className="bg-spruce text-canvas">
      <div className="container py-14 md:py-20">
        <dl className="grid divide-y divide-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
          {FACTS.map((f) => {
            const number = (
              <span className="whitespace-nowrap font-display text-[56px] font-extrabold leading-none tracking-tight tabular-nums md:text-[68px] lg:text-[84px]">
                {f.value}
                {f.unit && <span className="ml-1 text-[0.42em] font-bold text-sage">{f.unit}</span>}
              </span>
            )
            return (
              <div key={f.label} className="py-7 first:pt-0 last:pb-0 md:px-10 md:py-0 md:first:pl-0 md:last:pr-0">
                <dd>
                  {f.href ? (
                    <a
                      href={f.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-opacity duration-500 ease-out-expo hover:opacity-80"
                    >
                      {number}
                    </a>
                  ) : (
                    number
                  )}
                </dd>
                <dt className="mt-3 text-[12px] font-medium uppercase tracking-[0.18em] text-white/60 md:text-[13px]">
                  {f.label}
                </dt>
              </div>
            )
          })}
        </dl>
      </div>
    </section>
  )
}
