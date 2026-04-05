import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Target, Heart, Leaf, Users, Star, Package, Truck, Award, FlaskConical, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'A propos de Body Start',
  description: "Découvrez l'histoire et les valeurs de Body Start Nutrition.",
}

const values = [
  {
    Icon: Leaf,
    title: 'Transparence totale',
    desc: 'Chaque ingrédient, chaque dosage, chaque source est clairement indiqué sur nos produits. Rien de caché.',
  },
  {
    Icon: Heart,
    title: 'Formule pour vous',
    desc: "Nos produits sont adaptés à tous les profils sportifs, du débutant à l'athlète confirmé.",
  },
  {
    Icon: Users,
    title: 'Conseillers formés',
    desc: 'En boutique, notre équipe est formée pour vous guider vers les produits adaptés à votre objectif.',
  },
  {
    Icon: Target,
    title: 'Résultats prouvés',
    desc: "Nous ne vendons que des produits dont l'efficacité est soutenue par des études scientifiques.",
  },
]

const stats = [
  { value: '2 000+', label: 'Clients', Icon: Users },
  { value: '50+', label: 'Produits', Icon: Package },
  { value: '4.9/5', label: 'Note moyenne', Icon: Star },
  { value: '48h', label: 'Livraison', Icon: Truck },
]

const team = [
  { name: 'Fondateur & CEO', role: 'Vision & Stratégie', Icon: Award },
  { name: 'Expert Nutrition', role: 'Formulation produits', Icon: FlaskConical },
  { name: 'Conseiller', role: 'Suivi clients', Icon: Dumbbell },
]

export default function AboutPage() {
  return (
    <div className="bg-[#f4f6f1] min-h-screen">
      {/* Hero avec image */}
      <div className="relative bg-[#1a2e23] text-white py-28 md:py-36 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&q=80"
          alt="Salle de sport Body Start"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a2e23]/60 via-[#1a2e23]/50 to-[#1a2e23]" />
        <div className="relative container max-w-3xl text-center">
          <div className="flex justify-center mb-6">
            <span className="text-[#7cb98b] text-[11px] font-black uppercase tracking-widest block border-l-4 border-[#7cb98b] pl-3 text-left">
              Notre histoire
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl lg:text-[5rem] font-black uppercase tracking-tight mb-6 leading-none">
            La nutrition qui vous ressemble
          </h1>
          <p className="text-white/70 font-medium text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Body Start est née d&apos;une conviction simple : les sportifs méritent des compléments transparents, efficaces, sans faux marketing ni ingrédients inutiles.
          </p>
        </div>
      </div>

      <div className="container py-16 max-w-4xl">
        {/* Notre mission */}
        <section className="mb-20 text-center">
          <div className="w-16 h-16 bg-[#f4f6f1] border border-[#89a890]/30 rounded-[20px] flex items-center justify-center mx-auto mb-6">
            <Target className="w-8 h-8 text-[#4a5f4c]" />
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-[#1a2e23] mb-6">
            Notre mission
          </h2>
          <p className="text-[#4a5f4c] font-medium text-lg leading-relaxed max-w-2xl mx-auto">
            Rendre la nutrition sportive accessible, transparente et efficace. Chaque produit Body Start est sélectionné ou formulé avec des ingrédients tracés, aux dosages validés par la recherche scientifique.
          </p>
        </section>

        {/* Valeurs */}
        <section className="mb-24">
          <h2 className="font-display text-3xl font-black uppercase tracking-tight text-[#1a2e23] mb-10 text-center">
            Ce qui nous différencie
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className={cn(
                  'flex flex-col sm:flex-row gap-5 p-7 bg-white rounded-[20px]',
                  'border border-[#89a890]/20 hover:border-[#89a890]/50',
                  'shadow-sm hover:shadow-md transition-all duration-300'
                )}
              >
                <div className="w-12 h-12 bg-[#f4f6f1] rounded-[14px] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-[#4a5f4c]" />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tight text-xl text-[#1a2e23] mb-2">
                    {title}
                  </h3>
                  <p className="text-sm font-medium text-[#4a5f4c]/70 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Chiffres cles */}
        <section className="mb-24 bg-[#1a2e23] rounded-[24px] p-8 md:p-14 text-white">
          <h2 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight mb-10 text-center">
            Body Start en chiffres
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map(({ value, label, Icon }) => (
              <div key={label}>
                <div className="w-12 h-12 bg-white/10 rounded-[14px] flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-[#7cb98b]" />
                </div>
                <div className="font-display font-black text-3xl md:text-4xl text-white mb-2">
                  {value}
                </div>
                <div className="text-[#89a890] text-[10px] font-black uppercase tracking-widest">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Equipe */}
        <section className="mb-24 text-center">
          <h2 className="font-display text-3xl font-black uppercase tracking-tight text-[#1a2e23] mb-4">
            Une équipe passionnée
          </h2>
          <p className="text-[#4a5f4c]/70 font-medium max-w-xl mx-auto mb-10">
            Body Start est fondée par des sportifs, pour des sportifs. Notre équipe de conseillers formés en nutrition est disponible en boutique et par email.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {team.map(({ name, role, Icon }) => (
              <div
                key={name}
                className={cn(
                  'bg-white rounded-[20px] border border-[#89a890]/20 p-7 text-center',
                  'hover:-translate-y-1 hover:shadow-md hover:border-[#89a890]/40',
                  'shadow-sm transition-all duration-300'
                )}
              >
                <div className="w-16 h-16 bg-[#f4f6f1] rounded-[16px] flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-[#4a5f4c]" />
                </div>
                <p className="font-black uppercase tracking-tight text-[#1a2e23] text-sm">
                  {name}
                </p>
                <p className="text-[#89a890] text-[10px] font-black uppercase tracking-widest mt-1">
                  {role}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center bg-white rounded-[24px] p-12 border border-[#89a890]/20 shadow-sm">
          <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-[#1a2e23] mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-[#4a5f4c]/70 font-medium mb-8">
            Découvrez notre gamme ou venez en boutique pour un conseil personnalisé.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className={cn(
                'inline-flex items-center justify-center px-8 py-3.5 rounded-full',
                'bg-[#1a2e23] text-white font-bold text-sm',
                'hover:bg-[#4a5f4c] shadow-md hover:shadow-lg transition-all duration-300'
              )}
            >
              Voir nos produits
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              href="/stores"
              className={cn(
                'inline-flex items-center justify-center px-8 py-3.5 rounded-full',
                'bg-[#f4f6f1] text-[#1a2e23] font-bold text-sm border border-[#89a890]/30',
                'hover:bg-[#89a890]/10 shadow-md hover:shadow-lg transition-all duration-300'
              )}
            >
              Nos boutiques
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
