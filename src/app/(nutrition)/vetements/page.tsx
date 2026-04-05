'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CheckCircle2, Shirt, Zap, Shield, Repeat, Footprints, Watch, Dumbbell, Backpack } from 'lucide-react'
import toast from 'react-hot-toast'

const FEATURES = [
  { icon: Shirt, title: 'Tenues de sport', desc: 'Leggings, t-shirts, hoodies \u2014 pens\u00e9s pour bouger librement.' },
  { icon: Zap, title: 'Tissus haute performance', desc: 'Respirants, anti-odeurs, anti-transpiration. Pour rester au top toute la s\u00e9ance.' },
  { icon: Shield, title: 'Durabilit\u00e9 premium', desc: 'Coutures renforc\u00e9es et mati\u00e8res durables. Un investissement qui dure.' },
  { icon: Repeat, title: 'Du sport au quotidien', desc: 'Design \u00e9pur\u00e9 et moderne, aussi \u00e0 l\'aise en salle qu\'en ville.' },
]

const STYLES = [
  { label: 'Training', icon: Dumbbell, desc: 'Shorts, leggings, d\u00e9bardeurs' },
  { label: 'Running', icon: Footprints, desc: 'Tights, vestes l\u00e9g\u00e8res, t-shirts' },
  { label: 'Urban Sport', icon: Watch, desc: 'Hoodies, joggers, casquettes' },
  { label: 'Accessoires', icon: Backpack, desc: 'Sacs, gants, chaussettes' },
]

export default function VetementsPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  return (
    <div className="bg-[#f4f6f1] min-h-screen">

      {/* Hero */}
      <div className="relative overflow-hidden">
        <Image
          src="/assets/images/objectif-energie.jpg"
          alt="Body Start Sport V\u00eatements"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a2e23] via-[#1a2e23]/95 to-[#4a5f4c]/80" />

        <div className="relative container py-24 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full text-white/60 text-xs font-bold mb-8 uppercase tracking-wider">
              <span className="w-2 h-2 bg-[#7cb98b] rounded-full animate-pulse" />
              En cours de conception
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black leading-none tracking-tight text-white mb-5">
              BODY START
              <span className="block text-[#89a890]/50">SPORT</span>
            </h1>

            <p className="text-white/60 text-xl leading-relaxed mb-10 max-w-xl">
              La collection Body Start Sport arrive. Des v&ecirc;tements techniques con&ccedil;us pour les sportifs qui refusent de choisir entre performance et style.
            </p>

            {!sent ? (
              <div>
                <p className="text-white/40 text-sm mb-3 font-medium">
                  Soyez notifi&eacute; du lancement et profitez d&apos;une offre exclusive :
                </p>
                <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.fr"
                    className="flex-1 px-5 py-3.5 rounded-full bg-white/10 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7cb98b]/50 focus:border-transparent transition-all"
                  />
                  <button
                    onClick={() => { if (email) { setSent(true); toast.success('Vous serez notifi\u00e9 d\u00e8s le lancement de la collection !') } }}
                    className="px-7 py-3.5 bg-white text-[#1a2e23] font-bold rounded-full hover:bg-white/90 transition-colors whitespace-nowrap inline-flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    M&apos;avertir <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-white/25 text-xs mt-3">Early-bird &middot; -20% au lancement &middot; 0 spam</p>
              </div>
            ) : (
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/15 rounded-[20px] text-white font-semibold">
                <CheckCircle2 className="w-5 h-5 text-[#7cb98b]" />
                On vous pr&eacute;vient d&egrave;s le lancement !
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ce qui arrive */}
      <div className="container py-20">
        <div className="text-center mb-14">
          <p className="text-[#89a890] text-xs font-bold uppercase tracking-widest mb-3">
            Dans la collection
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-[#1a2e23]">
            Con&ccedil;u pour performer
          </h2>
          <p className="text-[#4a5f4c] mt-3 max-w-xl mx-auto leading-relaxed">
            Des mati&egrave;res techniques s&eacute;lectionn&eacute;es pour accompagner chaque effort, session apr&egrave;s session.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="p-7 rounded-[20px] bg-white shadow-sm hover:shadow-lg transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-[#f4f6f1] rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#1a2e23] transition-colors duration-300">
                <Icon className="w-5 h-5 text-[#4a5f4c] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-display font-bold text-[#1a2e23] mb-2 uppercase tracking-wide text-sm">
                {title}
              </h3>
              <p className="text-sm text-[#4a5f4c]/70 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cat\u00e9gories \u00e0 venir */}
      <div className="bg-[#1a2e23] py-16">
        <div className="container">
          <p className="text-[#89a890]/60 text-xs uppercase tracking-widest font-bold text-center mb-10">
            Les univers de la collection
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {STYLES.map(({ label, icon: Icon, desc }) => (
              <div
                key={label}
                className="text-center p-6 rounded-[20px] border border-white/8 hover:border-[#89a890]/30 transition-colors duration-300"
              >
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#89a890]" />
                </div>
                <p className="font-display font-bold text-white text-sm mb-1 uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-[#89a890]/50 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-16 text-center">
        <div className="container max-w-xl">
          <p className="text-[#4a5f4c] mb-6 leading-relaxed">
            En attendant la collection, retrouvez nos compl&eacute;ments pour booster vos performances.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#1a2e23] text-white font-bold rounded-full hover:bg-[#4a5f4c] transition-colors shadow-md hover:shadow-lg"
            >
              Voir nos compl&eacute;ments <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/stores"
              className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-[#1a2e23]/15 text-[#1a2e23] font-bold rounded-full hover:border-[#1a2e23]/40 transition-colors"
            >
              Nos boutiques
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
