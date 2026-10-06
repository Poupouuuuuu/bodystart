import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Scale, Building2, Server, type LucideIcon } from 'lucide-react'
import { buildPageMetadata } from '@/lib/seo'
import { frenchSpacing } from '@/lib/typo'
import { getLegalNotice } from '@/lib/shopify/policies'
import PolicyBlocks from '@/components/legal/PolicyBlocks'

export const metadata: Metadata = buildPageMetadata({
  path: '/mentions-legales',
  title: 'Mentions légales',
  description: 'Mentions légales du site BodyStart.',
})

// Texte lu dans Shopify (« Mentions légales »), source unique : on le modifie
// dans l'admin Shopify, jamais ici. Même fonctionnement que /cgv : régénération
// au plus toutes les 15 min, dernière version valide gardée si Shopify ne
// répond pas ou renvoie un texte vide.
export const revalidate = 900

// Rubriques « fiche » (une ligne « Libellé : valeur » par information) :
// icône et encadré, libellés en gras.
function sheetIcon(title: string): LucideIcon | null {
  if (/éditeur/i.test(title)) return Building2
  if (/hébergement/i.test(title)) return Server
  return null
}

export default async function MentionsLegalesPage() {
  const { intro, sections } = await getLegalNotice()

  return (
    <div className="min-h-screen bg-canvas">
      <div className="container py-16 md:py-24 max-w-4xl">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-ink-mute hover:text-spruce -mt-3 mb-7 transition-colors"
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
          {intro.length > 0 && (
            <div className="mt-6">
              <PolicyBlocks blocks={intro} linkEmails />
            </div>
          )}
        </div>

        <div className="space-y-6">
          {sections.map(({ title, blocks }, i) => {
            const Icon = sheetIcon(title)
            return (
              <section key={i} className="bg-white rounded-2xl border border-spruce/10 p-8">
                {Icon ? (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-sage flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-spruce" />
                      </div>
                      <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-spruce">
                        {frenchSpacing(title)}
                      </h2>
                    </div>
                    <div className="bg-canvas rounded-2xl p-6 md:p-8">
                      <PolicyBlocks blocks={blocks} boldLabels linkEmails />
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-spruce mb-4">
                      {frenchSpacing(title)}
                    </h2>
                    <PolicyBlocks blocks={blocks} linkEmails />
                  </>
                )}
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
