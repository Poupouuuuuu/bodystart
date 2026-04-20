/**
 * POST /api/coaching/intake
 *
 * Soumission du formulaire d'intake par le client.
 *
 * Body : { intakeId: string, data: { ... tous les champs } }
 *
 * Sécurité :
 *   - Vérifie le cookie Shopify (auth)
 *   - Vérifie que l'intakeId appartient bien au user
 *   - Vérifie que le statut est 'pending' (pas de double soumission)
 *
 * Side-effects :
 *   - Update intakes : remplit tous les champs + status='generated' + submitted_at
 *   - Envoi email coach avec toutes les réponses
 *   - Update profiles.updated_at
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCustomer } from '@/lib/shopify/customer-server'
import { getSupabaseAdminClient } from '@/lib/coaching/supabase/admin'
import { sendIntakeReceivedToCoach } from '@/lib/coaching/emails'

export const dynamic = 'force-dynamic'

const SHOPIFY_TOKEN_COOKIE = 'body-start-customer-token'

// Validation simple des champs critiques
function validateData(data: Record<string, unknown>): string | null {
  if (!data || typeof data !== 'object') return 'data invalide'
  const required = ['age', 'sexe', 'taille_cm', 'poids_kg', 'objectif', 'echeance_semaines', 'type_programme', 'niveau', 'dispo_hebdo', 'type_regime', 'nb_repas_jour', 'sommeil_heures', 'stress_niveau', 'motivation_pourquoi']
  for (const k of required) {
    const v = (data as Record<string, unknown>)[k]
    if (v === '' || v === null || v === undefined) return `Champ requis manquant : ${k}`
  }
  return null
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(SHOPIFY_TOKEN_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const customer = await getCustomer(token)
    if (!customer) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const body = await req.json()
    const intakeId = body.intakeId as string
    const data = body.data as Record<string, unknown>

    if (!intakeId) return NextResponse.json({ error: 'intakeId required' }, { status: 400 })

    const validationError = validateData(data)
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

    const admin = getSupabaseAdminClient()

    // ─── Vérifier l'ownership ───
    const { data: profile } = await admin
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('shopify_customer_id', customer.id)
      .maybeSingle()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { data: intake, error: fetchErr } = await admin
      .from('intakes')
      .select('id, user_id, status, source')
      .eq('id', intakeId)
      .maybeSingle()
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    if (!intake) return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
    if (intake.user_id !== profile.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (intake.status !== 'pending') {
      return NextResponse.json({ error: 'Cet intake a déjà été soumis.' }, { status: 409 })
    }

    // ─── Update intake avec toutes les réponses ───
    const updatePayload = {
      // Section 1 — Identité
      age: data.age,
      sexe: data.sexe,
      taille_cm: data.taille_cm,
      poids_kg: data.poids_kg,
      // Section 2 — Objectif
      objectif: data.objectif,
      type_programme: data.type_programme,
      // Section 3 — Activité
      niveau: data.niveau,
      dispo_hebdo: data.dispo_hebdo,
      // (sports_pratiques n'a pas de colonne dédiée → agrégés dans notes_libres)
      // Section 4 — Nutrition
      contraintes_alimentaires: data.contraintes_alimentaires ?? [],
      // Section 5 — Santé
      blessures_antecedents: data.blessures_antecedents
        ? [{ description: String(data.blessures_antecedents) }]
        : [],
      // Section 6 — Notes
      notes_libres: buildNotesLibres(data),
      // Status final
      status: 'generated',
      submitted_at: new Date().toISOString(),
    }

    const { error: updateErr } = await admin
      .from('intakes')
      .update(updatePayload)
      .eq('id', intakeId)

    if (updateErr) {
      console.error('[intake] update error:', updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // ─── Email coach (best-effort, n'échoue pas la requête) ───
    try {
      const tier: 'oneshot' | 'monthly_followup' =
        intake.source === 'monthly_89' ? 'monthly_followup' : 'oneshot'
      const clientName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email

      // On envoie TOUTES les réponses (pas juste celles persistées) pour que
      // le coach ait le contexte complet.
      await sendIntakeReceivedToCoach({
        intakeId,
        clientEmail: profile.email,
        clientName,
        tier,
        intakeFields: data as Record<string, unknown>,
      })
    } catch (mailErr) {
      console.error('[intake] email coach KO (non-bloquant):', mailErr)
    }

    return NextResponse.json({ ok: true, intakeId })
  } catch (err) {
    console.error('[intake] error:', err)
    const msg = err instanceof Error ? err.message : 'Unknown'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * Compile les champs "freeform" du formulaire en un seul bloc texte
 * dans `intakes.notes_libres`. Le schéma DB actuel n'a pas de colonnes
 * dédiées pour : objectif_chiffre, echeance_semaines, frequence_actuelle,
 * type_regime, nb_repas_jour, complements_actuels, pathologies, medicaments,
 * sommeil_heures, stress_niveau, motivation_pourquoi, blocages_passes,
 * sports_pratiques. On les agrège ici proprement pour le coach.
 *
 * Sprint 3 ou 4 pourra ajouter des colonnes typées si besoin.
 */
function buildNotesLibres(data: Record<string, unknown>): string {
  const lines: string[] = []
  const add = (label: string, value: unknown) => {
    if (value !== undefined && value !== '' && value !== null) {
      if (Array.isArray(value)) {
        if (value.length > 0) lines.push(`${label}: ${value.join(', ')}`)
      } else {
        lines.push(`${label}: ${value}`)
      }
    }
  }
  add('Objectif chiffré', data.objectif_chiffre)
  add('Échéance (semaines)', data.echeance_semaines)
  add('Sports pratiqués', data.sports_pratiques)
  add('Fréquence actuelle', data.frequence_actuelle)
  add('Type de régime', data.type_regime)
  add('Nb repas/jour', data.nb_repas_jour)
  add('Compléments actuels', data.complements_actuels)
  add('Pathologies', data.pathologies)
  add('Médicaments', data.medicaments)
  add('Sommeil (h/nuit)', data.sommeil_heures)
  add('Stress (1-10)', data.stress_niveau)
  add('Motivation', data.motivation_pourquoi)
  add('Blocages passés', data.blocages_passes)
  add('Notes libres', data.notes_libres)
  return lines.join('\n')
}
