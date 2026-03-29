// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-color)',
        'primary-text': 'var(--primary-text)',
        box: 'var(--box-bg-color)',
        high: 'var(--high-bg-color)',         
        'high-text': 'var(--high-text-color)',
        mint: '#85d8ea',
      },
      borderRadius: {
        box: 'var(--box-radius)',
        btn: 'var(--btn-radius)',
      },
      padding: {
        box: 'var(--box-padding)',
      },
      fontFamily: {
        sans: ['var(--main-font)', 'sans-serif'], 
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        fadeInUp: 'fadeInUp 0.5s ease-out forwards',
      }
    },
  },
  plugins: [],
}