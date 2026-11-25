import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import JeuRoue from '@/components/jeu/JeuRoue'

// Page privée ouverte par le QR code en caisse (/jeu?src=qr) : hors du groupe
// (nutrition) pour n'avoir ni menu ni panier, absente du sitemap et des liens
// internes, jamais indexée.
export const metadata: Metadata = {
  title: 'Jeu de la roue',
  description: 'Tourne la roue et gagne un cadeau à retirer dans ta boutique BodyStart de Coignières.',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

export default function JeuPage() {
  return (
    <main className="flex min-h-[100svh] flex-col bg-canvas px-4 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="mx-auto mb-6 flex w-full max-w-md justify-center">
        <Image
          src="/assets/logos/logo-v2-horizontal.png"
          alt="BodyStart Nutrition"
          width={155}
          height={50}
          priority
          className="h-10 w-auto"
        />
      </header>

      <div className="flex-1">
        <JeuRoue />
      </div>

      <footer className="mx-auto mt-10 w-full max-w-md text-center text-[12.5px] leading-relaxed text-ink-mute">
        <p>BodyStart Nutrition, 8 rue du Pont des Landes, 78310 Coignières</p>
        <Link href="/confidentialite" className="inline-flex min-h-[44px] items-center underline underline-offset-2 hover:text-spruce">
          Données personnelles
        </Link>
      </footer>
    </main>
  )
}
