import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Target, Flame } from 'lucide-react'
import { COACHING_PRODUCTS } from '@/lib/stripe/types'

export const metadata: Metadata = {
  title: 'Programmes Coaching — Body Start',
  description: 'Programmes d\'entraînement personnalisés : transformation 12 semaines, sèche 8 semaines, séances individuelles et packs coaching.',
}

const PROGRAMME_ICONS: Record<string, typeof Target> = {
  'programme-transformation': Target,
  'programme-seche': Flame,
  'seance-individuelle': Clock,
  'pack-10-seances': Clock,
}

export default function CoachingProgrammesPage() {
  const programmes = COACHING_PRODUCTS.filter((p) => p.type === 'programme')
  const seance = COACHING_PRODUCTS.find((p) => p.type === 'seance')
  const pack = COACHING_PRODUCTS.find((p) => p.type === 'pack')

  return (
    <div className="min-h-screen bg-gray-950 text-white pt-24 pb-16">
      <div className="container">
        <Link href="/coaching" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors mb-12 group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Retour au coaching
        </Link>

        <div className="mb-16 border-l-4 border-coaching-cyan-500 pl-6">
          <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-2">COACHING BODY START</span>
          <h1 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tight">
            NOS PROGRAMMES <span className="text-coaching-cyan-400">.</span>
          </h1>
        </div>

        {/* ─── Programmes (one-shot) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {programmes.map((p) => {
            const Icon = PROGRAMME_ICONS[p.id] ?? Target
            return (
              <div key={p.id} className="bg-gray-900 border-2 border-gray-800 rounded-sm p-8 hover:border-coaching-cyan-500 hover:shadow-[8px_8px_0_#2ab0b0] transition-all group">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-gray-950 border-2 border-gray-800 rounded-sm flex items-center justify-center group-hover:bg-coaching-cyan-500 group-hover:border-coaching-cyan-500 transition-colors">
                    <Icon className="w-6 h-6 text-gray-400 group-hover:text-black transition-colors" />
                  </div>
                  {p.durationDays && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-950 border-2 border-gray-800 px-3 py-1.5 rounded-sm">
                      {p.durationDays / 7} semaines
                    </span>
                  )}
                </div>

                <h2 className="font-black text-xl text-white uppercase tracking-tight mb-3">{p.name}</h2>
                <p className="text-gray-400 text-sm font-bold leading-relaxed mb-8">{p.description}</p>

                <ul className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-coaching-cyan-500 flex-shrink-0" />
                      <span className="text-gray-300 font-bold">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between pt-6 border-t-2 border-gray-800">
                  <span className="font-display font-black text-4xl text-white">{p.price}€</span>
                  <Link
                    href={`/coaching/tarifs#${p.id}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-coaching-cyan-500 text-black font-black text-[10px] uppercase tracking-widest rounded-sm border-2 border-coaching-cyan-500 hover:bg-coaching-cyan-400 hover:border-coaching-cyan-400 transition-all shadow-[4px_4px_0_theme(colors.black)] hover:shadow-[6px_6px_0_theme(colors.black)] hover:-translate-y-0.5"
                  >
                    COMMENCER <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* ─── Séances & Packs ─── */}
        <div className="mb-16 border-l-4 border-coaching-cyan-500 pl-6">
          <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-2">À LA CARTE</span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">SÉANCES INDIVIDUELLES</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {seance && (
            <div className="bg-gray-900 border-2 border-gray-800 rounded-sm p-8 hover:border-coaching-cyan-500 transition-colors">
              <span className="text-[10px] font-black uppercase tracking-widest text-coaching-cyan-400 mb-4 block">Séance unique</span>
              <h3 className="font-black text-xl text-white uppercase tracking-tight mb-3">{seance.name}</h3>
              <p className="text-gray-400 text-sm font-bold leading-relaxed mb-6">{seance.description}</p>
              <ul className="space-y-3 mb-8">
                {seance.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-coaching-cyan-500 flex-shrink-0" />
                    <span className="text-gray-300 font-bold">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between pt-6 border-t-2 border-gray-800">
                <span className="font-display font-black text-4xl text-white">{seance.price}€</span>
                <Link
                  href={`/coaching/tarifs#${seance.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-coaching-cyan-500 text-black font-black text-[10px] uppercase tracking-widest rounded-sm border-2 border-coaching-cyan-500 hover:bg-coaching-cyan-400 hover:border-coaching-cyan-400 transition-all shadow-[4px_4px_0_theme(colors.black)]"
                >
                  RÉSERVER <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {pack && (
            <div className="bg-gray-900 border-2 border-coaching-cyan-500 rounded-sm p-8 shadow-[8px_8px_0_#2ab0b0] relative">
              <div className="absolute -top-3 right-4 bg-coaching-cyan-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm">
                -15% vs unité
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-coaching-cyan-400 mb-4 block">Pack économique</span>
              <h3 className="font-black text-xl text-white uppercase tracking-tight mb-3">{pack.name}</h3>
              <p className="text-gray-400 text-sm font-bold leading-relaxed mb-6">{pack.description}</p>
              <ul className="space-y-3 mb-8">
                {pack.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-coaching-cyan-500 flex-shrink-0" />
                    <span className="text-gray-300 font-bold">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between pt-6 border-t-2 border-gray-800">
                <div>
                  <span className="font-display font-black text-4xl text-coaching-cyan-400">{pack.price}€</span>
                  <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest ml-2">soit {Math.round(pack.price / 10)}€/séance</span>
                </div>
                <Link
                  href={`/coaching/tarifs#${pack.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-coaching-cyan-500 text-black font-black text-[10px] uppercase tracking-widest rounded-sm border-2 border-coaching-cyan-500 hover:bg-coaching-cyan-400 hover:border-coaching-cyan-400 transition-all shadow-[4px_4px_0_theme(colors.black)]"
                >
                  ACHETER <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ─── CTA ─── */}
        <div className="text-center p-12 bg-gray-900 border-2 border-gray-800 rounded-sm">
          <h3 className="font-display text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">PAS SÛR DE VOTRE CHOIX ?</h3>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-8 max-w-xl mx-auto">
            Comparez toutes nos offres en détail ou réservez un appel gratuit avec un coach.
          </p>
          <Link
            href="/coaching/tarifs"
            className="inline-flex items-center justify-center gap-3 px-8 py-5 bg-coaching-cyan-500 text-black font-black text-[10px] uppercase tracking-widest rounded-sm border-2 border-coaching-cyan-500 hover:bg-coaching-cyan-400 hover:border-coaching-cyan-400 transition-all shadow-[6px_6px_0_theme(colors.black)] hover:shadow-[8px_8px_0_theme(colors.black)] hover:-translate-y-1"
          >
            COMPARER LES TARIFS <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
