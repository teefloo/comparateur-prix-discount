/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--ink-soft) / <alpha-value>)',
        'ink-faint': 'rgb(var(--ink-faint) / <alpha-value>)',
        'ink-mute': 'rgb(var(--ink-mute) / <alpha-value>)',
        paper: 'rgb(var(--paper) / <alpha-value>)',
        cream: 'rgb(var(--cream) / <alpha-value>)',
        rule: 'rgb(var(--rule) / <alpha-value>)',
        navy: 'rgb(var(--navy) / <alpha-value>)',
        'navy-deep': 'rgb(var(--navy-deep) / <alpha-value>)',
        yellow: 'rgb(var(--yellow) / <alpha-value>)',
        'yellow-deep': 'rgb(var(--yellow-deep) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Bricolage Grotesque', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Big Shoulders Display', 'Arial Black', 'system-ui', 'sans-serif'],
        editorial: ['var(--font-editorial)', 'Fraunces', 'Times New Roman', 'serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'ticket': '0 1px 0 rgb(var(--ink) / 0.85) inset, 0 14px 32px -16px rgb(var(--ink) / 0.30)',
        'ticket-hover': '0 1px 0 rgb(var(--ink) / 0.85) inset, 0 24px 48px -20px rgb(var(--ink) / 0.40)',
      },
      keyframes: {
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'stomp': {
          '0%': { transform: 'scale(0.92) rotate(-3deg)', opacity: '0' },
          '60%': { transform: 'scale(1.04) rotate(-1deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-1.5deg)', opacity: '1' },
        },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        stomp: 'stomp 480ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
      },
    },
  },
  plugins: [],
}

export default config
