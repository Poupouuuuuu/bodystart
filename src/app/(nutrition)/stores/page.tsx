import type { Metadata } from 'next'
import { MapPin, Clock, Phone, Mail, Store, Truck, ShoppingBag } from 'lucide-react'
import { BODY_START_STORES, COMING_SOON_STORES } from '@/lib/shopify/types'
import Link from 'next/link'
import NotifyForm from '@/components/stores/NotifyForm'

export const metadata: Metadata = {
  title: 'Nos boutiques',
  description: 'Retrouvez Body Start Nutrition en boutique. Click & Collect disponible.',
}

export default function StoresPage() {
  const store = BODY_START_STORES[0]

  return (
    <div>
      {/* Hero */}
      <div className="bg-gray-950 text-white py-20 md:py-24 border-b-4 border-gray-900">
        <div className="container text-center max-w-3xl">
          <div className="flex justify-center mb-6">
            <span className="text-brand-500 text-[10px] font-black uppercase tracking-widest block border-l-4 border-brand-500 pl-3 text-left">Nos points de vente</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 leading-none">Venez nous rendre visite</h1>
          <p className="text-gray-300 font-medium text-lg md:text-xl max-w-xl mx-auto">
            Nos conseillers sont à votre disposition pour vous aider à choisir les compléments adaptés à vos objectifs.
          </p>
        </div>
      </div>

      <div className="container py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">

          {/* Boutique A - active */}
          <div className="bg-white rounded-sm border-2 border-gray-200 shadow-[4px_4px_0_theme(colors.gray.200)] overflow-hidden hover:border-gray-900 hover:shadow-[8px_8px_0_theme(colors.gray.900)] hover:-translate-y-1 transition-all">
            {/* Placeholder image boutique */}
            <div className="aspect-video bg-gray-100 border-b-2 border-gray-200 flex items-center justify-center">
              <Store className="w-16 h-16 text-gray-300" />
            </div>
            <div className="p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-2">
                <h2 className="font-display font-black text-2xl uppercase tracking-tight text-gray-900 leading-none">{store.name}</h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 border-2 border-brand-200 text-brand-700 text-[10px] uppercase font-black tracking-widest rounded-sm">
                  <span className="w-2 h-2 bg-brand-500 rounded-sm" />
                  Ouvert
                </span>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3 font-medium text-sm text-gray-600">
                  <MapPin className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                  <span>{store.address}<br />{store.city}</span>
                </div>
                <div className="flex items-center gap-3 font-medium text-sm text-gray-600">
                  <Phone className="w-5 h-5 text-gray-900 flex-shrink-0" />
                  <span>{store.phone}</span>
                </div>
                <div className="flex items-center gap-3 font-medium text-sm text-gray-600">
                  <Mail className="w-5 h-5 text-gray-900 flex-shrink-0" />
                  <span>contact@bodystart.com</span>
                </div>
              </div>

              {/* Horaires */}
              <div className="bg-gray-50 border-2 border-gray-200 rounded-sm p-6 mb-8">
                <p className="flex items-center gap-2 font-black uppercase tracking-tight text-sm text-gray-900 mb-4">
                  <Clock className="w-5 h-5 text-brand-600" /> Horaires d&apos;ouverture
                </p>
                <div className="space-y-2.5 font-medium">
                  {store.hours.map((h, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{h.day}</span>
                      <span className={`font-black ${h.open === 'Fermé' ? 'text-brand-600' : 'text-gray-900'}`}>
                        {h.open === 'Fermé' ? 'Fermé' : `${h.open} – ${h.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Services */}
              <div className="flex gap-3 flex-wrap">
                {[
                  { icon: ShoppingBag, label: 'Vente sur place' },
                  { icon: Truck, label: 'Click & Collect' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-brand-50 text-brand-700 border-2 border-brand-200 px-3 py-1.5 rounded-sm">
                    <Icon className="w-4 h-4" /> {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Boutique B - coming soon */}
          {COMING_SOON_STORES.map((cs) => (
            <div key={cs.id} className="bg-white rounded-sm border-2 border-dashed border-gray-200 overflow-hidden shadow-[4px_4px_0_theme(colors.transparent)]">
              <div className="aspect-video bg-gray-50 border-b-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 bg-gray-100 border-2 border-gray-200 rounded-sm flex items-center justify-center">
                  <Store className="w-8 h-8 text-gray-300" />
                </div>
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Photo à venir</span>
              </div>
              <div className="p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-2">
                  <h2 className="font-display font-black text-2xl uppercase tracking-tight text-gray-400 leading-none">{cs.name}</h2>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 border-2 border-transparent text-[10px] uppercase font-black tracking-widest rounded-sm">
                    <span className="w-2 h-2 bg-gray-400 rounded-sm animate-pulse" />
                    {cs.openingDate}
                  </span>
                </div>

                <div className="flex items-center gap-3 font-medium text-sm text-gray-400 mb-8">
                  <MapPin className="w-5 h-5 flex-shrink-0" />
                  <span>{cs.city}</span>
                </div>

                <NotifyForm />
              </div>
            </div>
          ))}
        </div>

        {/* Click & Collect info */}
        <div className="max-w-4xl mx-auto mt-20 bg-white rounded-sm border-2 border-gray-900 shadow-[8px_8px_0_theme(colors.gray.900)] p-8 md:p-12">
          <h2 className="font-display font-black uppercase tracking-tight text-2xl md:text-3xl text-gray-900 mb-8 flex items-center gap-3 leading-none">
            <Truck className="w-8 h-8 text-brand-700 hidden sm:block" />
            Comment fonctionne le Click &amp; Collect ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Commandez en ligne', desc: 'Ajoutez vos produits au panier et choisissez "Click & Collect" au checkout.' },
              { step: '2', title: 'Prêt sous 2h', desc: 'Vous recevez un email de confirmation quand votre commande est prête en boutique.' },
              { step: '3', title: 'Retirez gratuitement', desc: "Présentez simplement votre email de confirmation en boutique. C'est gratuit !" },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <div className="w-10 h-10 bg-gray-900 text-white rounded-sm flex items-center justify-center font-black text-lg flex-shrink-0 shadow-[2px_2px_0_theme(colors.brand.500)]">
                  {step}
                </div>
                <div>
                  <p className="font-black uppercase tracking-tight text-gray-900 mb-2 leading-tight">{title}</p>
                  <p className="text-sm font-medium text-gray-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
