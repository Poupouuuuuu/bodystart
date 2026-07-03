import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─── REDESIGN V2 — Palette source de verite ─────────────
        // cf. tech-specs/redesign-v2-direction-artistique.md §A.Palette
        // Regle : vert JAMAIS en grande surface, surfaces claires dominantes.
        // Utilisation a-la-Tailwind : `bg-canvas`, `text-ink`, `bg-fresh`, etc.

        // Surfaces (cream + blanc)
        canvas:  '#FAF8F3',  // fond principal page
        // 'card' n'est pas defini : utiliser `bg-white` (norme Tailwind)

        // Verts (CTA + titres). JAMAIS de grande surface vert.
        fresh:   '#3B7A3F',  // boutons / CTA, hover plus fonce
        'fresh-deep': '#2F6433',  // hover des CTA fresh
        spruce:  '#2D5A2D',  // titres forts, accents verts
        sage:    '#EEF4EC',  // pastilles benefices, surfaces vert pale

        // Textes
        ink:     '#2A2A2A',  // texte courant
        'ink-mute': '#6B6B66',  // texte secondaire (gris doux)

        // Accents contextuels (badges, alertes — limite a 1-2 elements/section)
        mustard:     '#C9A227',  // best-seller, medaille
        'mustard-ink': '#5C4A14',  // texte brun fonce sur fond mustard
        terracotta:  '#B85C3E',  // promo, stock bas, alerte

        // ─── V1 (DEPRECATED, conserve pour pages non-refondues) ──
        // A retirer au fur et a mesure que les pages migrent vers V2.
        brand: {
          50:  '#E8F0EA',
          100: '#D1E1D5',
          200: '#A3C3AB',
          300: '#75A581',
          400: '#478757',
          500: '#2D5A3D',
          600: '#234832',
          700: '#1A3626',
          800: '#11241A',
          900: '#09120D',
        },
        cream: {
          50:  '#FDFBF8',
          100: '#F8F4EE',
          200: '#F0EBE1',
          300: '#E2D9CE',
          400: '#C9BDB0',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
      },
      spacing: {
        // L'échelle Tailwind saute de 16 (4rem) à 20 (5rem) : 9 sections V2
        // utilisent `md:py-18` qui ne générait RIEN sans ce token — le rythme
        // vertical desktop voulu par la DA (72px) s'applique enfin.
        '18': '4.5rem',
      },
      borderRadius: {
        '2xl': '16px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'marquee': 'marquee 30s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
