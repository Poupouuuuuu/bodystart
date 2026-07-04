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
    <div className="min-h-screen bg-canvas">
      <div className="container py-16 md:py-24 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-mute hover:text-spruce mb-10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
        </Link>

        <div className="bg-white rounded-2xl border border-spruce/10 p-8 md:p-12 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center flex-shrink-0">
              <Scale className="w-6 h-6 text-spruce" />
            </div>
            <h1 className="font-display text-[32px] md:text-[40px] font-extrabold text-spruce leading-[1.1] tracking-tight">
              Mentions légales
            </h1>
          </div>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-spruce/10 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-sage flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-spruce" />
              </div>
              <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-spruce">
                Éditeur du site
              </h2>
            </div>
            <div className="bg-canvas rounded-2xl p-6 md:p-8 text-base text-ink space-y-3">
              <p>
                <strong className="font-semibold text-spruce">Raison sociale :</strong> BODYSTART NUTRITION — SASU au capital de 500 €
              </p>
              <p>
                <strong className="font-semibold text-spruce">SIREN :</strong> 909 197 469
              </p>
              <p>
                <strong className="font-semibold text-spruce">SIRET (siège) :</strong> 909 197 469 00010
              </p>
              <p>
                <strong className="font-semibold text-spruce">RCS :</strong> Versailles
              </p>
              <p>
                <strong className="font-semibold text-spruce">TVA intracommunautaire :</strong> FR46909197469
              </p>
              <p>
                <strong className="font-semibold text-spruce">Siège social :</strong> 8 Rue du Pont des Landes, 78310 Coignières
              </p>
              <p>
                <strong className="font-semibold text-spruce">Email :</strong>{' '}
                <a href="mailto:bodystartnutrition@gmail.com" className="text-spruce font-semibold underline underline-offset-4 hover:text-fresh-deep transition-colors">
                  bodystartnutrition@gmail.com
                </a>
              </p>
              <p>
                <strong className="font-semibold text-spruce">Téléphone :</strong> 07 61 84 75 80
              </p>
              <p>
                <strong className="font-semibold text-spruce">Directeur de la publication :</strong> Adam Le Charlès
              </p>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-spruce/10 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-sage flex items-center justify-center flex-shrink-0">
                <Server className="w-5 h-5 text-spruce" />
              </div>
              <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-spruce">
                Hébergement
              </h2>
            </div>
            <div className="bg-canvas rounded-2xl p-6 md:p-8 text-base text-ink space-y-3">
              <p>
                <strong className="font-semibold text-spruce">Hébergeur :</strong> Vercel Inc.
              </p>
              <p>
                <strong className="font-semibold text-spruce">Adresse :</strong> 340 Pine Street, Suite 701, San Francisco, CA 94104, USA
              </p>
              <p>
                <strong className="font-semibold text-spruce">Site :</strong> vercel.com
              </p>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-spruce/10 p-8">
            <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-spruce mb-4">
              Propriété intellectuelle
            </h2>
            <p className="text-ink text-base leading-relaxed">
              L&apos;ensemble du contenu de ce site (textes, images, logos, icônes) est la propriété exclusive de BODYSTART NUTRITION et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction, distribution ou utilisation sans autorisation préalable est strictement interdite.
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-spruce/10 p-8">
            <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-spruce mb-4">
              Limitation de responsabilité
            </h2>
            <p className="text-ink text-base leading-relaxed">
              BODYSTART NUTRITION s&apos;efforce d&apos;assurer l&apos;exactitude des informations diffusées sur ce site. Cependant, BODYSTART NUTRITION ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité des informations mises à disposition. En conséquence, BODYSTART NUTRITION décline toute responsabilité pour toute imprécision, inexactitude ou omission portant sur des informations disponibles sur ce site.
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-spruce/10 p-8">
            <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-spruce mb-4">
              Droit applicable
            </h2>
            <p className="text-ink text-base leading-relaxed">
              Le présent site est régi par le droit français. En cas de litige, les tribunaux français seront seuls compétents.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
