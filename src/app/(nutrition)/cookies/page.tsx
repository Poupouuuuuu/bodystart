import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Politique des cookies' }

const cookieTypes = [
  {
    name: 'Cookies essentiels',
    required: true,
    description: 'Indispensables au fonctionnement du site (panier, session, préférences de base). Ils ne peuvent pas être désactivés.',
    examples: 'body-start-cart-id, body-start-customer-token',
  },
  {
    name: 'Cookies analytiques',
    required: false,
    description: 'Nous aident à comprendre comment vous utilisez le site afin d\'en améliorer les performances.',
    examples: 'Google Analytics (anonymisé)',
  },
  {
    name: 'Cookies marketing',
    required: false,
    description: 'Permettent d\'afficher des publicités personnalisées sur d\'autres sites.',
    examples: 'Facebook Pixel, Google Ads',
  },
]

export default function CookiesPage() {
  return (
    <div className="container py-16 md:py-24 max-w-4xl">
      <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-700 hover:text-gray-900 mb-10 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
      </Link>
      <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tight text-gray-900 mb-10 leading-none">Politique des cookies</h1>
      <div className="space-y-8">
        <p className="text-gray-700 font-medium text-lg leading-relaxed mb-6">
          Un cookie est un petit fichier texte stocké sur votre appareil lors de votre visite sur notre site. Voici les types de cookies que nous utilisons :
        </p>
        {cookieTypes.map(({ name, required, description, examples }) => (
          <div key={name} className="bg-white rounded-sm border-2 border-gray-200 shadow-[4px_4px_0_theme(colors.gray.200)] hover:border-gray-900 hover:shadow-[8px_8px_0_theme(colors.gray.900)] hover:-translate-y-1 transition-all p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="font-display font-black uppercase tracking-tight text-2xl text-gray-900">{name}</h2>
              <span className={`text-[10px] font-black uppercase tracking-widest border-2 px-3 py-1 rounded-sm ${required ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                {required ? 'Toujours actif' : 'Optionnel'}
              </span>
            </div>
            <p className="text-gray-700 font-medium text-base mb-6 leading-relaxed">{description}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 pt-4 border-t-2 border-gray-100">Exemples : {examples}</p>
          </div>
        ))}
        <p className="text-gray-700 font-medium mt-12 pt-8 border-t-2 border-gray-200">
          Pour en savoir plus ou exercer vos droits : <a href="mailto:contact@bodystart.fr" className="text-[10px] font-black uppercase tracking-widest text-brand-700 hover:text-gray-900 hover:underline underline-offset-4 ml-2">contact@bodystart.fr</a>
        </p>
      </div>
    </div>
  )
}
