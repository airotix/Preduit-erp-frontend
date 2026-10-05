"use client";
import { LocationSelector } from "./location-selector";
export type LocationValue = { country: string; state: string; city: string };

export function LocationFields({ value, onChange, className, readOnly }: {
  value: LocationValue; onChange: (patch: Partial<LocationValue>) => void; className?: string; readOnly?: boolean;
}) {
  return <>
    <div><label className="mb-1 block text-sm font-semibold">Country</label>
      <LocationSelector value={value.country} className={className} readOnly={readOnly}
        onValueChange={country => onChange({ country, state: "", city: "" })} /></div>
    <div><label className="mb-1 block text-sm font-semibold">State / province</label>
      <LocationSelector kind="state" value={value.state} country={value.country} className={className} readOnly={readOnly}
        onValueChange={state => onChange({ state, city: "" })} /></div>
    <div><label className="mb-1 block text-sm font-semibold">City</label>
      <LocationSelector kind="city" value={value.city} country={value.country} state={value.state} className={className} readOnly={readOnly}
        onValueChange={city => onChange({ city })} /></div>
  </>;
}
