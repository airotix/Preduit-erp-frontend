/**
 * Badge "tone" tokens — ported from the original Apparel ERP mock.
 * Each tone maps to a soft background, a readable foreground and a status dot.
 */
export type Tone =
  | "green"
  | "amber"
  | "red"
  | "neutral"
  | "accent"
  | "navy";

export const TONES: Record<Tone, { bg: string; fg: string; dot: string }> = {
  green: { bg: "#EAF5EF", fg: "#1F7A53", dot: "#2E9E6B" },
  amber: { bg: "#FBF3E6", fg: "#9C6B0E", dot: "#D29A22" },
  red: { bg: "#FBECEA", fg: "#C0392B", dot: "#D9534F" },
  neutral: { bg: "#EEEFF2", fg: "#4A4F61", dot: "#9499A6" },
  accent: { bg: "#FCEADF", fg: "#C2511A", dot: "#F36523" },
  navy: { bg: "#E7E9F0", fg: "#262B3F", dot: "#3A4256" },
};

export function tone(t: Tone | undefined) {
  return TONES[t ?? "neutral"] ?? TONES.neutral;
}

const AVATAR_COLORS = [
  "#3A4256",
  "#5B6478",
  "#8A6D3B",
  "#4A6B5D",
  "#6E5B7B",
  "#345B6B",
];

/** Deterministic avatar background from a string (matches the mock's hashing). */
export function avatarColor(s: string): string {
  let h = 0;
  for (let i = 0; i < (s || "").length; i++) {
    h = (h * 31 + s.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[h];
}

/** Two-letter initials from a name. */
export function initials(s: string): string {
  return (s || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
