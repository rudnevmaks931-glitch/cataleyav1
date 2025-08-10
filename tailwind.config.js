/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        neon: "#00f7c2",
        petronas: "#00b398",
        accentBlue: "#00F5FF",
        carbon: "#0a0a0a",
        panel: "rgba(255,255,255,0.03)",
        textDefault: "#E6FFF9",
        textMuted: "#A9EDE0"
      },
      boxShadow: {
        'neon-md': '0 8px 30px rgba(0,247,194,0.08)',
        'neon-glow': '0 8px 40px rgba(0,245,255,0.14)'
      },
      borderRadius: {
        'lg-2': '14px'
      }
    }
  },
  plugins: []
};
