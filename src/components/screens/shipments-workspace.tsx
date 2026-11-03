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
      {VIEWS.map(([id, label]) => <Button key={id} asChild size="sm" variant={view === id ? "navy" : "outline"}>
        <Link href={`/shipments/shipments?view=${id}`}>{label}</Link></Button>)}
    </div>
    <form onSubmit={apply} className="flex flex-wrap items-end gap-3 text-sm">
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
    {error && <Notice tone="red">{error.message}</Notice>}
    {isLoading && <LoadingBlock rows={4} />}
    {view === "upcoming" && <p className="text-sm text-muted-foreground">These goods are not ready to ship. The reason they are blocked is shown on each row.</p>}
    {(view === "ready" || view === "upcoming") && data && <Card className="overflow-hidden">
      <Table>
        <TableHeader><TableRow><TableHead className="w-10" /><TableHead>Direction</TableHead><TableHead>Party</TableHead><TableHead>Source</TableHead><TableHead>Article</TableHead><TableHead>Eligible</TableHead><TableHead>Note</TableHead></TableRow></TableHeader>
        <TableBody>{data.sources.map((row) => <TableRow key={row.key}>
          <TableCell>{view === "ready" && <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" aria-label={`Select ${row.article}`} checked={!!picked[row.key]} onChange={(e) => setPicked({ ...picked, [row.key]: e.target.checked })} />}</TableCell>
          <TableCell>{row.direction}</TableCell><TableCell>{row.party}</TableCell><TableCell>{row.source}</TableCell>
          <TableCell>{row.article}{row.color || row.size ? ` · ${row.color || "—"} / ${row.size || "—"}` : ""}{row.batch ? <span className="block text-xs text-muted-foreground">{row.batch}</span> : null}</TableCell>
          <TableCell className="tabular-nums">{row.eligible}</TableCell>
          <TableCell className="text-muted-foreground">{row.blocking || (row.partial ? "Partial shipment allowed" : "Complete shipment required")}</TableCell>
        </TableRow>)}{!data.sources.length && <TableRow><TableCell className="text-muted-foreground" colSpan={7}>{view === "ready" ? "Nothing is waiting to be prepared." : "Nothing is blocked in this view."}</TableCell></TableRow>}</TableBody>
      </Table>
    </Card>}
    {view === "ready" && <Button type="button" onClick={prepare}>Prepare shipment</Button>}
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
