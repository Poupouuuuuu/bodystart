import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ScrollText } from 'lucide-react'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  path: '/cgv',
  title: 'Conditions Générales de Vente',
  description: 'Les conditions générales de vente du site BodyStart.',
})

const sections = [
  {
    title: '1. Objet',
    content: `Les présentes Conditions Générales de Vente (CGV) régissent les ventes effectuées sur le site bodystart-nutrition.fr par la société BODYSTART NUTRITION (SASU au capital de 500 €, RCS Versailles 909 197 469, TVA FR46909197469), dont le siège est situé 8 Rue du Pont des Landes, 78310 Coignières, ci-après dénommée "le Vendeur". Toute commande implique l'acceptation sans réserve des présentes CGV.`,
  },
  {
    title: '2. Produits',
    content: `Les produits proposés à la vente sont des compléments alimentaires. Les photographies et descriptions des produits sont données à titre indicatif. BODYSTART NUTRITION se réserve le droit de modifier la composition des produits sous réserve de maintenir leur qualité équivalente. Les compléments alimentaires ne se substituent pas à une alimentation variée et équilibrée et à un mode de vie sain.`,
  },
  {
    title: '3. Prix',
    content: `Les prix sont indiqués en euros TTC (toutes taxes comprises). BODYSTART NUTRITION se réserve le droit de modifier ses prix à tout moment. Les produits sont facturés au prix en vigueur au moment de la validation de la commande. Les frais de livraison sont indiqués lors du processus de commande.`,
  },
  {
    title: '4. Commandes',
    content: `La commande est définitive après validation du paiement. BODYSTART NUTRITION se réserve le droit d'annuler toute commande pour des raisons légitimes (rupture de stock, adresse de livraison erronée, litige antérieur...). Vous recevrez un email de confirmation dès validation de votre commande.`,
  },
  {
    title: '5. Paiement',
    content: `Le paiement s'effectue en ligne par carte bancaire (Visa, Mastercard, American Express) via notre prestataire Shopify Payments, sécurisé par protocole SSL. BODYSTART NUTRITION ne conserve aucune donnée bancaire.`,
  },
  {
    title: '6. Livraison',
    content: `Les commandes sont expédiées via Colissimo ou Mondial Relay selon le choix effectué au moment de la commande. Les délais de livraison sont indiqués à titre indicatif. La livraison est offerte à partir de 85€ d'achat. Le Click & Collect est disponible dans notre boutique sous 2h après validation de la commande.`,
  },
  {
    title: '7. Droit de rétractation',
    content: `Conformément à l'article L221-18 du Code de la consommation, vous disposez d'un délai de 14 jours à compter de la réception de votre commande pour exercer votre droit de rétractation, sans avoir à justifier de motifs ni à payer de pénalités. Les produits doivent être retournés dans leur état d'origine, non ouverts et non utilisés.`,
  },
  {
    title: '8. Garanties',
    content: `BODYSTART NUTRITION garantit la conformité des produits aux descriptions figurant sur le site. En cas de produit défectueux ou non conforme, vous disposez de 2 ans à compter de la livraison pour invoquer la garantie légale de conformité.`,
  },
  {
    title: '9. Données personnelles',
    content: `Les informations collectées lors de votre commande sont nécessaires au traitement de celle-ci et sont transmises aux prestataires chargés de l'exécution de la commande. Conformément à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification et de suppression de vos données en nous contactant à : bodystartnutrition@gmail.com`,
  },
  {
    title: '10. Litiges',
    content: `En cas de litige, vous pouvez contacter notre service client à bodystartnutrition@gmail.com. À défaut de résolution amiable, vous pouvez saisir la plateforme européenne de règlement en ligne des litiges : ec.europa.eu/consumers/odr. Le droit français est applicable.`,
  },
  {
    title: '11. Médiateur de la consommation',
    // ⚠️ Adam doit adhérer à un médiateur agréé (CM2C, AME Conso, MEDICYS…) puis
    // remplacer la phrase « procédure d'adhésion en cours » par ses coordonnées
    // complètes (nom + adresse postale + site web). Obligation L612-1.
    content: `Conformément à l'article L612-1 du Code de la consommation, après avoir adressé une réclamation écrite au Vendeur (bodystartnutrition@gmail.com) restée sans réponse satisfaisante dans un délai de 60 jours, le consommateur peut recourir gratuitement à un médiateur de la consommation en vue de la résolution amiable du litige. La procédure d'adhésion de BODYSTART NUTRITION auprès d'un médiateur de la consommation agréé est en cours ; ses coordonnées seront publiées sur cette page dès l'adhésion effective. Dans l'intervalle, le consommateur peut recourir à la plateforme européenne de règlement en ligne des litiges : ec.europa.eu/consumers/odr.`,
  },
]

export default function CGVPage() {
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
              <ScrollText className="w-6 h-6 text-spruce" />
            </div>
            <div>
              <h1 className="font-display text-[32px] md:text-[40px] font-extrabold text-spruce leading-[1.1] tracking-tight">
                Conditions Générales de Vente
              </h1>
            </div>
          </div>
          {/* Date FIGÉE volontairement : la date de MAJ d'un document contractuel doit
              refléter le dernier vrai changement, pas le jour de la visite. À mettre à
              jour manuellement à chaque édition des CGV. */}
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute border-t border-spruce/10 pt-4">
            Dernière mise à jour : 3 juillet 2026
          </p>
        </div>

        <div className="space-y-6">
          {sections.map(({ title, content }) => (
            <section
              key={title}
              className="bg-white rounded-2xl border border-spruce/10 p-8"
            >
              <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-spruce mb-4">
                {title}
              </h2>
              <p className="text-ink leading-relaxed text-base">
                {content}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
