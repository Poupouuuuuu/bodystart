'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Instagram, Facebook, Music2, Loader2, MapPin, Phone, Clock, Mail, ArrowRight, ShieldCheck, Truck, Store, Headphones } from 'lucide-react'
import toast from 'react-hot-toast'

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
  { icon: Truck, label: 'Livraison rapide', sub: '48h en France' },
  { icon: Store, label: 'Click & Collect', sub: 'Retrait en boutique' },
  { icon: Headphones, label: 'SAV réactif', sub: '7j/7 par téléphone' },
]

const SOCIALS = [
  { Icon: Instagram, label: 'Instagram', href: '#' },
  { Icon: Facebook, label: 'Facebook', href: '#' },
  { Icon: Music2, label: 'TikTok', href: '#' },
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
    <footer>
      {/* ─── Bandeau Newsletter ─── */}
      <div className="bg-[#345f44] py-10 md:py-14">
        <div className="container px-4 lg:px-0">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="font-display text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-2">
                Rejoins la communauté Body Start
              </h3>
              <p className="text-white/70 text-sm md:text-base">
                Reçois nos offres exclusives, conseils nutrition et <span className="text-white font-bold">-10% sur ta première commande</span>
              </p>
            </div>
            <form onSubmit={handleNewsletter} className="flex w-full lg:w-auto gap-3">
              <div className="relative flex-1 lg:w-[320px]">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ton adresse email"
                  required
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3.5 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:bg-white/15 focus:border-white/40 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3.5 bg-white text-[#345f44] text-sm font-bold uppercase rounded-full hover:bg-cream-100 transition-colors flex items-center gap-2 shadow-lg whitespace-nowrap"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    S&apos;inscrire
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ─── Badges de confiance ─── */}
      <div className="bg-[#1a2e23] border-b border-white/10">
        <div className="container px-4 lg:px-0 py-8">
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

      {/* ─── Contenu principal ─── */}
      <div className="bg-[#1a2e23] pt-12 pb-8">
        <div className="container px-4 lg:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

            {/* Colonne 1 : Marque */}
            <div>
              <Link href="/" className="inline-block mb-5">
                <span className="font-display text-2xl font-black text-white tracking-tight">
                  BODY<span className="text-[#7cb98b]">START</span>
                </span>
              </Link>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Compléments alimentaires sportifs de qualité premium. Conseils personnalisés en boutique et en ligne.
              </p>
              {/* Réseaux sociaux */}
              <div className="flex gap-3">
                {SOCIALS.map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-[#345f44] hover:text-white transition-all duration-200"
                  >
                    <Icon className="w-4.5 h-4.5" strokeWidth={2} />
                  </a>
                ))}
              </div>
            </div>

            {/* Colonne 2 : Boutique */}
            <div>
              <h4 className="font-display font-bold text-xs uppercase tracking-widest text-white/40 mb-5">
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

            {/* Colonne 3 : Compte & Aide */}
            <div>
              <h4 className="font-display font-bold text-xs uppercase tracking-widest text-white/40 mb-5">
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

            {/* Colonne 4 : Notre boutique */}
            <div>
              <h4 className="font-display font-bold text-xs uppercase tracking-widest text-white/40 mb-5">
                Notre boutique
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#7cb98b] mt-0.5 flex-shrink-0" />
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=8+Rue+du+Pont+des+Landes+78310+Coigni%C3%A8res"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/70 hover:text-white transition-colors leading-relaxed"
                  >
                    8 Rue du Pont des Landes<br />78310 Coignières
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#7cb98b] flex-shrink-0" />
                  <a href="tel:+33761847580" className="text-sm text-white/70 hover:text-white transition-colors">
                    07 61 84 75 80
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[#7cb98b] flex-shrink-0" />
                  <span className="text-sm text-white/70">
                    7j/7 — 11h à 19h
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#7cb98b] flex-shrink-0" />
                  <a href="mailto:contact@bodystart.com" className="text-sm text-white/70 hover:text-white transition-colors">
                    contact@bodystart.com
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* ─── Bottom bar ─── */}
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} Body Start Nutrition. Tous droits réservés.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {FOOTER_LINKS.legal.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors"
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
