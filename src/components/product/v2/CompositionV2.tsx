import { AlertCircle } from 'lucide-react'
import type { ShopifyMetafield } from '@/lib/shopify/types'

interface CompositionV2Props {
  metafields?: ShopifyMetafield[] | null
}

/**
 * Section Composition + Allergenes V2.
 * Source : metafields Shopify custom.composition (multiline) +
 *          custom.allergenes (text).
 *
 * Si les deux sont vides : section completement masquee (pas de placeholder
 * vide qui pollue la fiche).
 * Si composition vide mais allergenes presents : on affiche quand meme la
 * section avec juste l'encart allergenes (cas marginal).
 */

function extract(metafields: ShopifyMetafield[] | null | undefined, key: string): string | null {
  if (!metafields || metafields.length === 0) return null
  const found = metafields.find((m) => m && m.key === key)
  const value = found?.value?.trim()
  return value || null
}

export default function CompositionV2({ metafields }: CompositionV2Props) {
  const composition = extract(metafields, 'composition')
  const allergenes = extract(metafields, 'allergenes')

  if (!composition && !allergenes) return null

  return (
    <section className="bg-canvas">
      <div className="container py-14 md:py-18">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
              Composition
            </p>
            <h2 className="font-display text-[28px] md:text-[36px] font-extrabold text-spruce leading-[1.1] tracking-tight">
              Ce qu&apos;il y a dans le pot
            </h2>
          </div>

          {composition && (
            <div className="bg-white border border-spruce/10 rounded-2xl p-7 md:p-9 mb-5">
              <p className="text-[14px] md:text-[15px] text-ink leading-[1.7] whitespace-pre-line">
                {composition}
              </p>
            </div>
          )}

          {allergenes && (
            <div className="flex items-start gap-3 bg-mustard/15 border border-mustard/40 rounded-2xl p-5">
              <AlertCircle className="w-5 h-5 text-mustard-ink flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-widest text-mustard-ink mb-1">
                  Allergènes
                </p>
                <p className="text-[14px] text-ink leading-[1.5]">{allergenes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
