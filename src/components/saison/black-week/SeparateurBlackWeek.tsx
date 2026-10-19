// Séparateur entre les grandes sections de l'accueil pendant la Black Week :
// un filet fin et un losange jaune au centre. Décoratif.
export default function SeparateurBlackWeek() {
  return (
    <div aria-hidden="true" className="container py-3">
      <div className="mx-auto flex h-6 max-w-[520px] items-center gap-3">
        <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(17,17,17,0),rgba(17,17,17,.22))]" />
        <span className="h-2 w-2 rotate-45 bg-[#F2C200] ring-1 ring-[#111111]/20" />
        <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(17,17,17,.22),rgba(17,17,17,0))]" />
      </div>
    </div>
  )
}
