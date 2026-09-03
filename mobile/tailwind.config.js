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
      // Klucze rodziny fontu NIE mogą pokrywać się z nazwami utility font-weight
      // Tailwinda (normal/medium/semibold/bold/extrabold) -- inaczej klasa np.
      // font-bold niesie jednocześnie fontFamily i fontWeight, co na Androidzie
      // wywala się do systemowego kroju. Waga bierze się z samego pliku fontu.
      fontFamily: {
        sans: ['Manrope_400Regular'],
        manrope: ['Manrope_400Regular'],
        'manrope-medium': ['Manrope_500Medium'],
        'manrope-semibold': ['Manrope_600SemiBold'],
        'manrope-bold': ['Manrope_700Bold'],
        'manrope-extrabold': ['Manrope_800ExtraBold'],
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
