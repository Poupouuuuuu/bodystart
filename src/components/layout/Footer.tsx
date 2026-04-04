'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Instagram, Facebook, Music2, Loader2, MapPin, Phone, Clock, Mail, ArrowRight, ShieldCheck, Truck, Store, Headphones } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const FOOTER_LINKS = {
  boutique: [
    { label: 'Tous les produits', href: '/products' },
    { label: 'Protéines', href: '/collections/proteines' },
    { label: 'Créatine', href: '/collections/creatine' },
    { label: 'Boosters', href: '/collections/boosters' },
    { label: 'Santé & Bien-être', href: '/collections/sante-bien-etre' },
    { label: 'Snacks & Barres', href: '/collections/snacks-barres' },
  ],
  compte: [
    { label: 'Mon Compte', href: '/account' },
    { label: 'Mes Commandes', href: '/account' },
    { label: 'Livraison & Retours', href: '/livraison' },
    { label: 'FAQ', href: '/faq' },
  ],
  legal: [
    { label: 'Mentions légales', href: '/mentions-legales' },
    { label: 'CGV', href: '/cgv' },
    { label: 'Confidentialité', href: '/confidentialite' },
  ],
}

const TRUST_BADGES = [
  { icon: ShieldCheck, label: 'Paiement sécurisé', sub: 'CB, Visa, Mastercard' },
  { icon: Truck, label: 'Livraison 48h', sub: 'Offerte dès 60€' },
  { icon: Store, label: 'Click & Collect', sub: 'Retrait en boutique' },
  { icon: Headphones, label: 'SAV réactif', sub: '7j/7 par téléphone' },
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleNewsletter(e: React.FormEvent) {
    e.preventDefault()
    if (!email || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        toast.success('Bienvenue dans la communauté Body Start !')
        setEmail('')
      } else {
        toast.error('Une erreur est survenue, réessayez.')
      }
    } catch {
      toast.error('Une erreur est survenue, réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <footer className="bg-[#1a2e23] border-t border-cream-300">
      
      {/* ─── Trust Badges (En haut) ─── */}
      <div className="bg-[#15251d] py-6">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#345f44]/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[#7cb98b]" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{label}</p>
                  <p className="text-white/50 text-xs">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Bandeau Newsletter ─── */}
      <div className="bg-[#345f44] py-8">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h3 className="font-display text-lg md:text-xl font-black text-white uppercase tracking-tight mb-1">
                Rejoins la communauté
              </h3>
              <p className="text-white/70 text-sm">
                Offres exclusives et <span className="text-white font-bold">-10% sur ta première commande</span>
              </p>
            </div>
            <form onSubmit={handleNewsletter} className="flex w-full lg:w-auto gap-2">
              <div className="relative flex-1 lg:w-[320px]">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ton adresse email"
                  required
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:bg-white/15 focus:border-[#7cb98b] transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-white text-[#345f44] text-sm font-bold uppercase rounded-full hover:bg-cream-100 transition-colors flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'S\'inscrire'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ─── Contenu Principal ─── */}
      <div className="pt-12 pb-8">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-10">

            {/* Colonne 1 : Logo & Marque */}
            <div>
              <Link href="/" className="inline-block mb-6">
                <Image
                  src="/assets/logos/logo-nutrition.png"
                  alt="Body Start Nutrition"
                  width={150}
                  height={40}
                  className="h-9 w-auto"
                />
              </Link>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Compléments alimentaires de qualité premium. L'expert en nutrition sportive et performances.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:bg-[#7cb98b] hover:text-[#1a2e23] transition-all">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:bg-[#7cb98b] hover:text-[#1a2e23] transition-all">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:bg-[#7cb98b] hover:text-[#1a2e23] transition-all">
                  <Music2 className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Colonne 2 : Boutique */}
            <div>
              <h4 className="font-display font-bold text-xs uppercase tracking-widest text-[#7cb98b] mb-5">
                Boutique
              </h4>
              <ul className="space-y-3">
                {FOOTER_LINKS.boutique.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-white/70 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Colonne 3 : Compte */}
            <div>
              <h4 className="font-display font-bold text-xs uppercase tracking-widest text-[#7cb98b] mb-5">
                Aide
              </h4>
              <ul className="space-y-3">
                {FOOTER_LINKS.compte.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-white/70 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Colonne 4 : Boutique physique */}
            <div>
              <h4 className="font-display font-bold text-xs uppercase tracking-widest text-[#7cb98b] mb-5">
                Notre boutique
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-white/70">
                  <MapPin className="w-4 h-4 text-[#7cb98b] mt-0.5 flex-shrink-0" />
                  <span>8 Rue du Pont des Landes<br/>78310 Coignières</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-white/70">
                  <Phone className="w-4 h-4 text-[#7cb98b] flex-shrink-0" />
                  <span>07 61 84 75 80</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-white/70">
                  <Clock className="w-4 h-4 text-[#7cb98b] flex-shrink-0" />
                  <span>11h à 19h (7j/7)</span>
                </li>
              </ul>
            </div>

          </div>

          {/* ─── Bottom Bar ─── */}
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/40">
              © {new Date().getFullYear()} Body Start. Tous droits réservés.
            </p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {FOOTER_LINKS.legal.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-xs text-white/40 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </footer>
  )
}
