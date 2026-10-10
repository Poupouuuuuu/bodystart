import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

/**
 * Relais vers le conseil, sous la description et les tableaux de la fiche.
 * Remplace le 10/10/2026 les blocs génériques « Le conseil BodyStart » et
 * « Ce qu'on vérifie » : aucune promesse sur le produit, seulement où poser
 * sa question.
 */
export default function QuestionProduitV2() {
  return (
    <section className="bg-canvas">
      <div className="container py-10 md:py-12">
        <div className="mx-auto flex max-w-3xl items-start gap-3 text-[15px] leading-relaxed text-ink">
          <MessageCircle className="mt-1 h-5 w-5 flex-shrink-0 text-spruce" aria-hidden="true" />
          <p>
            Une question sur ce produit&nbsp;? Passe nous voir{' '}
            <Link href="/stores" className="font-semibold text-spruce underline underline-offset-2 hover:text-fresh-deep">
              à Coignières
            </Link>{' '}
            ou fais le point en une minute avec{' '}
            <Link href="/conseil" className="font-semibold text-spruce underline underline-offset-2 hover:text-fresh-deep">
              notre guide
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
