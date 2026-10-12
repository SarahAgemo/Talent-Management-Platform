// The Refactory logo, drawn from the master artwork (refactory-logo.svg)
// exactly as supplied: same shapes, same proportions, brand colours only.
// Brand manual rules: never skew, stretch, outline, recolour, rearrange or add
// a drop shadow to the logo. Size it with a height class (e.g. "h-8 w-auto").
//
// Variants (both from the brand manual):
//   "color" - purple wordmark and slash, cerulean anchors (light backgrounds)
//   "white" - white wordmark and slash, cerulean anchors (purple / dark backgrounds)
//   "auto"  - "color" in light mode, "white" in dark mode (default)

const PURPLE = "#663367";
const CERULEAN = "#38BFC3";

// Wordmark letters r-e-f-a-c-t-o-r.
const WORDMARK = [
  "M321.27,191.89c64.33,0,96.5,32.84,96.5,98.52c0,8.75-0.6,17.5-1.81,26.25H275.24 c0,29.88,21.94,44.82,65.81,44.82c21.4,0,42.8-2.02,64.21-6.06v42.4c-18.71,4.04-41.46,6.06-68.24,6.06 c-76.85,0-115.28-36.14-115.28-108.41C221.74,226.41,254.92,191.89,321.27,191.89z M275.24,279.51h90.45v-1.61 c0-29.34-14.81-44.01-44.41-44.01C293.01,233.88,277.66,249.09,275.24,279.51z",
  "M451.64,403.87V191.89c0-58.15,31.76-87.22,95.29-87.22c17.36,0,33.11,2.69,47.24,8.07v42.4 c-13.32-5.38-27.79-8.07-43.4-8.07c-30.42,0-45.63,14.94-45.63,44.82h63.6v42.4h-63.6v169.59H451.64z",
  "M577.01,337.86c0-42.13,30.69-63.19,92.07-63.19c14.4,0,28.8,1.35,43.2,4.04v-15.95 c0-18.98-13.67-28.47-40.99-28.47c-23.15,0-48.86,3.37-77.13,10.09v-42.4c28.27-6.73,53.97-10.09,77.13-10.09 c62.99,0,94.48,23.28,94.48,69.85v142.13h-31.09l-18.97-18.98c-18.44,12.65-38.77,18.98-60.98,18.98 C602.92,403.87,577.01,381.87,577.01,337.86z M669.08,311.01c-25.71,0-38.56,8.75-38.56,26.25c0,18.84,10.77,28.26,32.3,28.26 c17.77,0,34.25-5.52,49.47-16.56v-33.91C698.82,312.35,684.42,311.01,669.08,311.01z",
  "M960.1,397.81c-17.49,4.04-35.67,6.06-54.51,6.06c-75.37,0-113.06-36.68-113.06-110.03 c0-67.97,37.68-101.95,113.06-101.95c18.84,0,37.02,2.02,54.51,6.05v42.4c-17.49-4.04-34.32-6.05-50.47-6.05 c-42.4,0-63.6,19.85-63.6,59.56c0,45.09,21.2,67.63,63.6,67.63c16.15,0,32.98-2.02,50.47-6.06V397.81z",
  "M992.4,157.57h39.57l8.07,34.32h53.3v42.4h-47.45v97.51c0,19.79,8.55,29.68,25.64,29.68h21.8v42.4h-47.64 c-35.54,0-53.3-19.05-53.3-57.14V157.57z",
  "M1119.59,297.88c0-71.07,34.99-106.6,104.99-106.6c69.99,0,104.98,35.54,104.98,106.6 c0,70.93-34.99,106.4-104.98,106.4C1154.85,404.28,1119.86,368.81,1119.59,297.88z M1224.57,363.49c34.32,0,51.48-22.14,51.48-66.42 c0-43.2-17.16-64.81-51.48-64.81c-34.32,0-51.48,21.61-51.48,64.81C1173.09,341.36,1190.25,363.49,1224.57,363.49z",
  "M1357.31,403.87V191.89h41.39l6.66,27.05c18.57-18.04,38.22-27.05,58.95-27.05v43.2 c-19.92,0-37.76,8.28-53.5,24.83v143.95H1357.31z",
  "M104,403.87V191.89h41.39l6.66,27.05c18.57-18.04,38.22-27.05,58.95-27.05v43.2c-19.92,0-37.76,8.28-53.5,24.83 v143.95H104z"
];
// The two <> coding anchors and the forward slash that form the "y".
const ANCHORS = [
  "1746.16,191.14 1822,389.54 1765.27,389.54 1673.16,389.54 1689.52,344.42 1749.45,344.42 1720.51,261.86",
  "1577.37,389.97 1492.07,192.05 1548.81,192.05 1650.38,192.05 1634.03,237.17 1564.62,237.17 1601.99,323.8"
];
const SLASH = "1615.44,488.81 1723.37,191.14 1671.43,191.14 1563.51,488.81";

type LogoProps = { variant?: "auto" | "color" | "white"; className?: string; title?: string };

export default function Logo({ variant = "auto", className, title = "Refactory" }: LogoProps) {
  // Purple parts: a fixed colour, or purple that turns white in dark mode.
  const purpleFill = variant === "white" ? "#FFFFFF" : PURPLE;
  const purpleClass = variant === "auto" ? "dark:fill-white" : undefined;
  return (
    <svg viewBox="102 102 1722 389" role="img" aria-label={title} className={className} xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      {WORDMARK.map((d, i) => <path key={i} d={d} fill={purpleFill} className={purpleClass} />)}
      {ANCHORS.map((points, i) => <polygon key={i} points={points} fill={CERULEAN} />)}
      <polygon points={SLASH} fill={purpleFill} className={purpleClass} />
    </svg>
  );
}
