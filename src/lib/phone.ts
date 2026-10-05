import { parsePhoneNumberWithError, type CountryCode } from "libphonenumber-js/max";
import { countryCode } from "./locations";

export const PHONE_MAX_DIGITS = 14;
export const PHONE_ERROR = "Enter a valid phone number with its country code (up to 14 digits).";
export function checkPhone(value: string, country?: string, mobileOnly = false): { number?: string; country?: CountryCode; error?: string } {
  const raw = value.trim();
  if (!raw) return {};
  if (!/^\+?[\d\s().-]+$/.test(raw)) return { error: "Use digits and an optional leading + country code." };
  const code = countryCode(country) as CountryCode | undefined;
  if (!raw.startsWith("+") && !code) return { error: "Select a phone country or enter the number with + and its country code." };
  try {
    const phone = parsePhoneNumberWithError(raw, { defaultCountry: code, extract: false });
    if (phone.number.replace(/\D/g, "").length > PHONE_MAX_DIGITS) return { error: "Phone numbers can contain up to 14 digits, including the country code." };
    if (!phone.isPossible()) return { error: "This phone number has an incorrect length for its country." };
    if (!phone.isValid()) return { error: "Enter a valid phone number for the selected country." };
    if (mobileOnly && !["MOBILE", "FIXED_LINE_OR_MOBILE"].includes(phone.getType() || "")) return { error: "Enter a mobile number; landlines are not accepted in this field." };
    return { number: phone.number, country: phone.country };
  } catch { return { error: "Enter a valid phone number for the selected country." }; }
}
