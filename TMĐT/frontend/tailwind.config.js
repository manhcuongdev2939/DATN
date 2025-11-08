/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#edfaff',
          100: '#d6f2ff',
          200: '#ade5ff',
          300: '#75d2ff',
          400: '#34b7ff',
          500: '#1099ee',
          600: '#0778cc',
          700: '#065fa4',
          800: '#0b4e82',
          900: '#0f416b'
        }
      }
    },
  },
  plugins: [],
};


