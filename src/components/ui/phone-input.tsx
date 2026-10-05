"use client";
import * as React from "react";
import { getCountries, getCountryCallingCode } from "libphonenumber-js/max";
import { checkPhone } from "@/lib/phone";
import { COUNTRIES, countryCode } from "@/lib/locations";
import { LocationSelector } from "./location-selector";
import styles from "./phone-input.module.css";

export type PhoneInputProps = React.ComponentProps<"input"> & {
  country?: string; mobileOnly?: boolean; onValueChange?: (value: string) => void;
};
const supported = new Set<string>(getCountries());
const callingCode = (code: string) => getCountryCallingCode(code as Parameters<typeof getCountryCallingCode>[0]);
const phoneCountries = COUNTRIES.filter(c => supported.has(c.code)).map(c => ({
  code: c.code, name: `${c.name} (+${callingCode(c.code)})`,
}));

/** Local validation; emits E.164 when valid and retains incomplete drafts. */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ onChange, onValueChange, onBlur, country, mobileOnly, value, defaultValue, className, ...props }, forwarded) => {
    const input = React.useRef<HTMLInputElement | null>(null);
    const generated = React.useId();
    const errorId = `${props.id || generated}-error`;
    const initial = String(value ?? defaultValue ?? "");
    const [draft, setDraft] = React.useState(initial);
    const emitted = React.useRef(initial);
    const initialCountry = checkPhone(initial).country || countryCode(country) || "PK";
    const [selected, setSelected] = React.useState<string>(supported.has(initialCountry) ? initialCountry : "PK");
    const [touched, setTouched] = React.useState(false);
    const result = checkPhone(draft, selected, mobileOnly || /mobile/i.test(props.name || ""));
    React.useEffect(() => {
      if (value !== undefined && String(value) !== emitted.current) {
        const next = String(value ?? "");
        setDraft(next); emitted.current = next;
        const inferred = checkPhone(next).country;
        if (inferred) setSelected(inferred);
      }
    }, [value]);
    React.useEffect(() => {
      const code = countryCode(country);
      if (!draft && code && supported.has(code)) setSelected(code);
    }, [country]);
    React.useEffect(() => { input.current?.setCustomValidity(result.error || ""); }, [result.error]);
    return <div className={`${styles.field} space-y-1`}>
      <div className={styles.controls}>
        <div className={styles.country}>
          <LocationSelector label="Phone country" clearable={false} value={`${selected} +${callingCode(selected)}`}
            options={phoneCountries} disabled={props.disabled} readOnly={props.readOnly} className="text-base sm:text-xs"
            onValueChange={(_name, option) => {
              if (!option) return;
              setSelected(option.code); setTouched(true);
              const checked = checkPhone(draft, option.code, mobileOnly || /mobile/i.test(props.name || ""));
              if (checked.number && checked.number !== emitted.current && input.current) {
                emitted.current = checked.number;
                setDraft(checked.number);
                input.current.value = checked.number;
                onValueChange?.(checked.number);
                onChange?.({ target: input.current, currentTarget: input.current, type: "change" } as React.ChangeEvent<HTMLInputElement>);
              }
            }} />
        </div>
        <input {...props} ref={node => {
          input.current = node;
          if (typeof forwarded === "function") forwarded(node); else if (forwarded) forwarded.current = node;
        }} className={className} style={{ ...props.style, minWidth: 0, width: "100%", flex: 1 }}
          type="tel" inputMode="tel" autoComplete={props.autoComplete || "tel"} value={draft}
          aria-invalid={touched && !!result.error || props["aria-invalid"]}
          aria-describedby={[props["aria-describedby"], touched && result.error ? errorId : ""].filter(Boolean).join(" ") || undefined}
          title="Include the country code; up to 14 digits"
          onBlur={event => {
            setTouched(true);
            if (result.number) setDraft(result.number);
            event.target.value = result.number || draft;
            onBlur?.(event);
            event.target.value = draft;
          }}
          onChange={event => {
            const raw = event.target.value;
            setDraft(raw); setTouched(true);
            const checked = checkPhone(raw, selected, mobileOnly || /mobile/i.test(props.name || ""));
            if (checked.country) setSelected(checked.country);
            emitted.current = checked.number || raw;
            onValueChange?.(emitted.current);
            event.target.value = emitted.current;
            onChange?.(event);
            event.target.value = raw;
          }} />
      </div>
      {touched && result.error && !props.readOnly && <p id={errorId} role="status" className="text-xs text-destructive">{result.error}</p>}
    </div>;
  }
);
PhoneInput.displayName = "PhoneInput";
