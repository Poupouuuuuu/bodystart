/**
 * /coaching/programmes — Sprint 2 redirect
 *
 * L'ancien catalogue 5 produits a été remplacé par le modèle 2-offres
 * (Programme Personnalisé 49€ + Suivi Personnalisé 89€/mois).
 * On redirige vers /coaching/tarifs où les 2 offres sont présentées.
 */
import { redirect } from 'next/navigation'

export default function ProgrammesRedirect(): never {
  redirect('/coaching/tarifs')
}
