import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield, ChevronRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Politique de confidentialité' }

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-[#f4f6f1]">
      <div className="container py-16 md:py-24 max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4a5f4c] hover:text-[#1a2e23] mb-10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
        </Link>

        <div className="bg-white rounded-[20px] p-8 md:p-12 mb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#89a890]/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-[#4a5f4c]" />
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-[#1a2e23] leading-none">
                Politique de confidentialité
              </h1>
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#89a890] border-t border-[#89a890]/20 pt-4">
            Dernière mise à jour :{' '}
            {new Date().toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-[20px] p-8">
            <h2 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-[#1a2e23] mb-4">
              Responsable du traitement
            </h2>
            <p className="text-[#4a5f4c] font-medium leading-relaxed text-base">
              Body Start, dont le siège social est à Adresse Boutique A, est responsable du traitement de vos données personnelles. Contact :{' '}
              <a
                href="mailto:contact@bodystart.fr"
                className="text-[#7cb98b] hover:text-[#1a2e23] font-bold underline underline-offset-4 transition-colors"
              >
                contact@bodystart.fr
              </a>
            </p>
          </section>

          <section className="bg-white rounded-[20px] p-8">
            <h2 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-[#1a2e23] mb-4">
              Données collectées
            </h2>
            <ul className="space-y-3 list-none">
              {[
                "Données d'identification : prénom, nom, adresse email",
                'Données de livraison : adresse postale, téléphone',
                "Données de commande : historique d'achats, préférences",
                'Données de navigation : cookies, adresse IP (anonymisée)',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[#4a5f4c] font-medium">
                  <ChevronRight className="w-4 h-4 text-[#7cb98b] mt-1 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white rounded-[20px] p-8">
            <h2 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-[#1a2e23] mb-4">
              Finalités du traitement
            </h2>
            <p className="text-[#4a5f4c] font-medium leading-relaxed text-base">
              Vos données sont utilisées pour : le traitement et le suivi des commandes, la gestion de votre compte client, l&apos;envoi de newsletters (avec votre consentement), l&apos;amélioration de nos services et la prévention des fraudes.
            </p>
          </section>

          <section className="bg-white rounded-[20px] p-8">
            <h2 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-[#1a2e23] mb-4">
              Conservation des données
            </h2>
            <p className="text-[#4a5f4c] font-medium leading-relaxed text-base">
              Vos données sont conservées pendant 3 ans à compter de votre dernière interaction avec Body Start, ou pendant la durée légalement requise.
            </p>
          </section>

          <section className="bg-white rounded-[20px] p-8">
            <h2 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-[#1a2e23] mb-4">
              Vos droits
            </h2>
            <p className="text-[#4a5f4c] font-medium leading-relaxed text-base mb-4">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="space-y-3 list-none">
              {[
                "Droit d'accès à vos données",
                'Droit de rectification',
                'Droit à l\'effacement ("droit à l\'oubli")',
                'Droit à la portabilité',
                "Droit d'opposition au traitement",
                'Droit de retirer votre consentement à tout moment',
              ].map((right) => (
                <li key={right} className="flex items-start gap-3 text-[#4a5f4c] font-medium">
                  <ChevronRight className="w-4 h-4 text-[#7cb98b] mt-1 flex-shrink-0" />
                  {right}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[#4a5f4c] font-medium">
              Pour exercer ces droits, contactez-nous :{' '}
              <a
                href="mailto:contact@bodystart.fr"
                className="text-[#7cb98b] hover:text-[#1a2e23] font-bold underline underline-offset-4 transition-colors"
              >
                contact@bodystart.fr
              </a>
            </p>
          </section>

          <section className="bg-white rounded-[20px] p-8">
            <h2 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-[#1a2e23] mb-4">
              Cookies
            </h2>
            <p className="text-[#4a5f4c] font-medium leading-relaxed text-base">
              Notre site utilise des cookies essentiels au fonctionnement du site (panier, session) et des cookies analytiques (avec votre consentement). Consultez notre{' '}
              <Link
                href="/cookies"
                className="text-[#7cb98b] hover:text-[#1a2e23] font-bold underline underline-offset-4 transition-colors"
              >
                politique cookies
              </Link>{' '}
              pour plus de détails.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
