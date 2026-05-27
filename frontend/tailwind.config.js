/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
          400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
          800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065',
        },
        accent: {
          400: '#f472b6', 500: '#ec4899', 600: '#db2777',
        },
        dark: {
          50: '#f8fafc', 100: '#1e1b4b', 200: '#1a1739', 300: '#15132e',
          400: '#100e24', 500: '#0c0a1a', 600: '#080612', 700: '#04030a',
          800: '#020105', 900: '#000000',
        },
      },
      animation: {
        'gradient': 'gradient 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)' },
        },
      },
      backgroundImage: {
        'hero-pattern': 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #1e1b4b 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
      },
    },
  },
  plugins: [],
};
