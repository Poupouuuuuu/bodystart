'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CheckCircle2, Shirt, Zap, Shield, Repeat, Star } from 'lucide-react'
import toast from 'react-hot-toast'

const FEATURES = [
  { icon: Shirt, title: 'Tenues de sport', desc: 'Leggings, t-shirts, hoodies — pensés pour bouger librement.' },
  { icon: Zap, title: 'Tissus haute performance', desc: 'Respirants, anti-odeurs, anti-transpiration. Pour rester au top toute la séance.' },
  { icon: Shield, title: 'Durabilité premium', desc: 'Coutures renforcées et matières durables. Un investissement qui dure.' },
  { icon: Repeat, title: 'Du sport au quotidien', desc: 'Design épuré et moderne, aussi à l\'aise en salle qu\'en ville.' },
]

const STYLES = [
  { label: 'Training', emoji: '🏋️', desc: 'Shorts, leggings, débardeurs' },
  { label: 'Running', emoji: '🏃', desc: 'Tights, vestes légères, t-shirts' },
  { label: 'Urban Sport', emoji: '🧢', desc: 'Hoodies, joggers, casquettes' },
  { label: 'Accessoires', emoji: '🎽', desc: 'Sacs, gants, chaussettes' },
]

export default function VetementsPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  return (
    <div className="bg-white">

      {/* ─── Hero ─── */}
      <div className="relative overflow-hidden bg-gray-950 text-white">
        <Image
          src="/assets/images/objectif-energie.jpg"
          alt="Body Start Sport Vêtements"
          fill
          className="object-cover opacity-25"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-950/90 to-gray-900/70" />

        {/* Grille décorative */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        <div className="relative container py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/15 rounded-full text-white/60 text-xs font-bold mb-6 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" />
              Phase 3 — En cours de conception
            </div>

            <h1 className="font-display text-5xl md:text-6xl font-black leading-none tracking-tighter mb-5">
              BODY START
              <span className="block text-white/30">SPORT</span>
            </h1>

            <p className="text-white/60 text-xl leading-relaxed mb-10 max-w-xl">
              La collection Body Start Sport arrive. Des vêtements techniques conçus pour les sportifs qui refusent de choisir entre performance et style.
            </p>

            {!sent ? (
              <div>
                <p className="text-white/40 text-sm mb-3 font-medium">Soyez notifié du lancement et profitez d&apos;une offre exclusive :</p>
                <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.fr"
                    className="flex-1 px-5 py-3.5 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                  />
                  <button
                    onClick={() => { if (email) { setSent(true); toast.success('Vous serez notifié dès le lancement de la collection !') } }}
                    className="px-6 py-3.5 bg-white text-gray-900 font-bold rounded-xl hover:bg-white/90 transition-colors whitespace-nowrap inline-flex items-center gap-2"
                  >
                    M&apos;avertir <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-white/25 text-xs mt-3">Early-bird · -20% au lancement · 0 spam</p>
              </div>
            ) : (
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white font-semibold">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                On vous prévient dès le lancement !
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Ce qui arrive ─── */}
      <div className="container py-20">
        <div className="text-center mb-12">
          <span className="text-gray-400 text-sm font-bold uppercase tracking-widest">Dans la collection</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mt-2">Conçu pour performer</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">Des matières techniques sélectionnées pour accompagner chaque effort, session après session.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl bg-white border border-gray-100 hover:border-gray-300 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gray-900 transition-colors">
                <Icon className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Catégories à venir ─── */}
      <div className="bg-gray-950 py-16">
        <div className="container">
          <p className="text-gray-500 text-sm uppercase tracking-widest font-semibold text-center mb-8">Les univers de la collection</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {STYLES.map(({ label, emoji, desc }) => (
              <div key={label} className="text-center p-5 rounded-2xl border border-white/8 hover:border-white/20 transition-colors">
                <div className="text-4xl mb-3">{emoji}</div>
                <p className="font-semibold text-white text-sm mb-1">{label}</p>
                <p className="text-gray-500 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CTA ─── */}
      <div className="bg-white py-16 text-center border-t border-gray-100">
        <div className="container max-w-xl">
          <p className="text-gray-500 mb-6">En attendant la collection, retrouvez nos compléments pour booster vos performances.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/products" className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors">
              Voir nos compléments <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/stores" className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-400 transition-colors">
              Nos boutiques
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
