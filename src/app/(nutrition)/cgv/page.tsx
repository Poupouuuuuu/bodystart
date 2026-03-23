import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Conditions Générales de Vente' }

const sections = [
  {
    title: '1. Objet',
    content: `Les présentes Conditions Générales de Vente (CGV) régissent les ventes effectuées sur le site bodystart.fr par la société Body Start, ci-après dénommée "le Vendeur". Toute commande implique l'acceptation sans réserve des présentes CGV.`,
  },
  {
    title: '2. Produits',
    content: `Les produits proposés à la vente sont des compléments alimentaires. Les photographies et descriptions des produits sont données à titre indicatif. Body Start se réserve le droit de modifier la composition des produits sous réserve de maintenir leur qualité équivalente. Les compléments alimentaires ne se substituent pas à une alimentation variée et équilibrée et à un mode de vie sain.`,
  },
  {
    title: '3. Prix',
    content: `Les prix sont indiqués en euros TTC (toutes taxes comprises). Body Start se réserve le droit de modifier ses prix à tout moment. Les produits sont facturés au prix en vigueur au moment de la validation de la commande. Les frais de livraison sont indiqués lors du processus de commande.`,
  },
  {
    title: '4. Commandes',
    content: `La commande est définitive après validation du paiement. Body Start se réserve le droit d'annuler toute commande pour des raisons légitimes (rupture de stock, adresse de livraison erronée, litige antérieur...). Vous recevrez un email de confirmation dès validation de votre commande.`,
  },
  {
    title: '5. Paiement',
    content: `Le paiement s'effectue en ligne par carte bancaire (Visa, Mastercard, American Express) via notre prestataire Shopify Payments, sécurisé par protocole SSL. Body Start ne conserve aucune donnée bancaire.`,
  },
  {
    title: '6. Livraison',
    content: `Les commandes sont expédiées via Colissimo ou Mondial Relay selon le choix effectué au moment de la commande. Les délais de livraison sont indiqués à titre indicatif. La livraison est offerte à partir de 60€ d'achat. Le Click & Collect est disponible dans notre boutique sous 2h après validation de la commande.`,
  },
  {
    title: '7. Droit de rétractation',
    content: `Conformément à l'article L221-18 du Code de la consommation, vous disposez d'un délai de 14 jours à compter de la réception de votre commande pour exercer votre droit de rétractation, sans avoir à justifier de motifs ni à payer de pénalités. Les produits doivent être retournés dans leur état d'origine, non ouverts et non utilisés.`,
  },
  {
    title: '8. Garanties',
    content: `Body Start garantit la conformité des produits aux descriptions figurant sur le site. En cas de produit défectueux ou non conforme, vous disposez de 2 ans à compter de la livraison pour invoquer la garantie légale de conformité.`,
  },
  {
    title: '9. Données personnelles',
    content: `Les informations collectées lors de votre commande sont nécessaires au traitement de celle-ci et sont transmises aux prestataires chargés de l'exécution de la commande. Conformément à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification et de suppression de vos données en nous contactant à : contact@bodystart.fr`,
  },
  {
    title: '10. Litiges',
    content: `En cas de litige, vous pouvez contacter notre service client à contact@bodystart.fr. À défaut de résolution amiable, vous pouvez saisir la plateforme européenne de règlement en ligne des litiges : ec.europa.eu/consumers/odr. Le droit français est applicable.`,
  },
]

export default function CGVPage() {
  return (
    <div className="container py-16 md:py-24 max-w-3xl">
      <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-700 hover:text-gray-900 mb-10 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
      </Link>
      <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tight text-gray-900 mb-4 leading-none">Conditions Générales de Vente</h1>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-12 pb-8 border-b-2 border-gray-200">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <div className="space-y-12">
        {sections.map(({ title, content }) => (
          <section key={title}>
            <h2 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-gray-900 mb-4">{title}</h2>
            <p className="text-gray-700 font-medium leading-relaxed text-base">{content}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
