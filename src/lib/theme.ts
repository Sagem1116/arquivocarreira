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
  root.style.setProperty("--accent", `color-mix(in oklab, ${c} 55%, var(--background) 45%)`);
  root.style.setProperty("--accent-foreground", fg);

  // Stronger overload: tint the whole canvas with the club color.
  root.style.setProperty("--background", `color-mix(in oklab, ${c} 16%, #0a0a0d 84%)`);
  root.style.setProperty("--card", `color-mix(in oklab, ${c} 14%, #11131a 86%)`);
  root.style.setProperty("--muted", `color-mix(in oklab, ${c} 12%, #1a1d26 88%)`);
  root.style.setProperty("--border", `color-mix(in oklab, ${c} 28%, #1f2230 72%)`);
  root.style.setProperty("--input", `color-mix(in oklab, ${c} 18%, #15181f 82%)`);

  root.style.setProperty("--sidebar", `color-mix(in oklab, ${c} 42%, #0a0a0d 58%)`);
  root.style.setProperty("--sidebar-foreground", fg);
  root.style.setProperty("--sidebar-primary", c);
  root.style.setProperty("--sidebar-primary-foreground", fg);
  root.style.setProperty("--sidebar-border", `color-mix(in oklab, ${c} 35%, var(--background) 65%)`);
  root.style.setProperty("--sidebar-accent", `color-mix(in oklab, ${c} 55%, var(--background) 45%)`);
  root.style.setProperty("--sidebar-accent-foreground", fg);
  root.style.setProperty(
    "--gradient-primary",
    `linear-gradient(135deg, ${c}, color-mix(in oklab, ${c} 60%, white))`,
  );
  root.style.setProperty(
    "--shadow-glow",
    `0 0 60px -8px color-mix(in oklab, ${c} 75%, transparent)`,
  );
  root.style.setProperty(
    "--club-overlay",
    `radial-gradient(circle at 20% 0%, color-mix(in oklab, ${c} 35%, transparent) 0%, transparent 55%), radial-gradient(circle at 80% 100%, color-mix(in oklab, ${c} 28%, transparent) 0%, transparent 60%)`,
  );
}

export function resetTheme() {
  const root = document.documentElement;
  // Remove inline overrides so styles.css defaults take over again.
  for (const prop of [
    "--primary", "--primary-glow", "--primary-foreground", "--primary-rgb",
    "--ring", "--accent", "--accent-foreground",
    "--background", "--card", "--muted", "--border", "--input",
    "--sidebar", "--sidebar-foreground", "--sidebar-primary", "--sidebar-primary-foreground",
    "--sidebar-border", "--sidebar-accent", "--sidebar-accent-foreground",
    "--gradient-primary", "--shadow-glow", "--club-overlay",
  ]) {
    root.style.removeProperty(prop);
  }
}
