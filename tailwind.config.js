/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'deep-blue': {
          50: '#f0f4fa',
          100: '#dce4ef',
          200: '#b8c7de',
          300: '#8ea3c7',
          400: '#607ea9',
          500: '#3f5e8a',
          600: '#2f4a6e',
          700: '#253b57',
          800: '#17283d',
          900: '#0A1628',
          950: '#050c16',
        },
        'alert-orange': {
          50: '#fff3ed',
          100: '#ffe2d3',
          200: '#ffbfa6',
          300: '#ff9570',
          400: '#ff6b35',
          500: '#f94e10',
          600: '#e63706',
          700: '#c22608',
          800: '#9d1f0e',
          900: '#7f1c10',
        },
        'tech-cyan': {
          50: '#e8fbf7',
          100: '#c5f5e9',
          200: '#8cead5',
          300: '#48d8bd',
          400: '#00D4AA',
          500: '#00b895',
          600: '#00937a',
          700: '#037563',
          800: '#085d50',
          900: '#0a4d43',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
