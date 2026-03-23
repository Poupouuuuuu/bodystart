import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export const metadata: Metadata = { title: 'Politique de confidentialité' }

export default function ConfidentialitePage() {
  return (
    <div className="container py-16 md:py-24 max-w-3xl">
      <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-700 hover:text-gray-900 mb-10 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
      </Link>
      <div className="flex items-center gap-4 mb-8 border-b-2 border-gray-200 pb-12">
        <div className="w-16 h-16 bg-white border-2 border-gray-200 shadow-[4px_4px_0_theme(colors.gray.200)] rounded-sm flex items-center justify-center flex-shrink-0">
          <Shield className="w-8 h-8 text-brand-700" />
        </div>
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tight text-gray-900 leading-none mb-3">Politique de confidentialité</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="space-y-12 text-gray-700 font-medium leading-relaxed text-base">
        <section>
          <h2 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-gray-900 mb-4">Responsable du traitement</h2>
          <p>Body Start, dont le siège social est à Adresse Boutique A, est responsable du traitement de vos données personnelles. Contact : <a href="mailto:contact@bodystart.fr" className="text-[10px] font-black uppercase tracking-widest text-brand-700 hover:text-gray-900 hover:underline underline-offset-4">contact@bodystart.fr</a></p>
        </section>
        <section>
          <h2 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-gray-900 mb-4">Données collectées</h2>
          <ul className="space-y-3 list-none">
            {['Données d\'identification : prénom, nom, adresse email', 'Données de livraison : adresse postale, téléphone', 'Données de commande : historique d\'achats, préférences', 'Données de navigation : cookies, adresse IP (anonymisée)'].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="w-2 h-2 bg-brand-500 rounded-sm mt-2 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-gray-900 mb-4">Finalités du traitement</h2>
          <p>Vos données sont utilisées pour : le traitement et le suivi des commandes, la gestion de votre compte client, l'envoi de newsletters (avec votre consentement), l'amélioration de nos services et la prévention des fraudes.</p>
        </section>
        <section>
          <h2 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-gray-900 mb-4">Conservation des données</h2>
          <p>Vos données sont conservées pendant 3 ans à compter de votre dernière interaction avec Body Start, ou pendant la durée légalement requise.</p>
        </section>
        <section>
          <h2 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-gray-900 mb-4">Vos droits</h2>
          <p className="mb-4">Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="space-y-3 list-none">
            {['Droit d\'accès à vos données', 'Droit de rectification', 'Droit à l\'effacement ("droit à l\'oubli")', 'Droit à la portabilité', 'Droit d\'opposition au traitement', 'Droit de retirer votre consentement à tout moment'].map((right) => (
              <li key={right} className="flex items-start gap-3">
                <span className="w-2 h-2 bg-brand-500 rounded-sm mt-2 flex-shrink-0" />
                {right}
              </li>
            ))}
          </ul>
          <p className="mt-6">Pour exercer ces droits, contactez-nous : <a href="mailto:contact@bodystart.fr" className="text-[10px] font-black uppercase tracking-widest text-brand-700 hover:text-gray-900 hover:underline underline-offset-4">contact@bodystart.fr</a></p>
        </section>
        <section>
          <h2 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-gray-900 mb-4">Cookies</h2>
          <p>Notre site utilise des cookies essentiels au fonctionnement du site (panier, session) et des cookies analytiques (avec votre consentement). Consultez notre <Link href="/cookies" className="text-[10px] font-black uppercase tracking-widest text-brand-700 hover:text-gray-900 hover:underline underline-offset-4">politique cookies</Link> pour plus de détails.</p>
        </section>
      </div>
    </div>
  )
}
