import Link from 'next/link'
import Image from 'next/image'
import {
  Instagram,
  Facebook,
  Music2,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  Truck,
  Store,
  Headphones,
} from 'lucide-react'

const FOOTER_LINKS = {
  boutique: [
    { label: 'Tous les produits', href: '/products' },
    { label: 'Packs & Économies', href: '/packs' },
    { label: 'Protéines', href: '/products?cat=proteines' },
    { label: 'Créatine', href: '/products?cat=creatine' },
    { label: 'Boosters', href: '/products?cat=boosters' },
    { label: 'Santé & Bien-être', href: '/products?cat=sante' },
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
  { icon: Truck, label: 'Livraison 48h', sub: 'Offerte dès 85€' },
  { icon: Store, label: 'Click & Collect', sub: 'Retrait en boutique' },
  { icon: Headphones, label: 'SAV réactif', sub: '7j/7 par téléphone' },
]

export default function Footer() {
  return (
    <footer className="bg-white border-t border-cream-300">

      {/* ─── Trust Badges ─── */}
      <div className="border-b border-cream-200">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-cream-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <p className="text-gray-900 text-sm font-semibold">{label}</p>
                  <p className="text-gray-500 text-xs">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Contenu Principal ─── */}
      <div className="pt-14 pb-10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12">

            {/* Colonne 1 : Logo & Marque */}
            <div>
              <Link href="/" className="inline-block mb-5">
                <Image
                  src="/assets/logos/logo-nutrition.png"
                  alt="Body Start Nutrition"
                  width={150}
                  height={40}
                  className="h-9 w-auto"
                />
              </Link>
              <p className="text-gray-600 text-sm leading-relaxed mb-6 max-w-xs">
                Compléments alimentaires de qualité premium. L&apos;expert en nutrition sportive et performances.
              </p>
              <div className="flex gap-2.5">
                <a
                  href="#"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-full bg-cream-100 flex items-center justify-center text-gray-700 hover:bg-brand-500 hover:text-white transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-full bg-cream-100 flex items-center justify-center text-gray-700 hover:bg-brand-500 hover:text-white transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  aria-label="TikTok"
                  className="w-9 h-9 rounded-full bg-cream-100 flex items-center justify-center text-gray-700 hover:bg-brand-500 hover:text-white transition-colors"
                >
                  <Music2 className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Colonne 2 : Boutique */}
            <div>
              <h4 className="font-display font-bold text-xs uppercase tracking-widest text-gray-900 mb-5">
                Boutique
              </h4>
              <ul className="space-y-3">
                {FOOTER_LINKS.boutique.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-brand-500 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Colonne 3 : Aide */}
            <div>
              <h4 className="font-display font-bold text-xs uppercase tracking-widest text-gray-900 mb-5">
                Aide
              </h4>
              <ul className="space-y-3">
                {FOOTER_LINKS.compte.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-brand-500 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Colonne 4 : Boutique physique */}
            <div>
              <h4 className="font-display font-bold text-xs uppercase tracking-widest text-gray-900 mb-5">
                Notre boutique
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                  <span>8 Rue du Pont des Landes<br />78310 Coignières</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  <a href="tel:+33761847580" className="hover:text-brand-500 transition-colors">
                    07 61 84 75 80
                  </a>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  <span>11h à 19h (7j/7)</span>
                </li>
              </ul>
            </div>

          </div>

          {/* ─── Bottom Bar ─── */}
          <div className="border-t border-cream-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Body Start. Tous droits réservés.
            </p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {FOOTER_LINKS.legal.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-xs text-gray-500 hover:text-brand-500 transition-colors"
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
