/** Shared helper for number inputs whose default is 0 — instead of showing a
 *  literal "0" the user has to select/delete before typing (which causes the
 *  classic "01" glitch), render the field empty and let a `placeholder="0"`
 *  show the hint in grey. Existing onChange handlers already treat an empty
 *  string as 0 (via `Number(v) || 0` / `parseFloat(v) || 0` etc.), so this is
 *  purely a display-side change. */
export function zeroToBlank(n: number | string | null | undefined): number | string {
  if (n === 0 || n === "0" || n === null || n === undefined) return "";
  return n;
}
