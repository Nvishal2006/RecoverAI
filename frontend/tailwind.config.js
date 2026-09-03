/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#060a12',
          900: '#0c121e',
          850: '#111928',
          800: '#1a2333',
        }
      }
    },
  },
  plugins: [],
}
