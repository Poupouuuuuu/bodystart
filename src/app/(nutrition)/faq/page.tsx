import Link from 'next/link'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import {
  COLISSIMO,
  MONDIAL_RELAY,
  FREE_SHIPPING_THRESHOLD_CENTS,
  formatShippingPrice,
} from '@/lib/shipping'

const FRANCO = `${FREE_SHIPPING_THRESHOLD_CENTS / 100}€`

const FAQ_ITEMS = [
  {
    category: 'Commandes & Livraison',
    questions: [
      { q: 'Quels sont les délais de livraison ?', a: `Mondial Relay (point relais) : ${MONDIAL_RELAY.delayLabel}. Colissimo (domicile) : ${COLISSIMO.delayLabel}. Click & Collect : prêt sous 2h en boutique.` },
      { q: 'La livraison est-elle gratuite ?', a: `La livraison est gratuite à partir de ${FRANCO} d'achat. En dessous, les frais sont de ${formatShippingPrice(MONDIAL_RELAY.priceCents)} en Mondial Relay (point relais) et ${formatShippingPrice(COLISSIMO.priceCents)} en Colissimo (domicile).` },
      { q: 'Comment suivre ma commande ?', a: 'Tu recevras un email avec ton numéro de suivi dès l\'expédition de ton colis. Tu peux aussi consulter ton espace client.' },
      { q: 'Comment fonctionne le Click & Collect ?', a: 'Choisis le Click & Collect au checkout. Ta commande est prête sous 2h. Présente ton email de confirmation en boutique pour retirer tes produits.' },
    ],
  },
  {
    category: 'Produits & Conseils',
    questions: [
      { q: 'Vos produits conviennent-ils aux végétariens/végétaliens ?', a: 'Certains de nos produits sont végétariens ou végétaliens. Chaque fiche produit précise les informations relatives au régime alimentaire.' },
      { q: 'Comment choisir le bon complément pour mon objectif ?', a: 'Parcours nos catégories (Protéines, Créatine, …) depuis le pied de page ou la page Tous les produits, ou utilise la recherche. Tu peux aussi venir en boutique, où nos conseillers te guideront personnellement.' },
      { q: 'Les produits sont-ils contrôlés antidopage ?', a: 'Nous sélectionnons des produits de qualité. Consulte les fiches produits pour les certifications spécifiques. En cas de doute, consulte la liste de l\'AFLD.' },
      { q: 'Peut-on cumuler plusieurs compléments ?', a: 'Oui, mais nous recommandons de demander l\'avis d\'un professionnel de santé avant d\'associer plusieurs produits. Nos conseillers en boutique peuvent t\'aider.' },
    ],
  },
  {
    category: 'Compte & Paiement',
    questions: [
      { q: 'Comment créer un compte ?', a: 'Touche l\'icône compte en haut à droite puis "Créer un compte". Renseigne ton email et un mot de passe. C\'est gratuit et rapide.' },
      { q: 'Quels modes de paiement acceptez-vous ?', a: 'Nous acceptons les cartes bancaires (Visa, Mastercard, Amex) via Shopify Payments. Le paiement est 100% sécurisé (SSL).' },
      { q: 'J\'ai oublié mon mot de passe, que faire ?', a: 'Clique sur "Mot de passe oublié ?" sur la page de connexion. Tu recevras un email de réinitialisation dans quelques minutes.' },
      { q: 'Comment modifier mon adresse de livraison ?', a: 'Connecte-toi à ton espace client, va dans "Mon profil" ou "Mes adresses" pour modifier tes informations.' },
    ],
  },
  {
    category: 'Retours & Remboursements',
    questions: [
      { q: 'Quel est le délai pour retourner un produit ?', a: 'Tu disposes de 14 jours à compter de la réception pour exercer ton droit de rétractation.' },
      { q: 'Comment initier un retour ?', a: 'Contacte-nous par email à bodystartnutrition@gmail.com avec ton numéro de commande. Nous t\'enverrons les instructions de retour.' },
      { q: 'Quand serai-je remboursé(e) ?', a: 'Le remboursement est effectué sous 14 jours après réception et vérification du retour, sur le moyen de paiement initial.' },
    ],
  },
]

// JSON-LD FAQPage — 6 questions principales, reprises MOT POUR MOT des Q/R
// affichées (cf. skill bodystart-seo-geo / references/schema-markup.md : tout ce
// qui est dans le schema doit être visible sur la page). On les référence
// directement depuis FAQ_ITEMS → identité garantie avec l'affichage.
const SCHEMA_FAQ = [
  FAQ_ITEMS[0].questions[0], // Délais de livraison
  FAQ_ITEMS[0].questions[1], // Livraison gratuite
  FAQ_ITEMS[0].questions[3], // Click & Collect
  FAQ_ITEMS[2].questions[1], // Modes de paiement
  FAQ_ITEMS[3].questions[0], // Délai de retour
  FAQ_ITEMS[1].questions[2], // Contrôle antidopage
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: SCHEMA_FAQ.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

export default function FAQPage() {
  return (
    <div className="bg-canvas min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="container py-14 md:py-20 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute hover:text-spruce mb-10 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Retour à l&apos;accueil
        </Link>
        <h1 className="font-display text-[32px] md:text-[40px] font-extrabold text-spruce leading-[1.1] tracking-tight mb-4">
          Questions fréquentes
        </h1>
        <p className="text-ink-mute text-[16px] leading-[1.6] mb-12">
          Tu ne trouves pas la réponse ?{' '}
          <a
            href="mailto:bodystartnutrition@gmail.com"
            className="text-spruce font-semibold hover:underline underline-offset-4"
          >
            Contacte-nous
          </a>
        </p>

        <div className="space-y-12 md:space-y-14">
          {FAQ_ITEMS.map(({ category, questions }) => (
            <section key={category}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-5 flex items-center gap-3">
                <span className="w-8 h-px bg-spruce/20" />
                {category}
              </p>
              <div className="space-y-3">
                {questions.map(({ q, a }) => (
                  <details
                    key={q}
                    className="group bg-white rounded-2xl border border-spruce/10 px-5 md:px-6"
                  >
                    <summary className="flex items-center justify-between gap-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden py-4 md:py-5 text-[15px] font-semibold text-ink">
                      {q}
                      <ChevronDown className="w-4 h-4 text-spruce flex-shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="text-[14px] text-ink-mute leading-[1.65] pb-5">{a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
