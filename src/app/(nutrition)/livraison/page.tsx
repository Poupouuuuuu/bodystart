import type { Metadata } from 'next'
import { Truck, Store, Package, RotateCcw } from 'lucide-react'

export const metadata: Metadata = { title: 'Livraison & Retours' }

const shippingMethods = [
  {
    Icon: Truck,
    name: 'Colissimo à domicile',
    delay: '2 à 4 jours ouvrés',
    price: 'Gratuit dès 60€ / Sinon 5,90€',
    details: 'Livraison à domicile avec suivi. Un numéro de suivi vous est envoyé par email.',
  },
  {
    Icon: Package,
    name: 'Mondial Relay',
    delay: '3 à 5 jours ouvrés',
    price: 'Gratuit dès 60€ / Sinon 3,90€',
    details: 'Retrait dans le point relais de votre choix. Pratique et économique.',
  },
  {
    Icon: Store,
    name: 'Click & Collect',
    delay: 'Disponible sous 2h',
    price: 'Gratuit',
    details: 'Retirez votre commande en boutique. Présentez simplement votre email de confirmation.',
  },
]

export default function LivraisonPage() {
  return (
    <>
      {/* Hero */}
      <div className="bg-gray-950 text-white py-20 border-b-4 border-gray-900 mb-0">
        <div className="container text-center max-w-4xl">
          <div className="flex justify-center mb-6">
            <span className="text-brand-500 text-[10px] font-black uppercase tracking-widest block border-l-4 border-brand-500 pl-3 text-left">Expédition & Retours</span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-black uppercase tracking-tighter mb-6 leading-none">Livraison & Retours</h1>
          <p className="text-gray-300 font-medium text-lg md:text-xl max-w-2xl mx-auto">Livraison rapide partout en France. Retours faciles sous 14 jours.</p>
          <div className="flex flex-wrap justify-center gap-10 mt-12 bg-gray-900 border-2 border-gray-800 rounded-sm p-6 max-w-3xl mx-auto">
            {[
              { icon: '🚚', label: 'Colissimo', sub: '2-4 jours' },
              { icon: '📦', label: 'Mondial Relay', sub: '3-5 jours' },
              { icon: '🏪', label: 'Click & Collect', sub: 'Sous 2h' },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="text-center">
                <div className="text-4xl mb-3">{icon}</div>
                <p className="font-black uppercase tracking-tight text-sm mb-1">{label}</p>
                <p className="text-[10px] text-brand-500 font-black uppercase tracking-widest">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-16 md:py-24 max-w-4xl">
        <h2 className="font-display text-3xl font-black uppercase tracking-tight text-gray-900 mb-5 sr-only">Livraison & Retours</h2>

        {/* Modes de livraison */}
        <section className="mb-20">
          <h2 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900 mb-8">Modes de livraison</h2>
          <div className="space-y-6">
            {shippingMethods.map(({ Icon, name, delay, price, details }) => (
              <div key={name} className="bg-white rounded-sm border-2 border-gray-200 shadow-[4px_4px_0_theme(colors.gray.200)] hover:-translate-y-1 hover:border-gray-900 hover:shadow-[8px_8px_0_theme(colors.gray.900)] p-6 md:p-8 flex gap-6 transition-all">
                <div className="w-12 h-12 bg-white border-2 border-brand-200 rounded-sm flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-brand-700" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                    <h3 className="font-black uppercase tracking-tight text-xl text-gray-900">{name}</h3>
                    <span className="text-[10px] bg-brand-50 border-2 border-brand-200 px-3 py-1 uppercase tracking-widest rounded-sm text-brand-700 font-black">{price}</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 block">⏱ {delay}</p>
                  <p className="text-gray-700 font-medium text-base">{details}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Retours */}
        <section className="mb-16">
          <h2 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900 mb-8 flex items-center gap-3">
            <RotateCcw className="w-8 h-8 text-brand-700" /> Politique de retour
          </h2>
          <div className="bg-white rounded-sm border-2 border-gray-900 shadow-[8px_8px_0_theme(colors.gray.900)] p-8 md:p-10 space-y-4 text-base text-gray-700 font-medium leading-relaxed">
            <p>✅ <strong className="font-black text-gray-900">14 JOURS</strong> pour changer d&apos;avis — droit de rétractation légal</p>
            <p>📦 Les produits doivent être <strong className="font-black text-gray-900">non ouverts et dans leur emballage d&apos;origine</strong></p>
            <p>📧 Pour initier un retour, contactez-nous à <a href="mailto:contact@bodystart.fr" className="text-[10px] font-black uppercase tracking-widest text-brand-700 hover:text-gray-900 hover:underline underline-offset-4 ml-1">contact@bodystart.fr</a></p>
            <p>💶 Le remboursement est effectué sous <strong className="font-black text-gray-900">14 JOURS</strong> après réception du retour</p>
            <p>🚚 Les frais de retour sont à la charge du client, sauf produit défectueux</p>
          </div>
        </section>

        <section className="border-t-4 border-gray-900 pt-16">
          <h2 className="font-display text-2xl font-black uppercase tracking-tight text-gray-900 mb-4">Une question ?</h2>
          <p className="text-gray-700 font-medium text-lg">
            Notre équipe est disponible du lundi au samedi.{' '}
            <a href="mailto:contact@bodystart.fr" className="text-[10px] font-black uppercase tracking-widest text-brand-700 hover:text-gray-900 hover:underline underline-offset-4 ml-2">contact@bodystart.fr</a>
          </p>
        </section>
      </div>
    </>
  )
}
