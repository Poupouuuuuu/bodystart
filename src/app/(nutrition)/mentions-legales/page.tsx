import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Mentions légales' }

export default function MentionsLegalesPage() {
  return (
    <div className="container py-16 md:py-24 max-w-4xl">
      <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-700 hover:text-gray-900 mb-10 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
      </Link>
      <div className="max-w-none">
        <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tight text-gray-900 mb-12 leading-none">Mentions légales</h1>

        <section className="mb-12">
          <h2 className="font-display text-2xl font-black uppercase tracking-tight text-gray-900 mb-4">Éditeur du site</h2>
          <div className="bg-gray-50 rounded-sm border-2 border-gray-200 p-6 md:p-8 text-base text-gray-700 font-medium space-y-3">
            <p><strong className="font-black text-gray-900">Raison sociale :</strong> Body Start [Forme juridique à compléter]</p>
            <p><strong className="font-black text-gray-900">SIRET :</strong> À compléter</p>
            <p><strong className="font-black text-gray-900">Siège social :</strong> Adresse Boutique A, Ville A</p>
            <p><strong className="font-black text-gray-900">Email :</strong> contact@bodystart.fr</p>
            <p><strong className="font-black text-gray-900">Téléphone :</strong> +33 X XX XX XX XX</p>
            <p><strong className="font-black text-gray-900">Directeur de publication :</strong> [Nom du gérant]</p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-2xl font-black uppercase tracking-tight text-gray-900 mb-4">Hébergement</h2>
          <div className="bg-gray-50 rounded-sm border-2 border-gray-200 p-6 md:p-8 text-base text-gray-700 font-medium space-y-3">
            <p><strong className="font-black text-gray-900">Hébergeur :</strong> Vercel Inc.</p>
            <p><strong className="font-black text-gray-900">Adresse :</strong> 340 Pine Street, Suite 701, San Francisco, CA 94104, USA</p>
            <p><strong className="font-black text-gray-900">Site :</strong> vercel.com</p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-2xl font-black uppercase tracking-tight text-gray-900 mb-4">Propriété intellectuelle</h2>
          <p className="text-gray-700 font-medium text-lg leading-relaxed">
            L'ensemble du contenu de ce site (textes, images, logos, icônes) est la propriété exclusive de Body Start et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction, distribution ou utilisation sans autorisation préalable est strictement interdite.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-2xl font-black uppercase tracking-tight text-gray-900 mb-4">Limitation de responsabilité</h2>
          <p className="text-gray-700 font-medium text-lg leading-relaxed">
            Body Start s'efforce d'assurer l'exactitude des informations diffusées sur ce site. Cependant, Body Start ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition. En conséquence, Body Start décline toute responsabilité pour toute imprécision, inexactitude ou omission portant sur des informations disponibles sur ce site.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-black uppercase tracking-tight text-gray-900 mb-4">Droit applicable</h2>
          <p className="text-gray-700 font-medium text-lg leading-relaxed">
            Le présent site est régi par le droit français. En cas de litige, les tribunaux français seront seuls compétents.
          </p>
        </section>
      </div>
    </div>
  )
}
