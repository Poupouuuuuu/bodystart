'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, ArrowRight, Dumbbell, Brain, TrendingUp, Clock, Star } from 'lucide-react'
import toast from 'react-hot-toast'

const FEATURES = [
  { icon: Dumbbell, title: 'PROGRAMMES SUR-MESURE', desc: 'Entraînements adaptés à votre niveau, vos objectifs et votre équipement disponible.' },
  { icon: Brain, title: 'SUIVI PERSONNALISÉ', desc: 'Un coach dédié qui analyse et ajuste votre programme chaque semaine.' },
  { icon: TrendingUp, title: 'PROGRESSION GARANTIE', desc: 'Méthode éprouvée avec des résultats mesurables dès les premières semaines.' },
  { icon: Clock, title: 'DISPONIBLE 7J/7', desc: 'Accès à votre espace coach et vos programmes à tout moment, depuis votre mobile.' },
]

const TESTIMONIALS = [
  { name: 'THOMAS R.', result: '+8KG DE MUSCLE', stars: 5, text: 'Programme ultra personnalisé, résultats en 3 mois.' },
  { name: 'JULIE M.', result: '-12KG EN 4 MOIS', stars: 5, text: 'Mon coach a tout adapté à mon emploi du temps chargé.' },
  { name: 'KARIM B.', result: 'PODIUM RÉGIONAL', stars: 5, text: 'Préparation compétition parfaite, je recommande.' },
]

export default function CoachingPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

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
              PHASE DE LANCEMENT IMMINENTE
            </div>

            <h1 className="font-display text-6xl md:text-8xl font-black leading-none mb-6 tracking-tighter uppercase">
              DÉPASSEZ VOS <span className="text-coaching-cyan-400">LIMITES</span>
            </h1>

            <p className="text-gray-400 text-lg md:text-xl font-bold uppercase tracking-widest leading-relaxed mb-12 max-w-2xl">
              Des programmes d'entraînement 100% personnalisés et un suivi coach premium pour une transformation radicale.
            </p>

            {!sent ? (
              <div className="p-6 md:p-8 bg-gray-900 border-2 border-gray-800 rounded-sm shadow-[8px_8px_0_theme(colors.black)]">
                <p className="text-[10px] font-black uppercase tracking-widest text-coaching-cyan-400 mb-4">Accès anticipé exclusif</p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="VOTRE@EMAIL.FR"
                    className="flex-1 px-5 py-4 rounded-sm bg-gray-950 border-2 border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-coaching-cyan-500 text-[10px] uppercase font-black tracking-widest transition-colors"
                  />
                  <button
                    onClick={() => { if (email) { setSent(true); toast.success('Vous serez notifié dès le lancement !') } }}
                    className="px-8 py-4 bg-coaching-cyan-500 hover:bg-coaching-cyan-400 text-black border-2 border-coaching-cyan-500 hover:border-coaching-cyan-400 font-black text-[10px] uppercase tracking-widest rounded-sm transition-all shadow-[4px_4px_0_theme(colors.black)] hover:shadow-[6px_6px_0_theme(colors.black)] hover:-translate-y-0.5 whitespace-nowrap inline-flex items-center justify-center gap-2"
                  >
                    ME PRÉVENIR <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="inline-flex items-center gap-3 px-6 py-5 bg-gray-900 border-2 border-coaching-cyan-500 shadow-[8px_8px_0_theme(colors.black)] rounded-sm text-coaching-cyan-400 font-black text-[10px] uppercase tracking-widest">
                <CheckCircle2 className="w-5 h-5" />
                VOUS ÊTES SUR LA LISTE PRIORITAIRE.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Features ─── */}
      <div id="programmes" className="container py-24">
        <div className="mb-16 border-l-4 border-coaching-cyan-500 pl-6">
          <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-2">LA MÉTHODE</span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">UNE APPROCHE CLINIQUE</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-8 bg-gray-900 border-2 border-gray-800 rounded-sm hover:border-coaching-cyan-500 hover:shadow-[8px_8px_0_theme(colors.coaching-cyan.500)] transition-all group duration-300">
              <div className="w-14 h-14 bg-gray-950 border-2 border-gray-800 rounded-sm flex items-center justify-center mb-6 group-hover:bg-coaching-cyan-500 group-hover:border-coaching-cyan-500 transition-colors">
                <Icon className="w-6 h-6 text-gray-400 group-hover:text-black transition-colors" />
              </div>
              <h3 className="font-black text-white text-sm mb-4 uppercase tracking-wider">{title}</h3>
              <p className="text-gray-400 text-xs font-bold leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Témoignages ─── */}
      <div id="temoignages" className="bg-gray-900 border-y-4 border-gray-800 py-24">
        <div className="container">
          <div className="mb-16 border-l-4 border-coaching-cyan-500 pl-6">
            <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-2">PREUVES À L'APPUI</span>
            <h2 className="font-display text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">RÉSULTATS DES BÊTA TESTEURS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map(({ name, result, stars, text }) => (
              <div key={name} className="bg-gray-950 border-2 border-gray-800 rounded-sm p-8 shadow-[8px_8px_0_theme(colors.black)] hover:border-coaching-cyan-500 transition-colors">
                <div className="flex gap-1 mb-6">
                  {[...Array(stars)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-coaching-cyan-500 text-coaching-cyan-500" />
                  ))}
                </div>
                <p className="text-gray-300 font-bold uppercase tracking-wider leading-relaxed mb-8 text-sm">"{text}"</p>
                <div className="pt-6 border-t-2 border-gray-800">
                  <p className="font-black text-white text-base mb-1">{name}</p>
                  <p className="text-coaching-cyan-400 text-[10px] font-black tracking-widest uppercase">{result}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CTA final ─── */}
      <div className="bg-coaching-cyan-500 py-24 border-b-8 border-gray-900">
        <div className="container text-center max-w-3xl">
          <h2 className="font-display text-5xl md:text-6xl font-black text-black uppercase tracking-tighter mb-6">OPÉRATIONNEL POUR LA TRANSFORMATION ?</h2>
          <p className="text-gray-900 font-black uppercase tracking-widest text-sm mb-12">
            RÉPONDRE PRÉSENT · NO EXCUSES · DEVENEZ LA MEILLEURE VERSION DE VOUS-MÊME
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/products" 
              className="inline-flex items-center justify-center gap-3 px-8 py-5 bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest rounded-sm border-2 border-gray-900 hover:bg-gray-950 transition-all shadow-[6px_6px_0_theme(colors.white)] hover:shadow-[8px_8px_0_theme(colors.white)] hover:-translate-y-1"
            >
              PRÉPARER LE TERRAIN (NUTRITION) <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
