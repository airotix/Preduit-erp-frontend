"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

type Source = { key: string; direction: "Incoming" | "Outgoing"; party: string; source: string; article: string;
  color: string | null; size: string | null; batch: string | null; eligible: number; blocking: string | null;
  partial: boolean; savedDestination: string | null };
type Shipment = { id: string; ref: string; direction: string; party: string; source: string; status: string;
  label: string; tracking: string | null; carrier: string; destination: string; eta: string; legacy: boolean };
type Workspace = { view: string; sources: Source[]; shipments: Shipment[] };

const VIEWS = [["ready", "Ready to ship"], ["active", "Active shipments"], ["completed", "Completed"], ["upcoming", "Upcoming"]] as const;

export function ShipmentsWorkspace() {
  const params = useSearchParams();
  const router = useRouter();
  const view = params.get("view") || "ready";
  const [direction, setDirection] = React.useState(params.get("direction") || "");
  const [party, setParty] = React.useState(params.get("party") || "");
  const [source, setSource] = React.useState(params.get("source") || "");
  const [status, setStatus] = React.useState(params.get("status") || "");
  const [picked, setPicked] = React.useState<Record<string, boolean>>({});
  const query = new URLSearchParams({ view, direction, party, source, status });
  const { data, error, isLoading } = useQuery({
    queryKey: ["shipments-workspace", query.toString()],
    queryFn: () => apiGet<Workspace>(`/shipments/workspace?${query.toString()}`),
  });
  const apply = (event: React.FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams({ view, direction, party, source, status });
    router.replace(`/shipments/shipments?${next.toString()}`);
  };
  const prepare = () => {
    const keys = Object.entries(picked).filter(([, on]) => on).map(([key]) => key);
    if (!keys.length) return;
    sessionStorage.setItem("shipment-prepare-keys", JSON.stringify(keys));
    router.push("/shipments/prepare");
  };
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2">
      {VIEWS.map(([id, label]) => <Link key={id} href={`/shipments/shipments?view=${id}`}
        className={`rounded-md border px-3 py-2 text-sm font-semibold ${view === id ? "bg-[#23263A] text-white" : ""}`}>{label}</Link>)}
    </div>
    <form onSubmit={apply} className="flex flex-wrap items-end gap-3 text-sm">
      <label>Direction<select className="mt-1 block rounded-md border px-2 py-2" value={direction} onChange={(e) => setDirection(e.target.value)}>
        <option value="">Incoming and outgoing</option><option>Incoming</option><option>Outgoing</option></select></label>
      <label>Supplier or customer<input className="mt-1 block rounded-md border px-2 py-2" value={party} onChange={(e) => setParty(e.target.value)} /></label>
      <label>Source order<input className="mt-1 block rounded-md border px-2 py-2" value={source} onChange={(e) => setSource(e.target.value)} /></label>
      <label>Status<select className="mt-1 block rounded-md border px-2 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">Any</option>
        {["Prepared", "Dispatched", "In transit", "Received", "Delivered", "Cancelled", "Returned"].map((item) => <option key={item}>{item}</option>)}
      </select></label>
      <button className="rounded-md border px-3 py-2 font-semibold" type="submit">Apply filters</button>
    </form>
    {error && <p role="alert" className="text-sm text-destructive">{error.message}</p>}
    {isLoading && <p className="text-sm">Loading shipments…</p>}
    {view === "upcoming" && <p className="text-sm text-muted-foreground">These goods are not ready to ship. The reason they are blocked is shown on each row.</p>}
    {(view === "ready" || view === "upcoming") && data && <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead><tr className="text-xs text-muted-foreground"><th className="p-3" /><th>Direction</th><th>Party</th><th>Source</th><th>Article</th><th>Eligible</th><th>Note</th></tr></thead>
        <tbody>{data.sources.map((row) => <tr key={row.key} className="border-t">
          <td className="p-3">{view === "ready" && <input type="checkbox" aria-label={`Select ${row.article}`} checked={!!picked[row.key]} onChange={(e) => setPicked({ ...picked, [row.key]: e.target.checked })} />}</td>
          <td>{row.direction}</td><td>{row.party}</td><td>{row.source}</td>
          <td>{row.article}{row.color || row.size ? ` · ${row.color || "—"} / ${row.size || "—"}` : ""}{row.batch ? <span className="block text-xs text-muted-foreground">{row.batch}</span> : null}</td>
          <td className="tabular-nums">{row.eligible}</td>
          <td className="text-muted-foreground">{row.blocking || (row.partial ? "Partial shipment allowed" : "Complete shipment required")}</td>
        </tr>)}{!data.sources.length && <tr><td className="p-3 text-muted-foreground" colSpan={7}>{view === "ready" ? "Nothing is waiting to be prepared." : "Nothing is blocked in this view."}</td></tr>}</tbody>
      </table>
    </div>}
    {view === "ready" && <button type="button" className="rounded-md bg-[#23263A] px-4 py-2 text-sm font-semibold text-white" onClick={prepare}>Prepare shipment</button>}
    {(view === "active" || view === "completed") && data && <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead><tr className="text-xs text-muted-foreground"><th className="p-3">Shipment</th><th>Direction</th><th>Party</th><th>Source</th><th>Status</th><th>Route</th></tr></thead>
        <tbody>{data.shipments.map((row) => <tr key={row.id} className="border-t">
          <td className="p-3"><Link className="font-semibold underline" href={`/shipments/shipments/${row.id}`}>{row.ref}</Link></td>
          <td>{row.direction}</td><td>{row.party}</td><td>{row.source}</td>
          <td>{row.label}{row.tracking ? ` · ${row.tracking}` : ""}{row.legacy ? <span className="block text-xs text-amber-700">Historical delivery needs reconciliation</span> : null}</td>
          <td>{row.carrier || "—"} → {row.destination || "—"}{row.eta ? ` · ${row.eta}` : ""}</td>
        </tr>)}{!data.shipments.length && <tr><td className="p-3 text-muted-foreground" colSpan={6}>No shipments in this view.</td></tr>}</tbody>
      </table>
    </div>}
  </div>;
}
