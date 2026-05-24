/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0B0F1A',
          900: '#0B0F1A',
          800: '#121826',
          700: '#1B2330',
          600: '#26303D',
          500: '#39455A',
          400: '#5A6677',
          300: '#8A95A6',
          200: '#C2C9D4',
          100: '#E6E9EF',
          50: '#F4F6FA',
        },
        marigold: {
          DEFAULT: '#F4A227',
          600: '#D8861A',
          500: '#F4A227',
          400: '#F8BB5C',
          100: '#FFF1D9',
        },
        emerald: {
          DEFAULT: '#1F8E63',
          600: '#16734F',
          500: '#1F8E63',
          400: '#3FB180',
          100: '#D9F1E5',
        },
        terracotta: {
          DEFAULT: '#C8553D',
          500: '#C8553D',
          100: '#F8DCD4',
        },
        canvas: { DEFAULT: '#FBF8F2', dark: '#0B0F1A' },
      },
      fontFamily: {
        display: ['Georgia', 'Fraunces', 'serif'],
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: { '4xl': '28px' },
    },
  },
  plugins: [],
};
