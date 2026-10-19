// Frise du pied de page pendant la Black Week : bande noire, filet jaune en
// haut, « Black Week » répété entre des losanges jaunes. Décorative.
const REPETITIONS = 8

export default function FriseBlackWeek() {
  return (
    <div aria-hidden="true" className="bw-frise relative h-[56px] overflow-hidden md:h-[68px]">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[#F2C200]" />
      <div className="absolute inset-0 flex items-center gap-6 whitespace-nowrap pl-4 pt-[3px] md:gap-8">
        {Array.from({ length: REPETITIONS }, (_, i) => (
          <span key={i} className="inline-flex shrink-0 items-center gap-6 md:gap-8">
            <span className="text-[12px] font-extrabold uppercase tracking-[0.24em] text-white/85 md:text-[13px]">
              Black Week
            </span>
            <span className="h-1.5 w-1.5 rotate-45 bg-[#F2C200]" />
          </span>
        ))}
      </div>
    </div>
  )
}
