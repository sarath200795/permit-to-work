/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Orange brand identity (Tailwind orange) — consumed app-wide via
        // bg-brand-* / text-brand-* so recoloring here recolors everything.
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d4d9e2',
          300: '#aeb7c7',
          400: '#8290a8',
          500: '#62718c',
          600: '#4d5a73',
          700: '#3f495d',
          800: '#373f4f',
          900: '#1c2230',
          950: '#11151d',
        },
        // Warm clay neutrals: ivory/peach base so raised "clay" surfaces pop
        // while the orange brand carries the accents.
        clay: {
          bg: '#f4ece4',
          surface: '#fdf6ef',
          50: '#fdf8f3',
          100: '#f8efe6',
          200: '#f0e2d4',
          300: '#e4cdba',
          400: '#d4b39c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        clay: '1.5rem',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(249,115,22,0.15), 0 10px 40px -10px rgba(249,115,22,0.40)',
        card: '0 1px 2px rgba(16,24,40,0.06), 0 12px 32px -12px rgba(16,24,40,0.18)',
        // Claymorphism (refined/subtle), warm-tinted: dark bottom-right drop +
        // light top-left highlight. Inset variants for recessed inputs/pressed.
        clay: '6px 6px 14px rgba(196,160,130,0.40), -6px -6px 14px rgba(255,255,255,0.90)',
        'clay-sm': '3px 3px 8px rgba(196,160,130,0.35), -3px -3px 8px rgba(255,255,255,0.85)',
        'clay-inset':
          'inset 4px 4px 8px rgba(196,160,130,0.40), inset -4px -4px 8px rgba(255,255,255,0.90)',
        'clay-pressed':
          'inset 5px 5px 10px rgba(196,160,130,0.50), inset -4px -4px 8px rgba(255,255,255,0.80)',
        'clay-brand':
          '5px 5px 12px rgba(249,115,22,0.28), -5px -5px 12px rgba(255,255,255,0.75)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(249,115,22,0.5)' },
          '70%': { boxShadow: '0 0 0 14px rgba(249,115,22,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(249,115,22,0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        float: 'float 6s ease-in-out infinite',
        pulseRing: 'pulseRing 2s infinite',
      },
    },
  },
  plugins: [],
}
