/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: {
      ink: "#1B1F2A", paper: "#FAFAF8", surface: "#FFFFFF", border: "#E4E1D8",
      brand: { DEFAULT: "#663366", light: "#8C5B8C", dark: "#4D264D" },
      accent: { DEFAULT: "#00A8A8", light: "#4DC7C7", dark: "#007575" },
      success: "#2F7D5D", warning: "#C6862B", danger: "#B3462C"
    },
    fontFamily: { display: ["Poppins", "system-ui", "sans-serif"], body: ["Poppins", "system-ui", "sans-serif"] }
  } },
  plugins: []
};
