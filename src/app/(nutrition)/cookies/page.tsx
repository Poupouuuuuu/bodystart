import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Cookie, Lock, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  path: '/cookies',
  title: 'Politique des cookies',
  description: 'Les cookies utilisés sur le site BodyStart et comment les gérer.',
})

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
    name: "Mesure d'audience",
    required: false,
    icon: BarChart3,
    description:
      "Nous aident à comprendre comment vous utilisez le site afin d'en améliorer les performances.",
    examples: 'Google Analytics 4, activé uniquement avec votre consentement',
  },
]

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="container py-16 md:py-24 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-mute hover:text-spruce mb-10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
        </Link>

        <div className="bg-white rounded-2xl border border-spruce/10 p-8 md:p-12 mb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center flex-shrink-0">
              <Cookie className="w-6 h-6 text-spruce" />
            </div>
            <h1 className="font-display text-[32px] md:text-[40px] font-extrabold text-spruce leading-[1.1] tracking-tight">
              Politique des cookies
            </h1>
          </div>
          <p className="text-ink text-base leading-relaxed border-t border-spruce/10 pt-6">
            Un cookie est un petit fichier texte stocké sur votre appareil lors de votre visite sur notre site. Voici les types de cookies que nous utilisons :
          </p>
        </div>

        <div className="space-y-6">
          {cookieTypes.map(({ name, required, icon: Icon, description, examples }) => (
            <div
              key={name}
              className="bg-white rounded-2xl border border-spruce/10 p-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sage flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-spruce" />
                  </div>
                  <h2 className="font-display text-xl font-extrabold tracking-tight text-spruce">
                    {name}
                  </h2>
                </div>
                <span
                  className={cn(
                    'text-[12px] font-semibold px-4 py-1.5 rounded-full',
                    required
                      ? 'bg-sage text-spruce'
                      : 'bg-canvas text-ink-mute'
                  )}
                >
                  {required ? 'Toujours actif' : 'Optionnel'}
                </span>
              </div>
              <p className="text-ink text-base mb-6 leading-relaxed">
                {description}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute pt-4 border-t border-spruce/10">
                Exemples : {examples}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-spruce/10 p-8 mt-10">
          <p className="text-ink">
            Pour en savoir plus ou exercer vos droits :{' '}
            <a
              href="mailto:bodystartnutrition@gmail.com"
              className="text-spruce font-semibold underline underline-offset-4 hover:text-fresh-deep transition-colors"
            >
              bodystartnutrition@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
