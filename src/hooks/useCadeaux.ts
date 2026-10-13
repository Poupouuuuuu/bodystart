'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCart } from '@/hooks/useCart'
import { dateDeReference } from '@/lib/paliers'
import { calculerCadeaux, type DonneesPaliers } from '@/lib/paliers/panier'

type Reponse = DonneesPaliers & { ok: true; dateForcable: boolean }

/** Ce que le client a décidé pour les cadeaux de ce panier (gardé dans le navigateur). */
interface Memo {
  /** Paliers dont le cadeau a été retiré : plus d'ajout automatique, bouton « Ajouter mon cadeau ». */
  refuses: number[]
  /** Variante choisie par palier (parfum de la Crunch Bar). */
  choix: Record<number, string>
  /** Paliers que Shopify n'a pas accordés, avec le contexte du refus (voir lib/paliers/panier). */
  nonAccordes: Record<number, string>
}
const VIDE: Memo = { refuses: [], choix: {}, nonAccordes: {} }
const cle = (cartId: string) => `bs-cadeaux:${cartId}`

function lire(cartId: string): Memo {
  try {
    const raw = JSON.parse(localStorage.getItem(cle(cartId)) ?? 'null')
    return raw && typeof raw === 'object' ? { ...VIDE, ...raw } : VIDE
  } catch {
    return VIDE
  }
}
function ecrire(cartId: string, memo: Memo) {
  try {
    localStorage.setItem(cle(cartId), JSON.stringify(memo))
  } catch {
    /* navigation privée : la décision vaut pour la session en cours */
  }
}

/**
 * Paliers cadeaux du panier : lit /api/paliers dès que le panier contient un
 * article, calcule la progression et garde les lignes cadeaux en accord avec
 * les paliers (ajout, retrait, quantité 1). Rien n'est affiché si la route
 * échoue : le panier fonctionne alors comme avant.
 */
export function useCadeaux({ retraitBoutique }: { retraitBoutique: boolean }) {
  const { cart, syncCadeaux } = useCart()
  const actif = (cart?.totalQuantity ?? 0) > 0

  const [donnees, setDonnees] = useState<Reponse | null>(null)
  const charge = useRef(false)
  useEffect(() => {
    if (!actif || charge.current) return
    charge.current = true
    fetch('/api/paliers')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.ok) setDonnees(j as Reponse)
      })
      .catch(() => {
        /* barre masquée, panier inchangé */
      })
  }, [actif])

  const cartId = cart?.id ?? ''
  const [memo, setMemo] = useState<Memo>(VIDE)
  useEffect(() => {
    if (cartId) setMemo(lire(cartId))
  }, [cartId])
  const majMemo = useCallback(
    (f: (m: Memo) => Memo) =>
      setMemo((m) => {
        const n = f(m)
        if (cartId) ecrire(cartId, n)
        return n
      }),
    [cartId]
  )

  const now = useMemo(
    () => (donnees ? dateDeReference(window.location.search, donnees.dateForcable ? 'preview' : 'production') : new Date()),
    // Recalculée à chaque changement du panier : une période qui commence se voit au prochain ajout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [donnees, cart]
  )
  const options = useMemo(
    () => ({
      now,
      refuses: new Set(memo.refuses),
      choix: memo.choix,
      nonAccordes: memo.nonAccordes,
      retraitBoutique,
    }),
    [now, memo, retraitBoutique]
  )
  const etat = useMemo(() => calculerCadeaux(cart, donnees, options), [cart, donnees, options])

  // Dernières valeurs pour le plan recalculé dans la file des mutations.
  const derniers = useRef({ donnees, options })
  derniers.current = { donnees, options }

  useEffect(() => {
    if (!donnees || !cart) return
    if (Object.entries(etat.nonAccorder).some(([k, c]) => memo.nonAccordes[Number(k)] !== c)) {
      majMemo((m) => ({ ...m, nonAccordes: { ...m.nonAccordes, ...etat.nonAccorder } }))
    }
    if (etat.actions.length === 0) return
    void syncCadeaux((frais) => {
      const { donnees: d, options: o } = derniers.current
      return calculerCadeaux(frais, d, o).actions
    })
  }, [etat, donnees, cart, memo.nonAccordes, majMemo, syncCadeaux])

  /** Le client retire son cadeau : on ne le remettra pas de force. */
  const retirerCadeau = useCallback(
    (lineId: string, montant: number) => {
      majMemo((m) => ({ ...m, refuses: [...new Set([...m.refuses, montant])] }))
      void syncCadeaux(() => [{ type: 'retirer', lineId }])
    },
    [majMemo, syncCadeaux]
  )

  /** Bouton « Ajouter mon cadeau » : l'ajout automatique reprend pour ce palier. */
  const ajouterCadeau = useCallback(
    (montant: number) => majMemo((m) => ({ ...m, refuses: m.refuses.filter((x) => x !== montant) })),
    [majMemo]
  )

  /** Choix du parfum : la ligne cadeau change de variante, sans repasser par la caisse. */
  const choisirVariante = useCallback(
    (montant: number, variantId: string, lineId?: string) => {
      majMemo((m) => ({ ...m, choix: { ...m.choix, [montant]: variantId } }))
      if (lineId) void syncCadeaux(() => [{ type: 'variante', lineId, variantId, montant }])
    },
    [majMemo, syncCadeaux]
  )

  return { etat, visible: etat.etats.length > 0, retirerCadeau, ajouterCadeau, choisirVariante }
}
