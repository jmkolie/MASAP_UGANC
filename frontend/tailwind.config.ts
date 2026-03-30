import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf2f4',
          100: '#f4dfe6',
          200: '#e9becd',
          300: '#db8ba7',
          400: '#c85e83',
          500: '#a73763',
          600: '#8e1f4c',
          700: '#6b1f33',
          800: '#531628',
          900: '#3d0f1c',
          950: '#260710',
        },
        university: {
          blue: '#0e66c2',
          'blue-light': '#2b7bd0',
          gold: '#de5634',
          'gold-light': '#f18b54',
          light: '#faf2f4',
          burgundy: '#531628',
          'burgundy-dark': '#3d0f1c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px -18px rgba(83, 22, 40, 0.35)',
        'card-hover': '0 18px 45px -24px rgba(83, 22, 40, 0.45)',
      },
    },
  },
  plugins: [],
}
export default config
