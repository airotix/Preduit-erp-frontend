"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { statusTone, tone } from "@/lib/tone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { LoadingBlock, Notice } from "@/components/ui/notice";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToneBadge } from "@/components/tone-badge";

type Source = { key: string; direction: "Incoming" | "Outgoing"; party: string; source: string; article: string;
  color: string | null; size: string | null; batch: string | null; eligible: number; blocking: string | null;
  partial: boolean; savedDestination: string | null };
type Shipment = { id: string; ref: string; direction: string; party: string; source: string; status: string;
  label: string; tracking: string | null; carrier: string; destination: string; eta: string; legacy: boolean };
type Workspace = { view: string; sources: Source[]; shipments: Shipment[] };

const VIEWS = [["ready", "Ready to ship"], ["active", "On the way"], ["completed", "Delivered"], ["upcoming", "Not ready yet"]] as const;

export function ShipmentsWorkspace() {
  const params = useSearchParams();
  const router = useRouter();
  const view = params.get("view") || "ready";
  const [direction, setDirection] = React.useState(params.get("direction") || "");
  const [party, setParty] = React.useState(params.get("party") || "");
  const [source, setSource] = React.useState(params.get("source") || "");
  const [status, setStatus] = React.useState(params.get("status") || "");
  const [picked, setPicked] = React.useState<Record<string, boolean>>({});
  const activeFilters = [direction, party, source, status].filter(Boolean).length;
  const pickedCount = Object.values(picked).filter(Boolean).length;
  const query = new URLSearchParams({ view, direction, party, source, status });
  const { data, error, isLoading } = useQuery({
    queryKey: ["shipments-workspace", query.toString()],
    queryFn: () => apiGet<Workspace>(`/shipments/workspace?${query.toString()}`),
  });
  // One card per source order, so goods that travel together sit together.
  const groups = React.useMemo(() => {
    const byOrder = new Map<string, Source[]>();
    (data?.sources ?? []).forEach((row) => byOrder.set(`${row.direction}|${row.source}`, [...(byOrder.get(`${row.direction}|${row.source}`) ?? []), row]));
    return [...byOrder.entries()];
  }, [data]);
  // Goods going to a supplier's warehouse and goods going to a customer cannot share a shipment.
  const pickedDirection = (data?.sources ?? []).find((row) => picked[row.key])?.direction;
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
      {VIEWS.map(([id, label]) => <Button key={id} asChild size="sm" variant={view === id ? "navy" : "outline"}>
        <Link href={`/shipments/shipments?view=${id}`}>{label}</Link></Button>)}
    </div>
    <details className="rounded-lg border border-border/70 px-3 py-2" open={activeFilters > 0}>
    <summary className="cursor-pointer text-sm font-semibold">Filter{activeFilters ? ` (${activeFilters} applied)` : ""}</summary>
    <form onSubmit={apply} className="mt-3 flex flex-wrap items-end gap-3 text-sm">
      <div className="space-y-1.5"><Label htmlFor="ship-direction">Direction</Label>
        <NativeSelect id="ship-direction" className="w-52" value={direction} onChange={(e) => setDirection(e.target.value)}>
          <option value="">Incoming and outgoing</option><option>Incoming</option><option>Outgoing</option></NativeSelect></div>
      <div className="space-y-1.5"><Label htmlFor="ship-party">Supplier or customer</Label>
        <Input id="ship-party" className="w-52" value={party} onChange={(e) => setParty(e.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="ship-source">Source order</Label>
        <Input id="ship-source" className="w-44" value={source} onChange={(e) => setSource(e.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="ship-status">Status</Label>
        <NativeSelect id="ship-status" className="w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any</option>
          {["Prepared", "Dispatched", "In transit", "Received", "Delivered", "Cancelled", "Returned"].map((item) => <option key={item}>{item}</option>)}
        </NativeSelect></div>
      <Button variant="outline" type="submit">Apply filters</Button>
    </form>
    </details>
    {error && <Notice tone="red">{error.message}</Notice>}
    {isLoading && <LoadingBlock rows={4} />}
    {view === "upcoming" && <p className="text-sm text-muted-foreground">These goods are not ready to ship yet. The reason is shown on each row.</p>}
    {(view === "ready" || view === "upcoming") && data && <div className="space-y-3">
      {groups.map(([groupKey, rows]) => {
        const ticked = rows.filter((row) => picked[row.key]).length;
        return <Card key={groupKey} className="overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
            <div>
              <h3 className="font-bold">{rows[0].source}</h3>
              <p className="text-sm text-muted-foreground">
                <ToneBadge tone={rows[0].direction === "Incoming" ? "navy" : "accent"} dot={false}>{rows[0].direction === "Incoming" ? "From supplier" : "To customer"}</ToneBadge>
                <span className="ml-2">{rows[0].party}</span></p>
            </div>
            {view === "ready" && <Button type="button" size="sm" variant="outline" onClick={() => {
              const on = ticked < rows.length;
              setPicked({ ...picked, ...Object.fromEntries(rows.map((row) => [row.key, on])) });
            }}>{ticked < rows.length ? "Select all" : "Clear"}</Button>}
          </header>
          <Table>
            <TableHeader><TableRow>{view === "ready" && <TableHead className="w-10" />}<TableHead>Article</TableHead><TableHead>{view === "ready" ? "Ready to ship" : "Pieces"}</TableHead>{view === "upcoming" && <TableHead>Why not yet</TableHead>}</TableRow></TableHeader>
            <TableBody>{rows.map((row) => <TableRow key={row.key}>
              {view === "ready" && <TableCell><input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" aria-label={`Select ${row.article}`} checked={!!picked[row.key]} disabled={!!pickedDirection && pickedDirection !== row.direction} onChange={(e) => setPicked({ ...picked, [row.key]: e.target.checked })} /></TableCell>}
              <TableCell>{row.article}{row.color || row.size ? ` · ${row.color || "—"} / ${row.size || "—"}` : ""}{row.batch ? <span className="block text-xs text-muted-foreground">{row.batch}</span> : null}
                {view === "ready" && !row.partial && <span className="block text-xs text-muted-foreground">Ships complete only</span>}</TableCell>
              <TableCell className="tabular-nums">{row.eligible}</TableCell>
              {view === "upcoming" && <TableCell className="text-muted-foreground">{row.blocking}</TableCell>}
            </TableRow>)}</TableBody>
          </Table>
        </Card>;
      })}
      {!groups.length && <Card className="p-5 text-sm text-muted-foreground">{view === "ready" ? "Nothing is waiting to be prepared." : "Nothing is blocked in this view."}</Card>}
    </div>}
    {view === "ready" && <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3 shadow-md">
      <span className="text-sm font-semibold">{pickedCount ? `${pickedCount} item${pickedCount === 1 ? "" : "s"} selected` : "Tick the items that are travelling together"}</span>
      <Button type="button" disabled={!pickedCount} onClick={prepare}>Prepare shipment</Button>
    </div>}
    {(view === "active" || view === "completed") && data && <Card className="overflow-hidden">
      <Table>
        <TableHeader><TableRow><TableHead>Shipment</TableHead><TableHead>Direction</TableHead><TableHead>Party</TableHead><TableHead>Source</TableHead><TableHead>Status</TableHead><TableHead>Route</TableHead></TableRow></TableHeader>
        <TableBody>{data.shipments.map((row) => <TableRow key={row.id}>
          <TableCell><Link className="font-bold text-primary hover:underline" href={`/shipments/shipments/${row.id}`}>{row.ref}</Link></TableCell>
          <TableCell>{row.direction}</TableCell><TableCell>{row.party}</TableCell><TableCell>{row.source}</TableCell>
          <TableCell><ToneBadge tone={statusTone(row.label)}>{row.label}</ToneBadge>{row.tracking ? <span className="ml-2 text-xs text-muted-foreground">{row.tracking}</span> : null}{row.legacy ? <span className="mt-1 block text-xs" style={{ color: tone("amber").fg }}>Historical delivery needs reconciliation</span> : null}</TableCell>
          <TableCell>{row.carrier || "—"} → {row.destination || "—"}{row.eta ? ` · ${row.eta}` : ""}</TableCell>
        </TableRow>)}{!data.shipments.length && <TableRow><TableCell className="text-muted-foreground" colSpan={6}>No shipments in this view.</TableCell></TableRow>}</TableBody>
      </Table>
    </Card>}
  </div>;
}
