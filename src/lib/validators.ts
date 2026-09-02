/**
 * Shared field-format validation used across every form in the app.
 *
 * `fieldFormatError(name, value)` infers the expected format from the field
 * NAME (email / phone / website / postal / IBAN / SWIFT / tax) and returns an
 * error message, or null when the value is empty (empty is handled by the
 * separate "required" rule) or valid. This keeps one source of truth so the
 * AutoForm and every bespoke form validate identically.
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Digits, spaces, dashes, parentheses, optional leading +. Must hold 7–15 digits.
export const PHONE_RE = /^\+?[\d\s().-]{7,}$/;
export const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i;
export const SWIFT_RE = /^[A-Za-z]{6}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?$/;

export function isEmail(v: string): boolean {
  return EMAIL_RE.test(v.trim());
}

export function isPhone(v: string): boolean {
  const s = v.trim();
  if (!PHONE_RE.test(s)) return false;
  const digits = (s.match(/\d/g) || []).length;
  return digits >= 7 && digits <= 15;
}

export function isWebsite(v: string): boolean {
  return URL_RE.test(v.trim());
}

/** Returns an error string for a value given its field name, or null if OK.
 *  Empty values pass here (the "required" check owns emptiness). */
export function fieldFormatError(name: string, value: unknown): string | null {
  if (value == null) return null;
  const v = String(value).trim();
  if (!v) return null;
  const n = name.toLowerCase();

  if (/e-?mail/.test(n)) return isEmail(v) ? null : "Enter a valid email address.";
  if (/(phone|mobile|tel\b|telephone|contactnumber|whatsapp|fax|supportline)/.test(n))
    return isPhone(v) ? null : "Enter a valid phone number.";
  if (/(website|^url$|homepage)/.test(n)) return isWebsite(v) ? null : "Enter a valid URL.";
  if (/(linkedin|instagram|facebook|twitter|^x$)/.test(n))
    // Social handles/URLs — light touch: reject spaces only.
    return /\s/.test(v) ? "Remove spaces from the handle/URL." : null;
  if (/swift|bic/.test(n)) return SWIFT_RE.test(v) ? null : "Enter a valid SWIFT/BIC code.";
  if (/(postal|zip|postcode)/.test(n))
    return /^[A-Za-z0-9][A-Za-z0-9 -]{1,11}$/.test(v) ? null : "Enter a valid postal code.";
  return null;
}
