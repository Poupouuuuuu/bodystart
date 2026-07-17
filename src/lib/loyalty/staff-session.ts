/**
 * Helpers d'auth staff loyalty.
 *
 * Spec V2 §7.4 + §8 + decision Adam L5 :
 *   - Auth via Supabase Auth (email/password)
 *   - Staff identifie par auth.users.id ↔ loyalty_staff.id (1:1)
 *   - Toute action sur /staff/* DOIT etre authentifiee (caisse = touche a l'argent)
 *
 * Usage :
 *   - requireStaff() : appel en haut d'un Server Component → redirect /staff/login si KO
 *   - getStaffFromRequest() : pour les Route Handlers → retourne { id, email, fullName, role } ou null
 */
import { redirect } from 'next/navigation'
import { createLoyaltyServerClient } from './supabase-server'
import { getLoyaltyAdminClient } from './supabase-admin'

export interface StaffContext {
  id: string
  email: string
  fullName: string | null
  role: 'cashier' | 'admin'
}

/**
 * À appeler en haut d'un Server Component /staff/*.
 * - Pas de session Supabase → redirect /staff/login
 * - Session OK mais pas dans loyalty_staff ou is_active=false → redirect /staff/login?reason=not_staff
 * - Sinon retourne le contexte staff
 */
export async function requireStaff(): Promise<StaffContext> {
  const supabase = await createLoyaltyServerClient()

  // 1. Recupere la session Supabase Auth via cookies
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/staff/login')
  }

  // 2. Verifie que ce user est dans loyalty_staff actif
  // On utilise le admin client pour bypass la RLS et avoir une lecture deterministe
  const admin = getLoyaltyAdminClient()
  const { data: staff, error: staffErr } = await admin
    .from('loyalty_staff')
    .select('id, email, full_name, role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (staffErr || !staff || !staff.is_active) {
    redirect('/staff/login?reason=not_staff')
  }

  return {
    id: staff.id,
    email: staff.email,
    fullName: staff.full_name,
    role: staff.role as 'cashier' | 'admin',
  }
}

/**
 * Pour les Route Handlers : retourne le contexte staff ou null.
 * NE redirect pas, retourne null si pas connecte ou pas staff actif.
 */
export async function getStaffFromRequest(): Promise<StaffContext | null> {
  try {
    const supabase = await createLoyaltyServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) return null

    const admin = getLoyaltyAdminClient()
    const { data: staff } = await admin
      .from('loyalty_staff')
      .select('id, email, full_name, role, is_active')
      .eq('id', user.id)
      .maybeSingle()

    if (!staff || !staff.is_active) return null

    return {
      id: staff.id,
      email: staff.email,
      fullName: staff.full_name,
      role: staff.role as 'cashier' | 'admin',
    }
  } catch {
    return null
  }
}
