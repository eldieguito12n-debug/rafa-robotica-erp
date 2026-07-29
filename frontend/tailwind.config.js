/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f0ff',
          100: '#b3d1ff',
          200: '#80b3ff',
          300: '#4d94ff',
          400: '#1a75ff',
          500: '#0066ff',
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001433',
        },
        neon: {
          green: '#00ff88',
          blue: '#00d4ff',
          purple: '#a855f7',
          pink: '#ff0080',
          yellow: '#ffd600',
        },
        dark: {
          50: '#f5f7fa',
          100: '#e4e8ef',
          200: '#c5ccd9',
          300: '#9ba6b8',
          400: '#6b7891',
          500: '#4b5773',
          600: '#354059',
          700: '#232c40',
          800: '#131a2b',
          900: '#0a0f1c',
          950: '#050810',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(0, 102, 255, 0.3)',
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.3)',
        'glow-cyan': '0 0 30px rgba(0, 212, 255, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(0, 102, 255, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 102, 255, 0.07) 1px, transparent 1px)",
        'radial-glow': 'radial-gradient(ellipse at top, rgba(0, 102, 255, 0.15) 0%, transparent 50%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 8s linear infinite',
        'scan': 'scan 4s linear infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 102, 255, 0.3), 0 0 10px rgba(0, 102, 255, 0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 102, 255, 0.5), 0 0 40px rgba(0, 102, 255, 0.2)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
