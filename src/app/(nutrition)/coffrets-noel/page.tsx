import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import PackCardV2 from '@/components/pack/v2/PackCardV2'
import { getCoffrets } from '@/lib/shopify'
import { buildPageMetadata } from '@/lib/seo'
import { COFFRETS_CHEMIN, coffretsVisibles, dateCoffrets } from '@/lib/coffrets'

// 5 min : un coffret publié ou épuisé dans Shopify apparaît vite.
export const revalidate = 300

// Ouverte du 2/11 au 24/12 (heure de Paris) et seulement si un coffret est
// publié sur le site ; 404 sinon (lib/coffrets). Hors production,
// ?coffrets_date=2026-11-10 force la date : la page devient alors dynamique.
// En production, searchParams n'est jamais lu, la page reste en ISR.
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

async function ouverte(searchParams: Props['searchParams']) {
  const env = process.env.VERCEL_ENV
  const forcee = env === 'production' ? undefined : (await searchParams).coffrets_date
  if (!coffretsVisibles(dateCoffrets(forcee, env))) return []
  return getCoffrets().catch((err) => {
    console.error('[CoffretsPage] lecture des coffrets en échec :', err)
    return []
  })
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const coffrets = await ouverte(searchParams)
  if (coffrets.length === 0) return {}
  return buildPageMetadata({
    path: COFFRETS_CHEMIN,
    title: 'Coffrets de Noël : idées cadeaux sport et nutrition',
    description:
      'Coffrets de Noël composés par BodyStart à Coignières (78) : snacks protéinés, compléments et protéines. Retrait gratuit en boutique ou livraison en France.',
  })
}

export default async function CoffretsNoelPage({ searchParams }: Props) {
  const coffrets = await ouverte(searchParams)
  if (coffrets.length === 0) notFound()

  return (
    <div className="bg-canvas min-h-screen">
      <section className="pt-10 md:pt-12">
        <div className="container">
          <div className="max-w-3xl">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">
              Idées cadeaux
            </p>
            <h1 className="mb-5 font-display text-[36px] font-extrabold leading-[1.05] tracking-tight text-spruce sm:text-[44px] lg:text-[52px]">
              Coffrets de Noël
            </h1>
            <p className="max-w-[600px] text-[16px] leading-[1.6] text-ink-mute md:text-[17px]">
              On a composé ces coffrets au comptoir, avec des produits qu&apos;on conseille tous
              les jours : de quoi faire plaisir à un sportif, du plus gourmand au plus complet.
              Retrait gratuit à Coignières ou livraison partout en France.
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="container">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {coffrets.map((p) => (
              <PackCardV2 key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <div className="container">
          <div className="mx-auto flex max-w-3xl flex-col gap-5 rounded-2xl border border-spruce/10 bg-white p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">
                Pas sûr du bon coffret ?
              </p>
              <p className="font-display text-[18px] font-bold leading-tight text-spruce md:text-[20px]">
                Dis-nous pour qui c&apos;est, on t&apos;oriente.
              </p>
            </div>
            <Link
              href="/conseil"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-spruce px-6 py-3 text-[14px] font-semibold text-spruce transition-colors hover:bg-spruce/5"
            >
              Demander conseil
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
