import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield, ChevronRight } from 'lucide-react'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  path: '/confidentialite',
  title: 'Politique de confidentialité',
  description: 'Comment BodyStart traite tes données personnelles, conformément au RGPD.',
})

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="container py-16 md:py-24 max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-mute hover:text-spruce mb-10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
        </Link>

        <div className="bg-white rounded-2xl border border-spruce/10 p-8 md:p-12 mb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-spruce" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-[32px] md:text-[40px] font-extrabold text-spruce leading-[1.1] tracking-tight break-words">
                Politique de confidentialité
              </h1>
            </div>
          </div>
          {/* Date figée : refléter le dernier vrai changement, pas le jour de la visite. */}
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute border-t border-spruce/10 pt-4">
            Dernière mise à jour : 3 juillet 2026
          </p>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-spruce/10 p-8">
            <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-spruce mb-4">
              Responsable du traitement
            </h2>
            <p className="text-ink leading-relaxed text-base">
              BODYSTART NUTRITION (SASU) dont le siège social est situé 8 Rue du Pont des Landes, 78310 Coignières, est responsable du traitement de vos données personnelles. Contact :{' '}
              <a
                href="mailto:bodystartnutrition@gmail.com"
                className="text-spruce font-semibold underline underline-offset-4 hover:text-fresh-deep transition-colors"
              >
                bodystartnutrition@gmail.com
              </a>
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-spruce/10 p-8">
            <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-spruce mb-4">
              Données collectées
            </h2>
            <ul className="space-y-3 list-none">
              {[
                "Données d'identification : prénom, nom, adresse email",
                'Données de livraison : adresse postale, téléphone',
                "Données de commande : historique d'achats, préférences",
                'Données de navigation : cookies, adresse IP (anonymisée)',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-ink">
                  <ChevronRight className="w-4 h-4 text-spruce mt-1 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white rounded-2xl border border-spruce/10 p-8">
            <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-spruce mb-4">
              Finalités du traitement
            </h2>
            <p className="text-ink leading-relaxed text-base">
              Vos données sont utilisées pour : le traitement et le suivi des commandes, la gestion de votre compte client, l&apos;envoi de newsletters (avec votre consentement), l&apos;amélioration de nos services et la prévention des fraudes.
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-spruce/10 p-8">
            <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-spruce mb-4">
              Conservation des données
            </h2>
            <p className="text-ink leading-relaxed text-base">
              Vos données sont conservées pendant 3 ans à compter de votre dernière interaction avec BODYSTART NUTRITION, ou pendant la durée légalement requise.
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-spruce/10 p-8">
            <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-spruce mb-4">
              Vos droits
            </h2>
            <p className="text-ink leading-relaxed text-base mb-4">
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
                <li key={right} className="flex items-start gap-3 text-ink">
                  <ChevronRight className="w-4 h-4 text-spruce mt-1 flex-shrink-0" />
                  {right}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-ink">
              Pour exercer ces droits, contactez-nous :{' '}
              <a
                href="mailto:bodystartnutrition@gmail.com"
                className="text-spruce font-semibold underline underline-offset-4 hover:text-fresh-deep transition-colors"
              >
                bodystartnutrition@gmail.com
              </a>
            </p>
            <p className="mt-4 text-ink leading-relaxed">
              Vous disposez également du droit d&apos;introduire une réclamation auprès de la CNIL :{' '}
              <a
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-spruce font-semibold underline underline-offset-4 hover:text-fresh-deep transition-colors"
              >
                www.cnil.fr
              </a>
              .
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-spruce/10 p-8">
            <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-spruce mb-4">
              Sous-traitants et transferts
            </h2>
            <p className="text-ink leading-relaxed text-base">
              Pour fournir nos services, nous faisons appel à des sous-traitants : Shopify
              (hébergement de la boutique et traitement des commandes), nos prestataires de
              paiement (Shopify Payments) et de livraison (Colissimo, Mondial Relay). Certaines
              de ces données peuvent être transférées en dehors de l&apos;Union européenne ;
              dans ce cas, ces transferts sont encadrés par des garanties appropriées (clauses
              contractuelles types de la Commission européenne ou mécanismes équivalents).
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-spruce/10 p-8">
            <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-spruce mb-4">
              Mesure d&apos;audience (Google Analytics 4)
            </h2>
            <p className="text-ink leading-relaxed text-base">
              Avec votre consentement, nous utilisons Google Analytics 4 (fourni par Google
              Ireland Limited) pour mesurer l&apos;audience du site : pages consultées, parcours de
              navigation et événements e-commerce (vues de produits, ajouts au panier). Cela nous
              aide à améliorer le site et nos fiches produit.
            </p>
            <ul className="mt-4 space-y-3 list-none">
              {[
                "Finalité : mesure d'audience et amélioration du site, à l'exclusion de toute publicité ciblée.",
                "Base légale : votre consentement (article 6.1.a du RGPD), recueilli via le bandeau cookies. Aucun script de mesure n'est chargé tant que vous n'avez pas accepté — aucun cookie ni aucune requête vers Google avant ce choix.",
                "Données traitées : un identifiant de mesure pseudonyme, les pages vues et les événements, l'adresse IP étant tronquée par Google.",
                'Conservation : les données de mesure d’audience sont conservées 14 mois maximum.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-ink">
                  <ChevronRight className="w-4 h-4 text-spruce mt-1 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-ink leading-relaxed">
              Vous pouvez retirer votre consentement à tout moment via le bandeau cookies, ou
              installer le{' '}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-spruce font-semibold underline underline-offset-4 hover:text-fresh-deep transition-colors"
              >
                module de désactivation de Google Analytics
              </a>
              . Ces données pouvant être transférées hors de l&apos;Union européenne, le transfert
              est encadré par des garanties appropriées (clauses contractuelles types).
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-spruce/10 p-8">
            <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-spruce mb-4">
              Cookies
            </h2>
            <p className="text-ink leading-relaxed text-base">
              Notre site utilise des cookies essentiels au fonctionnement du site (panier, session) et des cookies analytiques (avec votre consentement). Consultez notre{' '}
              <Link
                href="/cookies"
                className="text-spruce font-semibold underline underline-offset-4 hover:text-fresh-deep transition-colors"
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
