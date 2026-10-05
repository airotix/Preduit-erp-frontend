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
// Country-aware parsing is shared by bespoke forms, AutoForm, and invoice checks.
import { checkPhone } from "./phone";
export { PHONE_MAX_DIGITS, PHONE_ERROR } from "./phone";
export const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i;
export const SWIFT_RE = /^[A-Za-z]{6}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?$/;

export function isEmail(v: string): boolean {
  return EMAIL_RE.test(v.trim());
}

export function isPhone(v: string, country?: string): boolean {
  return !!checkPhone(v, country).number;
}

export function isPhoneField(name: string): boolean {
  return /(phone|mobile|tel\b|telephone|contactnumber|whatsapp|fax|supportline)/.test(name.toLowerCase().replace(/[_\s-]/g, ""));
}

/** Invoice documents have editable phone fields inside party objects. */
export function invoicePhoneError(doc: Record<string, any>): string | null {
  if (doc.contactPhone) {
    const error = fieldFormatError("phone", doc.contactPhone, doc.buyer?.country);
    if (error) return error;
  }
  for (const party of ["exporter", "buyer", "supplier", "seller"]) {
    for (const [name, value] of Object.entries(doc[party] || {})) {
      if (isPhoneField(name)) {
        const error = fieldFormatError(name, value, doc[party]?.country);
        if (error) return error;
      }
    }
  }
  return null;
}

export function isWebsite(v: string): boolean {
  return URL_RE.test(v.trim());
}

/** Returns an error string for a value given its field name, or null if OK.
 *  Empty values pass here (the "required" check owns emptiness). */
export function fieldFormatError(name: string, value: unknown, country?: string): string | null {
  if (value == null) return null;
  const v = String(value).trim();
  if (!v) return null;
  const n = name.toLowerCase();

  if (/e-?mail/.test(n)) return isEmail(v) ? null : "Enter a valid email address.";
  if (isPhoneField(name))
    return checkPhone(v, country, /mobile/i.test(name)).error || null;
  if (/(website|^url$|homepage)/.test(n)) return isWebsite(v) ? null : "Enter a valid URL.";
  if (/(linkedin|instagram|facebook|twitter|^x$)/.test(n))
    // Social handles/URLs — light touch: reject spaces only.
    return /\s/.test(v) ? "Remove spaces from the handle/URL." : null;
  if (/swift|bic/.test(n)) return SWIFT_RE.test(v) ? null : "Enter a valid SWIFT/BIC code.";
  if (/(postal|zip|postcode)/.test(n))
    return /^[A-Za-z0-9][A-Za-z0-9 -]{1,11}$/.test(v) ? null : "Enter a valid postal code.";
  return null;
}
