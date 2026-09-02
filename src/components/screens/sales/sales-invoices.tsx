"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, ArrowLeft, Save, Printer, Loader2, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from "@/components/ui/sheet";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { apiGet, apiPost, apiPut, USE_BACKEND } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { zeroToBlank } from "@/lib/number-input";
import { useModuleAccess } from "@/lib/module-access";

// ----- types + helpers ------------------------------------------------------
type FlatLine = { article: string; colour: string; size: string; qty: number; unitPrice: number; amount?: number };
type WsRow = { color: string; qty: Record<string, number>; unitPrice: number; total?: number; amount?: number };
type Article = { articleNo: string; style: string; description: string; fabric: string; hsCode: string; sku?: string; image?: string | null; sizes: string[]; rows: WsRow[]; subtotalQty?: number; subtotalAmount?: number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = any;

const INVOICE_TYPES = ["Retail", "Online", "Wholesale"] as const;
type InvoiceType = (typeof INVOICE_TYPES)[number];

// Document (paper) styling — grayscale, to match the printed template.
const FIELD = "w-full border-0 border-b border-[#c2c2c2] bg-transparent px-0.5 py-1 text-[12px] font-semibold text-[#111] outline-none focus:border-[#111]";
const LBL = "block text-[10px] italic leading-tight text-[#666]";
const BOX = "border border-[#c9c9c9]";

const wsRowTotal = (r: WsRow) => Object.values(r.qty || {}).reduce((s, q) => s + (Number(q) || 0), 0);
const fmt = (n: number, ccy: string) => `${ccy} ${(+n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const num = (n: number) => (+n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

// totals: subtotal − discount + tax + freight
function computeTotals(doc: Doc) {
  let totalQty = 0, subtotal = 0;
  if (doc.layout === "wholesale") {
    (doc.articles || []).forEach((a: Article) => a.rows.forEach((row) => {
      const t = wsRowTotal(row); totalQty += t; subtotal += t * (Number(row.unitPrice) || 0);
    }));
  } else {
    (doc.lines || []).forEach((l: FlatLine) => {
      const q = Number(l.qty) || 0; totalQty += q; subtotal += q * (Number(l.unitPrice) || 0);
    });
  }
  subtotal = r2(subtotal);
  const discount = Number(doc.totals?.discount) || 0;
  const taxRate = Number(doc.totals?.taxRate) || 0;
  const freight = doc.layout === "wholesale" ? (Number(doc.totals?.freight) || 0) : 0;
  const tax = r2((subtotal - discount) * (taxRate / 100));
  const total = r2(subtotal - discount + tax + freight);
  return { totalQty, subtotal, discount, taxRate, tax, freight, total };
}

// ============================================================================
export function SalesInvoices() {
  const [editor, setEditor] = React.useState<{ doc: Doc; publicId: string | null } | null>(null);
  const params = useSearchParams();
  const docParam = params.get("doc");
  // Deep-link: /sales/invoices?doc=<id> opens that invoice directly (used by the
  // "Open" links on an order's Invoices tab).
  React.useEffect(() => {
    if (!docParam) return;
    let cancelled = false;
    (async () => {
      try {
        const full = await apiGet<{ data: Doc }>(`/sales/invoice-docs/${docParam}`);
        if (!cancelled) setEditor({ doc: full.data, publicId: docParam });
      } catch { /* ignore — fall back to the list */ }
    })();
    return () => { cancelled = true; };
  }, [docParam]);
  if (editor) return <InvoiceEditor doc={editor.doc} publicId={editor.publicId} onBack={() => setEditor(null)} />;
  return <InvoiceList onOpen={(doc, publicId) => setEditor({ doc, publicId })} />;
}

// ----- list + generate ------------------------------------------------------
function InvoiceList({ onOpen }: { onOpen: (doc: Doc, publicId: string | null) => void }) {
  const { canWrite, reason: writeReason } = useModuleAccess("sales");
  const [genOpen, setGenOpen] = React.useState(false);
  const [orderNo, setOrderNo] = React.useState("");
  const [type, setType] = React.useState<InvoiceType>("Retail");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["sales", "invoice-docs"],
    queryFn: () => apiGet<{ invoices: Doc[] }>("/sales/invoice-docs"),
    enabled: USE_BACKEND,
  });

  const generate = async () => {
    if (!orderNo.trim()) return;
    setBusy(true); setError(null);
    try {
      const draft = await apiGet<Doc>(
        `/sales/invoice-docs/draft?order=${encodeURIComponent(orderNo.trim())}&type=${type}`,
      );
      setGenOpen(false); setOrderNo("");
      onOpen(draft, null);
    } catch {
      setError(`No sales order found for "${orderNo.trim()}".`);
    } finally { setBusy(false); }
  };

  const open = async (publicId: string) => {
    const full = await apiGet<{ data: Doc }>(`/sales/invoice-docs/${publicId}`);
    onOpen(full.data, publicId);
  };

  const invoices = data?.invoices ?? [];

  const [q, setQ] = React.useState("");
  const [typeF, setTypeF] = React.useState("All");
  const [statusF, setStatusF] = React.useState("All");
  const typeOpts = ["All", ...Array.from(new Set(invoices.map((i) => i.invoiceType).filter(Boolean) as string[]))];
  const statusOpts = ["All", ...Array.from(new Set(invoices.map((i) => i.status).filter(Boolean) as string[]))];
  const filtered = invoices.filter((i) => {
    const hay = `${i.invoiceNo ?? ""} ${i.orderNo ?? ""} ${i.customer ?? ""}`.toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (typeF !== "All" && i.invoiceType !== typeF) return false;
    if (statusF !== "All" && i.status !== statusF) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] text-muted-foreground">Retail, online &amp; wholesale invoices generated against sales orders.</p>
        <Button variant="navy" size="sm" disabled={!canWrite} title={!canWrite ? writeReason ?? undefined : undefined}
          onClick={() => setGenOpen(true)}><Plus size={15} /> Generate invoice</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-border/70 bg-muted px-3.5 py-2 text-muted-foreground">
          <Search size={15} strokeWidth={1.9} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoice, order, customer…"
            className="w-full border-0 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground" />
        </div>
        <Select value={typeF} onValueChange={setTypeF}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>{typeOpts.map((t) => <SelectItem key={t} value={t}>{t === "All" ? "All types" : t}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusF} onValueChange={setStatusF}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>{statusOpts.map((s) => <SelectItem key={s} value={s}>{s === "All" ? "All statuses" : s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 text-left font-bold">Invoice</th>
              <th className="px-4 py-3 text-left font-bold">Order</th>
              <th className="px-4 py-3 text-left font-bold">Type</th>
              <th className="px-4 py-3 text-left font-bold">Customer</th>
              <th className="px-4 py-3 text-right font-bold">Total</th>
              <th className="px-4 py-3 text-left font-bold">Status</th>
              <th className="px-4 py-3 text-left font-bold">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.publicId} onClick={() => open(inv.publicId)}
                  className="cursor-pointer border-t border-border/50 transition-colors hover:bg-muted/40">
                <td className="px-4 py-3 font-bold text-foreground">{inv.invoiceNo || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.orderNo || "—"}</td>
                <td className="px-4 py-3 text-foreground">{inv.invoiceType || "—"}</td>
                <td className="px-4 py-3 text-foreground">{inv.customer || "—"}</td>
                <td className="px-4 py-3 text-right tabular text-foreground">{fmt(inv.total, inv.currency || "USD")}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">{inv.status}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">
                {invoices.length === 0
                  ? "No invoices yet — click “Generate invoice”, enter an order number and pick a type."
                  : "No invoices match your search or filters."}
              </td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <Sheet open={genOpen} onOpenChange={setGenOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Generate invoice</SheetTitle>
            <SheetDescription>Enter the sales order number and choose the invoice type to build from its lines.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 px-6 pb-6">
            <div>
              <Label className="text-[13px]">Order number</Label>
              <Input className="mt-1" placeholder="e.g. SO-1042" value={orderNo}
                     onChange={(e) => setOrderNo(e.target.value)}
                     onKeyDown={(e) => e.key === "Enter" && generate()} autoFocus />
            </div>
            <div>
              <Label className="text-[13px]">Invoice type</Label>
              <Select value={type} onValueChange={(v) => setType(v as InvoiceType)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INVOICE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Retail &amp; Online use the receipt layout; Wholesale uses the colour×size matrix. Pricing follows the selected type.
              </p>
            </div>
            {error && <p className="rounded-md bg-[#FBEAEA] p-2.5 text-[12px] font-semibold text-[#C0392B]">{error}</p>}
          </div>
          <SheetFooter>
            <SheetClose asChild><Button type="button" variant="outline">Cancel</Button></SheetClose>
            <Button type="button" onClick={generate} disabled={busy || !orderNo.trim()}>
              {busy ? <><Loader2 size={15} className="animate-spin" /> Generating…</> : <><FileText size={15} /> Generate</>}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ----- small labelled paper field ------------------------------------------
function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <span className={LBL}>{label}</span>
      <input className={FIELD} value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// ----- editor shell (chooses layout) ---------------------------------------
function InvoiceEditor({ doc: initial, publicId, onBack }: { doc: Doc; publicId: string | null; onBack: () => void }) {
  const qc = useQueryClient();
  const { canWrite, reason: writeReason } = useModuleAccess("sales");
  const [doc, setDoc] = React.useState<Doc>(initial);
  const [saving, setSaving] = React.useState(false);
  const [savedId, setSavedId] = React.useState<string | null>(publicId);
  const ccy = doc.currency || "USD";
  const totals = React.useMemo(() => computeTotals(doc), [doc]);

  const update = (patch: (d: Doc) => void) =>
    setDoc((prev: Doc) => { const next = structuredClone(prev); patch(next); return next; });

  const finalize = (): Doc => {
    const d = structuredClone(doc);
    if (d.layout === "wholesale") {
      d.articles.forEach((a: Article) => {
        let sq = 0, sa = 0;
        a.rows.forEach((row) => { const t = wsRowTotal(row); const amt = r2(t * (Number(row.unitPrice) || 0)); row.total = t; row.amount = amt; sq += t; sa += amt; });
        a.subtotalQty = sq; a.subtotalAmount = r2(sa);
      });
    } else {
      d.lines.forEach((l: FlatLine) => { l.amount = r2((Number(l.qty) || 0) * (Number(l.unitPrice) || 0)); });
    }
    const t = computeTotals(d);
    d.totals = { ...(d.totals || {}), ...t };
    return d;
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = finalize();
      if (savedId) await apiPut(`/sales/invoice-docs/${savedId}`, payload);
      else { const res = await apiPost<{ publicId: string }>("/sales/invoice-docs", payload); setSavedId(res.publicId); }
      qc.invalidateQueries({ queryKey: ["sales", "invoice-docs"] });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft size={15} /> Back</Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer size={15} /> Print</Button>
          <Button size="sm" onClick={save} disabled={saving || !canWrite}
            title={!canWrite ? writeReason ?? undefined : undefined}>
            {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save</>}
          </Button>
        </div>
      </div>

      {doc.layout === "wholesale"
        ? <WholesalePaper doc={doc} ccy={ccy} totals={totals} update={update} />
        : <RetailPaper doc={doc} ccy={ccy} totals={totals} update={update} />}
    </div>
  );
}

// ----- totals box (shared) --------------------------------------------------
function TotalsBox({ doc, ccy, totals, update, freight }: {
  doc: Doc; ccy: string; totals: ReturnType<typeof computeTotals>; update: (p: (d: Doc) => void) => void; freight: boolean;
}) {
  return (
    <div className={cn(BOX, "divide-y divide-[#c9c9c9] text-[12px]")}>
      <div className="flex items-center justify-between px-3 py-2">
        <span>Sous-total · Sub-total {ccy}</span><span className="tabular font-semibold">{num(totals.subtotal)}</span>
      </div>
      <div className="flex items-center justify-between px-3 py-1.5">
        <span>Remise · Discount</span>
        <input type="number" placeholder="0" className="w-24 border-b border-[#c2c2c2] bg-transparent text-right text-[12px] outline-none focus:border-[#111]"
               value={zeroToBlank(doc.totals?.discount ?? 0)} onChange={(e) => update((d) => { d.totals.discount = parseFloat(e.target.value) || 0; })} />
      </div>
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="flex items-center gap-1">Sales tax (
          <input type="number" placeholder="0" className="w-12 border-b border-[#c2c2c2] bg-transparent text-right text-[12px] outline-none focus:border-[#111]"
                 value={zeroToBlank(doc.totals?.taxRate ?? 0)} onChange={(e) => update((d) => { d.totals.taxRate = parseFloat(e.target.value) || 0; })} />%)
        </span>
        <span className="tabular">{num(totals.tax)}</span>
      </div>
      {freight && (
        <div className="flex items-center justify-between px-3 py-1.5">
          <span>Fret · Freight</span>
          <input type="number" placeholder="0" className="w-24 border-b border-[#c2c2c2] bg-transparent text-right text-[12px] outline-none focus:border-[#111]"
                 value={zeroToBlank(doc.totals?.freight ?? 0)} onChange={(e) => update((d) => { d.totals.freight = parseFloat(e.target.value) || 0; })} />
        </div>
      )}
      <div className="flex items-center justify-between bg-[#e4e4e4] px-3 py-2 font-extrabold">
        <span>{freight ? "TOTAL À PAYER" : "TOTAL"} · TOTAL {ccy}</span><span className="tabular">{num(totals.total)}</span>
      </div>
    </div>
  );
}

// ============================================================================
// RETAIL / ONLINE — flat receipt
// ============================================================================
const REMIT_ROWS: [string, string][] = [["Title", "title"], ["Bank", "bank"], ["Account", "account"], ["IBAN", "iban"], ["SWIFT", "swift"]];

function RetailPaper({ doc, ccy, totals, update }: {
  doc: Doc; ccy: string; totals: ReturnType<typeof computeTotals>; update: (p: (d: Doc) => void) => void;
}) {
  const badge = (doc.invoiceType || "Retail").toUpperCase() === "ONLINE" ? "ONLINE SALE" : "RETAIL SALE";
  const META: [string, string][] = [
    ["Invoice no", "invoiceNo"], ["Date", "invoiceDate"],
    ["Payment method", "paymentMethod"], ["Order ref", "orderRef"],
    ["Cashier", "cashier"], ["Status", "status"],
  ];
  return (
    <div className="invoice-paper mx-auto w-full max-w-[900px] border border-[#e2e2e2] bg-white p-8 text-[#111] shadow-erp-lg">
      {/* header: exporter | title + customer */}
      <div className="grid grid-cols-[1.15fr_1fr] gap-4">
        <div className={cn(BOX, "p-3 text-center")}>
          <input className={cn(FIELD, "border-b-0 text-center text-[15px] font-extrabold")} value={doc.exporter?.name || ""}
                 onChange={(e) => update((d) => { d.exporter.name = e.target.value; })} />
          <input className={cn(FIELD, "border-b-0 text-center text-[11px] font-normal text-[#555]")} value={doc.exporter?.address || ""}
                 placeholder="Address · City" onChange={(e) => update((d) => { d.exporter.address = e.target.value; })} />
          <div className="mt-1 grid grid-cols-2 gap-x-3">
            <div><span className={LBL}>Tél / tel</span><input className={FIELD} value={doc.exporter?.tel || ""} onChange={(e) => update((d) => { d.exporter.tel = e.target.value; })} /></div>
            <div><span className={LBL}>Email</span><input className={FIELD} value={doc.exporter?.email || ""} onChange={(e) => update((d) => { d.exporter.email = e.target.value; })} /></div>
            <div className="col-span-2"><span className={LBL}>NTN / GST</span><input className={FIELD} value={doc.exporter?.taxId || ""} onChange={(e) => update((d) => { d.exporter.taxId = e.target.value; })} /></div>
          </div>
        </div>

        <div>
          <div className={cn(BOX, "bg-[#e4e4e4] py-2.5 text-center")}>
            <div className="text-[15px] font-extrabold tracking-tight text-[#111]">INVOICE</div>
            <div className="text-[10.5px] tracking-[0.14em] text-[#444]">{badge}</div>
          </div>
          <div className="mt-1.5 text-right text-[11px] text-[#333]">
            City, le <span className="font-semibold">{doc.invoiceDate || "__ / __ / ____"}</span>
          </div>
          <div className={cn(BOX, "mt-1.5 p-3")}>
            <span className={LBL}>Client / Customer</span>
            <input className={cn(FIELD, "font-bold")} value={doc.buyer?.name || ""} onChange={(e) => update((d) => { d.buyer.name = e.target.value; })} />
            <div className="mt-2 grid grid-cols-2 gap-x-3">
              <div><span className={LBL}>Phone</span><input className={FIELD} value={doc.buyer?.phone || ""} onChange={(e) => update((d) => { d.buyer.phone = e.target.value; })} /></div>
              <div><span className={LBL}>Email</span><input className={FIELD} value={doc.buyer?.email || ""} onChange={(e) => update((d) => { d.buyer.email = e.target.value; })} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* meta grid */}
      <div className="mt-4 grid grid-cols-3 gap-x-6 gap-y-2.5">
        {META.map(([label, key]) => (
          <Field key={key} label={label} value={doc[key]} onChange={(v) => update((d) => { d[key] = v; })} />
        ))}
      </div>

      {/* flat line table (read-only, from the order) */}
      <table className="mt-5 w-full border-collapse text-[11.5px]">
        <thead>
          <tr className="bg-[#ededed] text-[10px] uppercase tracking-wide text-[#333]">
            <th className="border border-[#c9c9c9] px-2 py-1.5 text-left font-bold">Article · Item</th>
            <th className="border border-[#c9c9c9] px-2 py-1.5 text-left font-bold">Colour</th>
            <th className="border border-[#c9c9c9] px-2 py-1.5 text-left font-bold">Size</th>
            <th className="border border-[#c9c9c9] px-2 py-1.5 text-center font-bold">Qté</th>
            <th className="border border-[#c9c9c9] px-2 py-1.5 text-right font-bold">P.U. {ccy}</th>
            <th className="border border-[#c9c9c9] px-2 py-1.5 text-right font-bold">Montant</th>
          </tr>
        </thead>
        <tbody>
          {(doc.lines || []).map((l: FlatLine, i: number) => (
            <tr key={i}>
              <td className="border border-[#c9c9c9] px-2 py-1.5 text-left font-medium">{l.article || "—"}</td>
              <td className="border border-[#c9c9c9] px-2 py-1.5 text-left uppercase">{l.colour || "—"}</td>
              <td className="border border-[#c9c9c9] px-2 py-1.5 text-left uppercase">{l.size || "—"}</td>
              <td className="border border-[#c9c9c9] px-2 py-1.5 text-center tabular">{l.qty}</td>
              <td className="border border-[#c9c9c9] px-2 py-1.5 text-right tabular">{num(Number(l.unitPrice) || 0)}</td>
              <td className="border border-[#c9c9c9] px-2 py-1.5 text-right tabular font-semibold">{num((Number(l.qty) || 0) * (Number(l.unitPrice) || 0))}</td>
            </tr>
          ))}
          <tr className="bg-[#f4f4f4] font-bold italic">
            <td className="border border-[#c9c9c9] px-2 py-1.5 text-right" colSpan={3}>Total articles · Total items</td>
            <td className="border border-[#c9c9c9] px-2 py-1.5 text-center tabular">{totals.totalQty}</td>
            <td className="border border-[#c9c9c9]" />
            <td className="border border-[#c9c9c9] px-2 py-1.5 text-right tabular">{num(totals.subtotal)}</td>
          </tr>
        </tbody>
      </table>

      {/* note + bank details | totals */}
      <div className="mt-4 grid grid-cols-[1.4fr_1fr] gap-4">
        <div className="space-y-3">
          <div>
            <span className={LBL}>Note</span>
            <textarea className={cn(BOX, "mt-1 h-[76px] w-full resize-none bg-white p-2 text-[12px] text-[#111] outline-none")}
                      value={doc.note || ""} onChange={(e) => update((d) => { d.note = e.target.value; })} />
          </div>
          <div>
            <div className="mb-1 text-[11px] font-bold text-[#111]">Bank details</div>
            <div className={cn(BOX, "divide-y divide-[#c9c9c9]")}>
              {(REMIT_ROWS).map(([label, key]) => (
                <div key={key} className="grid grid-cols-[0.6fr_1.4fr]">
                  <div className="border-r border-[#c9c9c9] bg-[#f6f6f6] px-2 py-2 text-[10px] italic text-[#555]">{label}</div>
                  <input className="px-2 py-2 text-[12px] text-[#111] outline-none focus:bg-[#f0f0f0]"
                         value={doc.remit?.[key] || ""} onChange={(e) => update((d) => { d.remit[key] = e.target.value; })} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <TotalsBox doc={doc} ccy={ccy} totals={totals} update={update} freight={false} />
      </div>

      {/* signatures */}
      <div className="mt-8 grid grid-cols-2 gap-10">
        <div className="border-t border-[#111] pt-1 text-[10px] italic text-[#555]">Signature client · Customer</div>
        <div className="border-t border-[#111] pt-1 text-[10px] italic text-[#555]">Caissier · Cashier &amp; stamp</div>
      </div>
    </div>
  );
}

// ============================================================================
// WHOLESALE — colour×size matrix (mirrors the procurement commercial invoice)
// ============================================================================
function WholesalePaper({ doc, ccy, totals, update }: {
  doc: Doc; ccy: string; totals: ReturnType<typeof computeTotals>; update: (p: (d: Doc) => void) => void;
}) {
  const META: [string, string][] = [
    ["Invoice no", "invoiceNo"], ["PO no", "poNo"], ["Order date", "orderDate"],
    ["Payment terms", "paymentTerms"], ["Sales rep", "salesRep"], ["Ship to", "shipTo"],
  ];
  const REMIT: [string, string][] = [["Title", "title"], ["Bank", "bank"], ["Account", "account"]];
  return (
    <div className="invoice-paper mx-auto w-full max-w-[900px] border border-[#e2e2e2] bg-white p-8 text-[#111] shadow-erp-lg">
      <div className="mb-1 flex items-center justify-between text-[9px] text-[#8a8a8a]">
        <span>{doc.exporter?.name || "Commercial invoice"}</span><span>Page 1 / 1</span>
      </div>

      {/* header: exporter | title + buyer */}
      <div className="grid grid-cols-[1.15fr_1fr] gap-4">
        <div className={cn(BOX, "p-3 text-center")}>
          <input className={cn(FIELD, "border-b-0 text-center text-[15px] font-extrabold")} value={doc.exporter?.name || ""}
                 onChange={(e) => update((d) => { d.exporter.name = e.target.value; })} />
          <input className={cn(FIELD, "border-b-0 text-center text-[11px] font-normal text-[#555]")} value={doc.exporter?.address || ""}
                 placeholder="Warehouse · Industrial estate · City" onChange={(e) => update((d) => { d.exporter.address = e.target.value; })} />
          <div className="mt-1 grid grid-cols-2 gap-x-3">
            <div><span className={LBL}>Email</span><input className={FIELD} value={doc.exporter?.email || ""} onChange={(e) => update((d) => { d.exporter.email = e.target.value; })} /></div>
            <div><span className={LBL}>Tél / tel</span><input className={FIELD} value={doc.exporter?.tel || ""} onChange={(e) => update((d) => { d.exporter.tel = e.target.value; })} /></div>
            <div className="col-span-2"><span className={LBL}>NTN / GST</span><input className={FIELD} value={doc.exporter?.taxId || ""} onChange={(e) => update((d) => { d.exporter.taxId = e.target.value; })} /></div>
          </div>
        </div>

        <div>
          <div className={cn(BOX, "bg-[#e4e4e4] py-2.5 text-center")}>
            <div className="text-[15px] font-extrabold tracking-tight text-[#111]">INVOICE</div>
            <div className="text-[10.5px] tracking-[0.14em] text-[#444]">WHOLESALE</div>
          </div>
          <div className="mt-1.5 text-right text-[11px] text-[#333]">
            City, le <span className="font-semibold">{doc.invoiceDate || "__ / __ / ____"}</span>
          </div>
          <div className={cn(BOX, "mt-1.5 p-3")}>
            <span className={LBL}>Client / Retailer · Buyer</span>
            <input className={cn(FIELD, "font-bold")} value={doc.buyer?.name || ""} onChange={(e) => update((d) => { d.buyer.name = e.target.value; })} />
            <span className={cn(LBL, "mt-2")}>GST / Tax ID</span>
            <input className={FIELD} value={doc.buyer?.taxId || ""} onChange={(e) => update((d) => { d.buyer.taxId = e.target.value; })} />
          </div>
        </div>
      </div>

      {/* meta grid */}
      <div className="mt-4 grid grid-cols-3 gap-x-6 gap-y-2.5">
        {META.map(([label, key]) => (
          <Field key={key} label={label} value={doc[key]} onChange={(v) => update((d) => { d[key] = v; })} />
        ))}
      </div>

      {/* article blocks */}
      <div className="mt-5 space-y-4">
        {(doc.articles || []).map((a: Article, ai: number) => (
          <ArticleBlock key={ai} a={a} ccy={ccy} onChange={(patch) => update((d) => patch(d.articles[ai]))} />
        ))}
      </div>

      {/* total quantity bar */}
      <div className={cn(BOX, "mt-5 grid grid-cols-[1.3fr_1fr_1fr] items-center bg-[#f3f3f3] text-[11px]")}>
        <div className="border-r border-[#c9c9c9] px-3 py-2 font-bold italic">Quantité totale · Total units ordered</div>
        <div className="border-r border-[#c9c9c9] px-3 py-2 text-center">{totals.totalQty.toLocaleString()} pcs</div>
        <div className="px-3 py-2 text-right tabular font-semibold">{fmt(totals.subtotal, ccy)}</div>
      </div>

      {/* terms + remit | totals */}
      <div className="mt-4 grid grid-cols-[1.4fr_1fr] gap-4">
        <div className="space-y-3">
          <div>
            <div className="text-[11px] font-bold text-[#111]">Terms</div>
            <textarea className={cn(BOX, "mt-1 h-[52px] w-full resize-none bg-white p-2 text-[11px] text-[#111] outline-none")}
                      value={doc.terms || ""} onChange={(e) => update((d) => { d.terms = e.target.value; })} />
          </div>
          <div>
            <div className="mb-1 text-[11px] font-bold text-[#111]">Remit to</div>
            <div className={cn(BOX, "divide-y divide-[#c9c9c9]")}>
              {REMIT.map(([label, key]) => (
                <div key={key} className="grid grid-cols-[0.6fr_1.4fr]">
                  <div className="border-r border-[#c9c9c9] bg-[#f6f6f6] px-2 py-2 text-[10px] italic text-[#555]">{label}</div>
                  <input className="px-2 py-2 text-[12px] text-[#111] outline-none focus:bg-[#f0f0f0]"
                         value={doc.remit?.[key] || ""} onChange={(e) => update((d) => { d.remit[key] = e.target.value; })} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <TotalsBox doc={doc} ccy={ccy} totals={totals} update={update} freight={true} />
      </div>

      {/* signatures */}
      <div className="mt-8 grid grid-cols-2 gap-10">
        <div className="border-t border-[#111] pt-1 text-[10px] italic text-[#555]">Reçu par · Received by — date</div>
        <div className="border-t border-[#111] pt-1 text-[10px] italic text-[#555]">Signature autorisée &amp; cachet · Authorised &amp; stamp</div>
      </div>
    </div>
  );
}

// ----- one wholesale article: photo + meta (editable) + read-only matrix ---
function ArticleBlock({ a, ccy, onChange }: {
  a: Article; ccy: string; onChange: (patch: (a: Article) => void) => void;
}) {
  const subQty = a.rows.reduce((s, r) => s + wsRowTotal(r), 0);
  const subAmt = a.rows.reduce((s, r) => s + wsRowTotal(r) * (Number(r.unitPrice) || 0), 0);
  return (
    <div className={BOX}>
      <div className="flex gap-4 bg-[#f3f3f3] p-3">
        <div className="flex h-[92px] w-[118px] shrink-0 flex-col items-center justify-center overflow-hidden border border-dashed border-[#b5b5b5] bg-white text-center text-[9px] leading-tight text-[#999]">
          {a.image ? <img src={a.image} alt="" className="h-full w-full object-cover" /> : <>Photo or browse files</>}
        </div>
        <div className="grid flex-1 grid-cols-3 gap-x-4 gap-y-1.5">
          <Field label="Style" value={a.style} onChange={(v) => onChange((x) => { x.style = v; })} />
          <Field label="SKU" value={a.sku || ""} onChange={(v) => onChange((x) => { x.sku = v; })} />
          <Field label="Désignation / description" value={a.description} onChange={(v) => onChange((x) => { x.description = v; })} />
          <Field label="Matière / fabric" value={a.fabric} onChange={(v) => onChange((x) => { x.fabric = v; })} />
          <Field label="HS code" value={a.hsCode} onChange={(v) => onChange((x) => { x.hsCode = v; })} />
        </div>
      </div>

      <table className="w-full border-collapse text-[11.5px]">
        <thead>
          <tr className="bg-[#ededed] text-[10px] uppercase tracking-wide text-[#333]">
            <th className="border border-[#c9c9c9] px-2 py-1.5 text-left font-bold">Couleur / Colour</th>
            {a.sizes.map((s, si) => (
              <th key={si} className="border border-[#c9c9c9] px-2 py-1.5 text-center font-bold uppercase">{s}</th>
            ))}
            <th className="border border-[#c9c9c9] px-2 py-1.5 font-bold">Units</th>
            <th className="border border-[#c9c9c9] px-2 py-1.5 font-bold">P.U. {ccy}</th>
            <th className="border border-[#c9c9c9] px-2 py-1.5 font-bold">Montant</th>
          </tr>
        </thead>
        <tbody>
          {a.rows.map((r, ri) => {
            const t = wsRowTotal(r);
            return (
              <tr key={ri}>
                <td className="border border-[#c9c9c9] px-2 py-1.5 text-left uppercase font-medium">{r.color || "—"}</td>
                {a.sizes.map((s, si) => (
                  <td key={si} className="border border-[#c9c9c9] px-2 py-1.5 text-center tabular">{r.qty[s] || ""}</td>
                ))}
                <td className="border border-[#c9c9c9] px-2 py-1.5 text-center tabular font-semibold">{t}</td>
                <td className="border border-[#c9c9c9] px-2 py-1.5 text-right tabular">{num(Number(r.unitPrice) || 0)}</td>
                <td className="border border-[#c9c9c9] px-2 py-1.5 text-right tabular font-semibold">{num(t * (Number(r.unitPrice) || 0))}</td>
              </tr>
            );
          })}
          <tr className="bg-[#f4f4f4] font-bold italic">
            <td className="border border-[#c9c9c9] px-2 py-1.5 text-right" colSpan={a.sizes.length + 1}>Sous-total · Style subtotal</td>
            <td className="border border-[#c9c9c9] px-2 py-1.5 text-center tabular">{subQty}</td>
            <td className="border border-[#c9c9c9]" />
            <td className="border border-[#c9c9c9] px-2 py-1.5 text-right tabular">{num(subAmt)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
