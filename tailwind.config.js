/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mars: {
          50: '#fff7f5',
          100: '#ffe8e0',
          200: '#ffc9b8',
          300: '#ffa080',
          400: '#ff6b3d',
          500: '#f94a1a',
          600: '#e03010',
          700: '#ba220f',
          800: '#941e14',
          900: '#781c14',
          950: '#410b07',
        },
        space: {
          950: '#020617',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        },
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          muted: 'rgb(var(--surface-muted) / <alpha-value>)',
          elevated: 'rgb(var(--surface-elevated) / <alpha-value>)',
          card: 'rgb(var(--surface-card) / <alpha-value>)',
        },
        content: {
          DEFAULT: 'rgb(var(--content) / <alpha-value>)',
          muted: 'rgb(var(--content-muted) / <alpha-value>)',
          subtle: 'rgb(var(--content-subtle) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
          muted: 'rgb(var(--border-muted) / <alpha-value>)',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['"Orbitron"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'spin-slow': 'spin 4s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
