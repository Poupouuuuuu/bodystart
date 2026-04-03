'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Dumbbell, Brain, TrendingUp, Clock, Star, Zap, Shield, Users, ChevronRight } from 'lucide-react'
import { COACHING_PRODUCTS } from '@/lib/stripe/types'

const FEATURES = [
  { icon: Dumbbell, title: 'PROGRAMMES SUR-MESURE', desc: 'Entraînements adaptés à votre niveau, vos objectifs et votre équipement disponible.' },
  { icon: Brain, title: 'SUIVI PERSONNALISÉ', desc: 'Un coach dédié qui analyse et ajuste votre programme chaque semaine.' },
  { icon: TrendingUp, title: 'PROGRESSION GARANTIE', desc: 'Méthode éprouvée avec des résultats mesurables dès les premières semaines.' },
  { icon: Clock, title: 'DISPONIBLE 7J/7', desc: 'Accès à votre espace coach et vos programmes à tout moment, depuis votre mobile.' },
]

const TESTIMONIALS = [
  { name: 'THOMAS R.', result: '+8KG DE MUSCLE', duration: '3 mois', stars: 5, text: 'Programme ultra personnalisé. Mon coach a adapté chaque semaine selon mes progrès. Jamais eu d\'aussi bons résultats.' },
  { name: 'JULIE M.', result: '-12KG', duration: '4 mois', stars: 5, text: 'Tout est adapté à mon emploi du temps chargé. Les séances en visio sont aussi efficaces qu\'en salle.' },
  { name: 'KARIM B.', result: 'PODIUM RÉGIONAL', duration: '6 mois', stars: 5, text: 'Préparation compétition parfaite. La combinaison nutrition + coaching a fait toute la différence.' },
]

const ADVANTAGES = [
  { icon: Zap, title: '-15% PERMANENT', desc: 'Sur tous les compléments et vêtements Body Start, automatiquement appliqué.' },
  { icon: Shield, title: 'SANS ENGAGEMENT', desc: 'Programmes one-shot ou abonnement mensuel résiliable à tout moment.' },
  { icon: Users, title: 'VISIO OU BOUTIQUE', desc: 'Séances individuelles en visio ou en personne dans notre boutique de Coignières.' },
]

