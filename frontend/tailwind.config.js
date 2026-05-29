/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: '#FFF8F0',
        forest: '#1B5E20',
        amber: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#B45309',
        },
        sky: {
          DEFAULT: '#3B82F6',
          light: '#DBEAFE',
          dark: '#1D4ED8',
        },
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
      },
      minHeight: {
        touch: '48px',
      },
    },
  },
  plugins: [],
}
