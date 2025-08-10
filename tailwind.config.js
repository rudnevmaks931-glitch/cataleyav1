/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        carbon: "#0a0a0a",
        petronas: "#00f7c2",
        silver: "#c0c0c0"
      },
      backgroundImage: {
        glass: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.1))",
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
