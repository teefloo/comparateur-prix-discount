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
          DEFAULT: '#0C8F63',
          muted: '#15A46F',
          subtle: '#E9F8F1',
          glow: 'rgba(12, 143, 99, 0.12)',
        },
        secondary: {
          DEFAULT: '#1F6FEB',
          muted: '#4F86F7',
          subtle: '#EAF1FF',
        },
        coral: {
          DEFAULT: '#FF6B35',
          muted: '#FF8C5A',
        },
        foreground: '#0F172A',
        muted: '#526173',
        subtle: '#9AA6B2',
        paper: '#F7F6F2',
        surface: '#FFFFFF',
        surfaceSoft: '#EEF1F5',
        line: '#D8DEE8',
        ink: '#0B1220',
        success: '#0C8F63',
        warning: '#B76A00',
        danger: '#C2410C',
        action: '#0066CC',
        stokomani: '#E63946',
        bm: '#2D3436',
        centrakor: '#00B894',
        aldi: '#004b90',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 1px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 12px 30px rgba(15, 23, 42, 0.10)',
        'accent-sm': '0 8px 18px rgba(12, 143, 99, 0.14)',
        'accent-lg': '0 14px 34px rgba(12, 143, 99, 0.20)',
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
