import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CoachingProgrammesPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white pt-24 pb-16">
      <div className="container relative">
        <Link href="/coaching" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors mb-12 group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Retour au coaching
        </Link>
        <h1 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tight mb-8">
          LES PROGRAMMES <span className="text-coaching-cyan-400">.</span>
        </h1>
        <div className="bg-gray-900 border-2 border-gray-800 p-8 shadow-[8px_8px_0_theme(colors.black)]">
          <p className="text-xl font-medium text-gray-400 leading-relaxed mb-8">
            Catalogue complet des programmes d'entraînement. Prise de masse, perte de gras, explosivité.
            Page en cours de construction.
          </p>
          <div className="h-64 border-2 border-dashed border-gray-800 flex items-center justify-center text-gray-600 font-black uppercase tracking-widest">
            Bientôt disponible
          </div>
        </div>
      </div>
    </div>
  )
}
