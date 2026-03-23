import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Store, CheckCircle2, Star } from 'lucide-react'

const TRUST_BADGES = [
  'Sans additifs cachés',
  'Dosages cliniques',
  'Livraison Colissimo',
]

export default function HeroSection() {
  return (
    <section className="relative bg-white overflow-hidden min-h-[90vh] flex items-center">

      {/* ─── Fond décoratif ─── */}
      <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-bl from-brand-50 to-white hidden lg:block" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-100 rounded-full blur-[120px] opacity-40 translate-x-1/3 -translate-y-1/4 hidden lg:block pointer-events-none" />

      <div className="relative container w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-16 lg:py-24">

          {/* ─── Colonne gauche : texte ─── */}
          <div className="relative z-10">

            {/* Label pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-brand-900 border-2 border-brand-700 rounded-sm text-xs font-bold tracking-widest uppercase text-white mb-7">
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-sm animate-pulse" />
              Nutrition sportive premium
            </div>

            {/* Titre */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-[4rem] font-black uppercase tracking-tighter leading-[1.05] text-gray-900 mb-5">
              Des compléments
              <br />
              qui font la{' '}
              <span className="relative inline-block text-brand-700">
                différence
                <svg
                  className="absolute -bottom-1.5 left-0 w-full"
                  viewBox="0 0 260 7"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M2 5.5 Q65 1.5 130 4.5 Q195 7 258 2.5"
                    stroke="#4b7a22"
                    strokeWidth="4"
                    strokeLinecap="square"
                  />
                </svg>
              </span>
            </h1>

            {/* Sous-titre */}
            <p className="text-gray-500 text-lg leading-relaxed mb-7 max-w-md">
              Formules scientifiques, ingrédients tracés, dosages précis.
              Body Start Nutrition accompagne les sportifs exigeants vers leurs objectifs.
            </p>

            {/* Badges confiance */}
            <div className="flex flex-wrap gap-2 mb-8">
              {TRUST_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-900 bg-brand-100 border-2 border-brand-200 px-3 py-1.5 rounded-sm shadow-[2px_2px_0_theme(colors.gray.900)]"
                >
                  <CheckCircle2 className="w-4 h-4 text-brand-700" />
                  {badge}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-4 mb-10">
              <Link
                href="/products"
                className="btn-primary group"
              >
                Découvrir nos produits
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/stores"
                className="btn-secondary"
              >
                <Store className="w-4 h-4" />
                Nos boutiques
              </Link>
            </div>

            {/* Avis clients */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['💪', '🏃', '🥇', '⚡'].map((emoji, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full bg-brand-100 border-2 border-white flex items-center justify-center text-sm"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-gray-500">Avis vérifiés par nos clients</p>
              </div>
            </div>
          </div>

          {/* ─── Colonne droite : image ─── */}
          <div className="relative z-10 flex items-center justify-center">

            {/* Image principale — athlete */}
            <div className="relative w-full max-w-sm mx-auto">

              {/* Badge flottant — produit vedette */}
              <div className="absolute -left-4 top-12 z-20 bg-white shadow-[4px_4px_0_theme(colors.gray.900)] border-2 border-gray-900 px-4 py-3 flex items-center gap-3 animate-fade-in rounded-sm">
                <Image
                  src="/assets/images/hero-product.jpg"
                  alt="Whey Protéine"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-sm object-cover border border-gray-200"
                />
                <div>
                  <p className="text-xs font-black uppercase text-gray-900 tracking-wide">Whey Protéine</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">★ Best-seller</p>
                </div>
              </div>

              {/* Badge flottant — livraison */}
              <div className="absolute -right-4 bottom-20 z-20 bg-brand-700 text-white shadow-[4px_4px_0_theme(colors.gray.900)] border-2 border-gray-900 px-4 py-3 rounded-sm">
                <p className="text-xs font-black uppercase tracking-wide">🚚 Livraison 48h</p>
                <p className="text-[10px] text-brand-100 font-bold uppercase tracking-widest mt-0.5">Colissimo Express</p>
              </div>

              {/* Photo athlete */}
              <div className="relative rounded-sm overflow-hidden border-2 border-gray-900 shadow-[8px_8px_0_theme(colors.gray.900)] aspect-[3/4]">
                <Image
                  src="/assets/images/athlete.png"
                  alt="Sportif Body Start Nutrition"
                  fill
                  className="object-cover object-top grayscale-[20%] contrast-125 saturate-50"
                  priority
                />
                {/* Gradient bas */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-brand-900/60 to-transparent" />

                {/* Stats en overlay bas */}
                <div className="absolute bottom-0 inset-x-0 p-5 grid grid-cols-3 gap-2 border-t border-white/20">
                  {[
                    { value: '100%', label: 'TRACÉ' },
                    { value: '2', label: 'BOUTIQUES' },
                    { value: '48H', label: 'LIVRAISON' },
                  ].map(({ value, label }) => (
                    <div key={label} className="text-center">
                      <div className="font-display font-black text-white text-xl leading-none">{value}</div>
                      <div className="text-brand-300 text-[9px] font-bold tracking-widest mt-1">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Ligne séparatrice */}
      <div className="absolute bottom-0 inset-x-0 border-b border-gray-100" />
    </section>
  )
}
