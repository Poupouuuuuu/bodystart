import { frenchSpacing } from '@/lib/typo'
import BoutiqueConseil from './BoutiqueConseil'
import RappelForm from './RappelForm'

/**
 * Version de repli de /conseil, quand le guide ne peut pas être lu (Shopify
 * indisponible, metafield invalide, stock illisible) : texte, boutique,
 * rappel. Jamais d'erreur 500 sur cette page.
 */
export default function ConseilRepli() {
  return (
    <div className="container max-w-2xl pb-16 pt-8 md:pb-24 md:pt-14">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mustard-ink">
        Conseil gratuit · Coignières
      </p>
      <h1 className="mt-3 font-display text-[34px] font-extrabold leading-[1.05] tracking-tight text-spruce sm:text-[44px]">
        On te conseille en boutique
      </h1>
      <p className="mt-4 text-[16px] leading-[1.6] text-ink md:text-[17px]">
        {frenchSpacing(
          'Notre guide en ligne est en pause pour le moment. Passe nous voir à Coignières, ou laisse-nous tes coordonnées : on te rappelle pour faire le point ensemble, sans engagement.'
        )}
      </p>

      <div className="mt-8">
        <BoutiqueConseil />
      </div>

      <section className="mt-10 rounded-[20px] bg-white p-5 shadow-card sm:p-6" aria-labelledby="conseil-rappel">
        <h2 id="conseil-rappel" className="font-display text-[22px] font-extrabold tracking-tight text-spruce">
          Être rappelé
        </h2>
        <p className="mb-5 mt-1 text-[14px] text-ink-mute">Facultatif : on t’appelle pour en parler.</p>
        <RappelForm objectif="Conseil personnalisé" contexte="Demande envoyée depuis /conseil (guide indisponible)." />
      </section>
    </div>
  )
}
