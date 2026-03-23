'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { Instagram, Facebook, Youtube, Music2, Phone, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

const FOOTER_LINKS = {
  nutrition: [
    { label: 'Tous les produits', href: '/products' },
    { label: 'Protéines & Gainers', href: '/collections/proteines' },
    { label: 'Créatine', href: '/collections/creatine' },
    { label: 'Vitamines & Santé', href: '/collections/vitamines-et-mineraux' },
    { label: 'Brûleurs & Minceur', href: '/collections/bruleurs-eminceurs' },
    { label: 'Snacks & Barres', href: '/collections/snack-et-bar' },
  ],
  infos: [
    { label: 'À propos', href: '/about' },
    { label: 'Nos boutiques', href: '/stores' },
    { label: 'Blog', href: '/blog' },
    { label: 'Livraison & Retours', href: '/livraison' },
    { label: 'FAQ', href: '/faq' },
  ],
  legal: [
    { label: 'Mentions légales', href: '/mentions-legales' },
    { label: 'CGV', href: '/cgv' },
    { label: 'Politique de confidentialité', href: '/confidentialite' },
    { label: 'Cookies', href: '/cookies' },
  ],
}

export default function Footer() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isCoaching = pathname?.startsWith('/coaching') || searchParams?.get('theme') === 'coaching'

  return (
    <footer className={cn(
      "border-t-4 border-gray-900 pt-20 pb-8 transition-colors duration-300",
      isCoaching ? "bg-gray-950 text-white" : "bg-white text-gray-900"
    )}>
      <div className="container">
        
        <div className="flex flex-col lg:flex-row justify-between items-start gap-16 lg:gap-8 mb-16">
          {/* Brand Info */}
          <div className="lg:max-w-sm">
            <Link href={isCoaching ? "/coaching" : "/"} className="inline-block mb-6">
              <Image
                src={isCoaching ? "/assets/logos/logo-coaching.png" : "/assets/logos/logo-nutrition.png"}
                alt={isCoaching ? "Body Start Coaching" : "Body Start Nutrition"}
                width={160}
                height={48}
                className="h-10 w-auto"
              />
            </Link>
            <p className={cn(
              "text-sm font-medium leading-relaxed mb-8",
              isCoaching ? "text-gray-400" : "text-gray-600"
            )}>
              Fabricant français de compléments alimentaires premium. Formules validées cliniquement, transparence totale, pour athlètes exigeants.
            </p>
            {/* Socials */}
            <div className="flex gap-4">
              {[
                { Icon: Instagram, label: 'Instagram' },
                { Icon: Facebook, label: 'Facebook' },
                { Icon: Youtube, label: 'YouTube' },
                { Icon: Music2, label: 'TikTok' },
              ].map(({ Icon, label }) => (
                <span
                  key={label}
                  aria-label={label}
                  className={cn(
                    "w-12 h-12 border-2 rounded-sm flex items-center justify-center",
                    isCoaching
                      ? "bg-gray-900 border-gray-800 text-gray-600"
                      : "bg-gray-50 border-gray-200 text-gray-300"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </span>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 lg:gap-16 w-full lg:w-auto">
            {/* Colonne 1 */}
            <div>
              <h3 className={cn(
                "font-black text-xs uppercase tracking-widest mb-6 border-l-4 pl-3",
                isCoaching ? "text-white border-coaching-cyan-400" : "text-gray-900 border-brand-500"
              )}>
                Nutrition
              </h3>
              <ul className="space-y-4">
                {FOOTER_LINKS.nutrition.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={cn(
                      "text-sm font-bold transition-colors",
                      isCoaching ? "text-gray-400 hover:text-coaching-cyan-400" : "text-gray-600 hover:text-brand-700"
                    )}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Colonne 2 */}
            <div>
              <h3 className={cn(
                "font-black text-xs uppercase tracking-widest mb-6 border-l-4 pl-3",
                isCoaching ? "text-white border-coaching-cyan-400" : "text-gray-900 border-brand-500"
              )}>
                Informations
              </h3>
              <ul className="space-y-4">
                {FOOTER_LINKS.infos.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={cn(
                      "text-sm font-bold transition-colors",
                      isCoaching ? "text-gray-400 hover:text-coaching-cyan-400" : "text-gray-600 hover:text-brand-700"
                    )}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Colonne 3: Contact */}
            <div className="col-span-2 md:col-span-1">
              <h3 className={cn(
                "font-black text-xs uppercase tracking-widest mb-6 border-l-4 pl-3",
                isCoaching ? "text-white border-white" : "text-gray-900 border-gray-900"
              )}>
                Assistance
              </h3>
              <ul className="space-y-5">
                <li className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0",
                    isCoaching ? "bg-gray-900" : "bg-gray-100"
                  )}>
                    <Phone className={cn("w-3.5 h-3.5", isCoaching ? "text-white" : "text-gray-900")} />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">LUN - VEN | 9H - 18H</span>
                    <a href="tel:+33761847580" className={cn(
                      "text-sm font-black transition-colors",
                      isCoaching ? "text-white hover:text-coaching-cyan-400" : "text-gray-900 hover:text-brand-700"
                    )}>07 61 84 75 80</a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0",
                    isCoaching ? "bg-gray-900" : "bg-gray-100"
                  )}>
                    <Mail className={cn("w-3.5 h-3.5", isCoaching ? "text-white" : "text-gray-900")} />
                  </div>
                  <div>
                     <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">ÉCRIVEZ-NOUS</span>
                    <a href="mailto:contact@bodystart.com" className={cn(
                      "text-sm font-black transition-colors",
                      isCoaching ? "text-white hover:text-coaching-cyan-400" : "text-gray-900 hover:text-brand-700"
                    )}>contact@bodystart.com</a>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className={cn(
        "border-t-2 mt-12 pt-8",
        isCoaching ? "border-gray-900" : "border-gray-100"
      )}>
        <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
            © 2026 BODY START. TOUS DROITS RÉSERVÉS.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {FOOTER_LINKS.legal.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest transition-colors",
                  isCoaching ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-gray-900"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
