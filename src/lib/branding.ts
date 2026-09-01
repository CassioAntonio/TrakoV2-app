import mark from "@/assets/trako-mark.png";

/**
 * Single source of truth for the brand assets used in generated share images.
 * Swap the logo/colors here — the share pipeline never hardcodes them.
 */
export const BRANDING = {
  name: "TRAKO",
  tagline: "YOUR RIDE. YOUR TRAIL.",
  markSrc: mark as string,
  colors: {
    background: "#0b0f0d",
    surface: "#12181a",
    accent: "#a3e635",
    accentSoft: "rgba(163,230,53,0.22)",
    text: "#ffffff",
    muted: "#9aa5a0",
  },
  fonts: {
    display: "700 __px 'Chakra Petch', system-ui, sans-serif",
    body: "500 __px 'Barlow', system-ui, sans-serif",
  },
} as const;

export function displayFont(px: number) {
  return BRANDING.fonts.display.replace("__", String(px));
}

export function bodyFont(px: number) {
  return BRANDING.fonts.body.replace("__", String(px));
}
