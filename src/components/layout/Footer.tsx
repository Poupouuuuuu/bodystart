import Link from 'next/link'
import Image from 'next/image'
import {
  Instagram,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  Truck,
  Store,
  Headphones,
} from 'lucide-react'
import { FREE_SHIPPING_THRESHOLD_CENTS, MONDIAL_RELAY, formatShippingPrice } from '@/lib/shipping'

// Footer — copy spec §3.9 et §3.10
//
// Note : "Sante & bien-etre" est remonte en 3e position (pas en dernier)
// pour incarner le positionnement 50/50 sport/sante. cf. spec §3.10.
//
// Reseaux sociaux : on ne garde QUE Instagram (lien reel quand disponible).
// Facebook + TikTok masques tant que les comptes ne sont pas prets (spec §3.10).
//
// Forfaits livraison sous 85€ (decision Adam 2026-05-23) :
//   - Mondial Relay : 4,90€
//   - Colissimo (domicile) : 6,90€
// Au-dessus de 85€ : offerte (les deux methodes).
const FOOTER_LINKS = {
  boutique: [
    { label: 'Tous les produits', href: '/products' },
    { label: 'Packs & Économies', href: '/packs' },
    // Pages catégories SEO (liens entrants sitewide — cf. src/lib/categories.ts)
    { label: 'Protéines', href: '/categories/proteines' },
    { label: 'Créatine', href: '/categories/creatine' },
    { label: 'Pré-workout', href: '/categories/pre-workout' },
    { label: 'Acides aminés', href: '/categories/acides-amines' },
    { label: 'Santé & bien-être', href: '/categories/sante' },
    { label: 'Brûleurs', href: '/categories/bruleurs' },
  ],
  compte: [
    { label: 'Mon Compte', href: '/account' },
    { label: 'Mes Commandes', href: '/account?tab=orders' },
    { label: 'Guides nutrition', href: '/blog' },
    { label: 'Pourquoi BodyStart ?', href: '/pourquoi-bodystart' },
    { label: 'Livraison & Retours', href: '/livraison' },
    { label: 'FAQ', href: '/faq' },
  ],
  legal: [
    { label: 'Mentions légales', href: '/mentions-legales' },
    { label: 'CGV', href: '/cgv' },
    { label: 'Confidentialité', href: '/confidentialite' },
    { label: 'Cookies', href: '/cookies' },
  ],
}

// 4 nouvelles puces (copy spec §3.9)
const TRUST_BADGES = [
  {
    icon: ShieldCheck,
    label: 'Paiement sécurisé',
    sub: 'CB, Visa, Mastercard',
  },
  {
    icon: Truck,
    label: `Livraison offerte dès ${FREE_SHIPPING_THRESHOLD_CENTS / 100}€`,
    sub: `Sinon dès ${formatShippingPrice(MONDIAL_RELAY.priceCents)} (relais)`,
  },
  {
    icon: Store,
    label: 'Click & Collect gratuit',
    sub: 'Souvent prêt en quelques minutes',
  },
  {
    icon: Headphones,
    label: 'On répond 7j/7',
    sub: 'Au téléphone et en boutique',
  },
]

const INSTAGRAM_URL = 'https://www.instagram.com/bodystart_nutrition/'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-spruce/10">

      {/* ─── Trust Badges ─── */}
      <div className="border-b border-spruce/10">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-sage flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-spruce" />
                </div>
                <div>
                  <p className="text-ink text-sm font-semibold">{label}</p>
                  <p className="text-ink-mute text-xs">{sub}</p>
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
                  src="/assets/logos/logo-texte-240.png"
                  alt="BodyStart"
                  width={150}
                  height={40}
                  className="h-9 w-auto"
                />
              </Link>
              <p className="text-ink-mute text-sm leading-relaxed mb-6 max-w-xs">
                Compléments sport et santé, conseillés à Coignières, livrés dans le 78.
              </p>
              {/* Reseaux sociaux : Instagram visible, Facebook+TikTok masques tant
                  qu'on n'a pas de comptes prets (spec §3.10). */}
              <div className="flex gap-2.5">
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram BodyStart"
                  className="w-11 h-11 rounded-full bg-sage flex items-center justify-center text-ink hover:bg-fresh hover:text-white transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Colonne 2 : Boutique */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-5">
                Boutique
              </h4>
              <ul className="space-y-1">
                {FOOTER_LINKS.boutique.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="block py-2.5 text-sm text-ink-mute hover:text-spruce transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Colonne 3 : Aide */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-5">
                Aide
              </h4>
              <ul className="space-y-1">
                {FOOTER_LINKS.compte.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="block py-2.5 text-sm text-ink-mute hover:text-spruce transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Colonne 4 : Boutique physique */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-5">
                Notre boutique
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-ink-mute">
                  <MapPin className="w-4 h-4 text-spruce mt-0.5 flex-shrink-0" />
                  <span>8 Rue du Pont des Landes<br />78310 Coignières</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-ink-mute">
                  <Phone className="w-4 h-4 text-spruce flex-shrink-0" />
                  <a href="tel:+33761847580" className="hover:text-spruce transition-colors">
                    07 61 84 75 80
                  </a>
                </li>
                <li className="text-sm">
                  <Link href="/complements-alimentaires-coignieres" className="text-ink-mute hover:text-spruce transition-colors">
                    Compléments alimentaires à Coignières
                  </Link>
                </li>
                <li className="flex items-center gap-3 text-sm text-ink-mute">
                  <Clock className="w-4 h-4 text-spruce flex-shrink-0" />
                  <span>11h à 19h (7j/7)</span>
                </li>
              </ul>
            </div>

          </div>

          {/* ─── Bottom Bar ─── */}
          <div className="border-t border-spruce/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-ink-mute">
              © {new Date().getFullYear()} BodyStart. Tous droits réservés.
            </p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {FOOTER_LINKS.legal.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-xs text-ink-mute hover:text-spruce transition-colors"
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