export default function CoachingPage() {
  const abonnement = COACHING_PRODUCTS.find((p) => p.type === 'abonnement')
  const programmes = COACHING_PRODUCTS.filter((p) => p.type === 'programme')
  const seance = COACHING_PRODUCTS.find((p) => p.type === 'seance')
  const pack = COACHING_PRODUCTS.find((p) => p.type === 'pack')

  return (
    <div className="bg-gray-950 text-white selection:bg-coaching-cyan-500 selection:text-black">

      {/* ─── Hero ─── */}
      <div className="relative overflow-hidden border-b-4 border-gray-900">
        <Image
          src="/assets/images/objectif-muscle.jpg"
          alt="Coaching Body Start"
          fill
          className="object-cover opacity-30 grayscale contrast-125 mix-blend-overlay"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900/90 to-black/80" />

        <div className="relative container py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 border-2 border-coaching-cyan-500 rounded-sm text-coaching-cyan-400 text-[10px] font-black mb-8 uppercase tracking-widest shadow-[4px_4px_0_theme(colors.black)]">
              <span className="w-2 h-2 bg-coaching-cyan-400 rounded-sm animate-pulse" />
              COACHING BODY START
            </div>

            <h1 className="font-display text-6xl md:text-8xl font-black leading-none mb-6 tracking-tighter uppercase">
              DÉPASSEZ VOS <span className="text-coaching-cyan-400">LIMITES</span>
            </h1>

            <p className="text-gray-400 text-lg md:text-xl font-bold uppercase tracking-widest leading-relaxed mb-12 max-w-2xl">
              Programmes d'entraînement 100% personnalisés, coaching individuel et suivi premium pour une transformation radicale.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/coaching/tarifs"
                className="inline-flex items-center justify-center gap-3 px-8 py-5 bg-coaching-cyan-500 text-black font-black text-[10px] uppercase tracking-widest rounded-sm border-2 border-coaching-cyan-500 hover:bg-coaching-cyan-400 hover:border-coaching-cyan-400 transition-all shadow-[6px_6px_0_theme(colors.black)] hover:shadow-[8px_8px_0_theme(colors.black)] hover:-translate-y-1"
              >
                VOIR LES TARIFS <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/coaching/programmes"
                className="inline-flex items-center justify-center gap-3 px-8 py-5 bg-transparent text-white font-black text-[10px] uppercase tracking-widest rounded-sm border-2 border-gray-700 hover:border-coaching-cyan-500 hover:text-coaching-cyan-400 transition-all"
              >
                DÉCOUVRIR LES PROGRAMMES
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Features ─── */}
      <div className="container py-24">
        <div className="mb-16 border-l-4 border-coaching-cyan-500 pl-6">
          <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-2">LA MÉTHODE</span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">UNE APPROCHE CLINIQUE</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-8 bg-gray-900 border-2 border-gray-800 rounded-sm hover:border-coaching-cyan-500 hover:shadow-[8px_8px_0_#2ab0b0] transition-all group duration-300">
              <div className="w-14 h-14 bg-gray-950 border-2 border-gray-800 rounded-sm flex items-center justify-center mb-6 group-hover:bg-coaching-cyan-500 group-hover:border-coaching-cyan-500 transition-colors">
                <Icon className="w-6 h-6 text-gray-400 group-hover:text-black transition-colors" />
              </div>
              <h3 className="font-black text-white text-sm mb-4 uppercase tracking-wider">{title}</h3>
              <p className="text-gray-400 text-xs font-bold leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Offres (aperçu 4 produits) ─── */}
      <div className="bg-gray-900 border-y-4 border-gray-800 py-24">
        <div className="container">
          <div className="mb-16 border-l-4 border-coaching-cyan-500 pl-6">
            <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-2">NOS OFFRES</span>
            <h2 className="font-display text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">TROUVEZ VOTRE FORMULE</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Programmes */}
            {programmes.map((p) => (
              <div key={p.id} className="bg-gray-950 border-2 border-gray-800 rounded-sm p-6 hover:border-coaching-cyan-500 transition-colors flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-coaching-cyan-400 mb-3">Programme</span>
                <h3 className="font-black text-white text-base uppercase tracking-tight mb-2">{p.name}</h3>
                <p className="text-gray-400 text-xs font-bold leading-relaxed mb-6 flex-1">{p.description}</p>
                <div className="flex items-end justify-between">
                  <span className="font-display font-black text-3xl text-white">{p.price}€</span>
                  <Link href="/coaching/tarifs" className="text-coaching-cyan-400 text-[10px] font-black uppercase tracking-widest hover:text-coaching-cyan-300 transition-colors inline-flex items-center gap-1">
                    Détails <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}

            {/* Séance */}
            {seance && (
              <div className="bg-gray-950 border-2 border-gray-800 rounded-sm p-6 hover:border-coaching-cyan-500 transition-colors flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-coaching-cyan-400 mb-3">Séance</span>
                <h3 className="font-black text-white text-base uppercase tracking-tight mb-2">{seance.name}</h3>
                <p className="text-gray-400 text-xs font-bold leading-relaxed mb-6 flex-1">{seance.description}</p>
                <div className="flex items-end justify-between">
                  <span className="font-display font-black text-3xl text-white">{seance.price}€</span>
                  <Link href="/coaching/tarifs" className="text-coaching-cyan-400 text-[10px] font-black uppercase tracking-widest hover:text-coaching-cyan-300 transition-colors inline-flex items-center gap-1">
                    Détails <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}

            {/* Abonnement — featured */}
            {abonnement && (
              <div className="bg-gray-950 border-2 border-coaching-cyan-500 rounded-sm p-6 shadow-[8px_8px_0_#2ab0b0] flex flex-col relative">
                <div className="absolute -top-3 right-4 bg-coaching-cyan-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm">
                  Populaire
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-coaching-cyan-400 mb-3">Abonnement</span>
                <h3 className="font-black text-white text-base uppercase tracking-tight mb-2">{abonnement.name}</h3>
                <p className="text-gray-400 text-xs font-bold leading-relaxed mb-6 flex-1">{abonnement.description}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="font-display font-black text-3xl text-coaching-cyan-400">{abonnement.price}€</span>
                    <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest ml-1">/mois</span>
                  </div>
                  <Link href="/coaching/tarifs" className="text-coaching-cyan-400 text-[10px] font-black uppercase tracking-widest hover:text-coaching-cyan-300 transition-colors inline-flex items-center gap-1">
                    Détails <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/coaching/tarifs"
              className="inline-flex items-center justify-center gap-3 px-8 py-5 bg-coaching-cyan-500 text-black font-black text-[10px] uppercase tracking-widest rounded-sm border-2 border-coaching-cyan-500 hover:bg-coaching-cyan-400 hover:border-coaching-cyan-400 transition-all shadow-[6px_6px_0_theme(colors.black)] hover:shadow-[8px_8px_0_theme(colors.black)] hover:-translate-y-1"
            >
              COMPARER TOUTES LES OFFRES <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Avantages coaching ─── */}
      <div className="container py-24">
        <div className="mb-16 border-l-4 border-coaching-cyan-500 pl-6">
          <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-2">AVANTAGES EXCLUSIFS</span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">PLUS QU'UN COACHING</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {ADVANTAGES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-5 p-6 bg-gray-900 border-2 border-gray-800 rounded-sm">
              <div className="w-12 h-12 bg-coaching-cyan-500 rounded-sm flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="font-black text-white text-sm mb-2 uppercase tracking-wider">{title}</h3>
                <p className="text-gray-400 text-xs font-bold leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Témoignages ─── */}
      <div className="bg-gray-900 border-y-4 border-gray-800 py-24">
        <div className="container">
          <div className="mb-16 border-l-4 border-coaching-cyan-500 pl-6">
            <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-2">RÉSULTATS</span>
            <h2 className="font-display text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">ILS ONT TRANSFORMÉ LEUR CORPS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map(({ name, result, duration, stars, text }) => (
              <div key={name} className="bg-gray-950 border-2 border-gray-800 rounded-sm p-8 shadow-[8px_8px_0_theme(colors.black)] hover:border-coaching-cyan-500 transition-colors">
                <div className="flex gap-1 mb-6">
                  {[...Array(stars)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-coaching-cyan-500 text-coaching-cyan-500" />
                  ))}
                </div>
                <p className="text-gray-300 font-bold uppercase tracking-wider leading-relaxed mb-8 text-sm">&ldquo;{text}&rdquo;</p>
                <div className="pt-6 border-t-2 border-gray-800">
                  <p className="font-black text-white text-base mb-1">{name}</p>
                  <p className="text-coaching-cyan-400 text-[10px] font-black tracking-widest uppercase">{result} en {duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CTA final ─── */}
      <div className="bg-coaching-cyan-500 py-24 border-b-8 border-gray-900">
        <div className="container text-center max-w-3xl">
          <h2 className="font-display text-5xl md:text-6xl font-black text-black uppercase tracking-tighter mb-6">PRÊT POUR LA TRANSFORMATION ?</h2>
          <p className="text-gray-900 font-black uppercase tracking-widest text-sm mb-12">
            NO EXCUSES · DEVENEZ LA MEILLEURE VERSION DE VOUS-MÊME
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/coaching/tarifs"
              className="inline-flex items-center justify-center gap-3 px-8 py-5 bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest rounded-sm border-2 border-gray-900 hover:bg-gray-950 transition-all shadow-[6px_6px_0_theme(colors.white)] hover:shadow-[8px_8px_0_theme(colors.white)] hover:-translate-y-1"
            >
              CHOISIR MON COACHING <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-3 px-8 py-5 bg-transparent text-black font-black text-[10px] uppercase tracking-widest rounded-sm border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
            >
              VOIR LA NUTRITION
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
