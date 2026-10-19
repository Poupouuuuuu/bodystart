// Séparateur entre les grandes sections de l'accueil pendant Noël : un fil
// doré très fin et une petite étoile au centre. Décoratif.
export default function SeparateurNoel() {
  return (
    <div aria-hidden="true" className="container py-3">
      <div className="mx-auto flex h-6 max-w-[520px] items-center gap-3">
        <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(201,162,74,0),rgba(201,162,74,.6))]" />
        <svg viewBox="0 0 24 24" width="14" height="14" focusable="false">
          <path fill="#C9A24A" d="M12 2.5l2.6 6.1 6.6.6-5 4.4 1.5 6.5L12 16.7l-5.7 3.4 1.5-6.5-5-4.4 6.6-.6z" />
        </svg>
        <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(201,162,74,.6),rgba(201,162,74,0))]" />
      </div>
    </div>
  )
}
