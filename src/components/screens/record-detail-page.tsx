"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Pencil, Plus, Trash2, Mail, Copy, MapPin } from "lucide-react";
import { Icon } from "@/components/icon";
import { ToneBadge } from "@/components/tone-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { avatarColor, initials, tone as toneOf } from "@/lib/tone";
import { DocumentsPanel } from "@/components/screens/documents-panel";
import { ImageField } from "@/components/screens/auto-form";
import { apiPut } from "@/lib/api-client";
import type { Cell, ColumnDef } from "@/lib/screen-types";
import {
  buildDetail,
  type DetailModel,
  type MetaItem,
  type TimelineItem,
} from "@/modules/detail/detail-data";

/* ------------------------------------------------------------------ *
 * Shared presentational pieces (page variants). These mirror the ones
 * used by the slide-over RecordDetail, laid out for a full page.
 * ------------------------------------------------------------------ */

function pascal(s: string) {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
      {children}
    </div>
  );
}

function Panel({
  title,
  sub,
  children,
  className,
}: {
  title?: string;
  sub?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={"p-6 " + (className ?? "")}>
      {title && (
        <div className="mb-4">
          <h3 className="text-[17px] font-extrabold tracking-tight text-foreground">
            {title}
          </h3>
          {sub && (
            <div className="mt-0.5 text-[13px] text-muted-foreground">{sub}</div>
          )}
        </div>
      )}
      {children}
    </Card>
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
                style={{
                  background: t.done ? k.bg : "#F1F2F5",
                  color: t.done ? k.fg : "#B7BAC4",
                }}
              >
                <Icon name={pascal(t.icon)} size={15} strokeWidth={2} />
              </div>
              {!last && (
                <div
                  className="w-0.5 flex-1"
                  style={{
                    background: t.done ? k.dot : "#E3E5EA",
                    minHeight: 18,
                  }}
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

function PartyCard({
  party,
  title,
}: {
  party: {
    name: string; email: string; phone: string; addr: string;
    vat?: string; contact?: string; bank?: string;
  };
  title: string;
}) {
  const Field = ({ label, value }: { label: string; value?: string }) =>
    value ? (
      <div>
        <span className="font-semibold text-foreground">{label}: </span>
        {value}
      </div>
    ) : null;
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <div className="rounded-xl border border-border/60 p-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: avatarColor(party.name) }}
          >
            {initials(party.name)}
          </span>
          <div className="font-bold text-foreground">{party.name}</div>
        </div>
        <div className="mt-3 space-y-1 text-[13px] text-muted-foreground">
          <div>{party.email}</div>
          <div>{party.phone}</div>
          <div>{party.addr}</div>
          <Field label="VAT number" value={party.vat} />
          <Field label="Contact" value={party.contact} />
          <Field label="Bank details" value={party.bank} />
        </div>
      </div>
    </div>
  );
}

type SupplierCardData = {
  name: string; status: string; code: string; location: string;
  email: string; phone: string; contactId: string; vat: string; bank: string;
};
type SupplierFormData = {
  name: string; region: string; leadTime: string; category: string;
  email: string; phone: string; address: string; contactPerson: string;
  vatNumber: string; bankDetails: string;
};

/** Read-only labelled row for the supplier card. Module-level so it stays stable. */
function CardRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[104px_1fr] items-center gap-2 py-1.5 text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground break-words">{children ?? (value || "—")}</span>
    </div>
  );
}

/** In-place editor for the supplier details card. */
function SupplierDetailsEditor({
  form, recordId, onCancel, onSaved,
}: { form: SupplierFormData; recordId: string; onCancel: () => void; onSaved: () => void }) {
  const [f, setF] = React.useState<SupplierFormData>(form);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (k: keyof SupplierFormData, v: string) => setF((p) => ({ ...p, [k]: v }));
  const save = async () => {
    if (!f.name.trim()) { setError("Name is required."); return; }
    setSaving(true); setError(null);
    try {
      await apiPut(`/procurement/suppliers/${recordId}`, {
        name: f.name.trim(), region: f.region || null, leadTime: f.leadTime || null,
        category: f.category || null, email: f.email || null, phone: f.phone || null,
        address: f.address || null, contactPerson: f.contactPerson || null,
        vatNumber: f.vatNumber || null, bankDetails: f.bankDetails || null,
      });
      onSaved();
    } catch { setError("Could not save changes. Please try again."); setSaving(false); }
  };
  return (
    <div className="rounded-2xl border border-border/60 p-5">
      <SectionTitle>Edit details</SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={_PF_LBL}>Name</label>
          <input className={_PF_INPUT} value={f.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className={_PF_LBL}>Email</label>
          <input className={_PF_INPUT} value={f.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label className={_PF_LBL}>Phone</label>
          <input className={_PF_INPUT} value={f.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className={_PF_LBL}>Contact ID</label>
          <input className={_PF_INPUT} value={f.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} />
        </div>
        <div>
          <label className={_PF_LBL}>VAT number</label>
          <input className={_PF_INPUT} value={f.vatNumber} onChange={(e) => set("vatNumber", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={_PF_LBL}>Bank details</label>
          <input className={_PF_INPUT} value={f.bankDetails} placeholder="e.g. Meezan Bank •••• 4471"
                 onChange={(e) => set("bankDetails", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={_PF_LBL}>Location / region</label>
          <input className={_PF_INPUT} value={f.region} onChange={(e) => set("region", e.target.value)} />
        </div>
      </div>
      {error && <div className="mt-3 rounded-md bg-[#FBEAEA] p-3 text-sm font-semibold text-[#C0392B]">{error}</div>}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </div>
    </div>
  );
}

/** Redesigned supplier details card: header + CONTACT + FINANCE + actions. */
function SupplierCard({
  card, form, recordId, onSaved,
}: { card: SupplierCardData; form?: SupplierFormData; recordId?: string; onSaved?: () => void }) {
  const [editing, setEditing] = React.useState(false);
  if (editing && form && recordId) {
    return (
      <SupplierDetailsEditor
        form={form} recordId={recordId}
        onCancel={() => setEditing(false)}
        onSaved={() => { setEditing(false); onSaved?.(); }}
      />
    );
  }
  const statusTone = /active|preferred|approved/i.test(card.status) ? "green" : "neutral";
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl text-[13px] font-bold text-white"
                style={{ background: avatarColor(card.name) }}>
            {initials(card.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[16px] font-extrabold text-foreground">{card.name}</span>
              <ToneBadge tone={statusTone} dot>{card.status}</ToneBadge>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
              {card.code && <span>{card.code}</span>}
              {card.code && card.location && <span>·</span>}
              {card.location && (
                <span className="inline-flex items-center gap-1"><MapPin size={12} strokeWidth={2} />{card.location}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 px-5 py-4">
        <SectionTitle>Contact</SectionTitle>
        <CardRow label="Email" value={card.email} />
        <CardRow label="Phone" value={card.phone} />
        <CardRow label="Contact ID" value={card.contactId} />
      </div>

      <div className="border-t border-border/60 px-5 py-4">
        <SectionTitle>Finance</SectionTitle>
        <CardRow label="VAT number">
          <span className="inline-flex items-center gap-2">
            {card.vat || "—"}
            {card.vat && (
              <button type="button" aria-label="Copy VAT number"
                      onClick={() => navigator.clipboard?.writeText(card.vat)}
                      className="rounded-md border border-border/70 p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <Copy size={12} strokeWidth={2} />
              </button>
            )}
          </span>
        </CardRow>
        <CardRow label="Bank" value={card.bank} />
      </div>

      <div className="flex items-center gap-2 border-t border-border/60 bg-muted/30 p-4">
        <a
          href={card.email ? `mailto:${card.email}` : undefined}
          className={
            "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white transition-opacity " +
            (card.email ? "bg-brand-orange hover:opacity-90" : "pointer-events-none bg-muted-foreground/40")
          }
        >
          <Mail size={15} strokeWidth={2} /> Email supplier
        </a>
        {recordId && form && (
          <button type="button" onClick={() => setEditing(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-[13px] font-bold text-foreground transition-colors hover:bg-muted">
            <Pencil size={14} strokeWidth={2} /> Edit details
          </button>
        )}
      </div>
    </div>
  );
}

function Lines({ lines, totals, grand }: NonNullable<DetailModel["doc"]>) {
  return (
    <div>
      <SectionTitle>Line items</SectionTitle>
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
          {lines.map((l, i) => (
            <tr key={i} className="border-t border-border/50">
              <td className="py-2.5">
                <div className="font-semibold text-foreground">{l.name}</div>
                <div className="text-xs text-muted-foreground">{l.sku}</div>
              </td>
              <td className="py-2.5 text-right tabular">{l.qty}</td>
              <td className="py-2.5 text-right tabular">{l.price}</td>
              <td className="py-2.5 text-right font-bold tabular text-foreground">
                {l.total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
        {totals.map((t) => (
          <div
            key={t.k}
            className="flex justify-between text-[13px] text-muted-foreground"
          >
            <span>{t.k}</span>
            <span className="tabular">{t.v}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-border/60 pt-2 text-base font-extrabold text-foreground">
          <span>Total</span>
          <span className="tabular">{grand}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- product-specific blocks ---------- */

function VariantMatrix({ product }: { product: NonNullable<DetailModel["product"]> }) {
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr>
          <th className="pb-2 text-left text-[11px] font-bold uppercase text-muted-foreground">
            Color
          </th>
          {product.sizes.map((s) => (
            <th
              key={s}
              className="pb-2 text-center text-[11px] font-bold uppercase text-muted-foreground"
            >
              {s}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {product.matrix.map((c) => (
          <tr key={c.name}>
            <td className="py-1.5">
              <span className="flex items-center gap-2 font-semibold text-foreground">
                <span
                  className="h-3.5 w-3.5 rounded-full border border-black/10"
                  style={{ background: c.hex }}
                />
                {c.name}
              </span>
            </td>
            {c.cells.map((cell, i) => {
              const k = toneOf(cell.tone);
              return (
                <td key={i} className="px-1 py-1.5">
                  <div
                    className="rounded-lg py-2 text-center text-[13px] font-bold tabular"
                    style={{ background: k.bg, color: k.fg }}
                  >
                    {cell.q}
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Product image upload/replace on the drill-down (edit mode). */
function ProductImageEditor({
  recordId, initial, onSaved,
}: { recordId: string; initial: string; onSaved: () => void }) {
  const [val, setVal] = React.useState(initial || "");
  const [saving, setSaving] = React.useState(false);
  const save = async () => {
    setSaving(true);
    try { await apiPut(`/catalog/products/${recordId}/image`, { imageUrl: val }); onSaved(); }
    finally { setSaving(false); }
  };
  return (
    <Panel title="Product image" sub="Upload or replace the product photo">
      <ImageField value={val} onChange={setVal} />
      <div className="mt-4 flex justify-end border-t border-border/60 pt-4">
        <Button variant="navy" size="sm" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save image"}
        </Button>
      </div>
    </Panel>
  );
}

/** In-place product details editor (title, status, category, season, prices,
 *  image with remove). Self-contained — no Sheet/Dialog context needed. */
const _PF_INPUT = "w-full h-10 rounded-lg border border-border/70 bg-white px-3 text-[13px] text-foreground outline-none focus:border-primary";
const _PF_LBL = "mb-1 block text-[12px] font-semibold text-muted-foreground";
const _PF_CATEGORIES = ["Knitwear", "Bottoms", "Shirts", "Outerwear", "Accessories"];
const _PF_SEASONS = ["Core", "Spring '26", "Fall '26", "Winter '26"];
const _PF_STATUSES = ["Active", "Draft", "Discontinued"];

type ProductForm = NonNullable<NonNullable<DetailModel["product"]>["form"]>;

function ProductDetailsEditor({
  product, recordId, onCancel, onSaved,
}: {
  product: NonNullable<DetailModel["product"]>;
  recordId: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const form = product.form;
  const sizes = product.sizes;
  const stockShape: NonNullable<DetailModel["stock"]> = {
    sizes,
    colors: product.matrix.map((c) => ({
      name: c.name,
      hex: c.hex,
      total: c.cells.reduce((s, x) => s + x.q, 0),
      cells: c.cells.map((x) => x.q),
    })),
    locations: [],
  };
  const [f, setF] = React.useState({
    title: form?.title ?? "",
    category: form?.category ?? "",
    season: form?.season ?? "",
    status: form?.status ?? "Active",
    retailPrice: form?.retailPrice ?? ("" as number | ""),
    wholesalePrice: form?.wholesalePrice ?? ("" as number | ""),
    onlinePrice: form?.onlinePrice ?? ("" as number | ""),
    supplierPrice: form?.supplierPrice ?? ("" as number | ""),
    imageUrl: form?.imageUrl ?? "",
    composition: form?.composition ?? "",
    gauge: form?.gauge ?? "",
    care: form?.care ?? "",
    origin: form?.origin ?? "",
    hsCode: form?.hsCode ?? "",
    weight: form?.weight ?? "",
  });
  const [rows, setRows] = React.useState<EditRow[]>(
    stockShape.colors.map((c) => ({
      name: c.name,
      hex: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c.hex) ? c.hex : "#CBD1DC",
      cells: sizes.map((_, i) => c.cells[i] ?? 0),
    }))
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (k: keyof typeof f, v: string | number) => setF((p) => ({ ...p, [k]: v }));
  const opts = (list: string[], cur: string) =>
    (cur && !list.includes(cur) ? [cur, ...list] : list);

  const num = (v: number | "") => (v === "" ? null : Number(v));
  const save = async () => {
    // Validate the colour matrix (unique colour names) before saving.
    const named = rows.filter((r) => r.name.trim());
    if (named.some((r, i) => named.findIndex((o) =>
        o.name.trim().toLowerCase() === r.name.trim().toLowerCase()) !== i)) {
      setError("Two colours use the same name. Please make them unique.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // 1) Product details + specs + image.
      await apiPut(`/catalog/products/${recordId}`, {
        title: f.title.trim(),
        category: f.category || null,
        season: f.season || null,
        status: f.status,
        retailPrice: num(f.retailPrice),
        wholesalePrice: num(f.wholesalePrice),
        onlinePrice: num(f.onlinePrice),
        supplierPrice: num(f.supplierPrice),
        imageUrl: f.imageUrl,
        composition: f.composition.trim() || null,
        gauge: f.gauge.trim() || null,
        care: f.care.trim() || null,
        origin: f.origin.trim() || null,
        hsCode: f.hsCode.trim() || null,
        weight: f.weight.trim() || null,
      });
      // 2) Colour × size matrix.
      await apiPut(`/catalog/products/${recordId}/matrix`, {
        colors: named.map((r) => ({
          color: r.name.trim(),
          hex: r.hex,
          cells: sizes.map((s, i) => ({ size: s, qty: Number(r.cells[i]) || 0 })),
        })),
      });
      onSaved();
    } catch {
      setError("Could not save changes. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Panel title="Edit product" sub="Update details, pricing, specifications & image">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={_PF_LBL}>Title</label>
          <input className={_PF_INPUT} value={f.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <label className={_PF_LBL}>Category</label>
          <select className={_PF_INPUT} value={f.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">—</option>
            {opts(_PF_CATEGORIES, f.category).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={_PF_LBL}>Season</label>
          <select className={_PF_INPUT} value={f.season} onChange={(e) => set("season", e.target.value)}>
            <option value="">—</option>
            {opts(_PF_SEASONS, f.season).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={_PF_LBL}>Status</label>
          <select className={_PF_INPUT} value={f.status} onChange={(e) => set("status", e.target.value)}>
            {opts(_PF_STATUSES, f.status).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={_PF_LBL}>Retail price (€)</label>
          <input type="number" min={0} step="any" className={_PF_INPUT} value={f.retailPrice}
                 onChange={(e) => set("retailPrice", e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
        <div>
          <label className={_PF_LBL}>Wholesale price (€)</label>
          <input type="number" min={0} step="any" className={_PF_INPUT} value={f.wholesalePrice}
                 onChange={(e) => set("wholesalePrice", e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
        <div>
          <label className={_PF_LBL}>Online price (€)</label>
          <input type="number" min={0} step="any" className={_PF_INPUT} value={f.onlinePrice}
                 onChange={(e) => set("onlinePrice", e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
        <div>
          <label className={_PF_LBL}>Supplier price (€)</label>
          <input type="number" min={0} step="any" className={_PF_INPUT} value={f.supplierPrice}
                 onChange={(e) => set("supplierPrice", e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
        <div className="sm:col-span-2">
          <label className={_PF_LBL}>Product image</label>
          <ImageField value={f.imageUrl} onChange={(v) => set("imageUrl", v)} />
        </div>

        <div className="sm:col-span-2 mt-1 border-t border-border/50 pt-3 text-[12px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          Specifications
        </div>
        <div>
          <label className={_PF_LBL}>Composition</label>
          <input className={_PF_INPUT} value={f.composition} onChange={(e) => set("composition", e.target.value)} />
        </div>
        <div>
          <label className={_PF_LBL}>Gauge</label>
          <input className={_PF_INPUT} value={f.gauge} onChange={(e) => set("gauge", e.target.value)} />
        </div>
        <div>
          <label className={_PF_LBL}>Care</label>
          <input className={_PF_INPUT} value={f.care} onChange={(e) => set("care", e.target.value)} />
        </div>
        <div>
          <label className={_PF_LBL}>Origin</label>
          <input className={_PF_INPUT} value={f.origin} onChange={(e) => set("origin", e.target.value)} />
        </div>
        <div>
          <label className={_PF_LBL}>HS code</label>
          <input className={_PF_INPUT} value={f.hsCode} onChange={(e) => set("hsCode", e.target.value)} />
        </div>
        <div>
          <label className={_PF_LBL}>Weight</label>
          <input className={_PF_INPUT} value={f.weight} onChange={(e) => set("weight", e.target.value)} />
        </div>
      </div>
      </Panel>

      <StockMatrixEditor
        stock={stockShape}
        recordId={recordId}
        endpoint={`/catalog/products/${recordId}/matrix`}
        hideActions
        title="Colours & sizes"
        sub="Update units, rename colours, or add a colour"
        onRowsChange={setRows}
      />

      {error && (
        <div className="rounded-md bg-[#FBEAEA] p-3 text-sm font-semibold text-[#C0392B]">{error}</div>
      )}

      <div className="flex items-center justify-end gap-2.5 border-t border-border/60 pt-4">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button variant="navy" size="sm" onClick={save} disabled={saving || !f.title.trim()}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function Specs({ specs }: { specs: MetaItem[] }) {
  return (
    <div className="space-y-3">
      {specs.map((s) => (
        <div
          key={s.k}
          className="flex justify-between border-b border-border/50 pb-2.5 text-[13px]"
        >
          <span className="text-muted-foreground">{s.k}</span>
          <span className="font-semibold text-foreground">{s.v}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- stock article: color × size matrix with per-color totals ---------- */

function StockMatrix({ stock }: { stock: NonNullable<DetailModel["stock"]> }) {
  const { sizes, colors } = stock;

  if (!colors.length) {
    return (
      <Panel title="Stock by color & size">
        <div className="py-6 text-center text-muted-foreground">
          No stock recorded for this article.
        </div>
      </Panel>
    );
  }

  // Column totals across colors.
  const sizeTotals = sizes.map((_, i) =>
    colors.reduce((sum, c) => sum + (c.cells[i] ?? 0), 0)
  );
  const grand = colors.reduce((sum, c) => sum + c.total, 0);

  return (
    <Panel title="Stock by color & size" sub="Units on hand by color and size">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr>
              <th className="pb-2 text-left text-[11px] font-bold uppercase text-muted-foreground">
                Color
              </th>
              {sizes.map((s) => (
                <th
                  key={s}
                  className="px-1 pb-2 text-center text-[11px] font-bold uppercase text-muted-foreground"
                >
                  {s}
                </th>
              ))}
              <th className="pb-2 pl-3 text-right text-[11px] font-bold uppercase text-muted-foreground">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {colors.map((c) => (
              <tr key={c.name}>
                <td className="py-1.5 pr-3">
                  <span className="flex items-center gap-2 font-semibold text-foreground">
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-black/10"
                      style={{ background: c.hex }}
                    />
                    {c.name}
                  </span>
                </td>
                {c.cells.map((q, i) => {
                  const k = toneOf(q === 0 ? "red" : q < 40 ? "amber" : "neutral");
                  return (
                    <td key={i} className="px-1 py-1.5">
                      <div
                        className="rounded-lg py-2 text-center text-[13px] font-bold tabular"
                        style={{ background: k.bg, color: k.fg }}
                      >
                        {q}
                      </div>
                    </td>
                  );
                })}
                <td className="py-1.5 pl-3 text-right font-extrabold tabular text-foreground">
                  {c.total.toLocaleString()}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-border font-extrabold text-foreground">
              <td className="py-2.5 pr-3">Total</td>
              {sizeTotals.map((t, i) => (
                <td key={i} className="px-1 py-2.5 text-center tabular">
                  {t}
                </td>
              ))}
              <td className="py-2.5 pl-3 text-right tabular">
                {grand.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ---------- stock article: editable color × size grid ---------- */

interface EditRow {
  name: string;
  hex: string;
  cells: number[];
}

function StockMatrixEditor({
  stock,
  recordId,
  endpoint,
  onCancel,
  onSaved,
  hideActions,
  onRowsChange,
  title,
  sub,
}: {
  stock: NonNullable<DetailModel["stock"]>;
  recordId: string;
  /** PUT target; defaults to the inventory stock matrix. */
  endpoint?: string;
  onCancel?: () => void;
  onSaved?: () => void;
  /** Embedded mode: hide the built-in Save/Cancel footer (parent saves). */
  hideActions?: boolean;
  /** Report the current rows up so a parent can save them with its own button. */
  onRowsChange?: (rows: EditRow[]) => void;
  title?: string;
  sub?: string;
}) {
  const sizes = stock.sizes;
  const [rows, setRows] = React.useState<EditRow[]>(() =>
    stock.colors.map((c) => ({
      name: c.name,
      hex: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c.hex) ? c.hex : "#CBD1DC",
      cells: sizes.map((_, i) => c.cells[i] ?? 0),
    }))
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Keep the parent in sync when embedded (stable setter → no loop).
  React.useEffect(() => { onRowsChange?.(rows); }, [rows, onRowsChange]);

  const patch = (ri: number, next: Partial<EditRow>) =>
    setRows((rs) => rs.map((r, i) => (i === ri ? { ...r, ...next } : r)));
  const setCell = (ri: number, ci: number, val: number) =>
    setRows((rs) =>
      rs.map((r, i) =>
        i === ri
          ? { ...r, cells: r.cells.map((q, j) => (j === ci ? val : q)) }
          : r
      )
    );
  const addColor = () =>
    setRows((rs) => [...rs, { name: "", hex: "#CBD1DC", cells: sizes.map(() => 0) }]);
  const removeRow = (ri: number) => setRows((rs) => rs.filter((_, i) => i !== ri));

  const save = async () => {
    const named = rows.filter((r) => r.name.trim());
    if (named.some((r, i) => named.findIndex((o) => o.name.trim().toLowerCase() === r.name.trim().toLowerCase()) !== i)) {
      setError("Two rows use the same color name. Please make them unique.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiPut(endpoint ?? `/inventory/stock/${recordId}/matrix`, {
        colors: named.map((r) => ({
          color: r.name.trim(),
          hex: r.hex,
          cells: sizes.map((s, i) => ({ size: s, qty: Number(r.cells[i]) || 0 })),
        })),
      });
      onSaved?.();
    } catch {
      setError("Could not save changes. Please try again.");
      setSaving(false);
    }
  };

  return (
    <Panel title={title ?? "Edit stock by color & size"} sub={sub ?? "Update counts, rename colors, or add a new color"}>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr>
              <th className="pb-2 text-left text-[11px] font-bold uppercase text-muted-foreground">
                Color
              </th>
              {sizes.map((s) => (
                <th
                  key={s}
                  className="px-1 pb-2 text-center text-[11px] font-bold uppercase text-muted-foreground"
                >
                  {s}
                </th>
              ))}
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri}>
                <td className="py-1.5 pr-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      aria-label="Color swatch"
                      value={r.hex}
                      onChange={(e) => patch(ri, { hex: e.target.value })}
                      className="h-7 w-7 shrink-0 cursor-pointer rounded-full border border-border/60 bg-transparent p-0"
                    />
                    <input
                      type="text"
                      placeholder="Color name"
                      value={r.name}
                      onChange={(e) => patch(ri, { name: e.target.value })}
                      className="w-32 rounded-lg border border-border/60 px-2.5 py-1.5 font-semibold text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </td>
                {r.cells.map((q, ci) => (
                  <td key={ci} className="px-1 py-1.5">
                    <input
                      type="number"
                      min={0}
                      value={q}
                      onChange={(e) =>
                        setCell(ri, ci, Math.max(0, Math.floor(Number(e.target.value) || 0)))
                      }
                      className="w-full min-w-[52px] rounded-lg border border-border/60 py-1.5 text-center font-bold tabular outline-none focus:border-primary"
                    />
                  </td>
                ))}
                <td className="py-1.5 pl-1 text-right">
                  <button
                    type="button"
                    onClick={() => removeRow(ri)}
                    aria-label="Remove color"
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-red-600"
                  >
                    <Trash2 size={15} strokeWidth={2} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addColor}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
      >
        <Plus size={15} strokeWidth={2.5} /> Add color
      </button>

      {error && (
        <div className="mt-4 rounded-md bg-[#FBEAEA] p-3 text-sm font-semibold text-[#C0392B]">
          {error}
        </div>
      )}

      {!hideActions && (
        <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-border/60 pt-4">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button variant="navy" size="sm" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------ *
 * Tab content per detail variant. Returns an ordered list keyed by the
 * model's own `tabs` labels so the sub-tab bar always matches the data.
 * ------------------------------------------------------------------ */

type CustomerCardData = {
  name: string; kind: string; code: string; title: string; location: string;
  email: string; phone: string; address: string;
  terms: string; currency: string; taxId: string; bank: string; account: string;
};
type CustomerFormData = {
  name: string; type: string; region: string; email: string; phone: string; address: string;
  code: string; terms: string; currency: string; taxId: string; bankName: string;
  bankAccount: string; contactTitle: string;
};

function CustomerDetailsEditor({
  form, recordId, onCancel, onSaved,
}: { form: CustomerFormData; recordId: string; onCancel: () => void; onSaved: () => void }) {
  const [f, setF] = React.useState<CustomerFormData>(form);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (k: keyof CustomerFormData, v: string) => setF((p) => ({ ...p, [k]: v }));
  const save = async () => {
    if (!f.name.trim()) { setError("Name is required."); return; }
    setSaving(true); setError(null);
    try {
      await apiPut(`/sales/customers/${recordId}`, {
        name: f.name.trim(), type: f.type || "Retail", region: f.region || null,
        email: f.email || null, phone: f.phone || null, address: f.address || null,
        code: f.code || null, terms: f.terms || null, currency: f.currency || null,
        taxId: f.taxId || null, bankName: f.bankName || null,
        bankAccount: f.bankAccount || null, contactTitle: f.contactTitle || null,
      });
      onSaved();
    } catch { setError("Could not save changes. Please try again."); setSaving(false); }
  };
  const fld = (label: string, k: keyof CustomerFormData, ph?: string) => (
    <div>
      <label className={_PF_LBL}>{label}</label>
      <input className={_PF_INPUT} value={f[k]} placeholder={ph}
             onChange={(e) => set(k, e.target.value)} />
    </div>
  );
  return (
    <div className="rounded-2xl border border-border/60 p-5">
      <SectionTitle>Edit contact</SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={_PF_LBL}>Name</label>
          <input className={_PF_INPUT} value={f.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        {fld("Contact title", "contactTitle", "e.g. Procurement lead")}
        {fld("Location / region", "region")}
        {fld("Email", "email")}
        {fld("Phone", "phone")}
        <div className="sm:col-span-2">
          <label className={_PF_LBL}>Address</label>
          <input className={_PF_INPUT} value={f.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        {fld("Customer ID", "code")}
        {fld("Terms", "terms", "e.g. Net 30")}
        {fld("Currency", "currency", "e.g. SGD")}
        {fld("Tax ID", "taxId")}
        {fld("Bank", "bankName")}
        {fld("Account no.", "bankAccount")}
      </div>
      {error && <div className="mt-3 rounded-md bg-[#FBEAEA] p-3 text-sm font-semibold text-[#C0392B]">{error}</div>}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </div>
    </div>
  );
}

/** Redesigned customer contact card: header + REACH + ACCOUNT + FINANCE + actions. */
function CustomerCard({
  card, form, recordId, onSaved,
}: { card: CustomerCardData; form?: CustomerFormData; recordId?: string; onSaved?: () => void }) {
  const [editing, setEditing] = React.useState(false);
  if (editing && form && recordId) {
    return (
      <CustomerDetailsEditor
        form={form} recordId={recordId}
        onCancel={() => setEditing(false)}
        onSaved={() => { setEditing(false); onSaved?.(); }}
      />
    );
  }
  const termsLine = [card.terms, card.currency].filter(Boolean).join(" · ");
  const copyBtn = (v: string) => (
    <button type="button" aria-label="Copy" onClick={() => navigator.clipboard?.writeText(v)}
            className="rounded-md border border-border/70 p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      <Copy size={12} strokeWidth={2} />
    </button>
  );
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl text-[13px] font-bold text-white"
                style={{ background: avatarColor(card.name) }}>
            {initials(card.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[16px] font-extrabold text-foreground">{card.name}</span>
              {card.kind && <ToneBadge tone="green" dot>{card.kind}</ToneBadge>}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
              {card.title && <span>{card.title}</span>}
              {card.title && card.location && <span>·</span>}
              {card.location && (
                <span className="inline-flex items-center gap-1"><MapPin size={12} strokeWidth={2} />{card.location}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 px-5 py-4">
        <SectionTitle>Reach</SectionTitle>
        <CardRow label="Email" value={card.email} />
        <CardRow label="Phone" value={card.phone} />
        <CardRow label="Address" value={card.address} />
      </div>

      <div className="border-t border-border/60 px-5 py-4">
        <SectionTitle>Account</SectionTitle>
        <CardRow label="Customer ID" value={card.code} />
        <CardRow label="Terms" value={termsLine} />
      </div>

      <div className="border-t border-border/60 px-5 py-4">
        <SectionTitle>Finance</SectionTitle>
        <CardRow label="Tax ID">
          <span className="inline-flex items-center gap-2">{card.taxId || "—"}{card.taxId && copyBtn(card.taxId)}</span>
        </CardRow>
        <CardRow label="Bank" value={card.bank} />
        <CardRow label="Account no.">
          <span className="inline-flex items-center gap-2">{card.account || "—"}{card.account && copyBtn(card.account)}</span>
        </CardRow>
      </div>

      <div className="flex items-center gap-2 border-t border-border/60 bg-muted/30 p-4">
        <a
          href={card.email ? `mailto:${card.email}` : undefined}
          className={
            "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white transition-opacity " +
            (card.email ? "bg-brand-orange hover:opacity-90" : "pointer-events-none bg-muted-foreground/40")
          }
        >
          <Mail size={15} strokeWidth={2} /> Email customer
        </a>
        {recordId && form && (
          <button type="button" onClick={() => setEditing(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-[13px] font-bold text-foreground transition-colors hover:bg-muted">
            <Pencil size={14} strokeWidth={2} /> Edit contact
          </button>
        )}
      </div>
    </div>
  );
}

function tabContentFor(
  d: DetailModel,
  ctx: { recordId?: string; onSaved?: () => void } = {},
): Record<string, React.ReactNode> {
  /* PRODUCT — mirrors the original HTML product page (the screenshot). */
  if (d.variant === "product" && d.product) {
    const p = d.product;
    const colorTotals = p.matrix.map((c) => ({
      name: c.name,
      hex: c.hex,
      total: c.cells.reduce((sum, cell) => sum + cell.q, 0),
    }));
    const onHand = colorTotals.reduce((s, c) => s + c.total, 0);

    return {
      Overview: (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
          <Panel
            title="Variant matrix"
            sub="Available units by color and size"
          >
            <VariantMatrix product={p} />
          </Panel>
          <div className="space-y-4">
            {p.image && (
              <Panel title="Image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={d.title} className="aspect-square w-full rounded-lg border border-border/60 object-cover" />
              </Panel>
            )}
            <Panel title="Specifications">
              <Specs specs={p.specs} />
            </Panel>
          </div>
        </div>
      ),
      "Variant matrix": (
        <Panel title="Variant matrix" sub="Available units by color and size">
          <VariantMatrix product={p} />
        </Panel>
      ),
      Inventory: (
        <Panel title="Inventory" sub="Units on hand across all locations">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 text-left font-bold">Color</th>
                <th className="pb-2 text-right font-bold">On hand</th>
              </tr>
            </thead>
            <tbody>
              {colorTotals.map((c) => (
                <tr key={c.name} className="border-t border-border/50">
                  <td className="py-2.5">
                    <span className="flex items-center gap-2 font-semibold text-foreground">
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-black/10"
                        style={{ background: c.hex }}
                      />
                      {c.name}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-bold tabular text-foreground">
                    {c.total}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-border font-extrabold text-foreground">
                <td className="py-2.5">Total on hand</td>
                <td className="py-2.5 text-right tabular">{onHand}</td>
              </tr>
            </tbody>
          </table>
        </Panel>
      ),
      Pricing: (
        <Panel title="Pricing & trade" sub="Retail, wholesale & online prices and trade details">
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {[
              { k: "Retail price", v: p.prices?.retail ?? d.meta.find((m) => m.k === "Retail price")?.v ?? "—" },
              { k: "Wholesale price", v: p.prices?.wholesale ?? "—" },
              { k: "Online price", v: p.prices?.online ?? "—" },
              { k: "Supplier price", v: p.prices?.supplier ?? "—" },
              ...p.specs.filter((s) =>
                ["HS code", "Origin", "Weight", "Composition"].includes(s.k)
              ),
            ].map((s) => (
              <div
                key={s.k}
                className="flex justify-between border-b border-border/50 pb-2.5 text-[13px]"
              >
                <span className="text-muted-foreground">{s.k}</span>
                <span className="font-semibold text-foreground">{s.v}</span>
              </div>
            ))}
          </div>
        </Panel>
      ),
      Activity: (
        <Panel title="Activity">
          <Timeline
            items={[
              {
                icon: "plus-circle",
                tone: "navy",
                title: "Product created",
                time: "Catalog · this season",
                done: true,
              },
              {
                icon: "tag",
                tone: "accent",
                title: "Retail price set",
                time: d.meta.find((m) => m.k === "Retail price")?.v ?? "—",
                done: true,
              },
              {
                icon: "check-circle-2",
                tone: "green",
                title: "Published · Active",
                time: "Visible to wholesale",
                done: true,
              },
            ]}
          />
        </Panel>
      ),
    };
  }

  /* ORDER / INVOICE */
  if ((d.variant === "order" || d.variant === "invoice") && d.doc) {
    const doc = d.doc;
    const primary = (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel>
          <Lines {...doc} />
        </Panel>
        <div className="space-y-4">
          <Panel>
            <PartyCard party={doc.party} title={doc.partyTitle} />
          </Panel>
          <Panel title={doc.timelineTitle}>
            <Timeline items={doc.timeline} />
          </Panel>
        </div>
      </div>
    );
    const timelinePanel = (
      <Panel title={doc.timelineTitle}>
        <Timeline items={doc.timeline} />
      </Panel>
    );
    const linesPanel = (
      <Panel>
        <Lines {...doc} />
      </Panel>
    );
    const invoicesPanel = (
      <Panel title="Invoices" sub="Commercial invoices generated for this order">
        {doc.orderInvoices && doc.orderInvoices.length > 0 ? (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 text-left font-bold">Invoice</th>
                <th className="pb-2 text-left font-bold">Type</th>
                <th className="pb-2 text-left font-bold">Date</th>
                <th className="pb-2 text-right font-bold">Total</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {doc.orderInvoices.map((inv) => (
                <tr key={inv.publicId} className="border-t border-border/50">
                  <td className="py-2.5 font-bold text-foreground">{inv.invoiceNo}</td>
                  <td className="py-2.5">{inv.invoiceType}</td>
                  <td className="py-2.5 text-muted-foreground">{inv.createdAt}</td>
                  <td className="py-2.5 text-right tabular font-semibold text-foreground">{inv.total}</td>
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
      </Panel>
    );
    const map: Record<string, React.ReactNode> = {};
    d.tabs.forEach((t, i) => {
      if (i === 0) map[t] = primary;
      else if (/invoice/i.test(t)) map[t] = invoicesPanel;
      else if (/item|line/i.test(t)) map[t] = linesPanel;
      else if (/fulfill|payment|activity/i.test(t)) map[t] = timelinePanel;
      else map[t] = primary;
    });
    return map;
  }

  /* JOURNAL */
  if (d.variant === "journal" && d.journal) {
    const j = d.journal;
    const ledger = (
      <Panel title="Ledger lines">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted-foreground">
              <th className="pb-2 text-left font-bold">Account</th>
              <th className="pb-2 text-right font-bold">Debit</th>
              <th className="pb-2 text-right font-bold">Credit</th>
            </tr>
          </thead>
          <tbody>
            {j.ledger.map((l, i) => (
              <tr key={i} className="border-t border-border/50">
                <td className="py-2.5">
                  <div className="font-semibold text-foreground">{l.acct}</div>
                  <div className="text-xs text-muted-foreground">{l.desc}</div>
                </td>
                <td className="py-2.5 text-right tabular">{l.debit}</td>
                <td className="py-2.5 text-right tabular">{l.credit}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-border font-extrabold text-foreground">
              <td className="py-2.5">Totals</td>
              <td className="py-2.5 text-right tabular">{j.ledgerDebit}</td>
              <td className="py-2.5 text-right tabular">{j.ledgerCredit}</td>
            </tr>
          </tbody>
        </table>
      </Panel>
    );
    const source = (
      <Panel title="Source">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {j.sourceNote}
        </p>
      </Panel>
    );
    const map: Record<string, React.ReactNode> = {};
    d.tabs.forEach((t, i) => {
      map[t] = i === 0 ? ledger : /source/i.test(t) ? source : ledger;
    });
    return map;
  }

  /* RECEIPT */
  if (d.variant === "receipt" && d.receipt) {
    const r = d.receipt;
    const node = (
      <Panel title="Received lines">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted-foreground">
              <th className="pb-2 text-left font-bold">Component</th>
              <th className="pb-2 text-right font-bold">Ordered</th>
              <th className="pb-2 text-right font-bold">Received</th>
              <th className="pb-2 text-right font-bold">Open</th>
              <th className="pb-2 text-right font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {r.lines.map((l, i) => (
              <tr key={i} className="border-t border-border/50">
                <td className="py-2.5">
                  <div className="font-semibold text-foreground">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{l.sku}</div>
                </td>
                <td className="py-2.5 text-right tabular">{l.ordered}</td>
                <td className="py-2.5 text-right tabular">{l.received}</td>
                <td className="py-2.5 text-right tabular">{l.outstanding}</td>
                <td className="py-2.5 text-right">
                  <ToneBadge tone={l.tone} dot={false}>
                    {l.badge}
                  </ToneBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
          {r.note}
        </p>
      </Panel>
    );
    const map: Record<string, React.ReactNode> = {};
    d.tabs.forEach((t) => (map[t] = node));
    return map;
  }

  /* ENTITY (supplier / customer) */
  if (d.variant === "entity" && d.entity) {
    const e = d.entity;
    const scorecard = (
      <Panel title={e.scorecardTitle}>
        <div className="grid grid-cols-2 gap-3">
          {e.scorecard.map((s) => {
            const k = toneOf(s.tone);
            return (
              <div
                key={s.label}
                className="rounded-xl p-4"
                style={{ background: k.bg }}
              >
                <div className="text-[22px] font-extrabold" style={{ color: k.fg }}>
                  {s.value}
                </div>
                <div className="text-[13px] font-semibold text-foreground">
                  {s.label}
                </div>
                <div className="text-xs text-muted-foreground">{s.sub}</div>
              </div>
            );
          })}
        </div>
      </Panel>
    );
    const related = (
      <Panel title={e.relatedTitle}>
        <div className="space-y-2">
          {e.related.map((r) => (
            <div
              key={r.a}
              className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3"
            >
              <div>
                <div className="font-bold tabular text-foreground">{r.a}</div>
                <div className="text-[13px] text-muted-foreground">{r.b}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold tabular text-foreground">{r.c}</span>
                <ToneBadge tone={r.tone} dot={false}>
                  {r.s}
                </ToneBadge>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    );
    const overview = (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {scorecard}
          {related}
        </div>
        {e.customerCard ? (
          <CustomerCard
            card={e.customerCard}
            form={e.customerForm}
            recordId={ctx.recordId}
            onSaved={ctx.onSaved}
          />
        ) : e.supplierCard ? (
          <SupplierCard
            card={e.supplierCard}
            form={e.supplierForm}
            recordId={ctx.recordId}
            onSaved={ctx.onSaved}
          />
        ) : (
          <Panel>
            <PartyCard party={e.contact} title={e.contactTitle ?? "Contact"} />
          </Panel>
        )}
      </div>
    );
    const activity = (
      <Panel title="Activity">
        <Timeline items={e.timeline} />
      </Panel>
    );
    const map: Record<string, React.ReactNode> = {};
    d.tabs.forEach((t, i) => {
      if (i === 0) map[t] = overview;
      else if (/activity/i.test(t)) map[t] = activity;
      else if (/scorecard/i.test(t)) map[t] = scorecard;
      else map[t] = related;
    });
    return map;
  }

  /* AI REPORT */
  if (d.variant === "report" && d.report) {
    const rp = d.report;
    const summary = (
      <Panel>
        <p className="text-[15px] leading-relaxed text-foreground">{rp.lede}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {rp.figures.map((f) => (
            <div key={f.label} className="rounded-xl bg-muted/60 p-3">
              <div className="text-lg font-extrabold text-foreground">{f.value}</div>
              <div className="text-[12px] font-semibold text-foreground">{f.label}</div>
              <div className="text-xs text-muted-foreground">{f.sub}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-5">
          {rp.sections.map((s) => (
            <div key={s.heading}>
              <SectionTitle>{s.heading}</SectionTitle>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </Panel>
    );
    const figures = (
      <Panel title="Figures">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {rp.figures.map((f) => (
            <div key={f.label} className="rounded-xl bg-muted/60 p-3">
              <div className="text-lg font-extrabold text-foreground">{f.value}</div>
              <div className="text-[12px] font-semibold text-foreground">{f.label}</div>
              <div className="text-xs text-muted-foreground">{f.sub}</div>
            </div>
          ))}
        </div>
      </Panel>
    );
    const map: Record<string, React.ReactNode> = {};
    d.tabs.forEach((t, i) => {
      map[t] = i === 0 ? summary : /figure/i.test(t) ? figures : summary;
    });
    return map;
  }

  /* PRODUCTION ORDER — Materials + Timeline */
  if (d.variant === "productionorder" && d.porder) {
    const p = d.porder;
    const materials = (
      <Panel title="Bill of materials" sub="Components used for this style">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 text-left font-bold">Component</th>
              <th className="pb-2 text-left font-bold">Material</th>
              <th className="pb-2 text-right font-bold">Qty / unit</th>
              <th className="pb-2 text-right font-bold">Cost</th>
            </tr>
          </thead>
          <tbody>
            {p.materials.map((m, i) => (
              <tr key={i} className="border-t border-border/50">
                <td className="py-2.5 font-semibold text-foreground">{m.component}</td>
                <td className="py-2.5">{m.material}</td>
                <td className="py-2.5 text-right tabular">{m.qty}</td>
                <td className="py-2.5 text-right font-bold tabular text-foreground">{m.cost}</td>
              </tr>
            ))}
            {p.materials.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-muted-foreground">
                  No materials linked to this style.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    );
    const timelinePanel = (
      <Panel title="Production timeline" sub="Stage-by-stage progress">
        <Timeline items={p.timeline} />
      </Panel>
    );
    const map: Record<string, React.ReactNode> = {};
    d.tabs.forEach((t) => (map[t] = /timeline/i.test(t) ? timelinePanel : materials));
    return map;
  }

  /* BOM LINE — orders that use this component */
  if (d.variant === "bomline" && d.bomOrders) {
    const orders = (
      <Panel title="Used in orders" sub="Production orders for this component's style">
        <div className="space-y-2">
          {d.bomOrders.map((r) => (
            <div
              key={r.a}
              className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3"
            >
              <div>
                <div className="font-bold tabular text-foreground">{r.a}</div>
                <div className="text-[13px] text-muted-foreground">{r.b}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold tabular text-foreground">{r.c}</span>
                <ToneBadge tone={r.tone} dot={false}>
                  {r.s}
                </ToneBadge>
              </div>
            </div>
          ))}
          {d.bomOrders.length === 0 && (
            <div className="py-6 text-center text-muted-foreground">
              Not used in any production order yet.
            </div>
          )}
        </div>
      </Panel>
    );
    const map: Record<string, React.ReactNode> = {};
    d.tabs.forEach((t) => (map[t] = orders));
    return map;
  }

  /* SHIPMENT — Tracking timeline + real Contents */
  if (d.variant === "shipment" && d.shipment) {
    const trackingPanel = (
      <Panel title="Tracking" sub="Delivery progress">
        <Timeline items={d.shipment.tracking} />
      </Panel>
    );
    const contentsPanel = (
      <Panel title="Contents" sub="Items in this shipment">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 text-left font-bold">Item</th>
              <th className="pb-2 text-left font-bold">SKU</th>
              <th className="pb-2 text-right font-bold">Qty</th>
            </tr>
          </thead>
          <tbody>
            {d.shipment.contents.map((c, i) => (
              <tr key={i} className="border-t border-border/50">
                <td className="py-2.5 font-semibold text-foreground">{c.name}</td>
                <td className="py-2.5 tabular text-muted-foreground">{c.sku}</td>
                <td className="py-2.5 text-right font-bold tabular text-foreground">{c.qty}</td>
              </tr>
            ))}
            {d.shipment.contents.length === 0 && (
              <tr>
                <td colSpan={3} className="py-6 text-center text-muted-foreground">
                  No line items recorded for this shipment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    );
    const map: Record<string, React.ReactNode> = {};
    d.tabs.forEach((t) => {
      map[t] = /content/i.test(t) ? contentsPanel : trackingPanel;
    });
    return map;
  }

  /* STOCK ARTICLE — colors on the left, sizes & counts on the right */
  if (d.variant === "stockarticle" && d.stock) {
    const stock = d.stock;
    const byColor = <StockMatrix stock={stock} />;
    const byLocation = (
      <Panel title="By location" sub="Units held at each location">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 text-left font-bold">Location</th>
              <th className="pb-2 text-right font-bold">On hand</th>
              <th className="pb-2 text-right font-bold">Reserved</th>
              <th className="pb-2 text-right font-bold">Available</th>
            </tr>
          </thead>
          <tbody>
            {stock.locations.map((l) => (
              <tr key={l.location} className="border-t border-border/50">
                <td className="py-2.5 font-semibold text-foreground">{l.location}</td>
                <td className="py-2.5 text-right tabular">{l.on_hand.toLocaleString()}</td>
                <td className="py-2.5 text-right tabular">{l.reserved.toLocaleString()}</td>
                <td className="py-2.5 text-right font-bold tabular text-foreground">
                  {l.available.toLocaleString()}
                </td>
              </tr>
            ))}
            {stock.locations.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-muted-foreground">
                  No location breakdown available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    );
    const map: Record<string, React.ReactNode> = {};
    d.tabs.forEach((t) => (map[t] = /location/i.test(t) ? byLocation : byColor));
    return map;
  }

  /* GENERIC (inspection / shipment) */
  const timeline = (
    <Panel title="Timeline">
      <Timeline items={d.generic?.timeline ?? []} />
    </Panel>
  );
  const map: Record<string, React.ReactNode> = {};
  d.tabs.forEach((t) => (map[t] = timeline));
  return map;
}

/* ------------------------------------------------------------------ */

export function RecordDetailPage({
  type,
  row,
  columns,
  backHref,
  backLabel,
  model,
  module,
  recordId,
  reload,
}: {
  type: string;
  row: Cell[];
  columns: ColumnDef[];
  backHref: string;
  backLabel: string;
  /** Real detail model from the backend; falls back to the mock builder. */
  model?: DetailModel;
  /** Owning module — enables the real Documents (attachments) panel. */
  module?: string;
  /** Backend public id of this record — enables in-place editing. */
  recordId?: string;
  /** Re-fetch this record's data client-side (after an in-place save). */
  reload?: () => void;
}) {
  const router = useRouter();
  // Re-fetch the record's data on the client; router.refresh() alone can't
  // re-run this client page's useEffect fetch.
  const afterSave = () => { setEditing(false); reload?.(); router.refresh(); };
  const [editing, setEditing] = React.useState(false);
  const d = model ?? buildDetail(type, row, columns);
  const content: Record<string, React.ReactNode> = {
    ...tabContentFor(d, { recordId, onSaved: afterSave }),
  };
  const tabs = d.tabs.length ? d.tabs : ["Overview"];

  // The stock article grid is editable in place via the header Edit button.
  const canEditStock = d.variant === "stockarticle" && !!d.stock && !!recordId;
  // The catalog product's variant matrix is editable the same way.
  const canEditProduct = d.variant === "product" && !!d.product && !!recordId;
  const canEdit = canEditStock || canEditProduct;

  if (canEditStock && editing) {
    content["Colors & sizes"] = (
      <StockMatrixEditor
        stock={d.stock!}
        recordId={recordId!}
        onCancel={() => setEditing(false)}
        onSaved={afterSave}
      />
    );
  }

  if (canEditProduct && editing) {
    const p = d.product!;
    // One combined editor: details + specs + image + colour/size matrix, saved
    // together by a single "Save changes" button.
    const editor = (
      <ProductDetailsEditor
        product={p}
        recordId={recordId!}
        onCancel={() => setEditing(false)}
        onSaved={afterSave}
      />
    );
    content["Overview"] = editor;
    content["Variant matrix"] = editor;
  }

  // Attachment tabs (Documents / Defects / Photos) become upload panels, each
  // its own list scoped to this record via a distinct entity ref.
  if (module) {
    for (const t of tabs) {
      let bucket: string | null = null;
      if (/^documents?$/i.test(t)) bucket = "";
      else if (/^defects?$/i.test(t)) bucket = ":defects";
      else if (/^photos?$/i.test(t)) bucket = ":photos";
      if (bucket !== null) {
        content[t] = (
          <Panel>
            <DocumentsPanel
              module={module}
              entityRef={`${d.ref}${bucket}`}
              entityType={`${d.variant}${bucket}`}
            />
          </Panel>
        );
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1180px]">
      {/* Back */}
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} strokeWidth={2} /> Back to {backLabel}
      </Link>

      {/* Header card */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9499A6]">
              {d.ref}
            </div>
            <div className="mt-1 flex items-center gap-3">
              <h1 className="text-[26px] font-extrabold tracking-tight text-foreground">
                {d.title}
              </h1>
              <ToneBadge tone={d.statusTone}>{d.statusLabel}</ToneBadge>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Supplier/customer (entity) pages manage actions on the details
                card itself, so the generic Print/Edit header buttons are hidden. */}
            {d.variant === "entity" || (canEdit && editing) ? null : (
              <>
                <Button variant="outline" size="sm">
                  <Printer size={15} strokeWidth={2} /> Print
                </Button>
                <Button
                  variant="navy"
                  size="sm"
                  onClick={canEdit ? () => setEditing(true) : undefined}
                >
                  <Pencil size={15} strokeWidth={2} /> Edit
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Meta tiles */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {d.meta.map((m) => (
            <div
              key={m.k}
              className="rounded-[12px] border border-border/70 bg-muted/40 px-4 py-3.5"
            >
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                {m.k}
              </div>
              <div className="mt-1 text-[18px] font-extrabold text-foreground">
                {m.v}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Sub-tabs */}
      <Tabs defaultValue={tabs[0]} className="mt-5">
        <TabsList className="mb-5 w-full justify-start gap-0 border-b border-border/70">
          {tabs.map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="mr-1 rounded-none border-b-2 border-transparent bg-transparent px-3.5 pb-3 pt-0 text-[14px] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground"
            >
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((t) => (
          <TabsContent key={t} value={t}>
            {content[t] ?? content[tabs[0]]}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
