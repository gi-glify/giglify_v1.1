/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Giglify Design System
        brand: {
          50: '#fff8e7',
          100: '#ffedb8',
          200: '#fddd7a',
          300: '#f7c24b',
          400: '#f5a623',
          500: '#d88908',
          600: '#b46f04',
          700: '#7f4d03',
          800: '#4f3002',
          900: '#2f1d01',
        },
        primary: {
          amber: '#F5A623',
          'amber-dark': '#F59E0B',
        },
        navy: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        accent: {
          green: '#10B981',
          'green-light': '#A7F3D0',
        },
        slate: {
          muted: '#64748B',
          text: '#334155',
          border: '#E2E8F0',
        },
      },
      fontFamily: {
        'body': ['IBM Plex Sans', 'system-ui', '-apple-system', 'sans-serif'],
        'sans': ['IBM Plex Sans', 'system-ui', '-apple-system', 'sans-serif'],
        'display': ['Space Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in',
        'slide-up': 'slideUp 0.6s ease-out',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-450px 0' },
          '100%': { backgroundPosition: '450px 0' }
        }
      }
    },
  },
  plugins: [],
}
