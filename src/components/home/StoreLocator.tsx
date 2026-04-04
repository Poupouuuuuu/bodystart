'use client'

import { MapPin, Clock, Phone, ArrowRight, Bell, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { BODY_START_STORES, COMING_SOON_STORES } from '@/lib/shopify/types'
import { useEffect, useState } from 'react'

// Vérifie si la boutique est actuellement ouverte
function useIsStoreOpen(hours: { day: string; open: string; close: string }[]) {
  const [isOpen, setIsOpen] = useState<boolean | null>(null)

  useEffect(() => {
    function check() {
      const now = new Date()
      const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
      const currentHour = parisTime.getHours()
      const currentMinute = parisTime.getMinutes()
      const currentTime = currentHour * 60 + currentMinute

      const dayIndex = parisTime.getDay()
      const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
      const todayName = dayNames[dayIndex]

      for (const h of hours) {
        if (h.open === 'Fermé') continue

        const isAllDays = h.day.includes('–') && h.day.includes('Lundi') && h.day.includes('Dimanche')
        const isToday = isAllDays || h.day.includes(todayName)

        if (isToday) {
          const [openH, openM] = h.open.split(':').map(Number)
          const [closeH, closeM] = h.close.split(':').map(Number)
          const openTime = openH * 60 + openM
          const closeTime = closeH * 60 + closeM

          setIsOpen(currentTime >= openTime && currentTime < closeTime)
          return
        }
      }
      setIsOpen(false)
    }

    check()
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [hours])

  return isOpen
}

const GOOGLE_MAPS_URL = 'https://www.google.com/maps/dir/?api=1&destination=8+Rue+du+Pont+des+Landes+78310+Coigni%C3%A8res'

export default function StoreLocator() {
  const store = BODY_START_STORES[0]
  const isOpen = useIsStoreOpen(store.hours)

  return (
    <section className="relative bg-[#1a2e23] py-24 overflow-hidden border-t border-[#4a5f4c]/20">
      
      {/* Premium Dark Mode Grid Background */}
      <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#4a5f4c 1px, transparent 1px), linear-gradient(90deg, #4a5f4c 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="container relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#f4f6f1]/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#f4f6f1] mb-6 backdrop-blur-md border border-[#f4f6f1]/20">
            <ShoppingBag className="w-3.5 h-3.5" />
            Click & Collect gratuit
          </div>
          <h2 className="font-display text-[35px] md:text-[50px] font-black uppercase text-[#f4f6f1] tracking-tighter mb-4 leading-none">
            VENEZ NOUS VOIR EN BOUTIQUE
          </h2>
          <p className="text-[#89a890] text-sm md:text-base max-w-xl mx-auto font-medium">
            Commandez en ligne et récupérez vos produits en boutique sous 2h. Conseil personnalisé et sans frais de livraison.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Boutique active */}
          <div className="bg-[#f4f6f1] rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden">
            {/* Subtle highlight */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/40 blur-3xl rounded-full" />
            
            {/* Badge + Nom */}
            <div className="flex items-start gap-4 mb-8">
              <div className="w-14 h-14 bg-[#1a2e23]/5 border border-[#1a2e23]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-[#1a2e23]" />
              </div>
              <div className="pt-1">
                {/* Badge ouvert/fermé dynamique */}
                {isOpen !== null && (
                  isOpen ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100/50 border border-green-200 rounded-full text-[10px] font-bold uppercase tracking-widest text-green-700 mb-3">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Ouverte maintenant
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-red-600 mb-3">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      Fermée actuellement
                    </div>
                  )
                )}
                <h3 className="font-display font-black uppercase text-2xl text-[#1a2e23]">{store.name}</h3>
                <p className="text-[#4a5f4c] text-sm mt-1 font-medium">{store.address}, {store.city}</p>
              </div>
            </div>

            {/* Horaires */}
            <div className="space-y-3 mb-8 pt-6 border-t border-[#1a2e23]/10">
              {store.hours.map((h, i) => (
                <div key={i} className="flex justify-between text-[13px] font-medium">
                  <span className="flex items-center gap-2 text-[#4a5f4c]">
                    <Clock className="w-4 h-4 text-[#89a890]" />
                    {h.day}
                  </span>
                  <span className={h.open === 'Fermé' ? 'text-[#89a890]' : 'text-[#1a2e23] font-bold'}>
                    {h.open === 'Fermé' ? 'Fermé' : `${h.open} – ${h.close}`}
                  </span>
                </div>
              ))}
            </div>

            {/* Téléphone + Itinéraire */}
            <div className="flex items-center justify-between pt-6 border-t border-[#1a2e23]/10">
              <a
                href={`tel:${store.phone.replace(/\s/g, '')}`}
                className="flex items-center gap-2 text-[#4a5f4c] text-sm font-bold hover:text-[#1a2e23] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#89a890]" />
                {store.phone}
              </a>
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1a2e23] text-white rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-[#2e4f3c] transition-all"
              >
                Itinéraire <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Boutique B — Coming soon */}
          {COMING_SOON_STORES.map((cs) => (
            <div key={cs.id} className="bg-transparent border border-[#89a890]/30 rounded-[32px] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              
              <div>
                <div className="flex items-start gap-4 mb-6 relative z-10">
                  <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-white/40" />
                  </div>
                  <div className="pt-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-white mb-3">
                      <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse" />
                      {cs.openingDate}
                    </div>
                    <h3 className="font-display font-black uppercase text-2xl text-white mt-1 opacity-80">{cs.name}</h3>
                    <p className="text-[#89a890] text-sm mt-1 font-medium">{cs.city}</p>
                  </div>
                </div>
                <p className="text-white/60 text-sm leading-relaxed relative z-10">
                  Notre deuxième boutique ouvre prochainement en Île-de-France. Soyez informé en avant-première de l'ouverture et des offres exclusives de lancement.
                </p>
              </div>
              <Link
                href="/stores#newsletter-boutique-b"
                className="mt-8 inline-flex items-center justify-center gap-2 w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full text-[11px] uppercase tracking-widest font-bold transition-all relative z-10"
              >
                <Bell className="w-4 h-4" />
                Me prévenir de l'ouverture
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
