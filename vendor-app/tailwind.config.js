/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#f59e0b', // Amber 500
          foreground: '#000000',
        },
        background: '#ffffff',
        foreground: '#09090b',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#09090b',
        },
        border: '#e4e4e7',
      }
    },
  },
  plugins: [],
}
