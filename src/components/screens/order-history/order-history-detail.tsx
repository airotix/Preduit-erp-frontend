"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/icon";
import { ToneBadge } from "@/components/tone-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGet, USE_BACKEND } from "@/lib/api-client";
import { tone as toneOf } from "@/lib/tone";
import type { Tone } from "@/lib/tone";

/* ------------------------------------------------------------------ *
 * Types — mirror the payload built by
 * backend/app/modules/order_history/service.py::order_history_detail,
 * which composes the *existing* Sales / Production / Quality /
 * Shipments detail builders. Each stage's payload is the exact shape
 * that module's own detail page already renders.
 * ------------------------------------------------------------------ */

interface MetaItem { k: string; v: string }
interface TimelineItem { icon: string; tone: Tone; title: string; time: string; done: boolean }

interface DocLine { name: string; sku: string; qty: number; price: string; total: string }
interface OrderInvoice {
  publicId: string; invoiceNo: string; invoiceType: string; currency?: string;
  total: string; status: string; createdAt: string;
}
interface OrderTab {
  ref: string; title: string; statusLabel: string; statusTone: Tone; meta: MetaItem[];
  doc: {
    lines: DocLine[]; totals: MetaItem[]; grand: string;
    timelineTitle: string; partyTitle: string; timeline: TimelineItem[];
    party: { name: string; email: string; phone: string; addr: string };
    orderInvoices: OrderInvoice[];
  };
}

interface Stage {
  public_id: string; seq: number; name: string; duration_days: number;
  status: string; overdue: boolean; start: string; end: string; worker: string; notes: string;
}
interface ProductionLine {
  publicId: string; name: string; qty: number; started: boolean; progress: number;
  statusLabel: string; statusTone: Tone;
  alert: { type: string; message: string } | null; stages: Stage[];
}
interface ProductionTab {
  ref: string; title: string; statusLabel: string; statusTone: Tone; meta: MetaItem[];
  started: boolean; progress: number;
  stages: Stage[]; materials: { component: string; material: string; qty: string; cost: string }[];
  lines?: ProductionLine[];
}

interface QualityItem {
  item: string;
  header: { inspectionNo: string; stage: string; result: string };
  summary: { sampled: number; defects: number; maxDefects: number; evaluation: string };
}
interface QualityTab {
  ref: string; title: string; statusLabel: string; statusTone: Tone; meta: MetaItem[];
  inspection: { items: QualityItem[] };
}

interface ShipmentTab {
  ref: string; title: string; statusLabel: string; statusTone: Tone; meta: MetaItem[];
  shipment: { tracking: TimelineItem[]; contents: { name: string; sku: string; qty: number }[] };
}

interface Detail {
  orderNo: string; customer: string; channel: string; status: string; statusTone: Tone;
  orderDate: string; total: string;
  tabs: string[];
  order: OrderTab | null;
  production: ProductionTab | null;
  quality: QualityTab | null;
  shipment: ShipmentTab | null;
  finance: { invoices: OrderInvoice[] };
}

const stepColor = (s: Stage) =>
  s.status === "Completed" ? "#2E9E6B" : s.status === "In Progress" ? "#2563EB" : "#E3E5EA";

const STAGE_TONE: Record<string, Tone> = {
  Completed: "green", "In Progress": "accent", Pending: "neutral",
};

function pascal(s: string) {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function MetaGrid({ meta }: { meta: MetaItem[] }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {meta.map((m) => (
        <div key={m.k} className="rounded-[12px] border border-border/70 bg-muted/40 px-4 py-3.5">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{m.k}</div>
          <div className="mt-1 text-[18px] font-extrabold text-foreground">{m.v}</div>
        </div>
      ))}
    </div>
  );
}

