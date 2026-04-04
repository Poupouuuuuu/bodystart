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
    <div className="bg-[#f4f6f1] min-h-screen">
      {/* Hero */}
      <div className="bg-[#1a2e23] text-white pt-24 pb-20 relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#f4f6f1 1px, transparent 1px), linear-gradient(90deg, #f4f6f1 1px, transparent 1px)', backgroundSize: '64px 64px' }}></div>
        
        <div className="container text-center max-w-4xl relative z-10">
          <div className="flex justify-center mb-6">
            <span className="bg-white/10 border border-white/20 text-white rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
              Expédition & Retours
            </span>
          </div>
          <h1 className="font-display text-[45px] md:text-[70px] font-black uppercase tracking-tighter mb-6 leading-none">
            Livraison & Retours
          </h1>
          <p className="text-[#89a890] font-medium text-lg md:text-xl max-w-2xl mx-auto">
            Livraison rapide partout en France. Retours faciles sous 14 jours.
          </p>
          
          <div className="flex flex-wrap justify-center gap-10 mt-14 bg-white/5 border border-white/10 rounded-[32px] p-8 max-w-3xl mx-auto backdrop-blur-md">
            {[
              { icon: '🚚', label: 'Colissimo', sub: '2-4 jours' },
              { icon: '📦', label: 'Mondial Relay', sub: '3-5 jours' },
              { icon: '🏪', label: 'Click & Collect', sub: 'Sous 2h' },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="text-center px-4">
                <div className="text-4xl mb-4 opacity-90">{icon}</div>
                <p className="font-display font-black uppercase tracking-tight text-sm mb-1">{label}</p>
                <p className="text-[10px] text-[#89a890] font-bold uppercase tracking-widest">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-20 max-w-4xl">
        <h2 className="sr-only">Livraison & Retours détail</h2>

        {/* Modes de livraison */}
        <section className="mb-24">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="font-display text-[30px] md:text-[40px] font-black uppercase tracking-tighter text-[#1a2e23] leading-none">Modes de livraison</h2>
            <div className="h-[2px] flex-1 bg-[#1a2e23]/10 mt-2"></div>
          </div>
          <div className="space-y-6">
            {shippingMethods.map(({ Icon, name, delay, price, details }) => (
              <div key={name} className="bg-white rounded-[28px] border border-[#1a2e23]/5 shadow-sm p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-[#f4f6f1] rounded-[20px] flex items-center justify-center flex-shrink-0 text-[#1a2e23]">
                  <Icon className="w-8 h-8" />
                </div>
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                    <h3 className="font-display font-black uppercase tracking-tight text-xl text-[#1a2e23]">{name}</h3>
                    <span className="text-[10px] bg-[#1a2e23]/5 border border-[#1a2e23]/10 px-3 py-1.5 uppercase tracking-widest rounded-full text-[#1a2e23] font-bold shrink-0">
                      {price}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#89a890] mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#89a890]"></span> {delay}
                  </p>
                  <p className="text-[#4a5f4c] font-medium text-[15px] leading-relaxed">{details}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Retours */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-[2px] flex-1 bg-[#1a2e23]/10 mt-2"></div>
            <h2 className="font-display text-[30px] md:text-[40px] font-black uppercase tracking-tighter text-[#1a2e23] leading-none flex items-center gap-3">
              Politique de retour
            </h2>
          </div>
          <div className="bg-white rounded-[32px] border border-[#1a2e23]/5 shadow-sm p-10 space-y-6 text-[#4a5f4c] font-medium leading-relaxed relative overflow-hidden">
            {/* Soft decorative background circle */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#f4f6f1] rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-6 h-6 rounded-full bg-[#1a2e23] text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</div>
              <p><strong className="font-black text-[#1a2e23] uppercase tracking-tight">14 jours</strong> pour changer d&apos;avis — droit de rétractation légal.</p>
            </div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-6 h-6 rounded-full bg-[#1a2e23] text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</div>
              <p>Les produits doivent être <strong className="font-black text-[#1a2e23]">non ouverts et dans leur emballage d&apos;origine</strong> pour garantir leur intégrité.</p>
            </div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-6 h-6 rounded-full bg-[#1a2e23] text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</div>
              <p>Pour initier un retour, contactez-nous à <a href="mailto:contact@bodystart.fr" className="text-[11px] font-bold uppercase tracking-widest text-[#1a2e23] hover:underline underline-offset-4 ml-1">contact@bodystart.fr</a> avec votre numéro de commande.</p>
            </div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-6 h-6 rounded-full bg-[#1a2e23] text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">4</div>
              <p>Le remboursement est effectué sous <strong className="font-black text-[#1a2e23]">14 jours</strong> après réception et validation du retour dans nos locaux.</p>
            </div>
          </div>
        </section>

        {/* Contact Footer */}
        <section className="bg-[#f4f6f1] rounded-[32px] border border-[#1a2e23]/10 p-10 text-center">
          <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1a2e23] mb-4">Une question ?</h2>
          <p className="text-[#4a5f4c] font-medium">
            Notre équipe est disponible du lundi au samedi.
            <br />
            <a href="mailto:contact@bodystart.fr" className="inline-block mt-4 text-[12px] font-bold uppercase tracking-widest text-white bg-[#1a2e23] px-6 py-3 rounded-full hover:bg-[#2e4f3c] transition-colors">
              contact@bodystart.fr
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
