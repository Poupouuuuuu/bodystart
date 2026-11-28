// Pastilles « Offerte dès … » des cartes produit, côté serveur (demande de
// Gestion, 28/11/2026) : mêmes paliers que le panier (/api/paliers :
// remises actives, cadeau en stock), période en cours à l'heure du rendu.
// Une lecture par rendu de page (parties Admin en cache, lib/paliers/serveur).
// En échec : aucune pastille, la page s'affiche comme avant.

import { chargerPaliers } from '@/lib/paliers/serveur'
import { offresDePaliers, type OffresVariantes } from '@/lib/carte-produit'

export async function offresDesCartes(maintenant = new Date()): Promise<OffresVariantes | null> {
  try {
    const paliers = await chargerPaliers()
    if (!paliers) return null
    return offresDePaliers(paliers, paliers.stock, maintenant)
  } catch (err) {
    console.error('[offres-cartes] paliers illisibles :', err)
    return null
  }
}
