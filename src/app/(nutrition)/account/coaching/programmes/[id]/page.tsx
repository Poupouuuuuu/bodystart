/**
 * /account/coaching/programmes/[id]
 *
 * Page de visualisation d'un programme délivré.
 * Auth obligatoire (middleware /account). Le serveur vérifie l'ownership.
 */
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Download, Calendar } from 'lucide-react'
import { getCustomer } from '@/lib/shopify/customer-server'
import { getSupabaseAdminClient } from '@/lib/coaching/supabase/admin'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mon programme — Coaching',
  robots: { index: false, follow: false },
}

const SHOPIFY_TOKEN_COOKIE = 'body-start-customer-token'

interface ProgramData {
  id: string
  user_id: string
  type: string
  pdf_url: string | null
  delivered_at: string | null
  created_at: string
  intake_id: string
}

export default async function ProgrammeDetailPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const token = cookieStore.get(SHOPIFY_TOKEN_COOKIE)?.value
  if (!token) redirect(`/login?redirect=/account/coaching/programmes/${params.id}`)

  const customer = await getCustomer(token)
  if (!customer) redirect('/login')

  const sb = getSupabaseAdminClient()
  const { data: profile } = await sb
    .from('profiles')
    .select('id')
    .eq('shopify_customer_id', customer.id)
    .maybeSingle()
  if (!profile) redirect('/coaching/tarifs')

  const { data: program } = await sb
    .from('programs')
    .select('id, user_id, type, pdf_url, delivered_at, created_at, intake_id')
    .eq('id', params.id)
    .maybeSingle()

  if (!program) notFound()
  const programRow = program as ProgramData
  if (programRow.user_id !== profile.id) notFound()

  return (
    <div className="container max-w-3xl py-10">
      <Link
        href="/account/coaching"
        className="inline-flex items-center gap-2 text-sm text-[#1a2e23]/60 hover:text-[#1a2e23] mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à mon coaching
      </Link>

      <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[#1a2e23] mb-2">
        Mon programme {programRow.type === 'sport' ? 'sport' : programRow.type === 'nutrition' ? 'nutrition' : 'complet'}
      </h1>
      <p className="text-sm text-[#1a2e23]/60 mb-8 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        {programRow.delivered_at
          ? `Délivré le ${new Date(programRow.delivered_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
          : 'En préparation par notre coach…'}
      </p>

      {!programRow.delivered_at ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900 text-sm">
          ⏳ Notre coach finalise ton programme. Tu recevras un email dès qu&apos;il sera prêt à télécharger.
        </div>
      ) : programRow.pdf_url ? (
        <div className="bg-white border-2 border-[#1a2e23]/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Download className="w-7 h-7 text-emerald-700" />
          </div>
          <h2 className="font-display text-xl font-bold text-[#1a2e23] mb-2">
            Ton programme est prêt
          </h2>
          <p className="text-sm text-[#1a2e23]/70 mb-6 max-w-md mx-auto">
            Télécharge le PDF ci-dessous. On te recommande de le lire en entier avant de
            commencer, et de le sauvegarder sur ton téléphone pour t&apos;y référer en séance.
          </p>
          <a
            href={`/api/coaching/pdf/${programRow.id}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1a2e23] text-white text-sm font-bold uppercase tracking-wider hover:bg-[#1a2e23]/90"
          >
            <Download className="w-4 h-4" /> Télécharger mon PDF
          </a>
        </div>
      ) : (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-900 text-sm">
          ⚠️ Ton programme est marqué comme délivré mais le PDF est introuvable.
          Contacte-nous pour qu&apos;on règle ça rapidement.
        </div>
      )}

      <div className="mt-8 p-5 bg-[#1a2e23]/5 rounded-2xl text-xs text-[#1a2e23]/70">
        <strong>📌 Bon à savoir :</strong> ton programme reste accessible à tout moment depuis ton
        espace coaching. Si tu as des questions ou besoin d&apos;ajustements, écris-nous depuis
        ton profil.
      </div>
    </div>
  )
}
