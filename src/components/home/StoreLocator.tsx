import { MapPin, Clock, Phone, ArrowRight, Bell } from 'lucide-react'
import Link from 'next/link'
import { BODY_START_STORES, COMING_SOON_STORES } from '@/lib/shopify/types'

export default function StoreLocator() {
  const store = BODY_START_STORES[0]

  return (
    <section className="section bg-white py-24">
      <div className="container">
        {/* En-tête */}
        <div className="text-center mb-12">
          <span className="text-brand-700 text-xs font-black uppercase tracking-widest border-l-4 border-brand-500 pl-3">
            Click & Collect
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-[2.5rem] font-black uppercase tracking-tight text-gray-900 mt-2 mb-3">
            Retirez en boutique
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto font-medium">
            Commandez en ligne et récupérez vos produits en boutique sous 2h. Gratuit, sans frais de livraison.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Boutique active */}
          <div className="bg-gray-900 border-2 border-brand-700 shadow-[8px_8px_0_theme(colors.brand.900)] rounded-sm p-6 text-white transition-transform hover:-translate-y-1 duration-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-brand-700 border-2 border-brand-500 shadow-[4px_4px_0_theme(colors.brand.900)] rounded-sm flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-900 border-2 border-brand-700 rounded-sm text-[9px] font-black uppercase tracking-widest text-brand-300 mb-2 shadow-[2px_2px_0_theme(colors.brand.900)]">
                  <span className="w-1.5 h-1.5 bg-brand-500 rounded-sm" />
                  Boutique ouverte
                </div>
                <h3 className="font-display font-black uppercase text-xl mt-1">{store.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{store.address}</p>
                <p className="text-gray-400 text-sm">{store.city}</p>
              </div>
            </div>

            <div className="space-y-2 mb-6 border-t border-gray-800 pt-5">
              {store.hours.map((h, i) => (
                <div key={i} className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-3.5 h-3.5 text-brand-700" />
                    {h.day}
                  </span>
                  <span className={h.open === 'Fermé' ? 'text-gray-600' : 'text-gray-300'}>
                    {h.open === 'Fermé' ? 'Fermé' : `${h.open} – ${h.close}`}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-gray-400 font-bold text-sm pt-5 border-t border-gray-800">
              <Phone className="w-4 h-4 text-brand-700" />
              {store.phone}
            </div>
          </div>

          {/* Boutique B — Coming soon */}
          {COMING_SOON_STORES.map((cs) => (
            <div key={cs.id} className="bg-gray-950 border-2 border-gray-800 rounded-sm p-6 text-white flex flex-col justify-between shadow-[8px_8px_0_theme(colors.gray.900)] hover:border-brand-900 transition-colors">
              <div>
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 bg-gray-900 border-2 border-gray-800 rounded-sm flex items-center justify-center flex-shrink-0 shadow-[4px_4px_0_theme(colors.gray.900)]">
                    <MapPin className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-900/50 border-2 border-brand-900 rounded-sm text-[9px] font-black uppercase tracking-widest text-brand-500 mb-2 shadow-[2px_2px_0_theme(colors.gray.900)]">
                      <span className="w-1.5 h-1.5 bg-brand-500 rounded-sm animate-pulse" />
                      {cs.openingDate}
                    </div>
                    <h3 className="font-display font-black uppercase text-xl mt-1 text-gray-500">{cs.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{cs.city}</p>
                  </div>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed font-medium">
                  Notre deuxième boutique ouvre prochainement. Soyez informé en avant-première de l'ouverture et bénéficiez d'une offre exclusive.
                </p>
              </div>
              <Link
                href="/stores#newsletter-boutique-b"
                className="mt-6 inline-flex items-center justify-center gap-2 w-full py-3.5 bg-gray-900 border-2 border-gray-700 shadow-[4px_4px_0_theme(colors.gray.900)] rounded-sm text-xs uppercase tracking-widest font-black text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-600 transition-all active:translate-y-1 active:shadow-none"
              >
                <Bell className="w-4 h-4" />
                Me prévenir à l'ouverture
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/stores" className="inline-flex items-center gap-2 text-brand-500 hover:text-brand-400 text-xs font-black uppercase tracking-widest transition-colors">
            En savoir plus sur le Click & Collect
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
