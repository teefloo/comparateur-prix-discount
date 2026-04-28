/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#0057FF',
          muted: '#3B82F6',
          subtle: '#EFF6FF',
          glow: 'rgba(0, 87, 255, 0.12)',
        },
        secondary: {
          DEFAULT: '#00E5A0',
          muted: '#34D399',
          subtle: '#ECFDF5',
        },
        coral: {
          DEFAULT: '#FF6B35',
          muted: '#FF8C5A',
        },
        foreground: '#0F172A',
        muted: '#64748B',
        subtle: '#CBD5E1',
        action: '#0066CC',
        stokomani: '#E63946',
        bm: '#2D3436',
        centrakor: '#00B894',
        aldi: '#004b90',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 10px 25px rgba(0, 0, 0, 0.06), 0 4px 10px rgba(0, 0, 0, 0.03)',
        'accent-sm': '0 4px 14px rgba(0, 87, 255, 0.15)',
        'accent-lg': '0 8px 32px rgba(0, 87, 255, 0.2)',
      },
      animation: {
        'gentle-rise': 'gentle-rise 0.3s ease-out',
      },
      keyframes: {
        'gentle-rise': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
