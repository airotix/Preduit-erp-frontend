"use client";

import * as React from "react";

export type Currency = "PKR" | "USD" | "EUR" | "AED";
export const CURRENCIES: Currency[] = ["PKR", "USD", "EUR", "AED"];

const SYMBOL: Record<Currency, string> = {
  PKR: "Rs",
  USD: "$",
  EUR: "€",
  AED: "AED",
};

interface CurrencyCtx {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

const Ctx = React.createContext<CurrencyCtx>({
  currency: "PKR",
  setCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = React.useState<Currency>("PKR");
  return <Ctx.Provider value={{ currency, setCurrency }}>{children}</Ctx.Provider>;
}

export const useCurrency = () => React.useContext(Ctx);

export function currencySymbol(c: Currency): string {
  return SYMBOL[c];
}

/**
 * Format an amount that is ALREADY in the target currency (the backend converts).
 * `abbrev` → "Rs 586M" / "Rs 42.8M" / "Rs 320K"; otherwise "Rs 586,000,000".
 */
export function money(amount: number, currency: Currency, abbrev = false): string {
  const sym = SYMBOL[currency];
  const n = Number(amount) || 0;
  if (abbrev) {
    const abs = Math.abs(n);
    if (abs >= 1_000_000) {
      const m = n / 1_000_000;
      return `${sym} ${m.toFixed(abs >= 100_000_000 ? 0 : 1)}M`;
    }
    if (abs >= 1_000) return `${sym} ${(n / 1_000).toFixed(0)}K`;
  }
  return `${sym} ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
