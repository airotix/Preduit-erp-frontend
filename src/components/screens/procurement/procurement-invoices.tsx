"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, ArrowLeft, Save, Printer, Loader2, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from "@/components/ui/sheet";
import { apiGet, apiPost, apiPut, USE_BACKEND } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { zeroToBlank } from "@/lib/number-input";
import { useModuleAccess } from "@/lib/module-access";

// ----- types + helpers ------------------------------------------------------
type Row = { color: string; qty: Record<string, number>; unitPrice: number; total?: number; amount?: number };
type Article = { articleNo: string; style: string; description: string; fabric: string; hsCode: string; image?: string | null; sizes: string[]; rows: Row[]; subtotalQty?: number; subtotalAmount?: number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = any;

// Document (paper) styling — grayscale, to match the printed template.
const FIELD = "w-full border-0 border-b border-[#c2c2c2] bg-transparent px-0.5 py-1 text-[12px] font-semibold text-[#111] outline-none focus:border-[#111]";
const LBL = "block text-[10px] italic leading-tight text-[#666]";
const BOX = "border border-[#c9c9c9]";

const rowTotal = (r: Row) => Object.values(r.qty || {}).reduce((s, q) => s + (Number(q) || 0), 0);
const fmt = (n: number, ccy: string) => `${ccy} ${(+n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const num = (n: number) => (+n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function u1000(n: number): string {
  if (n < 20) return ONES[n];
  if (n < 100) return (TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "")).trim();
  return (ONES[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + u1000(n % 100) : "")).trim();
}
function toWords(amount: number, ccy: string): string {
  const whole = Math.floor(amount || 0);
  const cents = Math.round(((amount || 0) - whole) * 100);
  const scales: [number, string][] = [[1_000_000_000, "billion"], [1_000_000, "million"], [1000, "thousand"], [1, ""]];
  let n = whole; const parts: string[] = [];
  if (n === 0) parts.push("zero");
  for (const [v, name] of scales) { if (n >= v) { parts.push(u1000(Math.floor(n / v)) + (name ? " " + name : "")); n %= v; } }
  let w = parts.join(" ").trim();
  w = w.charAt(0).toUpperCase() + w.slice(1) + ` ${ccy}`;
  if (cents) w += ` and ${cents}/100`;
  return w + " only";
}

// ============================================================================
export function ProcurementInvoices() {
  const [editor, setEditor] = React.useState<{ doc: Doc; publicId: string | null } | null>(null);
  if (editor) return <InvoiceEditor doc={editor.doc} publicId={editor.publicId} onBack={() => setEditor(null)} />;
  return <InvoiceList onOpen={(doc, publicId) => setEditor({ doc, publicId })} />;
}

// ----- list + generate ------------------------------------------------------
function InvoiceList({ onOpen }: { onOpen: (doc: Doc, publicId: string | null) => void }) {
  const { canWrite, reason: writeReason } = useModuleAccess("procurement");
  const [genOpen, setGenOpen] = React.useState(false);
  const [poNo, setPoNo] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["procurement", "invoices"],
    queryFn: () => apiGet<{ invoices: Doc[] }>("/procurement/invoices"),
    enabled: USE_BACKEND,
  });

  const generate = async () => {
    if (!poNo.trim()) return;
    setBusy(true); setError(null);
    try {
      const draft = await apiGet<Doc>(`/procurement/invoices/draft?po=${encodeURIComponent(poNo.trim())}`);
      setGenOpen(false); setPoNo("");
      onOpen(draft, null);
    } catch {
      setError(`No purchase order found for "${poNo.trim()}".`);
    } finally { setBusy(false); }
  };

  const open = async (publicId: string) => {
    const full = await apiGet<{ data: Doc }>(`/procurement/invoices/${publicId}`);
    onOpen(full.data, publicId);
  };

  const invoices = data?.invoices ?? [];

  const [q, setQ] = React.useState("");
  const [statusF, setStatusF] = React.useState("All");
  const statusOpts = ["All", ...Array.from(new Set(invoices.map((i) => i.status).filter(Boolean) as string[]))];
  const filtered = invoices.filter((i) => {
    const hay = `${i.invoiceNo ?? ""} ${i.poNo ?? ""} ${i.supplier ?? ""}`.toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (statusF !== "All" && i.status !== statusF) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] text-muted-foreground">Commercial invoices generated against purchase orders.</p>
        <Button variant="navy" size="sm" disabled={!canWrite} title={!canWrite ? writeReason ?? undefined : undefined}
          onClick={() => setGenOpen(true)}><Plus size={15} /> Generate invoice</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-border/70 bg-muted px-3.5 py-2 text-muted-foreground">
          <Search size={15} strokeWidth={1.9} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoice, PO, supplier…"
            className="w-full border-0 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground" />
        </div>
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
              <th className="px-4 py-3 text-left font-bold">PO</th>
              <th className="px-4 py-3 text-left font-bold">Supplier</th>
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
                <td className="px-4 py-3 text-muted-foreground">{inv.poNo || "—"}</td>
                <td className="px-4 py-3 text-foreground">{inv.supplier || "—"}</td>
                <td className="px-4 py-3 text-right tabular text-foreground">{fmt(inv.total, inv.currency || "USD")}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">{inv.status}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">
                {invoices.length === 0
                  ? "No invoices yet — click “Generate invoice” and enter a PO number."
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
            <SheetDescription>Enter the purchase order number to build a commercial invoice from its lines.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-3 px-6 pb-6">
            <div>
              <Label className="text-[13px]">PO number</Label>
              <Input className="mt-1" placeholder="e.g. PO-5501" value={poNo}
                     onChange={(e) => setPoNo(e.target.value)}
                     onKeyDown={(e) => e.key === "Enter" && generate()} autoFocus />
            </div>
            {error && <p className="rounded-md bg-[#FBEAEA] p-2.5 text-[12px] font-semibold text-[#C0392B]">{error}</p>}
          </div>
          <SheetFooter>
            <SheetClose asChild><Button type="button" variant="outline">Cancel</Button></SheetClose>
            <Button type="button" onClick={generate} disabled={busy || !poNo.trim()}>
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

// ----- editable invoice document (matches the printed template) ------------
function InvoiceEditor({ doc: initial, publicId, onBack }: { doc: Doc; publicId: string | null; onBack: () => void }) {
  const qc = useQueryClient();
  const { canWrite, reason: writeReason } = useModuleAccess("procurement");
  const [doc, setDoc] = React.useState<Doc>(initial);
  const [saving, setSaving] = React.useState(false);
  const [savedId, setSavedId] = React.useState<string | null>(publicId);
  const [notice, setNotice] = React.useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const ccy = doc.currency || "USD";

  const update = (patch: (d: Doc) => void) =>
    setDoc((prev: Doc) => { const next = structuredClone(prev); patch(next); return next; });

  const totalsView = React.useMemo(() => {
    let totalQty = 0, subtotal = 0;
    (doc.articles || []).forEach((a: Article) => a.rows.forEach((r) => {
      const t = rowTotal(r); totalQty += t; subtotal += t * (Number(r.unitPrice) || 0);
    }));
    subtotal = Math.round(subtotal * 100) / 100;
    const freight = Number(doc.totals?.freight) || 0;
    return { totalQty, subtotal, total: Math.round((subtotal + freight) * 100) / 100, freight };
  }, [doc]);

  const finalize = (): Doc => {
    const d = structuredClone(doc);
    let totalQty = 0, subtotal = 0;
    d.articles.forEach((a: Article) => {
      let sq = 0, sa = 0;
      a.rows.forEach((r) => { const t = rowTotal(r); const amt = Math.round(t * (Number(r.unitPrice) || 0) * 100) / 100; r.total = t; r.amount = amt; sq += t; sa += amt; });
      a.subtotalQty = sq; a.subtotalAmount = Math.round(sa * 100) / 100; totalQty += sq; subtotal += sa;
    });
    subtotal = Math.round(subtotal * 100) / 100;
    const freight = Number(d.totals?.freight) || 0;
    const total = Math.round((subtotal + freight) * 100) / 100;
    d.totals = { ...(d.totals || {}), totalQty, subtotal, freight, total, amountInWords: d.totals?.amountInWords || toWords(total, ccy) };
    return d;
  };

  const save = async () => {
    setSaving(true);
    setNotice(null);
    const isUpdate = !!savedId;
    try {
      const payload = finalize();
      if (savedId) await apiPut(`/procurement/invoices/${savedId}`, payload);
      else { const res = await apiPost<{ publicId: string }>("/procurement/invoices", payload); setSavedId(res.publicId); }
      qc.invalidateQueries({ queryKey: ["procurement", "invoices"] });
      setNotice({ kind: "ok", text: isUpdate ? "Invoice updated successfully." : "Invoice saved successfully." });
      setTimeout(() => setNotice(null), 4000);
    } catch {
      setNotice({ kind: "err", text: "Could not save the invoice. Please try again." });
    } finally { setSaving(false); }
  };

  const META: [string, string][] = [
    ["Facture n° / Invoice no", "invoiceNo"], ["Date facture / date", "invoiceDate"], ["Commande n° / PO", "poNo"],
    ["Date commande / order", "orderDate"], ["Date livraison / delivery", "deliveryDate"], ["Contact", "contact"],
    ["Incoterms", "incoterms"], ["Origine / origin", "origin"], ["Devise / currency", "currency"],
    ["Paiement / terms", "terms"], ["Port chargement / loading", "portLoading"], ["Port déchargement / discharge", "portDischarge"],
  ];
  const BANK: [string, string][] = [
    ["Bénéficiaire / Account title", "beneficiary"], ["Banque / Bank", "bank"], ["Agence / Branch", "branch"],
    ["Compte / Account no.", "account"], ["IBAN", "iban"], ["SWIFT / BIC", "swift"],
  ];

  return (
    <div className="space-y-4">
      {/* action bar */}
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

      {notice && (
        <div
          className="rounded-lg px-4 py-2.5 text-[13px] font-semibold print:hidden"
          style={notice.kind === "ok"
            ? { background: "#EAF7EF", color: "#2E9E6B" }
            : { background: "#FBEAEA", color: "#C0392B" }}
        >
          {notice.text}
        </div>
      )}

      {/* ===== PAPER ===== */}
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
                   placeholder="Street address · Industrial estate · City · PAKISTAN"
                   onChange={(e) => update((d) => { d.exporter.address = e.target.value; })} />
            <div className="mt-1 grid grid-cols-2 gap-x-3">
              <div><span className={LBL}>Pays / country</span><input className={FIELD} value={doc.exporter?.country || ""} onChange={(e) => update((d) => { d.exporter.country = e.target.value; })} /></div>
              <div><span className={LBL}>Tél / tel</span><input className={FIELD} value={doc.exporter?.tel || ""} onChange={(e) => update((d) => { d.exporter.tel = e.target.value; })} /></div>
              <div><span className={LBL}>Email</span><input className={FIELD} value={doc.exporter?.email || ""} onChange={(e) => update((d) => { d.exporter.email = e.target.value; })} /></div>
              <div><span className={LBL}>NTN / STRN / T.V.A.</span><input className={FIELD} value={doc.exporter?.taxId || ""} onChange={(e) => update((d) => { d.exporter.taxId = e.target.value; })} /></div>
            </div>
          </div>

          <div>
            <div className={cn(BOX, "bg-[#e4e4e4] py-2.5 text-center")}>
              <div className="text-[15px] font-extrabold tracking-tight text-[#111]">FACTURE COMMERCIALE</div>
              <div className="text-[10.5px] tracking-[0.14em] text-[#444]">COMMERCIAL INVOICE</div>
            </div>
            <div className="mt-1.5 text-right text-[11px] text-[#333]">
              Karachi, le <span className="font-semibold">{doc.invoiceDate || "__ / __ / ____"}</span>
            </div>
            <div className={cn(BOX, "mt-1.5 p-3")}>
              <span className={LBL}>Supplier</span>
              <input className={cn(FIELD, "font-bold")} value={doc.buyer?.name || ""} onChange={(e) => update((d) => { d.buyer.name = e.target.value; })} />
              <span className={cn(LBL, "mt-2")}>T.V.A. / VAT</span>
              <input className={FIELD} value={doc.buyer?.vat || ""} onChange={(e) => update((d) => { d.buyer.vat = e.target.value; })} />
            </div>
          </div>
        </div>

        {/* meta grid */}
        <div className="mt-4 grid grid-cols-3 gap-x-6 gap-y-2.5">
          {META.map(([label, key]) => (
            <Field key={key} label={label} value={doc[key]} onChange={(v) => update((d) => { d[key] = v; })} />
          ))}
        </div>

        {/* articles — matrix is fixed from the PO (read-only); meta fields editable */}
        <div className="mt-5 space-y-4">
          {(doc.articles || []).map((a: Article, ai: number) => (
            <ArticleBlock key={ai} a={a} ccy={ccy}
                          onChange={(patch) => update((d) => patch(d.articles[ai]))} />
          ))}
        </div>

        {/* total quantity bar */}
        <div className={cn(BOX, "mt-5 grid grid-cols-[1.3fr_1fr_1fr] items-center bg-[#f3f3f3] text-[11px]")}>
          <div className="border-r border-[#c9c9c9] px-3 py-2 font-bold italic">Quantité totale commandée · Total quantity ordered</div>
          <div className="border-r border-[#c9c9c9] px-3 py-2 text-center">{totalsView.totalQty.toLocaleString()} pcs</div>
          <div className="px-3 py-2 text-right tabular font-semibold">{fmt(totalsView.subtotal, ccy)}</div>
        </div>

        {/* amount in words + totals */}
        <div className="mt-4 grid grid-cols-[1.4fr_1fr] gap-4">
          <div>
            <span className={LBL}>Arrêté la présente facture à la somme de · Amount in words</span>
            <textarea className={cn(BOX, "mt-1 h-[76px] w-full resize-none bg-white p-2 text-[12px] text-[#111] outline-none")}
                      value={doc.totals?.amountInWords || ""}
                      onChange={(e) => update((d) => { d.totals.amountInWords = e.target.value; })} />
            <button className="mt-1 text-[10px] font-semibold text-[#444] underline print:hidden"
                    onClick={() => update((d) => { d.totals.amountInWords = toWords(totalsView.total, ccy); })}>
              Regenerate from total
            </button>
          </div>
          <div className={cn(BOX, "divide-y divide-[#c9c9c9] text-[12px]")}>
            <div className="flex items-center justify-between px-3 py-2">
              <span>Sous-total · Sub-total {ccy}</span><span className="tabular font-semibold">{num(totalsView.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5">
              <span>Fret &amp; assurance · Freight</span>
              <input type="number" placeholder="0" className="w-24 border-b border-[#c2c2c2] bg-transparent text-right text-[12px] outline-none focus:border-[#111]"
                     value={zeroToBlank(doc.totals?.freight ?? 0)} onChange={(e) => update((d) => { d.totals.freight = parseFloat(e.target.value) || 0; })} />
            </div>
            <div className="flex items-center justify-between bg-[#e4e4e4] px-3 py-2 font-extrabold">
              <span>TOTAL À PAYER · TOTAL {ccy}</span><span className="tabular">{num(totalsView.total)}</span>
            </div>
          </div>
        </div>

        {/* bank details */}
        <div className="mt-5">
          <div className="mb-1.5 text-[11px] font-bold text-[#111]">Coordonnées bancaires · Bank &amp; payment details</div>
          <div className={cn(BOX, "grid grid-cols-2 divide-x divide-[#c9c9c9]")}>
            {[BANK.slice(0, 3), BANK.slice(3)].map((col, ci) => (
              <div key={ci} className="divide-y divide-[#c9c9c9]">
                {col.map(([label, key]) => (
                  <div key={key} className="grid grid-cols-[1fr_1.2fr]">
                    <div className="border-r border-[#c9c9c9] bg-[#f6f6f6] px-2 py-2 text-[10px] italic text-[#555]">{label}</div>
                    <input className="px-2 py-2 text-[12px] text-[#111] outline-none focus:bg-[#f0f0f0]"
                           value={doc.bank?.[key] || ""} onChange={(e) => update((d) => { d.bank[key] = e.target.value; })} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* signatures */}
        <div className="mt-6 grid grid-cols-2 gap-10">
          <div className="border-t border-[#111] pt-1 text-[10px] italic text-[#555]">Établi par · Prepared by — lieu &amp; date</div>
          <div className="border-t border-[#111] pt-1 text-[10px] italic text-[#555]">Signature autorisée &amp; cachet · Authorised signature &amp; stamp</div>
        </div>

        <div className="mt-6 flex justify-between border-t border-[#ddd] pt-2 text-[9px] text-[#8a8a8a]">
          <span>{doc.exporter?.name}</span>
          <span>Facture commerciale · Commercial invoice</span>
          <span>Origine : Pakistan</span>
        </div>
      </div>
    </div>
  );
}

// ----- one article: photo + meta (editable) + FIXED read-only matrix -------
function ArticleBlock({ a, ccy, onChange }: {
  a: Article; ccy: string; onChange: (patch: (a: Article) => void) => void;
}) {
  const subQty = a.rows.reduce((s, r) => s + rowTotal(r), 0);
  const subAmt = a.rows.reduce((s, r) => s + rowTotal(r) * (Number(r.unitPrice) || 0), 0);

  return (
    <div className={BOX}>
      {/* meta header (photo from PO + editable fields) */}
      <div className="flex gap-4 bg-[#f3f3f3] p-3">
        <div className="flex h-[92px] w-[118px] shrink-0 flex-col items-center justify-center overflow-hidden border border-dashed border-[#b5b5b5] bg-white text-center text-[9px] leading-tight text-[#999]">
          {a.image
            ? <img src={a.image} alt="" className="h-full w-full object-cover" />
            : <>Photo article / image</>}
        </div>
        <div className="grid flex-1 grid-cols-3 gap-x-4 gap-y-1.5">
          <Field label="Article n°" value={a.articleNo} onChange={(v) => onChange((x) => { x.articleNo = v; })} />
          <Field label="Style" value={a.style} onChange={(v) => onChange((x) => { x.style = v; })} />
          <Field label="Désignation / description" value={a.description} onChange={(v) => onChange((x) => { x.description = v; })} />
          <Field label="Matière / fabric" value={a.fabric} onChange={(v) => onChange((x) => { x.fabric = v; })} />
          <Field label="HS code" value={a.hsCode} onChange={(v) => onChange((x) => { x.hsCode = v; })} />
        </div>
      </div>

      {/* colour × size matrix — permanent, read-only (from the PO) */}
      <table className="w-full border-collapse text-[11.5px]">
        <thead>
          <tr className="bg-[#ededed] text-[10px] uppercase tracking-wide text-[#333]">
            <th className="border border-[#c9c9c9] px-2 py-1.5 text-left font-bold">Couleur / Colour</th>
            {a.sizes.map((s, si) => (
              <th key={si} className="border border-[#c9c9c9] px-2 py-1.5 text-center font-bold uppercase">{s}</th>
            ))}
            <th className="border border-[#c9c9c9] px-2 py-1.5 font-bold">Total / Qté</th>
            <th className="border border-[#c9c9c9] px-2 py-1.5 font-bold">P.U. {ccy}</th>
            <th className="border border-[#c9c9c9] px-2 py-1.5 font-bold">Montant</th>
          </tr>
        </thead>
        <tbody>
          {a.rows.map((r, ri) => {
            const t = rowTotal(r);
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
            <td className="border border-[#c9c9c9] px-2 py-1.5 text-right" colSpan={a.sizes.length + 1}>Sous-total · Sub-total</td>
            <td className="border border-[#c9c9c9] px-2 py-1.5 text-center tabular">{subQty}</td>
            <td className="border border-[#c9c9c9]" />
            <td className="border border-[#c9c9c9] px-2 py-1.5 text-right tabular">{num(subAmt)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
