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
      // Fuseau horaire Paris
      const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
      const currentHour = parisTime.getHours()
      const currentMinute = parisTime.getMinutes()
      const currentTime = currentHour * 60 + currentMinute

      // Chercher l'horaire du jour
      const dayIndex = parisTime.getDay() // 0=Dimanche
      const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
      const todayName = dayNames[dayIndex]

      for (const h of hours) {
        if (h.open === 'Fermé') continue

        // Matcher "Lundi – Dimanche" (tous les jours) ou le jour spécifique
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
    const interval = setInterval(check, 60000) // Revérifier chaque minute
    return () => clearInterval(interval)
  }, [hours])

  return isOpen
}

// Google Maps URL pour l'itinéraire
const GOOGLE_MAPS_URL = 'https://www.google.com/maps/dir/?api=1&destination=8+Rue+du+Pont+des+Landes+78310+Coigni%C3%A8res'

export default function StoreLocator() {
  const store = BODY_START_STORES[0]
  const isOpen = useIsStoreOpen(store.hours)

  return (
    <section className="relative bg-[#345f44] py-16 lg:py-24 overflow-hidden">
      {/* Motif de fond subtil */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.5) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="container relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-white/80 mb-4">
            <ShoppingBag className="w-3.5 h-3.5" />
            Click & Collect gratuit
          </div>
          <h2 className="font-display text-2xl md:text-3xl lg:text-[40px] font-black uppercase text-white tracking-tight mb-3">
            VENEZ NOUS VOIR EN BOUTIQUE
          </h2>
          <p className="text-white/60 text-base max-w-xl mx-auto">
            Commandez en ligne et récupérez vos produits en boutique sous 2h. Conseil personnalisé et sans frais de livraison.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Boutique active */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg">
            {/* Badge + Nom */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                {/* Badge ouvert/fermé dynamique */}
                {isOpen !== null && (
                  isOpen ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full text-xs font-bold text-green-600 mb-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Ouverte maintenant
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 rounded-full text-xs font-bold text-red-500 mb-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      Fermée actuellement
                    </div>
                  )
                )}
                <h3 className="font-display font-black uppercase text-lg text-gray-900 mt-1">{store.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{store.address}</p>
                <p className="text-gray-500 text-sm">{store.city}</p>
              </div>
            </div>

            {/* Horaires */}
            <div className="space-y-2 mb-6 border-t border-cream-200 pt-5">
              {store.hours.map((h, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-3.5 h-3.5 text-brand-400" />
                    {h.day}
                  </span>
                  <span className={h.open === 'Fermé' ? 'text-gray-400' : 'text-gray-700 font-medium'}>
                    {h.open === 'Fermé' ? 'Fermé' : `${h.open} – ${h.close}`}
                  </span>
                </div>
              ))}
            </div>

            {/* Téléphone + Itinéraire */}
            <div className="flex items-center justify-between pt-5 border-t border-cream-200">
              <a
                href={`tel:${store.phone.replace(/\s/g, '')}`}
                className="flex items-center gap-2 text-gray-500 text-sm hover:text-brand-500 transition-colors"
              >
                <Phone className="w-4 h-4 text-brand-400" />
                {store.phone}
              </a>
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-brand-500 hover:text-brand-600 text-sm font-bold transition-colors"
              >
                Itinéraire <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Boutique B — Coming soon */}
          {COMING_SOON_STORES.map((cs) => (
            <div key={cs.id} className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-white/60" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white/70 mb-2">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      {cs.openingDate}
                    </div>
                    <h3 className="font-display font-black uppercase text-lg text-white/80 mt-1">{cs.name}</h3>
                    <p className="text-white/50 text-sm mt-1">{cs.city}</p>
                  </div>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">
                  Notre deuxième boutique ouvre prochainement en Île-de-France. Soyez informé en avant-première de l&apos;ouverture et des offres de lancement.
                </p>
              </div>
              <Link
                href="/stores#newsletter-boutique-b"
                className="mt-6 inline-flex items-center justify-center gap-2 w-full py-3.5 bg-white text-[#345f44] rounded-full text-sm uppercase font-bold hover:bg-white/90 transition-all shadow-md"
              >
                <Bell className="w-4 h-4" />
                Me prévenir de l&apos;ouverture
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
