import Image from 'next/image'
import { FlaskConical, Leaf, Award, MapPin } from 'lucide-react'

const VALUES = [
  {
    Icon: FlaskConical,
    title: 'Formules scientifiques',
    description: 'Dosé avec précision sur la base des dernières études cliniques. Pas de remplissage, que de l\'efficace.',
  },
  {
    Icon: Leaf,
    title: 'Ingrédients tracés',
    description: 'Origine, process, certification. Nous savons exactement ce qu\'il y a dans chaque produit.',
  },
  {
    Icon: Award,
    title: 'Qualité premium',
    description: 'Pas de compromis. Nos standards vont au-delà des exigences réglementaires européennes.',
  },
  {
    Icon: MapPin,
    title: 'Conseillers en boutique',
    description: 'Des conseillers formés pour vous aider à choisir le bon programme nutritionnel.',
  },
]

export default function BrandValues() {
  return (
    <section className="section bg-white overflow-hidden">
      <div className="container">

        {/* Layout 2 colonnes : image + contenu */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">

          {/* Image */}
          <div className="relative rounded-sm overflow-hidden aspect-[4/3] border-2 border-gray-900 shadow-[8px_8px_0_theme(colors.gray.900)]">
            <Image
              src="/assets/images/hero-product.jpg"
              alt="Compléments alimentaires Body Start"
              fill
              className="object-cover grayscale-[20%] contrast-125 saturate-50"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-900/40 to-transparent" />
            {/* Badge flottant */}
            <div className="absolute bottom-6 left-6 right-6 bg-white border-2 border-gray-900 rounded-sm p-4 shadow-[4px_4px_0_theme(colors.gray.900)]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-700 rounded-sm flex items-center justify-center flex-shrink-0">
                  <FlaskConical className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-black uppercase tracking-tight text-gray-900 text-sm">Formules validées</p>
                  <p className="text-brand-700 text-xs font-bold uppercase tracking-widest mt-0.5">Dosages cliniquement prouvés</p>
                </div>
              </div>
            </div>
          </div>

          {/* Texte */}
          <div>
            <span className="text-brand-700 text-sm font-black uppercase tracking-widest border-l-4 border-brand-500 pl-3">Notre engagement</span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-[2.5rem] font-black uppercase tracking-tight text-gray-900 mt-2 mb-4">
              Pourquoi Body Start ?
            </h2>
            <p className="text-gray-500 text-lg font-medium leading-relaxed mb-8">
              Nous fabriquons des compléments comme nous voudrions en consommer : avec transparence, sans bullshit marketing et une efficacité réelle prouvée.
            </p>

            <div className="space-y-4">
              {VALUES.map(({ Icon, title, description }) => (
                <div key={title} className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-gray-900 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[2px_2px_0_theme(colors.brand.700)]">
                    <Icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-black uppercase tracking-tight text-gray-900 mb-1">{title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed font-medium">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-brand-900 border-2 border-brand-700 rounded-sm p-8 shadow-[8px_8px_0_theme(colors.gray.900)]">
          {[
            { value: '100%', label: 'INGRÉDIENTS TRACÉS' },
            { value: '+2000', label: 'SPORTIFS SATISFAITS' },
            { value: '4.9/5', label: 'NOTE MOYENNE' },
            { value: '48H', label: 'LIVRAISON EXPRESS' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center relative">
              <div className="font-display font-black text-4xl text-white mb-2 tracking-tighter">{value}</div>
              <div className="text-brand-300 text-[10px] uppercase font-bold tracking-widest">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
