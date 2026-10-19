// Styles de la déco Halloween (19/10/2026), émis seulement pendant la période
// (layout Nutrition) : rien ne pèse sur le site le reste de l'année.
//
// Animations en transform et opacity uniquement, coupées par
// prefers-reduced-motion et mises en pause hors écran ([data-pause], posé par
// components/saison/AnimationsSaison). Sans animation, tout reste en place et
// visible (chauves-souris arrêtées sur le ciel, lucioles allumées).

const ETOILES = [
  [6, 10],
  [14, 26],
  [23, 7],
  [31, 19],
  [44, 12],
  [52, 31],
  [61, 6],
  [70, 22],
  [77, 38],
  [86, 9],
  [93, 27],
  [9, 44],
  [38, 40],
  [57, 47],
  [97, 50],
  [3, 58],
]
  .map(
    ([x, y], i) =>
      `radial-gradient(${i % 3 ? 1 : 1.5}px ${i % 3 ? 1 : 1.5}px at ${x}% ${y}%,rgba(255,236,214,.85),transparent 70%)`
  )
  .join(',')

export const CSS_HALLOWEEN = `
.hw-ciel{background:radial-gradient(120% 75% at 78% 6%,#3B2752 0%,#2A1E3D 30%,#1B1428 58%,#14101F 86%)}
.hw-etoiles{background-image:${ETOILES};opacity:.75}
.hw-lune{background:radial-gradient(circle at 36% 32%,#FFE4BE 0%,#F9B46F 20%,#EF8737 50%,#DA681B 76%,#B5510F 100%);box-shadow:inset -14px -18px 46px rgba(90,25,0,.32)}
.hw-lune::before,.hw-lune::after{content:"";position:absolute;border-radius:9999px;background:radial-gradient(circle,rgba(150,55,5,.2) 0%,rgba(150,55,5,.1) 45%,rgba(150,55,5,0) 72%)}
.hw-lune::before{width:30%;height:30%;left:52%;top:20%}
.hw-lune::after{width:20%;height:20%;left:24%;top:56%}
.hw-halo{background:radial-gradient(circle,rgba(232,113,26,.4) 0%,rgba(232,113,26,.15) 34%,rgba(232,113,26,0) 66%)}
.hw-voile{background:linear-gradient(to top,rgba(20,16,31,.96) 0%,rgba(20,16,31,.66) 42%,rgba(20,16,31,0) 74%),linear-gradient(100deg,rgba(20,16,31,.72) 0%,rgba(20,16,31,0) 60%)}
.hw-brume{position:absolute;left:-25%;width:150%;height:36%;bottom:-10%;background:radial-gradient(50% 50% at 50% 50%,rgba(205,190,235,.15) 0%,rgba(205,190,235,0) 70%)}
.hw-brume-2{left:-45%;bottom:4%;height:22%;opacity:.8}
.hw-luciole{position:absolute;width:4px;height:4px;border-radius:9999px;background:#FFB46B;box-shadow:0 0 6px 2px rgba(232,113,26,.65),0 0 16px 5px rgba(232,113,26,.22);opacity:.75}
.hw-vol{position:absolute;left:0;color:#0A0710;transform:translate3d(var(--x,30vw),0,0)}
.hw-visage{filter:drop-shadow(0 0 3px rgba(247,160,80,.9))}
.hw-lisere{filter:drop-shadow(0 -1px 0 rgba(240,140,70,.55))}
.hw-frise{background:radial-gradient(60% 120% at 50% 118%,rgba(232,113,26,.26) 0%,rgba(232,113,26,0) 60%),linear-gradient(to bottom,#14101F 0%,#241A33 62%,#33223F 100%)}
.hw-selection{background:radial-gradient(70% 60% at 85% 0%,rgba(232,113,26,.16) 0%,rgba(232,113,26,0) 60%),radial-gradient(60% 50% at 0% 100%,rgba(120,80,170,.18) 0%,rgba(120,80,170,0) 70%),#14101F}
@media (prefers-reduced-motion:no-preference){
.hw-vol{animation:hw-vol var(--d,50s) linear infinite;animation-delay:var(--r,0s);will-change:transform}
.hw-vol>svg{animation:hw-aile var(--f,.8s) ease-in-out infinite alternate;transform-origin:50% 45%}
.hw-halo{animation:hw-halo 7s ease-in-out infinite alternate}
.hw-brume{animation:hw-brume 34s ease-in-out infinite alternate}
.hw-brume-2{animation-duration:47s;animation-direction:alternate-reverse}
.hw-luciole{animation:hw-luciole var(--d,5s) ease-in-out infinite;animation-delay:var(--r,0s)}
}
[data-pause],[data-pause] *{animation-play-state:paused!important}
@keyframes hw-vol{from{transform:translate3d(-18vw,2vh,0)}to{transform:translate3d(118vw,-3vh,0)}}
@keyframes hw-aile{from{transform:scaleY(1)}to{transform:scaleY(.6)}}
@keyframes hw-halo{from{opacity:.72;transform:scale(.97)}to{opacity:1;transform:scale(1.03)}}
@keyframes hw-brume{from{transform:translate3d(-5%,0,0)}to{transform:translate3d(5%,0,0)}}
@keyframes hw-luciole{0%,100%{opacity:.08;transform:translate3d(0,4px,0)}50%{opacity:1;transform:translate3d(0,-7px,0)}}
`
