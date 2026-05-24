/**
 * Layout /staff/*.
 * Plein écran, sombre, tablette-friendly. Pas de Header/Footer commerciaux.
 */
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Caisse — BodyStart Staff',
  robots: { index: false, follow: false },
}

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f1a14] text-white">
      {children}
    </div>
  )
}
