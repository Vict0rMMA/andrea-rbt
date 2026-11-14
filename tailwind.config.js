/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: { 50: '#FDF4FF', 300: '#F0ABFC', 400: '#A78BFA', 600: '#7C3AED', 700: '#6D28D9', 900: '#2E1065' },
      },
      keyframes: {
        pop: { '0%': { transform: 'scale(.92)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
        rise: { '0%': { transform: 'translateY(10px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-5px)' }, '75%': { transform: 'translateX(5px)' } },
      },
      animation: {
        pop: 'pop .28s cubic-bezier(.2,.9,.3,1.2) both',
        rise: 'rise .35s ease-out both',
        float: 'float 4s ease-in-out infinite',
        shake: 'shake .3s ease-in-out',
      },
    },
  },
  plugins: [],
};
