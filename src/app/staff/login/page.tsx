/**
 * /staff/login
 *
 * Page de connexion staff loyalty (caisse boutique).
 * Form email/password → Supabase Auth signInWithPassword → cookie session.
 *
 * Conçu pour tablette plein écran : champs grands, focus auto, contraste élevé.
 */
import type { Metadata } from 'next'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = {
  title: 'Connexion staff — BodyStart',
  robots: { index: false, follow: false },
}

export default function StaffLoginPage({
  searchParams,
}: {
  searchParams?: { next?: string; reason?: string }
}) {
  const next = searchParams?.next ?? '/staff/caisse'
  const reason = searchParams?.reason

  return (
    <div className="min-h-screen bg-[#0f1a14] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-block w-14 h-14 rounded-2xl bg-[#1a2e23] text-white font-display font-black text-xl flex items-center justify-center mb-4">
            BS
          </div>
          <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1a2e23] mb-2">
            Caisse BodyStart
          </h1>
          <p className="text-sm text-[#4a5f4c]">Connexion staff</p>
        </div>

        {reason === 'not_staff' && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-900">
            Ton compte n&apos;est pas autorisé sur cette caisse. Contacte un admin pour activer
            ton accès.
          </div>
        )}

        <LoginForm nextUrl={next} />

        <p className="mt-8 text-center text-xs text-[#4a5f4c]/60">
          Accès réservé au personnel BodyStart. La session reste active sur cet appareil.
        </p>
      </div>
    </div>
  )
}
