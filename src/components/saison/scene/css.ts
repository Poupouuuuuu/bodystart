// Règles communes des décors « scène » (Noël, Halloween), reprises dans le
// CSS de chaque thème : un seul thème est émis à la fois.
//
// Animations en transform et opacity uniquement, coupées par
// prefers-reduced-motion et mises en pause hors écran ([data-pause], posé
// par components/saison/AnimationsSaison). Sans animation : particules
// posées à leur place (--x, --y), objets suspendus immobiles.
export const CSS_SCENE = `
.sz-scene-hero{--chute:110vh;--lent:4}
.sz-frise{--chute:150px;--lent:.5}
.sz-chute{position:absolute;top:var(--y,20%);left:var(--x,50%);width:var(--t,4px);height:var(--t,4px);opacity:var(--o,.85)}
.sz-pendu{transform-origin:50% 0}
.sz-fil{width:1px}
@media (min-width:1024px){.sz-pendus-photo .sz-pendu{scale:1.5}.sz-pendus-section .sz-pendu{scale:1.35}}
@media (prefers-reduced-motion:no-preference){
.sz-chute{top:-12px;animation:sz-chute calc(var(--d,14s) * var(--lent,1)) linear infinite;animation-delay:calc(var(--r,0s) * var(--lent,1));will-change:transform}
.sz-pendu{animation:sz-balance var(--d,5.5s) ease-in-out infinite alternate;animation-delay:var(--r,0s)}
}
[data-pause],[data-pause] *,[data-pause]::before,[data-pause]::after{animation-play-state:paused!important}
@keyframes sz-chute{from{transform:translate3d(0,0,0) rotate(0deg)}to{transform:translate3d(var(--dx,14px),var(--chute,110vh),0) rotate(var(--tour,0deg))}}
@keyframes sz-balance{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}
`
