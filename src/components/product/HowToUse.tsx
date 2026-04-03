import { Droplet, Cookie, Heart } from 'lucide-react'

const STEPS = [
  {
    step: '1',
    title: 'Dosez',
    description: 'Ajoutez 1 dose dans 250-300 ml d\'eau.',
    icon: <Cookie className="w-8 h-8 text-[#345f44]" />
  },
  {
    step: '2',
    title: 'Mélangez',
    description: 'Mélangez 30 secondes jusqu\'à dissolution complète.',
    icon: <Droplet className="w-8 h-8 text-[#345f44]" />
  },
  {
    step: '3',
    title: 'Dégustez',
    description: 'Buvez après l\'entraînement pour des résultats optimaux.',
    icon: <Heart className="w-8 h-8 text-[#345f44]" />
  },
]

export default function HowToUse() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
      
      {/* ─── Gauche : Trust & Transparency ─── */}
      <div className="relative w-full h-[400px] lg:h-[500px] rounded-2xl overflow-hidden flex flex-col justify-end p-8 md:p-12">
        <div className="absolute inset-0 bg-[#345f44]/80 z-10 MixBlendMode-multiply" />
        <img 
          src="/staff-pick-runner.jpg" 
          alt="Runner" 
          className="absolute inset-0 w-full h-full object-cover z-0" 
        />
        <div className="relative z-20 text-white">
          <h3 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tighter mb-4">
            CONFIANCE &<br />TRANSPARENCE
          </h3>
          <p className="font-medium text-lg leading-relaxed max-w-sm mb-6 text-cream-100">
            Nous croyons en une transparence totale. Chaque ingrédient est clairement listé, sans additif caché ni mélange exclusif.
          </p>
          <a href="/about" className="inline-block bg-white text-gray-900 font-bold uppercase text-xs tracking-widest px-6 py-3 rounded hover:bg-cream-100 transition-colors">
            EN SAVOIR PLUS
          </a>
        </div>
      </div>

      {/* ─── Droite : How To Use ─── */}
      <div>
        <h2 className="font-display text-4xl font-black uppercase tracking-tighter text-gray-900 mb-12 border-b-2 border-gray-900 pb-4">
          Comment l'utiliser
        </h2>

        <div className="space-y-8">
          {STEPS.map(({ step, title, description, icon }) => (
            <div key={step} className="flex items-start gap-6 group">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-[#d1ebd6] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                  {icon}
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#345f44] text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-[#e6efe1]">
                  {step}
                </div>
              </div>
              
              <div className="pt-2">
                <h4 className="font-display font-black text-xl uppercase tracking-tight text-gray-900 mb-2">
                  {title}
                </h4>
                <p className="text-gray-700 font-medium leading-relaxed max-w-xs">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
