// Dynamic theme: switch primary color of the entire app to a club color.
// Uses CSS variables so every component re-themes automatically.

const DEFAULT_PRIMARY = "#FF7A1A";

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function srgbToLinear(v: number) {
  const x = v / 255;
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function relLuminance([r, g, b]: [number, number, number]) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function applyClubTheme(hex?: string) {
  const color = hex && /^#?[0-9a-fA-F]{3,8}$/.test(hex) ? hex : DEFAULT_PRIMARY;
  const c = color.startsWith("#") ? color : `#${color}`;
  const rgb = hexToRgb(c);
  const lum = relLuminance(rgb);
  const fg = lum > 0.5 ? "oklch(0.14 0.01 60)" : "oklch(0.98 0.01 70)";

  const root = document.documentElement;
  root.style.setProperty("--primary", c);
  root.style.setProperty("--primary-glow", c);
  root.style.setProperty("--primary-foreground", fg);
  root.style.setProperty("--primary-rgb", rgb.join(" "));
  root.style.setProperty("--ring", c);
  root.style.setProperty("--sidebar", `color-mix(in oklab, ${c} 24%, var(--background) 76%)`);
  root.style.setProperty("--sidebar-foreground", fg);
  root.style.setProperty("--sidebar-primary", c);
  root.style.setProperty("--sidebar-primary-foreground", fg);
  root.style.setProperty("--sidebar-border", `color-mix(in oklab, ${c} 18%, var(--background) 82% / 70%)`);
  root.style.setProperty("--sidebar-accent", `color-mix(in oklab, ${c} 30%, var(--background) 70%)`);
  root.style.setProperty("--sidebar-accent-foreground", fg);
  root.style.setProperty(
    "--gradient-primary",
    `linear-gradient(135deg, ${c}, color-mix(in oklab, ${c} 70%, white))`,
  );
  root.style.setProperty(
    "--shadow-glow",
    `0 0 40px -8px color-mix(in oklab, ${c} 60%, transparent)`,
  );
}

export function resetTheme() {
  applyClubTheme(DEFAULT_PRIMARY);
}
