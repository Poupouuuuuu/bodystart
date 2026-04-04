'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const FAQ_ITEMS = [
  {
    category: 'Commandes & Livraison',
    questions: [
      { q: 'Quels sont les délais de livraison ?', a: 'Colissimo : 2 à 4 jours ouvrés. Mondial Relay : 3 à 5 jours ouvrés. Click & Collect : disponible sous 2h en boutique.' },
      { q: 'La livraison est-elle gratuite ?', a: 'La livraison est gratuite à partir de 60€ d\'achat. En dessous, les frais sont de 5,90€ en Colissimo et 3,90€ en Mondial Relay.' },
      { q: 'Comment suivre ma commande ?', a: 'Vous recevrez un email avec votre numéro de suivi dès l\'expédition de votre colis. Vous pouvez aussi consulter votre espace client.' },
      { q: 'Comment fonctionne le Click & Collect ?', a: 'Choisissez le Click & Collect au checkout. Votre commande est prête sous 2h. Présentez votre email de confirmation en boutique pour retirer vos produits.' },
    ],
  },
  {
    category: 'Produits & Conseils',
    questions: [
      { q: 'Vos produits conviennent-ils aux végétariens/végétaliens ?', a: 'Certains de nos produits sont végétariens ou végétaliens. Chaque fiche produit précise les informations relatives au régime alimentaire.' },
      { q: 'Comment choisir le bon complément pour mon objectif ?', a: 'Consultez notre section "Shop by Objectif" sur la page d\'accueil ou venez en boutique où nos conseillers vous guideront personnellement.' },
      { q: 'Les produits sont-ils contrôlés antidopage ?', a: 'Nous sélectionnons des produits de qualité. Consultez les fiches produits pour les certifications spécifiques. En cas de doute, consultez la liste de l\'AFLD.' },
      { q: 'Peut-on cumuler plusieurs compléments ?', a: 'Oui, mais nous recommandons de demander l\'avis d\'un professionnel de santé avant d\'associer plusieurs produits. Nos conseillers en boutique peuvent vous aider.' },
    ],
  },
  {
    category: 'Compte & Paiement',
    questions: [
      { q: 'Comment créer un compte ?', a: 'Cliquez sur "Créer un compte" en haut à droite. Renseignez votre email et un mot de passe. C\'est gratuit et rapide.' },
      { q: 'Quels modes de paiement acceptez-vous ?', a: 'Nous acceptons les cartes bancaires (Visa, Mastercard, Amex) via Shopify Payments. Le paiement est 100% sécurisé (SSL).' },
      { q: 'J\'ai oublié mon mot de passe, que faire ?', a: 'Cliquez sur "Mot de passe oublié ?" sur la page de connexion. Vous recevrez un email de réinitialisation dans quelques minutes.' },
      { q: 'Comment modifier mon adresse de livraison ?', a: 'Connectez-vous à votre espace client, allez dans "Mon profil" ou "Mes adresses" pour modifier vos informations.' },
    ],
  },
  {
    category: 'Retours & Remboursements',
    questions: [
      { q: 'Quel est le délai pour retourner un produit ?', a: 'Vous disposez de 14 jours à compter de la réception pour exercer votre droit de rétractation.' },
      { q: 'Comment initier un retour ?', a: 'Contactez-nous par email à contact@bodystart.fr avec votre numéro de commande. Nous vous enverrons les instructions de retour.' },
      { q: 'Quand serai-je remboursé(e) ?', a: 'Le remboursement est effectué sous 14 jours après réception et vérification du retour, sur le moyen de paiement initial.' },
    ],
  },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={cn(
      "bg-white rounded-[20px] overflow-hidden transition-all duration-300 border",
      open ? "border-[#1a2e23]/20 shadow-md" : "border-[#1a2e23]/5 shadow-sm hover:shadow-md"
    )}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left bg-transparent"
      >
        <span className="font-display font-bold uppercase tracking-tight text-[#1a2e23] text-sm pr-4 leading-tight">{question}</span>
        <div className={cn("w-8 h-8 rounded-full bg-[#1a2e23]/5 flex items-center justify-center flex-shrink-0 transition-all", open && "bg-[#1a2e23] text-white")}>
          <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', open ? 'rotate-180' : 'text-[#1a2e23]')} />
        </div>
      </button>
      {open && (
        <div className="px-6 pb-6 text-sm font-medium text-[#4a5f4c] leading-relaxed border-t border-[#1a2e23]/5 pt-4">
          {answer}
        </div>
      )}
    </div>
  )
}

export default function FAQPage() {
  return (
    <div className="bg-[#f4f6f1] min-h-screen">
      <div className="container py-16 md:py-20 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#89a890] hover:text-[#1a2e23] mb-10 transition-colors group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Retour à l&apos;accueil
        </Link>
        <h1 className="font-display text-[40px] md:text-[60px] font-black uppercase tracking-tighter text-[#1a2e23] mb-4 leading-none">Questions fréquentes</h1>
        <p className="text-[#4a5f4c] font-medium mb-12 text-base">Vous ne trouvez pas la réponse ? <a href="mailto:contact@bodystart.fr" className="text-[#1a2e23] font-bold hover:underline underline-offset-4">Contactez-nous</a></p>

        <div className="space-y-14">
          {FAQ_ITEMS.map(({ category, questions }) => (
            <section key={category}>
              <h2 className="font-display font-black text-[#1a2e23] text-sm uppercase tracking-widest mb-6 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-[#1a2e23]/20" />
                {category}
              </h2>
              <div className="space-y-3">
                {questions.map(({ q, a }) => <FAQItem key={q} question={q} answer={a} />)}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
