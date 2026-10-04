export const NEUTRAL_COLOR = "#CBD1DC";

const aliases: Record<string, string> = {
  cream: "#FFFDD0", ivory: "#FFFFF0", offwhite: "#FAF9F6", ecru: "#C2B280",
  charcoal: "#36454F", burgundy: "#800020", wine: "#722F37", mustard: "#FFDB58",
  khaki: "#C3B091", camel: "#C19A6B", denim: "#1560BD", blush: "#DE5D83",
  dustyrose: "#C08081", rose: "#FF007F", sage: "#9CAF88", mint: "#98FF98",
  forest: "#228B22", olivegreen: "#808000", navyblue: "#000080", royalblue: "#4169E1",
  babyblue: "#89CFF0", chocolatebrown: "#7B3F00", rust: "#B7410E", taupe: "#483C32",
};

export type SavedColor = { name: string; hex: string | null };
const normalize = (name: unknown) => typeof name === "string"
  ? name.trim().toLowerCase().replace(/[\s-]+/g, "") : "";

/** Use the tenant's saved shade, apparel aliases, then browser named colours. */
export function colorFromName(name: string, saved: SavedColor[] = []): string | null {
  const key = normalize(name);
  if (!key) return null;
  const existing = saved.find((color) => normalize(color?.name) === key);
  if (existing?.hex && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(existing.hex)) return existing.hex;
  if (aliases[key]) return aliases[key];
  // Accept names only; expressions, transparency and inherited colours do not
  // identify an article shade. Collapsing spaces also supports "sky blue".
  if (!/^[a-z]+$/.test(key) || ["transparent", "currentcolor", "inherit", "initial", "unset", "revert"].includes(key)) return null;
  if (typeof document === "undefined" || typeof CSS === "undefined" || !CSS.supports("color", key)) return null;
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = key;
  return /^#[0-9a-f]{6}$/i.test(ctx.fillStyle) ? ctx.fillStyle : null;
}
