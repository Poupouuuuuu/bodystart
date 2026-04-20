/**
 * /admin/programs
 *
 * Liste des intakes en attente de programme + programmes déjà créés.
 * Tri par status puis date desc.
 */
import Link from 'next/link'
import { requireAdmin } from '@/lib/coaching/auth/require-admin'
import { getSupabaseAdminClient } from '@/lib/coaching/supabase/admin'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Programmes — Admin',
  robots: { index: false, follow: false },
}

interface IntakeRow {
  id: string
  status: string
  source: string
  created_at: string
  submitted_at: string | null
  user_id: string
  profiles: { email: string; first_name: string | null; last_name: string | null } | null
}

export default async function AdminProgramsPage() {
  await requireAdmin()
  const admin = getSupabaseAdminClient()

  // Pull tous les intakes avec le profile lié
  const { data: intakes, error } = await admin
    .from('intakes')
    .select('id, status, source, created_at, submitted_at, user_id, profiles!inner(email, first_name, last_name)')
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return (
      <div>
        <h1 className="font-display text-3xl font-black uppercase mb-4">Erreur</h1>
        <pre className="text-sm bg-rose-50 p-4 rounded-xl">{error.message}</pre>
      </div>
    )
  }

  const rows: IntakeRow[] = (intakes ?? []) as unknown as IntakeRow[]
  const submitted = rows.filter((i) => i.status === 'generated')
  const delivered = rows.filter((i) => ['validated', 'delivered'].includes(i.status))
  const pending = rows.filter((i) => i.status === 'pending')

  return (
    <div>
      <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[#1a2e23] mb-2">
        Programmes coaching
      </h1>
      <p className="text-[#1a2e23]/60 text-sm mb-8">
        {rows.length} intake(s) au total · {submitted.length} en attente de validation
      </p>

      {/* ─── À traiter ─── */}
      <Section
        title={`🚨 À traiter (${submitted.length})`}
        intakes={submitted}
        emptyText="Aucun intake en attente. ✅"
      />

      {/* ─── Délivrés ─── */}
      <Section
        title={`✅ Délivrés (${delivered.length})`}
        intakes={delivered}
        emptyText="Aucun programme délivré pour l'instant."
        muted
      />

      {/* ─── En attente client ─── */}
      <Section
        title={`⏳ Intakes pas encore remplis (${pending.length})`}
        intakes={pending}
        emptyText="—"
        muted
      />
    </div>
  )
}

function Section({
  title,
  intakes,
  emptyText,
  muted,
}: {
  title: string
  intakes: IntakeRow[]
  emptyText: string
  muted?: boolean
}) {
  return (
    <section className={`mb-10 ${muted ? 'opacity-70' : ''}`}>
      <h2 className="font-display text-lg font-bold uppercase text-[#1a2e23] mb-4">{title}</h2>
      {intakes.length === 0 ? (
        <p className="text-sm text-[#1a2e23]/50 italic">{emptyText}</p>
      ) : (
        <div className="bg-white border border-[#1a2e23]/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a2e23]/10 text-xs uppercase text-[#1a2e23]/50 font-bold">
                <th className="text-left p-3">Client</th>
                <th className="text-left p-3">Offre</th>
                <th className="text-left p-3">Soumis</th>
                <th className="text-left p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {intakes.map((i) => (
                <tr key={i.id} className="border-b border-[#1a2e23]/5 last:border-0 hover:bg-[#1a2e23]/2">
                  <td className="p-3">
                    <div className="font-bold text-[#1a2e23]">
                      {i.profiles?.first_name ?? ''} {i.profiles?.last_name ?? ''}
                    </div>
                    <div className="text-xs text-[#1a2e23]/50">{i.profiles?.email}</div>
                  </td>
                  <td className="p-3 text-xs">
                    {i.source === 'monthly_89' ? '89€/mois' : '49€ one-shot'}
                  </td>
                  <td className="p-3 text-xs text-[#1a2e23]/60">
                    {i.submitted_at
                      ? new Date(i.submitted_at).toLocaleString('fr-FR')
                      : '—'}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={i.status} />
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/programs/${i.id}`}
                      className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#1a2e23] text-white text-xs font-medium hover:bg-[#1a2e23]/90"
                    >
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: 'En attente client', className: 'bg-gray-100 text-gray-600' },
    generated: { label: 'Soumis ▸ à traiter', className: 'bg-amber-100 text-amber-800' },
    validated: { label: 'Validé', className: 'bg-emerald-100 text-emerald-800' },
    delivered: { label: 'Délivré', className: 'bg-emerald-100 text-emerald-800' },
    rejected: { label: 'Refusé', className: 'bg-rose-100 text-rose-800' },
  }
  const conf = map[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${conf.className}`}
    >
      {conf.label}
    </span>
  )
}
