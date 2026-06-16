/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a14',
        surface: '#13131f',
        border: '#252538',
        accent: '#6366f1',
        accent2: '#8b5cf6',
      },
    },
  },
  plugins: [],
}
