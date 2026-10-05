"use client";
import * as React from "react";
import { countryCode, locationOptions, searchCountries, type LocationOption } from "@/lib/locations";
import { cn } from "@/lib/utils";

type Props = {
  kind?: "country" | "state" | "city";
  value?: string; onValueChange: (value: string, option?: LocationOption) => void;
  country?: string; state?: string; id?: string; label?: string;
  className?: string; disabled?: boolean; readOnly?: boolean; required?: boolean;
  allowCustom?: boolean; options?: LocationOption[]; clearable?: boolean;
};

/** Keyboard accessible search; large city lists never enter client state. */
export function LocationSelector({ kind = "country", value = "", onValueChange, country,
  state, id, label, className, disabled, readOnly, required, allowCustom, options: supplied, clearable = true }: Props) {
  const generated = React.useId();
  const inputId = id || generated;
  const listId = `${inputId}-options`;
  const root = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [options, setOptions] = React.useState<LocationOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [retry, setRetry] = React.useState(0);
  const [active, setActive] = React.useState(-1);
  const code = countryCode(country);
  const unavailable = disabled || readOnly || (kind !== "country" && !code);
  React.useEffect(() => {
    if (!open || unavailable) return;
    let stale = false;
    setActive(-1); setOptions([]); setError("");
    if (kind === "country") {
      const matches = supplied ? supplied.filter(o => o.code === countryCode(query) || `${o.name} ${o.code}`.toLowerCase().includes(query.toLowerCase())).slice(0, 50) : searchCountries(query);
      setOptions(matches); setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      locationOptions(kind, code!, state, kind === "city" ? query : "")
        .then(items => { if (!stale) setOptions(kind === "state" ? items.filter(o => o.name.toLowerCase().includes(query.toLowerCase())).slice(0, 50) : items); })
        .catch(e => { if (!stale) setError(e.message); })
        .finally(() => { if (!stale) setLoading(false); });
    }, kind === "city" && query ? 250 : 0);
    return () => { stale = true; clearTimeout(timer); };
  }, [open, unavailable, kind, code, state, query, retry, supplied]);
  React.useEffect(() => {
    const close = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  React.useEffect(() => { setOpen(false); setQuery(""); }, [country, state]);
  const select = (option: LocationOption) => { onValueChange(option.name, option); setOpen(false); };
  return <div ref={root} className="relative min-w-0" onBlur={e => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
  }}>
    <input id={inputId} role="combobox" aria-label={label || kind} aria-expanded={open}
      aria-controls={listId} aria-autocomplete="list" aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
      autoComplete="off" disabled={disabled || (kind !== "country" && !code)} readOnly={readOnly}
      required={required} value={open ? query : value} placeholder={`Select ${kind === "state" ? "province / state" : kind}`}
      className={cn("h-11 w-full min-w-0 rounded-lg border border-input bg-white px-3 text-base sm:text-sm", className)}
      onFocus={() => { if (!unavailable) { setQuery(""); setOpen(true); } }}
      onClick={() => { if (!unavailable && !open) { setQuery(""); setOpen(true); } }}
      onChange={e => { setQuery(e.target.value); setOpen(true); if (allowCustom) onValueChange(e.target.value); }}
      onKeyDown={e => {
        if (e.key === "Escape") { setOpen(false); e.stopPropagation(); }
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault(); setOpen(true);
          if (!options.length) { setActive(-1); return; }
          setActive(a => Math.max(0, Math.min(options.length - 1, a + (e.key === "ArrowDown" ? 1 : -1))));
        }
        if (e.key === "Enter" && open) { e.preventDefault(); if (options[active]) select(options[active]); }
      }} />
    {open && !unavailable && <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border bg-white shadow-xl">
      {loading && <p role="status" className="p-3 text-sm text-muted-foreground">Searching…</p>}
      {error && <div role="alert" className="p-3 text-sm">{error} <button type="button" className="underline" onClick={() => setRetry(n => n + 1)}>Retry</button></div>}
      {!loading && !error && !options.length && <p role="status" className="p-3 text-sm text-muted-foreground">No matches. Try another spelling.</p>}
      <ul id={listId} role="listbox" aria-label={label || kind}>
        {options.map((o, i) => <li key={o.code} id={`${listId}-${i}`} role="option" aria-selected={i === active}
          className={cn("cursor-pointer px-3 py-3 text-sm hover:bg-muted", i === active && "bg-muted")}
          onPointerDown={e => e.preventDefault()} onClick={() => select(o)}>
          {o.name}{o.stateName && <span className="ml-2 text-xs text-muted-foreground">{o.stateName}</span>}
        </li>)}
      </ul>
      {clearable && !!value && <button type="button" className="w-full border-t p-3 text-left text-sm text-muted-foreground"
        onPointerDown={e => e.preventDefault()} onClick={() => { onValueChange(""); setOpen(false); }}>Clear selection</button>}
    </div>}
  </div>;
}
