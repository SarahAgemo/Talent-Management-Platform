/** @type {import('tailwindcss').Config} */

// Every colour is a CSS variable defined in app/globals.css, once for light mode
// (:root) and once for dark mode (.dark), so the whole app switches theme
// without any page needing its own dark-mode classes.
const solid = (name) => `rgb(var(--${name}) / <alpha-value>)`;
// Brand and status colours: in dark mode their soft tints (bg-brand/10,
// bg-success/10, ...) are strengthened by --tint-boost so they stay visible on
// dark backgrounds. Solid colours are unaffected (alpha is capped at 1).
const tinted = (name) => `rgb(var(--${name}) / calc(<alpha-value> * var(--tint-boost, 1)))`;

module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: {
      ink: solid("ink"), paper: solid("paper"), surface: solid("surface"), border: solid("border"),
      brand: { DEFAULT: tinted("brand"), light: tinted("brand-light"), dark: tinted("brand-dark") },
      accent: { DEFAULT: tinted("accent"), light: tinted("accent-light"), dark: tinted("accent-dark") },
      success: tinted("success"), warning: tinted("warning"), danger: tinted("danger")
    },
    // Text in brand/status colours uses a shade picked for legibility in each
    // mode (e.g. a lighter purple on dark backgrounds), separate from the fill.
    textColor: {
      brand: { DEFAULT: solid("brand-fg") },
      accent: { DEFAULT: solid("accent-fg") },
      success: solid("success-fg"), warning: solid("warning-fg"), danger: solid("danger-fg")
    },
    // Plain `border` / `divide-y` with no colour class follow the theme too.
    borderColor: { DEFAULT: solid("border") },
    // Brand manual typefaces. Headings, navigation and figures use Century
    // Gothic (falling back to Helvetica Neue, the approved alternate). Tables,
    // forms and running text use Helvetica Neue, which stays compact and easy
    // to read in dense data (Segoe UI / Arial where it isn't installed).
    fontFamily: {
      display: ['"Century Gothic"', "CenturyGothic", '"Helvetica Neue"', "Helvetica", '"Segoe UI"', "Arial", "sans-serif"],
      body: ['"Helvetica Neue"', "Helvetica", '"Segoe UI"', "Arial", "sans-serif"]
    }
  } },
  plugins: []
};
