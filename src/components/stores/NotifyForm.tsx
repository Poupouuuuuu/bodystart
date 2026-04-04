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
    <div className="bg-[#1a2e23]/5 rounded-2xl p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-[#1a2e23]/10 flex items-center justify-center mx-auto mb-4">
        <Bell className="w-6 h-6 text-[#1a2e23]" />
      </div>
      <p className="font-display font-black text-[#1a2e23] uppercase tracking-tight text-sm mb-1">Ouverture prochaine</p>
      <p className="text-[13px] text-[#4a5f4c] mb-5 font-medium">Soyez parmi les premiers informés et bénéficiez d&apos;une offre de bienvenue exclusive.</p>
      <div id="newsletter-boutique-b" className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.fr"
          className="flex-1 px-5 py-3 rounded-full border border-[#1a2e23]/10 text-sm text-[#1a2e23] placeholder:text-[#89a890] focus:outline-none focus:ring-2 focus:ring-[#1a2e23]/20 focus:border-transparent bg-white"
        />
        <button
          onClick={handleNotify}
          className="px-6 py-3 bg-[#1a2e23] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#2e4f3c] transition-all whitespace-nowrap"
        >
          Me prévenir
        </button>
      </div>
    </div>
  )
}
