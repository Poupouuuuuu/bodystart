import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Target, Heart, Leaf, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'À propos de Body Start',
  description: "Découvrez l'histoire et les valeurs de Body Start Nutrition.",
}

export default function AboutPage() {
  return (
    <div>
      {/* Hero avec image */}
      <div className="relative bg-gray-950 text-white py-24 md:py-32 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&q=80"
          alt="Salle de sport Body Start"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/60 via-gray-950/50 to-gray-950" />
        <div className="relative container max-w-3xl text-center">
          <div className="flex justify-center mb-6">
            <span className="text-brand-500 text-[10px] font-black uppercase tracking-widest block border-l-4 border-brand-500 pl-3 text-left">Notre histoire</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl lg:text-[5rem] font-black uppercase tracking-tighter mb-6 leading-none">
            La nutrition qui vous ressemble
          </h1>
          <p className="text-gray-300 font-medium text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Body Start est née d&apos;une conviction simple : les sportifs méritent des compléments transparents, efficaces, sans faux marketing ni ingrédients inutiles.
          </p>
        </div>
      </div>

      <div className="container py-14 max-w-4xl">
        {/* Notre mission */}
        <section className="mb-20 text-center">
          <div className="w-16 h-16 bg-brand-50 border-2 border-brand-200 rounded-sm flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0_theme(colors.brand.200)]">
            <Target className="w-8 h-8 text-brand-700" />
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 mb-6">Notre mission</h2>
          <p className="text-gray-600 font-medium text-lg leading-relaxed max-w-2xl mx-auto">
            Rendre la nutrition sportive accessible, transparente et efficace. Chaque produit Body Start est sélectionné ou formulé avec des ingrédients tracés, aux dosages validés par la recherche scientifique.
          </p>
        </section>

        {/* Valeurs */}
        <section className="mb-24">
          <h2 className="font-display text-3xl font-black uppercase tracking-tight text-gray-900 mb-10 text-center">Ce qui nous différencie</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { Icon: Leaf, title: 'Transparence totale', desc: 'Chaque ingrédient, chaque dosage, chaque source est clairement indiqué sur nos produits. Rien de caché.' },
              { Icon: Heart, title: 'Formulé pour vous', desc: "Nos produits sont adaptés à tous les profils sportifs, du débutant à l'athlète confirmé." },
              { Icon: Users, title: 'Conseillers formés', desc: 'En boutique, notre équipe est formée pour vous guider vers les produits adaptés à votre objectif.' },
              { Icon: Target, title: 'Résultats prouvés', desc: "Nous ne vendons que des produits dont l'efficacité est soutenue par des études scientifiques." },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="flex flex-col sm:flex-row gap-5 p-6 bg-white rounded-sm border-2 border-gray-100 hover:border-gray-900 transition-all duration-300 shadow-[4px_4px_0_theme(colors.gray.100)] hover:shadow-[8px_8px_0_theme(colors.gray.900)]">
                <div className="w-12 h-12 bg-brand-50 border-2 border-brand-200 rounded-sm flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-brand-700" />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tight text-xl text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm font-medium text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Chiffres clés */}
        <section className="mb-24 bg-gray-950 rounded-sm border-4 border-gray-900 p-8 md:p-14 text-white shadow-[12px_12px_0_theme(colors.brand.700)] relative">
          <h2 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight mb-10 text-center">Body Start en chiffres</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
            {[
              { value: '2 000+', label: 'Clients', icon: '👥' },
              { value: '50+', label: 'Produits', icon: '🧴' },
              { value: '4.9/5', label: 'Note moyenne', icon: '⭐' },
              { value: '48h', label: 'Livraison', icon: '🚚' },
            ].map(({ value, label, icon }) => (
              <div key={label}>
                <div className="text-4xl mb-4">{icon}</div>
                <div className="font-display font-black text-3xl md:text-4xl text-white mb-2">{value}</div>
                <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Équipe */}
        <section className="mb-24 text-center">
          <h2 className="font-display text-3xl font-black uppercase tracking-tight text-gray-900 mb-4">Une équipe passionnée</h2>
          <p className="text-gray-500 font-medium max-w-xl mx-auto mb-10">
            Body Start est fondée par des sportifs, pour des sportifs. Notre équipe de conseillers formés en nutrition est disponible en boutique et par email.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { name: 'Fondateur & CEO', role: 'Vision & Stratégie', emoji: '🏆' },
              { name: 'Expert Nutrition', role: 'Formulation produits', emoji: '🔬' },
              { name: 'Conseiller', role: 'Suivi clients', emoji: '💪' },
            ].map(({ name, role, emoji }) => (
              <div key={name} className="bg-white border-2 border-gray-200 shadow-[4px_4px_0_theme(colors.gray.200)] rounded-sm p-6 text-center hover:-translate-y-1 hover:border-brand-500 hover:shadow-[4px_4px_0_theme(colors.brand.500)] transition-all">
                <div className="w-16 h-16 bg-gray-50 border-2 border-gray-100 rounded-sm flex items-center justify-center text-3xl mx-auto mb-4">{emoji}</div>
                <p className="font-black uppercase tracking-tight text-gray-900 text-sm">{name}</p>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">{role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center bg-white rounded-sm p-12 border-2 border-gray-900 shadow-[8px_8px_0_theme(colors.gray.900)]">
          <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 mb-4">Prêt à commencer ?</h2>
          <p className="text-gray-500 font-medium mb-8">Découvrez notre gamme ou venez en boutique pour un conseil personnalisé.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products" className="btn-primary">
              Voir nos produits <ArrowRight className="w-4 h-4 ml-2 inline-block" />
            </Link>
            <Link href="/stores" className="btn-secondary">
              Nos boutiques
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
