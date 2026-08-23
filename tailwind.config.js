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
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-muted': 'rgb(var(--surface-muted) / <alpha-value>)',
        'surface-strong': 'rgb(var(--surface-strong) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        'border-strong': 'rgb(var(--border-strong) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-strong': 'rgb(var(--accent-strong) / <alpha-value>)',
        'accent-soft': 'rgb(var(--accent-soft) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--ink-soft) / <alpha-value>)',
        'ink-faint': 'rgb(var(--ink-faint) / <alpha-value>)',
        'ink-mute': 'rgb(var(--ink-mute) / <alpha-value>)',
        paper: 'rgb(var(--paper) / <alpha-value>)',
        'paper-2': 'rgb(var(--paper-2) / <alpha-value>)',
        'paper-3': 'rgb(var(--paper-3) / <alpha-value>)',
        cream: 'rgb(var(--cream) / <alpha-value>)',
        rule: 'rgb(var(--rule) / <alpha-value>)',
        navy: 'rgb(var(--navy) / <alpha-value>)',
        'navy-deep': 'rgb(var(--navy-deep) / <alpha-value>)',
        yellow: 'rgb(var(--yellow) / <alpha-value>)',
        'yellow-deep': 'rgb(var(--yellow-deep) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Bricolage Grotesque', 'system-ui', 'sans-serif'],
        display: ['var(--font-sans)', 'Bricolage Grotesque', 'system-ui', 'sans-serif'],
        editorial: ['var(--font-sans)', 'Bricolage Grotesque', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
