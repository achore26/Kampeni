/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#2e6417',
          red: '#ff0000',
        },
      },
      fontSize: {
        'hero': ['clamp(2.8rem, 7vw, 5.5rem)', { lineHeight: '1.0', letterSpacing: '-0.02em' }],
        'display': ['clamp(2rem, 4vw, 3.5rem)', { lineHeight: '1.05', letterSpacing: '-0.015em' }],
      },
      keyframes: {
        // Logo spreads open from a thin centre sliver
        'splash-reveal': {
          '0%':   { clipPath: 'inset(0 48% 0 48%)', opacity: '0.15' },
          '100%': { clipPath: 'inset(0 0%  0 0%)',  opacity: '1'    },
        },
        // Thin line draws left-to-right under the logo
        'splash-scan': {
          '0%':   { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        // Tagline rises in gently
        'splash-tagline': {
          '0%':   { opacity: '0', transform: 'translateY(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'   },
        },
        // Whole screen dissolves out
        'splash-exit': {
          '0%':   { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'splash-reveal':  'splash-reveal  0.70s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'splash-scan':    'splash-scan    0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.65s forwards',
        'splash-tagline': 'splash-tagline 0.45s ease-out 1.05s both',
        'splash-exit':    'splash-exit    0.52s ease-in  forwards',
      },
    },
  },
  plugins: [],
}
