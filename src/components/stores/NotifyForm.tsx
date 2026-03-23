'use client'
import { useState } from 'react'
import { Bell } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NotifyForm() {
  const [email, setEmail] = useState('')

  function handleNotify() {
    if (!email) return
    toast.success("Parfait ! Vous serez parmi les premiers informés de l'ouverture.", { duration: 4000 })
    setEmail('')
  }

  return (
    <div className="bg-gray-50 rounded-2xl p-5 text-center">
      <Bell className="w-8 h-8 text-gray-300 mx-auto mb-3" />
      <p className="font-semibold text-gray-700 mb-1">Ouverture prochaine</p>
      <p className="text-sm text-gray-500 mb-4">Soyez parmi les premiers informés et bénéficiez d&apos;une offre de bienvenue exclusive.</p>
      <div id="newsletter-boutique-b" className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.fr"
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
        <button
          onClick={handleNotify}
          className="px-4 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl hover:bg-brand-800 transition-colors whitespace-nowrap"
        >
          Me prévenir
        </button>
      </div>
    </div>
  )
}
