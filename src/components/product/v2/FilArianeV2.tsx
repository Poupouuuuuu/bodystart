import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Rayon } from '@/lib/rayon-fiche'

/**
 * Fil d'Ariane de la fiche : Accueil › Rayon › Produit (SEO 2). Liens
 * visibles dans le HTML, même ordre que le BreadcrumbList du JSON-LD. Le nom
 * du produit n'est affiché qu'à partir de sm : sur téléphone, le h1 juste en
 * dessous le donne déjà.
 */
export default function FilArianeV2({ rayon, titre }: { rayon: Rayon; titre: string }) {
  const lien = 'inline-flex min-h-[44px] items-center transition-colors hover:text-spruce'
  const separateur = <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
  return (
    <nav aria-label="Fil d'Ariane" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-[13px] text-ink-mute">
        <li className="flex-shrink-0">
          <Link href="/" className={lien}>
            Accueil
          </Link>
        </li>
        <li aria-hidden="true">{separateur}</li>
        <li className="min-w-0">
          <Link href={rayon.href} className={`${lien} max-w-full`}>
            <span className="truncate">{rayon.label}</span>
          </Link>
        </li>
        <li aria-hidden="true" className="hidden sm:block">
          {separateur}
        </li>
        <li className="hidden min-w-0 sm:block">
          <span aria-current="page" className="block truncate text-ink">
            {titre}
          </span>
        </li>
      </ol>
    </nav>
  )
}
