'use client'
import { useState } from 'react'
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || loading) return

    setLoading(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.status === 409) {
        toast.error('Cet email est déjà inscrit à la newsletter.')
        return
      }

      if (!res.ok) {
        toast.error(data.error ?? 'Une erreur est survenue.')
        return
      }

      setSent(true)
      toast.success('Inscription confirmée ! Votre code -10% arrive dans votre boîte mail.', { duration: 5000 })
    } catch {
      toast.error('Erreur réseau. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section bg-cream-200">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-brand-500 text-sm font-bold uppercase mb-2">Newsletter</p>
          <h2 className="font-display text-3xl md:text-4xl font-black uppercase text-gray-900 mb-4">
            Rejoignez la communauté
          </h2>
          <p className="text-gray-500 text-lg mb-8 max-w-lg mx-auto">
            Conseils nutrition, offres exclusives et nouveautés. Recevez -10% sur votre première commande.
          </p>

          {sent ? (
            <div className="bg-white rounded-2xl border border-cream-300 p-8 shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-brand-500 mx-auto mb-4" />
              <p className="font-bold text-gray-900 text-lg mb-1">Vous êtes inscrit !</p>
              <p className="text-gray-500 text-sm">
                Votre code -10% arrive dans votre boîte mail.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.fr"
                required
                disabled={loading}
                className="flex-1 px-5 py-4 rounded-full border border-cream-300 bg-white text-gray-900 placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-8 py-4 flex-shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Inscription...
                  </>
                ) : (
                  <>
                    S&apos;inscrire
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-gray-400 text-xs mt-6">
            +2000 abonnés. Désinscription en 1 clic. 0 spam garanti.
          </p>
        </div>
      </div>
    </section>
  )
}
