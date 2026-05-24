/**
 * /staff/caisse
 *
 * Caisse boutique BodyStart. Tactile, plein écran, conçu pour tablette.
 *
 * Flow :
 *   1. Saisie téléphone (numpad) → lookup
 *   2. Si trouvé : affiche prénom + solde + saisie montant + toggle cagnotte
 *      Si non trouvé : form "créer compte rapide" → upsert
 *   3. Valider → finalize (channel=in_store, staff_user_id = session staff)
 *   4. Confirmation : "Vente validée" + parrain crédité éventuel
 *
 * Auth : Server Component qui appelle requireStaff() en tête.
 *        Le UI client reçoit le staff context en prop.
 */
import { requireStaff } from '@/lib/loyalty/staff-session'
import { CaisseClient } from './CaisseClient'

export const dynamic = 'force-dynamic'

export default async function CaissePage() {
  const staff = await requireStaff()
  return <CaisseClient staff={staff} />
}
