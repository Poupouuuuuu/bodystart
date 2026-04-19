/**
 * Layout admin — protection serveur réelle (vérification rôle admin).
 *
 * Le middleware a déjà vérifié la présence du cookie Shopify.
 * Ici on vérifie que l'email correspond à un admin déclaré.
 *
 * Les pages enfants peuvent supposer que `requireAdmin()` a passé.
 */
import type { ReactNode } from 'react'
import Link from 'next/link'
import { requireAdmin } from '@/lib/coaching/auth/require-admin'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin()

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="border-b border-[#1a2e23]/10 bg-white">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-display text-lg font-black uppercase tracking-tight text-[#1a2e23]">
              Body Start · Admin
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium text-[#1a2e23]/70">
              <Link href="/admin" className="hover:text-[#1a2e23]">Dashboard</Link>
              <Link href="/admin/programs" className="hover:text-[#1a2e23]">Programmes</Link>
              <Link href="/admin/checkins" className="hover:text-[#1a2e23]">Check-ins</Link>
            </nav>
          </div>
          <div className="text-sm text-[#1a2e23]/60">
            {admin.firstName ?? admin.email}
          </div>
        </div>
      </header>
      <main className="container py-10">{children}</main>
    </div>
  )
}
