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
        // ─── Palette Nutrition — Nature Premium ─────────────────
        brand: {
          50:  '#E8F0EA',
          100: '#D1E1D5',
          200: '#A3C3AB',
          300: '#75A581',
          400: '#478757',
          500: '#2D5A3D',  // vert sauge principal
          600: '#234832',
          700: '#1A3626',
          800: '#11241A',
          900: '#09120D',
        },
        // ─── Crème (fonds) ──────────────────────────────────────
        cream: {
          50:  '#FDFBF8',
          100: '#F8F4EE',
          200: '#F0EBE1',
          300: '#E2D9CE',
          400: '#C9BDB0',
        },
        // ─── Palette Coaching ───────────────────────────────────
        coaching: {
          50:  '#E6F7F7',
          500: '#2AB0B0',
          900: '#0D1F1F',
        },
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
