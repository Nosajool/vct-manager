/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // VCT-inspired color palette
        'vct-red': '#ff4655',
        'vct-dark': '#0f1923',
        'vct-darker': '#0a1017',
        'vct-gray': '#768079',
        'vct-light': '#ece8e1',
      },
    },
  },
  plugins: [],
}
