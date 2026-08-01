"use client";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCurrency, CURRENCIES, currencySymbol } from "@/lib/currency";
import { ExchangeRatesCard } from "@/components/screens/finance/exchange-rates-card";
import type { SettingsConfig } from "@/lib/screen-types";

function CurrencySetting() {
  const { currency, setCurrency } = useCurrency();
  return (
    <Card>
      <div className="border-b border-border/60 px-5 py-4 font-extrabold text-foreground">
        Currency
      </div>
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <div className="font-semibold text-foreground">Display currency</div>
          <div className="text-[13px] text-muted-foreground">
            Amounts across Finance are shown and converted into this currency.
          </div>
        </div>
        <div className="w-[180px]">
          <Select value={currency} onValueChange={(v) => setCurrency(v as typeof currency)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>{c} · {currencySymbol(c)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}

export function SettingsView({
  config,
  module,
  tab,
}: {
  config: SettingsConfig;
  module?: string;
  tab?: string;
}) {
  const showCurrency = module === "admin" && tab === "syssettings";
  return (
    <div className="space-y-4">
      {showCurrency && <CurrencySetting />}
      {showCurrency && <ExchangeRatesCard />}
      {config.groups.map((g) => (
        <Card key={g.title}>
          <div className="border-b border-border/60 px-5 py-4 font-extrabold text-foreground">
            {g.title}
          </div>
          <div className="divide-y divide-border/50">
            {g.items.map((it) => (
              <div
                key={it.label}
                className="flex items-center justify-between px-5 py-4"
              >
                <div>
                  <div className="font-semibold text-foreground">{it.label}</div>
                  <div className="text-[13px] text-muted-foreground">
                    {it.sub}
                  </div>
                </div>
                <Switch defaultChecked={it.enabled} />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
