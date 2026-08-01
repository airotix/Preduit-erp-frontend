"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost, USE_BACKEND } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Rate { from: string; to: string; rate: number; validFrom: string | null; source: string | null }

/** Exchange-rate management for System Settings: shows the dated rates used for
 *  currency conversion and refreshes them from the free Frankfurter/ECB feed. */
export function ExchangeRatesCard() {
  const qc = useQueryClient();
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const rates = useQuery({
    queryKey: ["finance", "fx", "rates"],
    queryFn: () => apiGet<{ base: string; rates: Rate[] }>("/finance/fx/rates"),
    enabled: USE_BACKEND,
  });

  const sync = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await apiPost<{ date: string; pairs: number }>("/finance/fx/sync-rates", {});
      setMsg(`Updated ${r.pairs} rate pairs (as of ${r.date}).`);
      qc.invalidateQueries({ queryKey: ["finance", "fx", "rates"] });
    } catch {
      setMsg("Sync failed. Check that FX_API_KEY is set in the backend .env (free key from exchangerate-api.com) and the backend can reach the internet.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="font-extrabold text-foreground">Exchange rates</div>
        <Button variant="outline" size="sm" onClick={sync} disabled={busy}>
          <RefreshCw size={15} className={cn(busy && "animate-spin")} /> {busy ? "Syncing…" : "Sync rates"}
        </Button>
      </div>
      <div className="px-5 py-4">
        <p className="mb-3 text-[13px] text-muted-foreground">
          Dated rates (base {rates.data?.base ?? "—"}) used to convert amounts across Finance.
          Pulled from ExchangeRate-API (supports {rates.data?.base ?? "your base currency"} and ~160 currencies).
        </p>
        {msg && <p className="mb-3 rounded-md bg-muted/50 p-2.5 text-[12px] text-muted-foreground">{msg}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 text-left font-bold">From</th>
                <th className="pb-2 text-left font-bold">To</th>
                <th className="pb-2 text-right font-bold">Rate</th>
                <th className="pb-2 text-left font-bold">Valid from</th>
                <th className="pb-2 text-left font-bold">Source</th>
              </tr>
            </thead>
            <tbody>
              {(rates.data?.rates ?? []).slice(0, 16).map((r, i) => (
                <tr key={i} className="border-t border-border/50">
                  <td className="py-2 font-semibold text-foreground">{r.from}</td>
                  <td className="py-2 text-foreground">{r.to}</td>
                  <td className="py-2 text-right tabular text-foreground">{r.rate.toFixed(4)}</td>
                  <td className="py-2 text-muted-foreground">{r.validFrom ?? "—"}</td>
                  <td className="py-2 text-muted-foreground">{r.source ?? "manual"}</td>
                </tr>
              ))}
              {(rates.data?.rates ?? []).length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No rates yet — click “Sync rates”.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
