import type { Metadata } from 'next'
import { MapPin, Clock, Phone, Mail, ArrowRight, Truck, ShoppingBag, CheckCircle } from 'lucide-react'
import { BODY_START_STORES, COMING_SOON_STORES } from '@/lib/shopify/types'
import NotifyForm from '@/components/stores/NotifyForm'

export const metadata: Metadata = {
  title: 'Nos boutiques',
  description: 'Retrouvez Body Start Nutrition en boutique. Click & Collect disponible.',
}

const GOOGLE_MAPS_URL = 'https://www.google.com/maps/dir/?api=1&destination=8+Rue+du+Pont+des+Landes+78310+Coigni%C3%A8res'

export default function StoresPage() {
  const store = BODY_START_STORES[0]

  return (
    <div className="bg-[#f4f6f1] min-h-screen">
      {/* ─── Hero ─── */}
      <div className="pt-16 pb-12 md:pt-20 md:pb-16">
        <div className="container text-center max-w-3xl">
          <h1 className="font-display text-[45px] md:text-[65px] lg:text-[80px] font-black uppercase text-[#1a2e23] tracking-tighter leading-none mb-6">
            NOS BOUTIQUES
          </h1>
          <p className="text-[#4a5f4c] font-medium text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Nos conseillers sont à votre disposition pour vous aider à choisir les compléments adaptés à vos objectifs.
          </p>
        </div>
      </div>

      <div className="container pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">

          {/* ─── Boutique A — Active ─── */}
          <div className="bg-white rounded-[32px] overflow-hidden border border-[#1a2e23]/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
            {/* Google Maps Embed */}
            <div className="aspect-video bg-[#e8ede5] relative overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2635.3!2d1.9263!3d48.7508!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z!5e0!3m2!1sfr!2sfr!4v1"
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Body Start Nutrition - Coignières"
              />
              <div className="absolute inset-0 pointer-events-none border-b border-[#1a2e23]/5" />
            </div>
            
            <div className="p-8 md:p-10">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-[10px] font-bold uppercase tracking-widest text-green-700 mb-3">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Ouverte
                  </div>
                  <h2 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tighter text-[#1a2e23] leading-none">
                    {store.name}
                  </h2>
                </div>
              </div>

              {/* Infos de contact */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4 text-[13px] font-medium text-[#4a5f4c]">
                  <div className="w-10 h-10 rounded-2xl bg-[#1a2e23]/5 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[#1a2e23]" />
                  </div>
                  <div className="pt-2">
                    <span>{store.address}</span><br />
                    <span className="font-bold text-[#1a2e23]">{store.city}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[13px] font-medium text-[#4a5f4c]">
                  <div className="w-10 h-10 rounded-2xl bg-[#1a2e23]/5 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-[#1a2e23]" />
                  </div>
                  <a href={`tel:${store.phone.replace(/\s/g, '')}`} className="pt-0.5 hover:text-[#1a2e23] transition-colors">
                    {store.phone}
                  </a>
                </div>
                <div className="flex items-center gap-4 text-[13px] font-medium text-[#4a5f4c]">
                  <div className="w-10 h-10 rounded-2xl bg-[#1a2e23]/5 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-[#1a2e23]" />
                  </div>
                  <a href="mailto:contact@bodystart.fr" className="pt-0.5 hover:text-[#1a2e23] transition-colors">
                    contact@bodystart.fr
                  </a>
                </div>
              </div>

              {/* Horaires */}
              <div className="bg-[#f4f6f1] rounded-[20px] p-6 mb-8">
                <p className="flex items-center gap-2 font-display font-black uppercase tracking-tight text-[12px] text-[#1a2e23] mb-4">
                  <Clock className="w-4 h-4 text-[#89a890]" /> Horaires d&apos;ouverture
                </p>
                <div className="space-y-3">
                  {store.hours.map((h, i) => (
                    <div key={i} className="flex justify-between text-[13px] font-medium">
                      <span className="text-[#4a5f4c]">{h.day}</span>
                      <span className={h.open === 'Fermé' ? 'text-[#89a890]' : 'text-[#1a2e23] font-bold'}>
                        {h.open === 'Fermé' ? 'Fermé' : `${h.open} – ${h.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Services */}
              <div className="flex gap-3 flex-wrap mb-8">
                {[
                  { icon: ShoppingBag, label: 'Vente sur place' },
                  { icon: Truck, label: 'Click & Collect' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-[#1a2e23]/5 text-[#1a2e23] px-4 py-2 rounded-full">
                    <Icon className="w-4 h-4" /> {label}
                  </span>
                ))}
              </div>

              {/* Bouton itinéraire */}
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-4 bg-[#1a2e23] text-white rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-[#2e4f3c] transition-all shadow-lg hover:shadow-xl"
              >
                Voir l&apos;itinéraire <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* ─── Boutique B — Coming Soon ─── */}
          {COMING_SOON_STORES.map((cs) => (
            <div key={cs.id} className="bg-white/50 backdrop-blur-sm rounded-[32px] overflow-hidden border border-dashed border-[#1a2e23]/15 flex flex-col">
              {/* Placeholder visuel */}
              <div className="aspect-video bg-[#1a2e23]/[0.03] flex flex-col items-center justify-center gap-4 border-b border-dashed border-[#1a2e23]/10">
                <div className="w-20 h-20 bg-[#1a2e23]/5 rounded-full flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-[#89a890]" />
                </div>
                <span className="text-[10px] text-[#89a890] font-bold uppercase tracking-widest">Photo à venir</span>
              </div>
              <div className="p-8 md:p-10 flex flex-col flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1a2e23]/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-3">
                      <span className="w-1.5 h-1.5 bg-[#89a890] rounded-full animate-pulse" />
                      {cs.openingDate}
                    </div>
                    <h2 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tighter text-[#1a2e23]/40 leading-none">
                      {cs.name}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[13px] font-medium text-[#89a890] mb-8">
                  <MapPin className="w-5 h-5 flex-shrink-0" />
                  <span>{cs.city}</span>
                </div>

                <div className="mt-auto">
                  <NotifyForm />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Click & Collect Explainer ─── */}
        <div className="max-w-5xl mx-auto mt-20 bg-[#1a2e23] rounded-[32px] p-10 md:p-14 overflow-hidden relative">
          {/* Background grid */}
          <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#4a5f4c 1px, transparent 1px), linear-gradient(90deg, #4a5f4c 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          <div className="relative z-10">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-white mb-6 border border-white/10">
                <Truck className="w-4 h-4" />
                Gratuit
              </div>
              <h2 className="font-display font-black uppercase tracking-tighter text-3xl md:text-[42px] text-white leading-none">
                COMMENT FONCTIONNE<br />LE CLICK & COLLECT ?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: '01', title: 'Commandez en ligne', desc: 'Ajoutez vos produits au panier et choisissez "Click & Collect" au checkout.' },
                { step: '02', title: 'Prêt sous 2h', desc: 'Vous recevez un email de confirmation quand votre commande est prête en boutique.' },
                { step: '03', title: 'Retirez gratuitement', desc: "Présentez simplement votre email de confirmation en boutique. C'est gratuit !" },
              ].map(({ step, title, desc }) => (
                <div key={step} className="text-center md:text-left">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 border border-white/10 text-white font-display font-black text-xl mb-5">
                    {step}
                  </div>
                  <p className="font-display font-black uppercase tracking-tight text-white text-lg mb-2">{title}</p>
                  <p className="text-white/60 text-sm font-medium leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Réassurance Services ─── */}
        <div className="max-w-5xl mx-auto mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: CheckCircle, title: 'Conseil personnalisé', desc: 'Nos experts sont formés pour vous orienter selon vos objectifs.' },
            { icon: ShoppingBag, title: 'Large gamme en boutique', desc: 'Retrouvez toute notre sélection de compléments directement en magasin.' },
            { icon: Truck, title: 'Retrait rapide', desc: 'Commande en ligne, prête en 2h, retrait gratuit.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-[24px] p-8 border border-[#1a2e23]/5 text-center">
              <div className="w-14 h-14 rounded-full bg-[#1a2e23]/5 flex items-center justify-center mx-auto mb-5">
                <Icon className="w-6 h-6 text-[#1a2e23]" />
              </div>
              <h3 className="font-display font-black uppercase tracking-tight text-[#1a2e23] text-sm mb-2">{title}</h3>
              <p className="text-[#4a5f4c] text-[13px] font-medium leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
