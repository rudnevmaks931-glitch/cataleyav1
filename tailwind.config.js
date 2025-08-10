/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        neon: "#00f7c2",
        petronas: "#00b398",
        carbon: "#0a0a0a",
        panel: "rgba(255,255,255,0.03)",
        textDefault: "#E6FFF9",
        textMuted: "#A9EDE0"
      },
      boxShadow: {
        'neon-md': '0 8px 30px rgba(0,247,194,0.08)'
      },
      borderRadius: {
        'lg-2': '14px'
      }
    }
  },
  plugins: []
}
