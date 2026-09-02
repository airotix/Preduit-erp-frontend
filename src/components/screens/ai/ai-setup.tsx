"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings, Database, Check, Loader2, RefreshCw, ArrowRight, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AiHeader } from "@/components/screens/ai/ai-header";
import { SELECT_CLS } from "@/components/screens/ai/ai-shared";
import { useModuleAccess } from "@/lib/module-access";
import {
  fetchAiSeasonConfig, saveAiSeasonConfig, fetchAiIngestStatus, runAiIngest,
  fetchAiForecastJob, refreshAiForecast, fetchAiBacktestStatus, runAiBacktest,
} from "@/lib/ai-api";
import type { SeasonConfig } from "@/lib/ai-types";

const CURRENCIES = ["EUR", "USD", "GBP", "PKR", "CHF", "JPY"];
const money = (n: number, cur: string) => `${cur} ${Math.round(n).toLocaleString()}`;

export function AiSetup() {
  const router = useRouter();
  const { canWrite, reason: writeReason } = useModuleAccess("ai");
  const qc = useQueryClient();

  const [step, setStep] = React.useState<1 | 2>(1);
  const [done, setDone] = React.useState<Set<1 | 2>>(new Set());
  const [saving, setSaving] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [ingestResult, setIngestResult] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<SeasonConfig>({
    name: "", currency: "EUR", budget: 0, targetMargin: 50, budgetBandPct: 15, costRatio: 50,
  });

  const cfg = useQuery({ queryKey: ["ai", "season-config"], queryFn: () => fetchAiSeasonConfig() });
  const erp = useQuery({ queryKey: ["ai", "ingest-status"], queryFn: () => fetchAiIngestStatus() });
  const fjob = useQuery({ queryKey: ["ai", "forecast-job"], queryFn: () => fetchAiForecastJob() });
  const btest = useQuery({ queryKey: ["ai", "backtest-status"], queryFn: () => fetchAiBacktestStatus() });

  // Prefill the form once season config loads.
  React.useEffect(() => {
    if (cfg.data && cfg.data.name !== undefined) {
      setForm((f) => ({ ...f, ...cfg.data } as SeasonConfig));
    }
  }, [cfg.data]);

  const engineLive = !!erp.data?.enabled;
  const set = <K extends keyof SeasonConfig>(k: K, v: SeasonConfig[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const step1Valid = form.name.trim() !== "" && form.budget > 0 && form.targetMargin > 0 && form.targetMargin <= 100;

  const saveAndContinue = async () => {
    if (!step1Valid) return;
    setSaving(true);
    try {
      await saveAiSeasonConfig(form);
      qc.invalidateQueries({ queryKey: ["ai", "season-config"] });
      setDone((d) => new Set([...d, 1]));
      setStep(2);
    } finally {
      setSaving(false);
    }
  };

  const doIngest = async () => {
    setBusy("ingest");
    setIngestResult(null);
    try {
      const r = await runAiIngest();
      setIngestResult(`Added ${r.rowsAdded ?? 0}, updated ${r.rowsUpdated ?? 0}, skipped ${r.rowsSkipped ?? 0}.`);
      qc.invalidateQueries({ queryKey: ["ai"] });
      setDone((d) => new Set([...d, 2]));
    } catch {
      setIngestResult("Sync failed — the forecasting engine is offline.");
    } finally {
      setBusy(null);
    }
  };

  const doRefresh = async () => {
    setBusy("forecast");
    try { await refreshAiForecast(); qc.invalidateQueries({ queryKey: ["ai", "forecast-job"] }); }
    catch { /* offline */ }
    finally { setBusy(null); }
  };

  const doBacktest = async () => {
    setBusy("backtest");
    try { await runAiBacktest(); qc.invalidateQueries({ queryKey: ["ai", "backtest-status"] }); }
    catch { /* offline */ }
    finally { setBusy(null); }
  };

  const steps = [
    { id: 1 as const, label: "Season config", icon: Settings },
    { id: 2 as const, label: "Sync & forecast", icon: Database },
  ];
  const progress = (done.size / 2) * 100;

  return (
    <div>
      <AiHeader
        title="Season setup"
        subtitle="Configure the season, sync data, and run the forecast pipeline"
        onRefresh={() => { cfg.refetch(); erp.refetch(); fjob.refetch(); btest.refetch(); }}
      />

      <div className="mx-auto max-w-4xl space-y-6">
        {!engineLive && (
          <div className="flex items-start gap-3 rounded-xl border border-[#F0DDBB] bg-[#FBF3E6] p-4 text-[13px] text-[#8A5A0E]">
            <TriangleAlert size={17} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Forecasting engine is offline</p>
              <p>Season config saves in the ERP and works now. Data sync, forecast refresh and backtest run once the engine is live (set <code>AI_ENGINE_ENABLED=true</code> on the backend).</p>
            </div>
          </div>
        )}

        {/* Progress + steps */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-semibold text-foreground">Setup progress</span>
            <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-brand-orange transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex items-center">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const active = step === s.id;
            const complete = done.has(s.id);
            return (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => (s.id === 1 || done.has(1)) && setStep(s.id)}
                  className={cn("flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
                    active && "bg-brand-orange/10")}
                >
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-full border-2",
                    complete ? "border-[#2E9E6B] bg-[#2E9E6B] text-white"
                    : active ? "border-brand-orange bg-brand-orange text-white"
                    : "border-border text-muted-foreground")}>
                    {complete ? <Check size={16} /> : <Icon size={16} />}
                  </span>
                  <span className={cn("text-[13px] font-semibold", active ? "text-brand-orange" : "text-muted-foreground")}>{s.label}</span>
                </button>
                {i < steps.length - 1 && (
                  <div className={cn("mx-2 h-0.5 flex-1", done.has(s.id) ? "bg-[#2E9E6B]" : "bg-border")} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step content */}
        <Card className="p-6">
          {step === 1 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="text-[13px]">Season name</Label>
                <Input className="mt-1" placeholder="e.g. AW 2025" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div>
                <Label className="text-[13px]">Default currency</Label>
                <select className={cn(SELECT_CLS, "mt-1 w-full")} value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-[13px]">Seasonal buying budget</Label>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Base-case budget; conservative & optimistic derive from it.</p>
                <Input className="mt-1" type="number" placeholder="500000" value={form.budget || ""} onChange={(e) => set("budget", parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label className="text-[13px]">Budget flexibility band (±%)</Label>
                <Input className="mt-1" type="number" min={0} max={100} value={form.budgetBandPct} onChange={(e) => set("budgetBandPct", parseFloat(e.target.value) || 0)} />
                {form.budget > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="rounded-md bg-[#FBF3E6] p-2"><div className="text-muted-foreground">Conservative</div><div className="font-bold text-[#9C6B0E]">{money(form.budget * (1 - form.budgetBandPct / 100), form.currency)}</div></div>
                    <div className="rounded-md bg-brand-orange/10 p-2"><div className="text-muted-foreground">Base</div><div className="font-bold text-brand-orange">{money(form.budget, form.currency)}</div></div>
                    <div className="rounded-md bg-[#EAF7EF] p-2"><div className="text-muted-foreground">Optimistic</div><div className="font-bold text-[#1F7A53]">{money(form.budget * (1 + form.budgetBandPct / 100), form.currency)}</div></div>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-[13px]">Target gross margin %</Label>
                <Input className="mt-1" type="number" min={0} max={100} value={form.targetMargin} onChange={(e) => set("targetMargin", parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label className="text-[13px]">Estimated cost ratio %</Label>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Unit cost as % of price, until real cost data is available.</p>
                <Input className="mt-1" type="number" min={0} max={99} value={form.costRatio} onChange={(e) => set("costRatio", parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ERP sync */}
              <div>
                <h3 className="mb-3 text-[14px] font-bold text-foreground">Data sync</h3>
                <Card
                  className={cn("cursor-pointer p-6 text-center transition-all hover:border-brand-orange/50",
                    !engineLive && "cursor-not-allowed opacity-60",
                    done.has(2) && "border-[#2E9E6B] bg-[#EAF7EF]/40")}
                  onClick={() => engineLive && canWrite && busy !== "ingest" && doIngest()}
                  title={!canWrite ? writeReason ?? undefined : undefined}
                >
                  <div className="flex flex-col items-center">
                    {busy === "ingest" ? <Loader2 size={36} className="mb-3 animate-spin text-brand-orange" />
                     : done.has(2) ? <Check size={36} className="mb-3 text-[#2E9E6B]" />
                     : <Database size={36} className="mb-3 text-brand-orange" />}
                    <h4 className="font-bold text-foreground">{done.has(2) ? "Sync complete" : "Sync from ERP"}</h4>
                    <p className="mt-1 text-[13px] text-muted-foreground">Pull product & order data into the forecasting engine</p>
                  </div>
                </Card>
                {ingestResult && <p className="mt-3 rounded-lg bg-muted/50 p-3 text-[13px] text-muted-foreground">{ingestResult}</p>}
              </div>

              {/* Forecast pipeline */}
              <div className="border-t border-border/60 pt-6">
                <h3 className="mb-3 text-[14px] font-bold text-foreground">Forecast pipeline</h3>
                <div className="flex flex-col gap-4 rounded-lg bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1 text-[13px] text-muted-foreground">
                    <p>Status: <strong className="text-foreground">{fjob.data?.status ?? "idle"}</strong></p>
                    <p>Last run: <strong className="text-foreground">{fjob.data?.lastRun ? new Date(fjob.data.lastRun).toLocaleString() : "—"}</strong></p>
                  </div>
                  <Button variant="outline" onClick={doRefresh} disabled={!engineLive || !canWrite || busy === "forecast" || fjob.data?.status === "running"}
                    title={!canWrite ? writeReason ?? undefined : undefined}>
                    {busy === "forecast" || fjob.data?.status === "running" ? <><Loader2 size={15} className="animate-spin" /> Running…</> : <><RefreshCw size={15} /> Refresh forecasts</>}
                  </Button>
                </div>
              </div>

              {/* Backtest */}
              <div className="border-t border-border/60 pt-6">
                <h3 className="mb-3 text-[14px] font-bold text-foreground">Forecast accuracy backtest</h3>
                <div className="flex flex-col gap-4 rounded-lg bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1 text-[13px] text-muted-foreground">
                    <p>Status: <strong className="text-foreground">{btest.data?.status ?? "idle"}</strong></p>
                    {btest.data?.completedAt && <p>Completed: <strong className="text-foreground">{new Date(btest.data.completedAt).toLocaleString()}</strong></p>}
                  </div>
                  <Button variant="outline" onClick={doBacktest} disabled={!engineLive || !canWrite || busy === "backtest" || btest.data?.status === "running"}
                    title={!canWrite ? writeReason ?? undefined : undefined}>
                    {busy === "backtest" || btest.data?.status === "running" ? <><Loader2 size={15} className="animate-spin" /> Running…</> : <><RefreshCw size={15} /> Run backtest</>}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Nav */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setStep(1)} disabled={step === 1}>Back</Button>
          {step === 1 ? (
            <Button onClick={saveAndContinue} disabled={!step1Valid || saving || !canWrite}
              title={!canWrite ? writeReason ?? undefined : undefined}>
              {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <>Save & continue <ArrowRight size={15} /></>}
            </Button>
          ) : (
            <Button onClick={() => router.push("/ai/productkpis")}>
              Go to Product KPIs <ArrowRight size={15} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
