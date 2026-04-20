/**
 * /coaching/intake
 *
 * Page d'accueil du formulaire d'intake.
 * Vérifie côté serveur :
 *   - Le user a un profile Supabase
 *   - Le user a au moins un intake `pending` (sinon → /coaching/tarifs)
 *   - Le user a déjà consenti RGPD (sinon → /coaching/consentement)
 *
 * Une fois ces checks OK, affiche le formulaire multi-step (Client Component).
 */
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getCustomer } from '@/lib/shopify/customer-server'
import { getSupabaseAdminClient } from '@/lib/coaching/supabase/admin'
import { IntakeForm } from './IntakeForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Mon intake coaching',
  robots: { index: false, follow: false },
}

const SHOPIFY_TOKEN_COOKIE = 'body-start-customer-token'

export default async function IntakePage() {
  const cookieStore = cookies()
  const token = cookieStore.get(SHOPIFY_TOKEN_COOKIE)?.value
  if (!token) redirect('/login?redirect=/coaching/intake')

  const customer = await getCustomer(token)
  if (!customer) redirect('/login?redirect=/coaching/intake')

  const admin = getSupabaseAdminClient()

  // 1. Profile
  const { data: profile } = await admin
    .from('profiles')
    .select('id, email, first_name, last_name, rgpd_consent_at')
    .eq('shopify_customer_id', customer.id)
    .maybeSingle()

  if (!profile) {
    // Profile pas encore créé → soit le user n'a jamais payé, soit le webhook
    // n'a pas encore tourné. On le redirige vers les offres.
    redirect('/coaching/tarifs')
  }

  // 2. Consentement RGPD obligatoire
  if (!profile.rgpd_consent_at) {
    redirect('/coaching/consentement')
  }

  // 3. Trouver l'intake pending le plus récent
  const { data: intake } = await admin
    .from('intakes')
    .select('id, source, status, created_at')
    .eq('user_id', profile.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!intake) {
    // Pas d'intake pending → soit jamais payé, soit déjà rempli
    redirect('/account/coaching')
  }

  return (
    <div className="bg-cream-50 min-h-screen py-12">
      <div className="container max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-black uppercase tracking-tight text-[#1a2e23] mb-3">
            Mon intake coaching
          </h1>
          <p className="text-[#1a2e23]/70 text-sm font-medium">
            Réponds aux questions ci-dessous (≈ 5 min). Plus tu es précis, plus ton programme sera
            adapté. Toutes les informations sont confidentielles et stockées en Europe.
          </p>
        </div>

        <IntakeForm
          intakeId={intake.id}
          source={intake.source as 'oneshot_49' | 'monthly_89'}
          firstName={profile.first_name}
          lastName={profile.last_name}
        />
      </div>
    </div>
  )
}
