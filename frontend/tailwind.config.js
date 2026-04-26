/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        'gdg-blue': '#4285F4',
        'gdg-red': '#EA4335',
        'gdg-yellow': '#FBBC04',
        'gdg-green': '#34A853',
        'gdg-blue-pastel': '#C3ECF6',
        'gdg-red-pastel': '#F8D8D8',
        'gdg-yellow-pastel': '#FFE7A5',
        'gdg-green-pastel': '#CCF6C5',
      }
    },
  },
  plugins: [],
}
