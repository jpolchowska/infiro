/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}', './lib/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        infiro: {
          navy: '#142284',
          coral: '#ff5f55',
          peach: '#f0b67e',
          purple: '#c873d9',
          white: '#fefefe',
        },
      },
      fontFamily: {
        sans: ['Manrope_400Regular'],
        normal: ['Manrope_400Regular'],
        medium: ['Manrope_500Medium'],
        semibold: ['Manrope_600SemiBold'],
        bold: ['Manrope_700Bold'],
        extrabold: ['Manrope_800ExtraBold'],
      },
      // Tylko najmniejszy tekst w apce był za drobny (text-xs) -- domyślne
      // 12px podbite do 13px. Reszta skali (sm/base/lg/xl...) zostaje bez zmian.
      fontSize: {
        xs: '13px',
      },
    },
  },
  plugins: [],
};
