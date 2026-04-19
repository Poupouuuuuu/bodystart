/**
 * /account/coaching/confidentialite
 *
 * RGPD — Page d'export des données + demande de suppression.
 * Protégée par middleware (cookie body-start-customer-token requis).
 */
import type { Metadata } from 'next'
import { ConfidentialiteActions } from './ConfidentialiteActions'

export const metadata: Metadata = {
  title: 'Confidentialité — Mon coaching',
  robots: { index: false, follow: false },
}

export default function ConfidentialitePage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[#1a2e23] mb-2">
        Confidentialité de mes données coaching
      </h1>
      <p className="text-[#1a2e23]/70 mb-10">
        Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de portabilité et
        d&apos;effacement sur vos données personnelles.
      </p>

      {/* ─── Export ─── */}
      <section className="mb-8 bg-white border border-[#1a2e23]/10 rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold uppercase text-[#1a2e23] mb-2">
          Exporter mes données
        </h2>
        <p className="text-sm text-[#1a2e23]/70 mb-4">
          Téléchargez l&apos;intégralité de vos données coaching au format JSON : profil, intakes,
          programmes, abonnements, check-ins, commandes. (RGPD art. 20 — Portabilité).
        </p>
        <ConfidentialiteActions action="export" />
      </section>

      {/* ─── Suppression ─── */}
      <section className="bg-white border border-rose-200 rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold uppercase text-rose-900 mb-2">
          Supprimer mon compte coaching
        </h2>
        <p className="text-sm text-[#1a2e23]/70 mb-4">
          Cette action déclenche une demande de suppression que notre coach validera sous 1 mois
          maximum (délai légal CNIL). Vos données personnelles seront anonymisées.
        </p>
        <p className="text-sm text-[#1a2e23]/70 mb-4">
          <strong>À noter :</strong> certaines données peuvent être conservées pour des obligations
          légales (factures, comptabilité — 6 ans en France selon l&apos;art. L102 B du LPF), mais
          ne seront plus rattachables à votre identité.
        </p>
        <ConfidentialiteActions action="delete" />
      </section>
    </div>
  )
}
