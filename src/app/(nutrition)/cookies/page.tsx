import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Cookie, Lock, BarChart3, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Politique des cookies' }

const cookieTypes = [
  {
    name: 'Cookies essentiels',
    required: true,
    icon: Lock,
    description:
      'Indispensables au fonctionnement du site (panier, session, préférences de base). Ils ne peuvent pas être désactivés.',
    examples: 'body-start-cart-id, body-start-customer-token',
  },
  {
    name: 'Cookies analytiques',
    required: false,
    icon: BarChart3,
    description:
      "Nous aident à comprendre comment vous utilisez le site afin d'en améliorer les performances.",
    examples: 'Google Analytics (anonymisé)',
  },
  {
    name: 'Cookies marketing',
    required: false,
    icon: Megaphone,
    description:
      "Permettent d'afficher des publicités personnalisées sur d'autres sites.",
    examples: 'Facebook Pixel, Google Ads',
  },
]

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#f4f6f1]">
      <div className="container py-16 md:py-24 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4a5f4c] hover:text-[#1a2e23] mb-10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
        </Link>

        <div className="bg-white rounded-[20px] p-8 md:p-12 mb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#89a890]/10 flex items-center justify-center flex-shrink-0">
              <Cookie className="w-6 h-6 text-[#4a5f4c]" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-[#1a2e23] leading-none">
              Politique des cookies
            </h1>
          </div>
          <p className="text-[#4a5f4c] font-medium text-base leading-relaxed border-t border-[#89a890]/20 pt-6">
            Un cookie est un petit fichier texte stocké sur votre appareil lors de votre visite sur notre site. Voici les types de cookies que nous utilisons :
          </p>
        </div>

        <div className="space-y-6">
          {cookieTypes.map(({ name, required, icon: Icon, description, examples }) => (
            <div
              key={name}
              className="bg-white rounded-[20px] p-8 transition-shadow hover:shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#89a890]/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#4a5f4c]" />
                  </div>
                  <h2 className="font-display font-black uppercase tracking-tight text-xl text-[#1a2e23]">
                    {name}
                  </h2>
                </div>
                <span
                  className={cn(
                    'text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full',
                    required
                      ? 'bg-[#7cb98b]/15 text-[#4a5f4c]'
                      : 'bg-[#f4f6f1] text-[#89a890]'
                  )}
                >
                  {required ? 'Toujours actif' : 'Optionnel'}
                </span>
              </div>
              <p className="text-[#4a5f4c] font-medium text-base mb-6 leading-relaxed">
                {description}
              </p>
              <p className="text-xs font-bold uppercase tracking-widest text-[#89a890] pt-4 border-t border-[#89a890]/10">
                Exemples : {examples}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[20px] p-8 mt-10">
          <p className="text-[#4a5f4c] font-medium">
            Pour en savoir plus ou exercer vos droits :{' '}
            <a
              href="mailto:contact@bodystart.fr"
              className="text-[#7cb98b] hover:text-[#1a2e23] font-bold underline underline-offset-4 transition-colors"
            >
              contact@bodystart.fr
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
