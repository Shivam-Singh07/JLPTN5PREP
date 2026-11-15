/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        jp: ['"Noto Sans JP"', '"Zen Maru Gothic"', 'sans-serif'],
        mincho: ['"Shippori Mincho"', '"Noto Serif JP"', 'serif'],
      },
      colors: {
        // Japanese traditional colors (日本の伝統色)
        sumi: {
          950: '#0c0c0e',
          900: '#121215',
          850: '#17171b',
          800: '#1d1d22',
          700: '#282830',
          600: '#3a3a44',
          500: '#52525e',
          400: '#737380',
          300: '#a1a1aa',
          200: '#d4d4d8',
          100: '#f4f4f5',
        },
        vermilion: {
          DEFAULT: '#c53d33',
          50: '#fdf3f2',
          100: '#fbe4e2',
          200: '#f8cdc8',
          300: '#f1aba3',
          400: '#e57a6f',
          500: '#c53d33', // Traditional Japanese Shu-iro
          600: '#b12f26',
          700: '#94241d',
          800: '#7b201a',
          900: '#671e1a',
        },
        washi: {
          50: '#faf9f5',
          100: '#f5f3ec',
          200: '#eeebe1',
          300: '#ded9c9',
          400: '#c5bea9',
          500: '#a89f88',
        },
        matcha: {
          DEFAULT: '#16a34a',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        brand: {
          50: '#fdf3f2',
          100: '#fbe4e2',
          200: '#f8cdc8',
          300: '#f1aba3',
          400: '#e57a6f',
          500: '#c53d33',
          600: '#b12f26',
          700: '#94241d',
          800: '#7b201a',
          900: '#671e1a',
        }
      }
    },
  },
  plugins: [],
}
