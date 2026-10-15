import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { lienPage } from '@/lib/catalogue'
import { cn } from '@/lib/utils'

/**
 * Liens vers chaque page du catalogue (SEO 2) : /products, /products/page/2…
 * Vrais liens dans le HTML, sans JavaScript, toutes les pages listées pour
 * qu'aucun produit ne soit à plus de deux clics de /products. Sans état :
 * utilisable dans le catalogue client comme dans les pages serveur.
 */
export default function PaginationCatalogue({ page, pages }: { page: number; pages: number }) {
  if (pages <= 1) return null
  const pastille =
    'inline-flex h-11 min-w-[44px] items-center justify-center rounded-full px-3 text-[14px] font-semibold transition-colors'
  const lien = cn(pastille, 'bg-white text-spruce shadow-soft hover:bg-sage')
  return (
    <nav aria-label="Pages du catalogue" className="mt-8">
      <p className="mb-3 text-center text-[12px] text-ink-mute">Tout le catalogue, page par page</p>
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        {page > 1 && (
          <li>
            <Link href={lienPage(page - 1)} rel="prev" className={lien}>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Page précédente</span>
            </Link>
          </li>
        )}
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            {n === page ? (
              <span aria-current="page" className={cn(pastille, 'bg-spruce text-white')}>
                {n}
              </span>
            ) : (
              <Link href={lienPage(n)} className={lien} aria-label={`Page ${n}`}>
                {n}
              </Link>
            )}
          </li>
        ))}
        {page < pages && (
          <li>
            <Link href={lienPage(page + 1)} rel="next" className={lien}>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Page suivante</span>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
