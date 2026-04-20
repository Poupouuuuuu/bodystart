/**
 * /account/coaching
 *
 * Espace coaching client.
 * - Liste tous les programmes du user (avec status)
 * - Liste les intakes pending (à remplir)
 * - Affiche le code promo -15% si abonnement actif
 *
 * Page server-rendered (toute la data vient de Supabase via le sync au login).
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { ArrowRight, ChevronRight, Tag, Dumbbell, Clipboard, ShieldX, Lock } from 'lucide-react'
import { getCustomer } from '@/lib/shopify/customer-server'
import { getSupabaseAdminClient } from '@/lib/coaching/supabase/admin'

export const dynamic = 'force-dynamic'

const SHOPIFY_TOKEN_COOKIE = 'body-start-customer-token'

export default async function AccountCoachingPage() {
  const cookieStore = cookies()
  const token = cookieStore.get(SHOPIFY_TOKEN_COOKIE)?.value
  if (!token) redirect('/login?redirect=/account/coaching')

  const customer = await getCustomer(token)
  if (!customer) redirect('/login')

  const sb = getSupabaseAdminClient()
  const { data: profile } = await sb
    .from('profiles')
    .select('id, email, first_name')
    .eq('shopify_customer_id', customer.id)
    .maybeSingle()

  // Pas de profil ⇒ jamais payé. On affiche le pitch d'inscription.
  if (!profile) {
    return <NoCoachingState firstName={null} />
  }

  // Pull intakes + programs + active subscriptions
  const [{ data: intakes }, { data: programs }, { data: subs }] = await Promise.all([
    sb
      .from('intakes')
      .select('id, status, source, created_at, submitted_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false }),
    sb
      .from('programs')
      .select('id, type, delivered_at, created_at')
      .eq('user_id', profile.id)
      .not('delivered_at', 'is', null)
      .order('delivered_at', { ascending: false }),
    sb
      .from('subscriptions')
      .select('id, status, current_period_end')
      .eq('user_id', profile.id)
      .eq('status', 'active'),
  ])

  const pendingIntakes = (intakes ?? []).filter((i) => i.status === 'pending')
  const submittedIntakes = (intakes ?? []).filter((i) => i.status === 'generated')
  const hasActiveSub = (subs ?? []).length > 0
  const programsList = programs ?? []

  // Code promo -15% pour les abonnés actifs
  const discountCode = hasActiveSub
    ? `COACH-${profile.email
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 8)
        .toUpperCase()}`
    : null

  // Cas 1 : aucune activité → pitch
  if (intakes?.length === 0 && programs?.length === 0 && !hasActiveSub) {
    return <NoCoachingState firstName={profile.first_name} />
  }

  return (
    <div className="container py-10 md:py-14">
      <div className="mb-10">
        <p className="text-[10px] font-black uppercase tracking-widest text-coaching-cyan-600 border-l-4 border-coaching-cyan-500 pl-2 mb-2">
          Mon coaching
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tight text-gray-900">
          Espace coaching
        </h1>
      </div>

      {/* ─── Code promo -15% ─── */}
      {discountCode && (
        <div className="mb-8 p-5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Tag className="w-5 h-5 text-emerald-700 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Réduction abonné -15%
              </p>
              <p className="text-xs text-emerald-700/80">
                Appliquée automatiquement sur tout le shop quand tu utilises ce code
              </p>
            </div>
          </div>
          <code className="px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-bold text-emerald-900 inline-flex items-center gap-2">
            <Clipboard className="w-3.5 h-3.5" />
            {discountCode}
          </code>
        </div>
      )}

      {/* ─── Intakes en attente (action requise) ─── */}
      {pendingIntakes.length > 0 && (
        <div className="mb-8 p-5 bg-amber-50 border-2 border-amber-200 rounded-2xl">
          <h2 className="font-display font-bold text-amber-900 uppercase tracking-tight mb-2">
            ⚠️ Action requise : remplis ton intake
          </h2>
          <p className="text-sm text-amber-900/80 mb-4">
            Notre coach attend tes informations pour construire ton programme.
          </p>
          <Link
            href="/coaching/intake"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-700 text-white text-sm font-medium hover:bg-amber-800"
          >
            Remplir l&apos;intake <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ─── Intakes soumis en attente coach ─── */}
      {submittedIntakes.length > 0 && (
        <div className="mb-8 p-5 bg-blue-50 border-2 border-blue-200 rounded-2xl">
          <h2 className="font-display font-bold text-blue-900 uppercase tracking-tight mb-2">
            ⏳ Programme en cours de préparation
          </h2>
          <p className="text-sm text-blue-900/80">
            Notre coach prépare ton programme personnalisé. Tu recevras un email sous 48-72h
            quand il sera prêt à télécharger.
          </p>
        </div>
      )}

      {/* ─── Mes programmes délivrés ─── */}
      <div className="bg-white border border-[#1a2e23]/10 rounded-2xl overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-[#1a2e23]/10 flex items-center justify-between">
          <h2 className="font-display font-bold uppercase text-[#1a2e23] flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-coaching-cyan-600" />
            Mes programmes
          </h2>
          <span className="text-xs text-[#1a2e23]/50">{programsList.length} programme(s)</span>
        </div>
        <div className="p-5 space-y-3">
          {programsList.length === 0 ? (
            <p className="text-sm text-[#1a2e23]/50 italic text-center py-6">
              Aucun programme délivré pour l&apos;instant.
            </p>
          ) : (
            programsList.map((p) => (
              <Link
                key={p.id}
                href={`/account/coaching/programmes/${p.id}`}
                className="flex items-center justify-between p-4 border border-[#1a2e23]/10 rounded-xl hover:border-coaching-cyan-500 hover:bg-coaching-cyan-50/30 transition-colors group"
              >
                <div>
                  <p className="font-bold text-sm text-[#1a2e23] capitalize">
                    Programme {p.type}
                  </p>
                  <p className="text-xs text-[#1a2e23]/50 mt-1">
                    Délivré le{' '}
                    {p.delivered_at
                      ? new Date(p.delivered_at).toLocaleDateString('fr-FR')
                      : '—'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#1a2e23]/40 group-hover:text-coaching-cyan-600 transition-colors" />
              </Link>
            ))
          )}
        </div>
      </div>

      {/* ─── Footer links ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/account/coaching/confidentialite"
          className="flex items-center justify-between p-4 border border-[#1a2e23]/10 rounded-xl text-sm text-[#1a2e23] hover:border-[#1a2e23]/30"
        >
          <span className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Confidentialité (RGPD)
          </span>
          <ChevronRight className="w-4 h-4" />
        </Link>
        <Link
          href="/products"
          className="flex items-center justify-between p-4 border border-[#1a2e23]/10 rounded-xl text-sm text-[#1a2e23] hover:border-[#1a2e23]/30"
        >
          <span>Boutique nutrition (-15% si abonné)</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

function NoCoachingState({ firstName }: { firstName: string | null }) {
  return (
    <div className="container py-10 md:py-14">
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 bg-gray-100 border-2 border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-7 h-7 text-gray-400" />
        </div>
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-gray-900 mb-4">
          {firstName ? `Salut ${firstName}` : 'Aucun coaching actif'}
        </h1>
        <p className="text-sm text-gray-500 font-medium mb-8">
          Tu n&apos;as pas encore souscrit à une offre coaching. Découvre nos 2 formules et
          commence ta transformation.
        </p>
        <Link
          href="/coaching/tarifs"
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#1a2e23] text-white font-bold text-sm uppercase tracking-wider rounded-full hover:bg-[#1a2e23]/90"
        >
          Découvrir les offres <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
