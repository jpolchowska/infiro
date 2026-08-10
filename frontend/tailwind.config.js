/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
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
    },
  },
  plugins: [],
};