function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="space-y-0">
      {items.map((t, i) => {
        const k = toneOf(t.tone);
        const last = i === items.length - 1;
        return (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: t.done ? k.bg : "#F1F2F5", color: t.done ? k.fg : "#B7BAC4" }}
              >
                <Icon name={pascal(t.icon)} size={15} strokeWidth={2} />
              </div>
              {!last && (
                <div
                  className="w-0.5 flex-1"
                  style={{ background: t.done ? k.dot : "#E3E5EA", minHeight: 18 }}
                />
              )}
            </div>
            <div className={last ? "" : "pb-4"}>
              <div className="font-semibold text-foreground">{t.title}</div>
              <div className="text-[13px] text-muted-foreground">{t.time}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyStage({ label }: { label: string }) {
  return (
    <Card className="flex flex-col items-center gap-2 p-14 text-center">
      <div className="text-[15px] font-semibold text-foreground">{label}</div>
      <p className="max-w-md text-[13px] text-muted-foreground">
        This order hasn&apos;t reached this stage yet — check back once it moves forward.
      </p>
    </Card>
  );
}

/* ---------------------------- Order tab ---------------------------- */

function OrderPanel({ data }: { data: OrderTab }) {
  const { doc } = data;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-2">
        <h3 className="mb-4 text-[17px] font-extrabold tracking-tight text-foreground">Order line items</h3>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 text-left font-bold">Item</th>
              <th className="pb-2 text-right font-bold">Qty</th>
              <th className="pb-2 text-right font-bold">Price</th>
              <th className="pb-2 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {doc.lines.map((l, i) => (
              <tr key={i} className="border-t border-border/50">
                <td className="py-2.5 font-semibold text-foreground">
                  {l.name}{l.sku ? ` · ${l.sku}` : ""}
                </td>
                <td className="py-2.5 text-right tabular">{l.qty}</td>
                <td className="py-2.5 text-right tabular">{l.price}</td>
                <td className="py-2.5 text-right tabular font-bold text-foreground">{l.total}</td>
              </tr>
            ))}
            {doc.totals.map((t) => (
              <tr key={t.k} className="border-t border-border/50 font-semibold text-foreground">
                <td className="py-2.5" colSpan={3}>{t.k}</td>
                <td className="py-2.5 text-right tabular">{t.v}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-border font-extrabold text-foreground">
              <td className="py-2.5" colSpan={3}>Total</td>
              <td className="py-2.5 text-right tabular">{doc.grand}</td>
            </tr>
          </tbody>
        </table>

        <h3 className="mb-3 mt-8 text-[17px] font-extrabold tracking-tight text-foreground">{doc.partyTitle}</h3>
        <div className="rounded-xl border border-border/60 p-4 text-[13px]">
          <div className="font-bold text-foreground">{doc.party.name}</div>
          {doc.party.email && <div className="mt-1"><span className="font-semibold text-foreground">Email: </span>{doc.party.email}</div>}
          {doc.party.phone && <div><span className="font-semibold text-foreground">Phone: </span>{doc.party.phone}</div>}
          {doc.party.addr && <div><span className="font-semibold text-foreground">Address: </span>{doc.party.addr}</div>}
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="mb-4 text-[17px] font-extrabold tracking-tight text-foreground">{doc.timelineTitle}</h3>
        <Timeline items={doc.timeline} />
      </Card>
    </div>
  );
}

/* -------------------------- Production tab -------------------------- */

function ProductionLineBlock({ line }: { line: ProductionLine }) {
  if (!line.started) {
    return (
      <Card className="flex flex-col items-center gap-2 p-10 text-center">
        <div className="text-[14px] font-semibold text-foreground">Production hasn&apos;t started for {line.name}</div>
      </Card>
    );
  }
  return (
    <>
      <Card className="p-6">
        <div className="flex items-start">
          {line.stages.map((s, i) => (
            <React.Fragment key={s.public_id}>
              <div className="flex min-w-[80px] flex-col items-center text-center">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold text-white"
                  style={{ background: stepColor(s) }}
                >
                  {s.status === "Completed" ? "✓" : s.seq}
                </span>
                <span className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-foreground">{s.name}</span>
                <span className="mt-1">
                  <ToneBadge tone={s.overdue ? "red" : STAGE_TONE[s.status] ?? "neutral"} dot={false}>
                    {s.overdue ? "Overdue" : s.status}
                  </ToneBadge>
                </span>
              </div>
              {i < line.stages.length - 1 && (
                <div className="mt-4 h-0.5 flex-1" style={{ background: s.status === "Completed" ? "#2E9E6B" : "#E3E5EA" }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>
      <div className="mt-3 space-y-2">
        {line.stages.filter((s) => s.worker || s.notes || s.start || s.end).map((s) => (
          <Card key={s.public_id} className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold uppercase tracking-wide text-foreground">{s.name}</span>
              <ToneBadge tone={STAGE_TONE[s.status] ?? "neutral"} dot={false}>{s.status}</ToneBadge>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-6 gap-y-0.5 text-[13px] text-muted-foreground">
              {s.start && <span>Start: {s.start}</span>}
              {s.end && <span>End: {s.end}</span>}
              {s.worker && <span>Worker: {s.worker}</span>}
            </div>
            {s.notes && <div className="mt-1 text-[12px] italic text-muted-foreground">“{s.notes}”</div>}
          </Card>
        ))}
      </div>
    </>
  );
}

function ProductionPanel({ data }: { data: ProductionTab }) {
  const lines = data.lines ?? [];
  return (
    <div className="space-y-4">
      <MetaGrid meta={data.meta} />
      {lines.length > 0 ? (
        lines.map((ln, i) => (
          <div key={i}>
            <div className="mb-2 flex items-center gap-3 text-[13px] text-muted-foreground">
              <span className="font-semibold text-foreground">{ln.name}</span>
              <span>· {ln.qty.toLocaleString()} units</span>
              <ToneBadge tone={ln.statusTone} dot={false}>{ln.statusLabel} · {ln.progress}%</ToneBadge>
            </div>
            <ProductionLineBlock line={ln} />
          </div>
        ))
      ) : (
        <Card className="p-6">
          <div className="flex flex-wrap gap-4 text-[13px]">
            {data.stages.map((s) => (
              <ToneBadge key={s.public_id} tone={STAGE_TONE[s.status] ?? "neutral"} dot={false}>
                {s.name} · {s.status}
              </ToneBadge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ---------------------------- Quality tab ---------------------------- */

function QualityPanel({ data }: { data: QualityTab }) {
  const items = data.inspection?.items ?? [];
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <MetaGrid meta={data.meta} />
      </Card>
      <Card className="p-6">
        <h3 className="mb-4 text-[17px] font-extrabold tracking-tight text-foreground">Item inspections</h3>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 text-left font-bold">Inspection</th>
              <th className="pb-2 text-left font-bold">Item</th>
              <th className="pb-2 text-left font-bold">Stage</th>
              <th className="pb-2 text-center font-bold">Defects</th>
              <th className="pb-2 text-left font-bold">Result</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.header.inspectionNo} className="border-t border-border/50">
                <td className="py-2.5 font-bold text-foreground">{it.header.inspectionNo}</td>
                <td className="py-2.5 text-foreground">{it.item}</td>
                <td className="py-2.5 text-muted-foreground">{it.header.stage}</td>
                <td className="py-2.5 text-center tabular">{it.summary.defects}/{it.summary.maxDefects}</td>
                <td className="py-2.5">
                  <ToneBadge tone={/pass/i.test(it.header.result) ? "green" : /fail/i.test(it.header.result) ? "red" : /progress/i.test(it.header.result) ? "navy" : "neutral"} dot={false}>
                    {it.header.result}
                  </ToneBadge>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No inspection items.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* --------------------------- Shipment tab --------------------------- */

function ShipmentPanel({ data }: { data: ShipmentTab }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-2">
        <MetaGrid meta={data.meta} />
        <h3 className="mb-3 mt-8 text-[17px] font-extrabold tracking-tight text-foreground">Contents</h3>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 text-left font-bold">Item</th>
              <th className="pb-2 text-left font-bold">SKU</th>
              <th className="pb-2 text-right font-bold">Qty</th>
            </tr>
          </thead>
          <tbody>
            {data.shipment.contents.map((c, i) => (
              <tr key={i} className="border-t border-border/50">
                <td className="py-2.5 font-semibold text-foreground">{c.name}</td>
                <td className="py-2.5">{c.sku}</td>
                <td className="py-2.5 text-right tabular">{c.qty}</td>
              </tr>
            ))}
            {data.shipment.contents.length === 0 && (
              <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">No contents recorded.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
      <Card className="p-6">
        <h3 className="mb-4 text-[17px] font-extrabold tracking-tight text-foreground">Tracking</h3>
        <Timeline items={data.shipment.tracking} />
      </Card>
    </div>
  );
}

/* ---------------------------- Finance tab ---------------------------- */

function FinancePanel({ invoices }: { invoices: OrderInvoice[] }) {
  return (
    <Card className="p-6">
      <h3 className="mb-4 text-[17px] font-extrabold tracking-tight text-foreground">Invoices</h3>
      {invoices.length > 0 ? (
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 text-left font-bold">Invoice</th>
              <th className="pb-2 text-left font-bold">Type</th>
              <th className="pb-2 text-left font-bold">Date</th>
              <th className="pb-2 text-right font-bold">Total</th>
              <th className="pb-2 text-left font-bold">Status</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.publicId} className="border-t border-border/50">
                <td className="py-2.5 font-bold text-foreground">{inv.invoiceNo}</td>
                <td className="py-2.5">{inv.invoiceType}</td>
                <td className="py-2.5 text-muted-foreground">{inv.createdAt}</td>
                <td className="py-2.5 text-right tabular font-semibold text-foreground">{inv.total}</td>
                <td className="py-2.5">{inv.status}</td>
                <td className="py-2.5 text-right">
                  <Link
                    href={`/sales/invoices?doc=${inv.publicId}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[12px] font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="py-8 text-center text-[13px] text-muted-foreground">
          No invoices generated for this order yet.
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */

const TAB_CLS =
  "mr-1 whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-3.5 pb-3 pt-0 text-[14px] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground";

export function OrderHistoryDetail({ publicId, backHref }: { publicId: string; backHref: string }) {
  const { data } = useQuery<Detail>({
    queryKey: ["orderhistory", "detail", publicId],
    queryFn: () => apiGet<Detail>(`/order-history/orders/${publicId}/detail`),
    enabled: USE_BACKEND,
  });

  return (
    <div className="mx-auto w-full max-w-[1180px]">
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} strokeWidth={2} /> Back to Order History
      </Link>

      {!data ? (
        <div className="py-20 text-center text-muted-foreground">Loading…</div>
      ) : (
        <>
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9499A6]">
                  {data.orderNo ? `#${data.orderNo}` : "—"}
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <h1 className="text-[26px] font-extrabold tracking-tight text-foreground">{data.customer}</h1>
                  <ToneBadge tone={data.statusTone}>{data.status}</ToneBadge>
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { k: "Channel", v: data.channel },
                { k: "Order date", v: data.orderDate },
                { k: "Total", v: data.total },
              ].map((m) => (
                <div key={m.k} className="rounded-[12px] border border-border/70 bg-muted/40 px-4 py-3.5">
                  <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{m.k}</div>
                  <div className="mt-1 text-[18px] font-extrabold text-foreground">{m.v}</div>
                </div>
              ))}
            </div>
          </Card>

          <Tabs defaultValue={data.tabs[0]} className="mt-4">
            <TabsList className="erp-scroll mb-4 w-full justify-start gap-0 overflow-x-auto border-b border-border/70">
              {data.tabs.map((t) => (
                <TabsTrigger key={t} value={t} className={TAB_CLS}>{t}</TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="Order">
              {data.order ? <OrderPanel data={data.order} /> : <EmptyStage label="No order details available" />}
            </TabsContent>
            <TabsContent value="Production">
              {data.production ? <ProductionPanel data={data.production} /> : <EmptyStage label="Production hasn't started yet" />}
            </TabsContent>
            <TabsContent value="Quality">
              {data.quality ? <QualityPanel data={data.quality} /> : <EmptyStage label="No inspection recorded yet" />}
            </TabsContent>
            <TabsContent value="Shipment">
              {data.shipment ? <ShipmentPanel data={data.shipment} /> : <EmptyStage label="Not shipped yet" />}
            </TabsContent>
            <TabsContent value="Finance">
              <FinancePanel invoices={data.finance.invoices} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
