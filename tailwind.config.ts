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
        // ─── Palette Nutrition (extraite du logo Body Start Nutrition) ───
        brand: {
          50:  '#f0f7e6',
          100: '#d9edb8',
          200: '#c2e08a',
          300: '#a6cf5e',
          400: '#8dbf40',
          500: '#78a83c',  // vert feuilles/icône logo
          600: '#619028',
          700: '#4b7a22',  // vert principal "BODYSTART" texte logo
          800: '#3a5f19',
          900: '#2a4511',
          950: '#182a08',
        },
        // ─── Palette Coaching (Phase 2 — logo Coaching) ───────────────
        coaching: {
          50:  '#eef4fb',
          100: '#d0e3f5',
          200: '#a1c6eb',
          300: '#72a9e1',
          400: '#438cd7',
          500: '#1d6fcd',
          600: '#1d5aa8',
          700: '#1d3461',  // bleu marine logo coaching
          800: '#162648',
          900: '#0e1930',
          950: '#070d18',
        },
        // ─── Cyan coaching (accent logo coaching) ─────────────────────
        'coaching-cyan': {
          400: '#3dc8c8',
          500: '#2ab0b0',
          600: '#1a9898',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
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
      },
    },
  },
  plugins: [],
}

export default config
