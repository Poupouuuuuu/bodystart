'use client'

import { useEffect, useState } from 'react'

/**
 * Pastille d'offre retirée à l'heure de fin de la période de paliers, même
 * avec la page en cache : premier rendu identique au serveur, puis un effet
 * la masque à `fin` (ISO).
 */
export default function PastilleDatee({ texte, fin, className }: { texte: string; fin: string | null; className: string }) {
  const [active, setActive] = useState(true)
  useEffect(() => {
    if (!fin) return
    const reste = Date.parse(fin) + 1000 - Date.now()
    if (reste <= 0) {
      setActive(false)
      return
    }
    if (reste > 24 * 3600 * 1000) return
    const t = setTimeout(() => setActive(false), reste)
    return () => clearTimeout(t)
  }, [fin])
  return active ? <span className={className}>{texte}</span> : null
}
