import { Fragment, type ReactNode } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ScrollText } from 'lucide-react'
import { buildPageMetadata } from '@/lib/seo'
import { frenchSpacing } from '@/lib/typo'
import { getTermsOfSale } from '@/lib/shopify/policies'
import type { InlineRun, PolicyBlock } from '@/lib/legal/parsePolicyHtml'

export const metadata: Metadata = buildPageMetadata({
  path: '/cgv',
  title: 'Conditions Générales de Vente',
  description: 'Les conditions générales de vente du site BodyStart.',
})

// Texte lu dans Shopify (« Conditions générales de vente »), source unique :
// on modifie les CGV dans l'admin Shopify, jamais ici. La page est régénérée
// au plus toutes les 15 min (ISR). Si Shopify ne répond pas ou renvoie un
// texte vide, getTermsOfSale lève une erreur et Next.js garde la dernière
// version valide. La date « Dernière mise à jour » fait partie du texte Shopify.
export const revalidate = 900

function Runs({ runs }: { runs: InlineRun[] }) {
  return (
    <>
      {runs.map((r, i) => {
        if (r.br) return <br key={i} />
        let node: ReactNode = frenchSpacing(r.text)
        if (r.em) node = <em>{node}</em>
        if (r.strong) node = <strong className="font-semibold">{node}</strong>
        if (r.href) {
          const external = /^https?:/i.test(r.href)
          node = (
            <a
              href={r.href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="text-fresh underline underline-offset-2 break-words hover:text-fresh-deep transition-colors"
            >
              {node}
            </a>
          )
        }
        return <Fragment key={i}>{node}</Fragment>
      })}
    </>
  )
}

function ListBlock({ block }: { block: Extract<PolicyBlock, { type: 'ul' | 'ol' }> }) {
  const className = `${block.type === 'ul' ? 'list-disc' : 'list-decimal'} pl-5 space-y-1.5 text-ink leading-relaxed text-base`
  const items = block.items.map((runs, j) => (
    <li key={j}>
      <Runs runs={runs} />
    </li>
  ))
  return block.type === 'ul' ? <ul className={className}>{items}</ul> : <ol className={className}>{items}</ol>
}

function Blocks({ blocks }: { blocks: PolicyBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((b, i) =>
        b.type === 'p' ? (
          <p key={i} className="text-ink leading-relaxed text-base">
            <Runs runs={b.runs} />
          </p>
        ) : (
          <ListBlock key={i} block={b} />
        )
      )}
    </div>
  )
}

export default async function CGVPage() {
  const { updatedLine, intro, sections } = await getTermsOfSale()

  return (
    <div className="min-h-screen bg-canvas">
      <div className="container py-16 md:py-24 max-w-3xl">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-ink-mute hover:text-spruce -mt-3 mb-7 transition-colors"
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
          {updatedLine && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute border-t border-spruce/10 pt-4">
              {frenchSpacing(updatedLine)}
            </p>
          )}
          {intro.length > 0 && (
            <div className="mt-6">
              <Blocks blocks={intro} />
            </div>
          )}
        </div>

        <div className="space-y-6">
          {sections.map(({ title, blocks }, i) => (
            <section key={i} className="bg-white rounded-2xl border border-spruce/10 p-8">
              <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-spruce mb-4">
                {frenchSpacing(title)}
              </h2>
              <Blocks blocks={blocks} />
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
