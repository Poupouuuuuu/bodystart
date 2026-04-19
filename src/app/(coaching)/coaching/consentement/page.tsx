/**
 * /coaching/consentement
 *
 * Page de consentement RGPD bloquante avant tout accès au formulaire d'intake.
 * Affiche le disclaimer santé + checkbox de consentement explicite (non pré-cochée).
 *
 * Flow :
 *   1. User arrive ici (depuis Stripe success ou lien direct)
 *   2. Doit être connecté → si non, redirect /login
 *   3. Coche les 2 cases (santé + traitement données)
 *   4. POST /api/coaching/consent → marque rgpd_consent_at
 *   5. Redirige vers /coaching/intake (Sprint 2)
 */
import type { Metadata } from 'next'
import { ConsentForm } from './ConsentForm'

export const metadata: Metadata = {
  title: 'Consentement — Coaching personnalisé',
  robots: { index: false, follow: false },
}

export default function ConsentementPage() {
  return (
    <div className="min-h-screen bg-cream-50 py-12">
      <div className="container max-w-2xl">
        <div className="bg-white border border-[#1a2e23]/10 rounded-2xl p-8">
          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[#1a2e23] mb-2">
            Avant de commencer
          </h1>
          <p className="text-[#1a2e23]/70 mb-8">
            Quelques informations importantes avant de remplir votre intake coaching.
          </p>

          {/* ─── Disclaimer santé ─── */}
          <section className="mb-8 p-5 rounded-xl bg-amber-50 border border-amber-200">
            <h2 className="font-display text-base font-bold uppercase text-amber-900 mb-2">
              ⚠️ Avertissement santé
            </h2>
            <p className="text-sm text-amber-900/80 leading-relaxed">
              <strong>Body Start n&apos;est pas un professionnel de santé.</strong> Les programmes
              que nous proposons sont générés par intelligence artificielle puis relus par un coach
              sportif, mais ne se substituent en aucun cas à un avis médical.
            </p>
            <p className="text-sm text-amber-900/80 leading-relaxed mt-3">
              <strong>Consultez votre médecin avant toute nouvelle activité physique ou changement
              alimentaire significatif</strong>, en particulier en cas de pathologie, grossesse, ou
              traitement médicamenteux en cours.
            </p>
          </section>

          {/* ─── Données collectées ─── */}
          <section className="mb-8">
            <h2 className="font-display text-base font-bold uppercase text-[#1a2e23] mb-3">
              Données que nous allons collecter
            </h2>
            <ul className="space-y-2 text-sm text-[#1a2e23]/80">
              <li>• Identité (prénom, nom, email — depuis votre compte Shopify)</li>
              <li>• Données morphologiques (âge, sexe, taille, poids actuel)</li>
              <li>• Objectif sportif et niveau d&apos;activité</li>
              <li>• Antécédents de blessures et contraintes alimentaires</li>
              <li>• Évolution hebdomadaire (si abonnement) : poids, mesures, ressenti</li>
            </ul>
          </section>

          {/* ─── Bases légales et durée ─── */}
          <section className="mb-8">
            <h2 className="font-display text-base font-bold uppercase text-[#1a2e23] mb-3">
              Vos droits
            </h2>
            <ul className="space-y-2 text-sm text-[#1a2e23]/80">
              <li>
                <strong>Hébergement :</strong> données stockées en Union Européenne (Frankfurt) chez
                Supabase, conformément au RGPD.
              </li>
              <li>
                <strong>Sous-traitants :</strong> Anthropic (génération IA), Stripe (paiement),
                Resend (emails), Shopify (compte client).
              </li>
              <li>
                <strong>Conservation :</strong> 3 ans après votre dernière connexion, puis
                anonymisation automatique.
              </li>
              <li>
                <strong>Droits :</strong> vous pouvez à tout moment exporter ou supprimer vos
                données depuis votre espace personnel (page Confidentialité).
              </li>
            </ul>
          </section>

          {/* ─── Formulaire (client component) ─── */}
          <ConsentForm />
        </div>
      </div>
    </div>
  )
}
