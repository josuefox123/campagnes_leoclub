/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.njk",
    "./public/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f3ff',
          100: '#e1e7ff',
          200: '#c8d4ff',
          300: '#a3b7ff',
          400: '#7992ff',
          500: '#546aff',
          600: '#3b46ff',
          700: '#2c31eb',
          800: '#2427be',
          900: '#232797',
          950: '#141558',
        }
      }
    },
  },
  plugins: [],
}
