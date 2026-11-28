import Link from 'next/link'
import Image from '@/components/ui/Image'
import { Package, Plus } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

export interface ArticleSuggestion {
  handle: string
  title: string
  image: string | null
  price: string
  currency: string
}

/**
 * Un seul petit article pour atteindre le prochain palier (lib/paliers/suggestion),
 * dans la carte des paliers du tiroir. Bouton « Ajouter » : ajout direct (mono-variante).
 */
export default function SuggestionPalier({
  article,
  suffit,
  ajout,
  onAjouter,
  onOuvrirFiche,
}: {
  article: ArticleSuggestion
  suffit: boolean
  ajout: boolean
  onAjouter: () => void
  onOuvrirFiche: () => void
}) {
  return (
    <div className="mt-3 rounded-lg bg-sage/60 p-2.5">
      <p className="mb-2 text-[11px] font-medium leading-snug text-ink-mute">
        {suffit ? 'Petit ajout pour y arriver\u00a0:' : 'Petit ajout pour t’en rapprocher\u00a0:'}
      </p>
      <div className="flex items-center gap-2.5">
        <Link
          href={`/products/${article.handle}`}
          onClick={onOuvrirFiche}
          className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-white"
        >
          {article.image ? (
            <Image src={article.image} alt={article.title} fill className="object-contain p-1" sizes="44px" />
          ) : (
            <Package className="h-5 w-5 text-spruce/25" aria-hidden="true" />
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-ink">{article.title}</p>
          <p className="text-[12px] font-bold leading-snug text-spruce">
            {formatPrice({ amount: article.price, currencyCode: article.currency })}
          </p>
        </div>
        <button
          type="button"
          onClick={onAjouter}
          disabled={ajout}
          aria-label={`Ajouter ${article.title} au panier`}
          className="press inline-flex h-11 flex-shrink-0 items-center gap-1 rounded-full border border-spruce/20 bg-white px-3 text-[12px] font-semibold text-spruce transition-colors hover:bg-sage disabled:opacity-50"
        >
          {ajout ? '…' : (
            <>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Ajouter
            </>
          )}
        </button>
      </div>
    </div>
  )
}
