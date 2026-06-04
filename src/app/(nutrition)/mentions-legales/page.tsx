import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Scale, Building2, Server } from 'lucide-react'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  path: '/mentions-legales',
  title: 'Mentions légales',
  description: 'Mentions légales du site BodyStart.',
})

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-[#f4f6f1]">
      <div className="container py-16 md:py-24 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4a5f4c] hover:text-[#1a2e23] mb-10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
        </Link>

        <div className="bg-white rounded-[20px] p-8 md:p-12 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#89a890]/10 flex items-center justify-center flex-shrink-0">
              <Scale className="w-6 h-6 text-[#4a5f4c]" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-[#1a2e23] leading-none">
              Mentions légales
            </h1>
          </div>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-[20px] p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#89a890]/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-[#4a5f4c]" />
              </div>
              <h2 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-[#1a2e23]">
                Éditeur du site
              </h2>
            </div>
            <div className="bg-[#f4f6f1] rounded-2xl p-6 md:p-8 text-base text-[#4a5f4c] font-medium space-y-3">
              <p>
                <strong className="font-black text-[#1a2e23]">Raison sociale :</strong> BODYSTART NUTRITION — SASU au capital de 500 €
              </p>
              <p>
                <strong className="font-black text-[#1a2e23]">SIREN :</strong> 909 197 469
              </p>
              <p>
                <strong className="font-black text-[#1a2e23]">SIRET (siège) :</strong> 909 197 469 00010
              </p>
              <p>
                <strong className="font-black text-[#1a2e23]">RCS :</strong> Versailles
              </p>
              <p>
                <strong className="font-black text-[#1a2e23]">TVA intracommunautaire :</strong> FR46909197469
              </p>
              <p>
                <strong className="font-black text-[#1a2e23]">Siège social :</strong> 8 Rue du Pont des Landes, 78310 Coignières
              </p>
              <p>
                <strong className="font-black text-[#1a2e23]">Email :</strong>{' '}
                <a href="mailto:bodystartnutrition@gmail.com" className="text-[#7cb98b] hover:text-[#1a2e23] font-bold underline underline-offset-4 transition-colors">
                  bodystartnutrition@gmail.com
                </a>
              </p>
              <p>
                <strong className="font-black text-[#1a2e23]">Téléphone :</strong> 07 61 84 75 80
              </p>
              <p>
                <strong className="font-black text-[#1a2e23]">Directeur de la publication :</strong> Adam Le Charlès
              </p>
            </div>
          </section>

          <section className="bg-white rounded-[20px] p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#89a890]/10 flex items-center justify-center flex-shrink-0">
                <Server className="w-5 h-5 text-[#4a5f4c]" />
              </div>
              <h2 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-[#1a2e23]">
                Hébergement
              </h2>
            </div>
            <div className="bg-[#f4f6f1] rounded-2xl p-6 md:p-8 text-base text-[#4a5f4c] font-medium space-y-3">
              <p>
                <strong className="font-black text-[#1a2e23]">Hébergeur :</strong> Vercel Inc.
              </p>
              <p>
                <strong className="font-black text-[#1a2e23]">Adresse :</strong> 340 Pine Street, Suite 701, San Francisco, CA 94104, USA
              </p>
              <p>
                <strong className="font-black text-[#1a2e23]">Site :</strong> vercel.com
              </p>
            </div>
          </section>

          <section className="bg-white rounded-[20px] p-8">
            <h2 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-[#1a2e23] mb-4">
              Propriété intellectuelle
            </h2>
            <p className="text-[#4a5f4c] font-medium text-base leading-relaxed">
              L&apos;ensemble du contenu de ce site (textes, images, logos, icônes) est la propriété exclusive de BODYSTART NUTRITION et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction, distribution ou utilisation sans autorisation préalable est strictement interdite.
            </p>
          </section>

          <section className="bg-white rounded-[20px] p-8">
            <h2 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-[#1a2e23] mb-4">
              Limitation de responsabilité
            </h2>
            <p className="text-[#4a5f4c] font-medium text-base leading-relaxed">
              BODYSTART NUTRITION s&apos;efforce d&apos;assurer l&apos;exactitude des informations diffusées sur ce site. Cependant, BODYSTART NUTRITION ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité des informations mises à disposition. En conséquence, BODYSTART NUTRITION décline toute responsabilité pour toute imprécision, inexactitude ou omission portant sur des informations disponibles sur ce site.
            </p>
          </section>

          <section className="bg-white rounded-[20px] p-8">
            <h2 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-[#1a2e23] mb-4">
              Droit applicable
            </h2>
            <p className="text-[#4a5f4c] font-medium text-base leading-relaxed">
              Le présent site est régi par le droit français. En cas de litige, les tribunaux français seront seuls compétents.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
