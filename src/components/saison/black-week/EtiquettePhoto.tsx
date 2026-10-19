// Étiquette « Black Week » posée sur la photo du haut de l'accueil (haut en
// deux parties), jamais sur le texte. Décorative : le bandeau d'annonce donne
// déjà l'offre et les dates.
export default function EtiquettePhoto() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute left-4 top-4 sm:left-6 sm:top-6">
      <span className="inline-flex items-center gap-2 rounded-md bg-[#F2C200] px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#111111] shadow-[0_10px_24px_-10px_rgba(0,0,0,0.7)] lg:px-4 lg:py-2 lg:text-[14px]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#111111]" />
        Black Week
      </span>
    </div>
  )
}
