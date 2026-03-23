'use client'
import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

const BULLETS = [
  '-10% sur votre première commande',
  'Conseils d\'experts chaque semaine',
  'Accès early-bird aux nouveaux produits',
]

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSent(true)
    toast.success('Inscription confirmée ! Votre code -10% arrive dans votre boîte mail.', { duration: 5000 })
  }

  return (
    <section className="bg-gray-50 border-y-2 border-gray-200 overflow-hidden relative py-20">

      <div className="container relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <span className="text-brand-700 text-xs font-black uppercase tracking-widest block mb-4 border-l-4 border-brand-500 pl-3">
              Newsletter
            </span>
            <h2 className="font-display text-4xl lg:text-[2.5rem] font-black uppercase tracking-tight text-gray-900 mb-4 leading-[1.1]">
              Rejoignez la communauté Body Start
            </h2>
            <p className="text-gray-600 text-lg font-medium mb-8 leading-relaxed max-w-lg">
              Conseils nutrition, offres exclusives et nouveautés — directement dans votre boîte mail. Désabonnement en 1 clic.
            </p>
            <ul className="space-y-3">
              {BULLETS.map((bullet) => (
                <li key={bullet} className="flex items-center gap-3 text-sm text-gray-800 font-medium">
                  <span className="text-brand-700 font-bold">✓</span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          {/* Right */}
          <div>
            <div className="bg-gray-950 border-2 border-gray-900 rounded-sm p-8 shadow-[8px_8px_0_theme(colors.gray.900)] max-w-md mx-auto lg:max-w-none">
              {sent ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 text-brand-500 mx-auto mb-4" />
                  <p className="text-white font-black uppercase tracking-tight text-xl mb-2">Vous êtes inscrit !</p>
                  <p className="text-brand-200 text-sm">
                    Votre code -10% arrive dans votre boîte mail.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-white font-black uppercase tracking-tight text-xl mb-1">Inscrivez-vous gratuitement</p>
                  <p className="text-gray-400 text-sm mb-6 font-medium">
                    Et recevez -10% dès votre première commande.
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.fr"
                      required
                      className="w-full px-4 py-3.5 rounded-sm bg-gray-900 border-2 border-gray-800 text-white placeholder:text-gray-600 text-sm font-bold focus:outline-none focus:border-brand-500 focus:bg-gray-950 transition-colors"
                    />
                    <button
                      type="submit"
                      className="w-full py-4 bg-brand-700 border-2 border-transparent text-white font-black uppercase tracking-widest text-xs rounded-sm hover:border-gray-900 hover:shadow-[4px_4px_0_theme(colors.gray.900)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150"
                    >
                      Rejoindre la communauté
                    </button>
                  </form>
                </>
              )}
              <p className="text-gray-600 text-[10px] uppercase tracking-widest font-black text-center mt-6">
                Déjà +2000 abonnés &bull; 0 spam garanti
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
