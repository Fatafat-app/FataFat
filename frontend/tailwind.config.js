/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./services/**/*.{js,jsx,ts,tsx}",
    "./store/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#FF6000',
        ftafat: {
          yellow: '#FACC15',
          dark: '#4A2B11',
          brown: '#8C5E35',
          gold: '#CA8A04',
          accent: '#FF6000',
        },
      },
    },
  },
  plugins: [],
};
