/**
 * /admin — Dashboard admin coaching.
 *
 * Sprint 1 : placeholder fonctionnel (preuve que l'auth admin marche).
 * Sprint 3 : remplacer par dashboard réel (file d'attente programmes + stats).
 */
import { requireAdmin } from '@/lib/coaching/auth/require-admin'

export const metadata = {
  title: 'Admin Coaching',
  robots: { index: false, follow: false },
}

export default async function AdminDashboardPage() {
  const admin = await requireAdmin()

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[#1a2e23] mb-2">
        Bienvenue {admin.firstName ?? 'coach'}
      </h1>
      <p className="text-[#1a2e23]/70 mb-8">
        Connexion admin réussie · {admin.email}
      </p>

      <div className="bg-white border border-[#1a2e23]/10 rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold uppercase text-[#1a2e23] mb-4">
          Sprint 1 — Fondations posées
        </h2>
        <ul className="space-y-2 text-sm text-[#1a2e23]/80">
          <li>✅ Bridge Shopify ↔ Supabase fonctionnel</li>
          <li>✅ JWT custom signé avec SUPABASE_JWT_SECRET</li>
          <li>✅ Profil sync automatiquement à la connexion</li>
          <li>✅ Vérification du rôle admin via COACHING_ADMIN_EMAILS</li>
          <li>⏳ Sprint 2 : intake + génération IA + PDF</li>
          <li>⏳ Sprint 3 : file de validation + envoi client</li>
          <li>⏳ Sprint 4 : abonnements + check-ins</li>
          <li>⏳ Sprint 5 : Cal.com + landing finale</li>
        </ul>
      </div>
    </div>
  )
}
