"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer, Pencil, Plus, Trash2, Mail, Copy, MapPin } from "lucide-react";
import { Icon } from "@/components/icon";
import { ToneBadge } from "@/components/tone-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { avatarColor, initials, tone as toneOf } from "@/lib/tone";
import { DocumentsPanel } from "@/components/screens/documents-panel";
import { ImageField } from "@/components/screens/auto-form";
import { apiGet, apiPut, apiPost, apiDelete, apiUpload, apiUrl, USE_BACKEND } from "@/lib/api-client";
import { zeroToBlank } from "@/lib/number-input";
import { useModuleAccess } from "@/lib/module-access";
import { fieldFormatError } from "@/lib/validators";
import type { Cell, ColumnDef } from "@/lib/screen-types";
import {
  buildDetail,
  type DetailModel,
  type InspectionItem,
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
  email: string; phone: string; contactId: string; vat: string;
  bankName: string; bankAccountTitle: string; bankAccountNumber: string;
  bankSwift: string; bankIban: string;
};
type SupplierFormData = {
  name: string; region: string; leadTime: string; category: string;
  email: string; phone: string; address: string; contactPerson: string;
  vatNumber: string; bankName: string; bankAccountTitle: string;
  bankAccountNumber: string; bankSwift: string; bankIban: string;
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
    const bad = fieldFormatError("email", f.email) || fieldFormatError("phone", f.phone);
    if (bad) { setError(bad); return; }
    setSaving(true); setError(null);
    try {
      await apiPut(`/procurement/suppliers/${recordId}`, {
        name: f.name.trim(), region: f.region || null, leadTime: f.leadTime || null,
        category: f.category || null, email: f.email || null, phone: f.phone || null,
        address: f.address || null, contactPerson: f.contactPerson || null,
        vatNumber: f.vatNumber || null,
        bankName: f.bankName || null, bankAccountTitle: f.bankAccountTitle || null,
        bankAccountNumber: f.bankAccountNumber || null, bankSwift: f.bankSwift || null,
        bankIban: f.bankIban || null,
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
        <div className="sm:col-span-2 mt-1 border-t border-border/50 pt-3 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          Bank details
        </div>
        <div>
          <label className={_PF_LBL}>Bank name</label>
          <input className={_PF_INPUT} value={f.bankName} placeholder="e.g. Meezan Bank Ltd."
                 onChange={(e) => set("bankName", e.target.value)} />
        </div>
        <div>
          <label className={_PF_LBL}>Account title</label>
          <input className={_PF_INPUT} value={f.bankAccountTitle} placeholder="e.g. Lahore Textile Co."
                 onChange={(e) => set("bankAccountTitle", e.target.value)} />
        </div>
        <div>
          <label className={_PF_LBL}>Account number</label>
          <input className={`${_PF_INPUT} font-mono`} value={f.bankAccountNumber}
                 onChange={(e) => set("bankAccountNumber", e.target.value)} />
        </div>
        <div>
          <label className={_PF_LBL}>SWIFT / BIC</label>
          <input className={`${_PF_INPUT} font-mono`} value={f.bankSwift} placeholder="MEZNPKKA"
                 onChange={(e) => set("bankSwift", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={_PF_LBL}>IBAN</label>
          <input className={`${_PF_INPUT} font-mono`} value={f.bankIban}
                 placeholder="PK00 MEZN 0000 0000 0000 0000"
                 onChange={(e) => set("bankIban", e.target.value)} />
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
  card, form, recordId, onSaved, canWrite = true, writeReason,
}: {
  card: SupplierCardData; form?: SupplierFormData; recordId?: string; onSaved?: () => void;
  canWrite?: boolean; writeReason?: string | null;
}) {
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
        <CardRow label="Bank" value={card.bankName} />
        <CardRow label="Acct title" value={card.bankAccountTitle} />
        <CardRow label="Account" value={card.bankAccountNumber} />
        <CardRow label="SWIFT" value={card.bankSwift} />
        <CardRow label="IBAN" value={card.bankIban} />
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
          <button type="button" onClick={canWrite ? () => setEditing(true) : undefined}
                  disabled={!canWrite} title={!canWrite ? writeReason ?? undefined : undefined}
                  className={"inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-[13px] font-bold text-foreground transition-colors hover:bg-muted" +
                    (!canWrite ? " cursor-not-allowed opacity-50 hover:bg-transparent" : "")}>
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
// Fallback shown only until the live category list (GET /catalog/categories)
// loads — the real options always come from there, so a category created
// moments ago (in the Categories tab) is selectable immediately here too.
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
    fabric: form?.fabric ?? "",
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
  const { data: categoryNames } = useQuery({
    queryKey: ["catalog", "category-names"],
    queryFn: () => apiGet<string[]>("/catalog/categories"),
    enabled: USE_BACKEND,
  });
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
        fabric: f.fabric.trim() || null,
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
            {opts(categoryNames ?? _PF_CATEGORIES, f.category).map((c) => <option key={c} value={c}>{c}</option>)}
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
          <input type="number" min={0} step="any" placeholder="0" className={_PF_INPUT} value={zeroToBlank(f.retailPrice)}
                 onChange={(e) => set("retailPrice", e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
        <div>
          <label className={_PF_LBL}>Wholesale price (€)</label>
          <input type="number" min={0} step="any" placeholder="0" className={_PF_INPUT} value={zeroToBlank(f.wholesalePrice)}
                 onChange={(e) => set("wholesalePrice", e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
        <div>
          <label className={_PF_LBL}>Online price (€)</label>
          <input type="number" min={0} step="any" placeholder="0" className={_PF_INPUT} value={zeroToBlank(f.onlinePrice)}
                 onChange={(e) => set("onlinePrice", e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
        <div>
          <label className={_PF_LBL}>Supplier price (€)</label>
          <input type="number" min={0} step="any" placeholder="0" className={_PF_INPUT} value={zeroToBlank(f.supplierPrice)}
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
          <label className={_PF_LBL}>Fabric</label>
          <input className={_PF_INPUT} value={f.fabric} onChange={(e) => set("fabric", e.target.value)} />
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
                      placeholder="0"
                      value={zeroToBlank(q)}
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
    const bad = fieldFormatError("email", f.email) || fieldFormatError("phone", f.phone);
    if (bad) { setError(bad); return; }
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
  card, form, recordId, onSaved, canWrite = true, writeReason,
}: {
  card: CustomerCardData; form?: CustomerFormData; recordId?: string; onSaved?: () => void;
  canWrite?: boolean; writeReason?: string | null;
}) {
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
          <button type="button" onClick={canWrite ? () => setEditing(true) : undefined}
                  disabled={!canWrite} title={!canWrite ? writeReason ?? undefined : undefined}
                  className={"inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-[13px] font-bold text-foreground transition-colors hover:bg-muted" +
                    (!canWrite ? " cursor-not-allowed opacity-50 hover:bg-transparent" : "")}>
            <Pencil size={14} strokeWidth={2} /> Edit contact
          </button>
        )}
      </div>
    </div>
  );
}

/** Quality inspection workspace: progress stepper + AQL sampling + summary +
 *  history, plus the Start action. Read-mostly in Phase 1; checklist/defects
 *  editing and decision buttons land in later phases. */
function InspectionWorkspace({
  data, recordId, onSaved, canWrite,
}: {
  data: InspectionItem;
  recordId?: string;
  onSaved?: () => void;
  canWrite?: boolean;
}) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [editingHdr, setEditingHdr] = React.useState(false);
  const h = data.header;
  const aql = data.aql;
  const s = data.summary;
  const passed = aql.accepted;
  const inProgress = data.canDecide;

  const run = async (fn: () => Promise<unknown>) => {
    if (!recordId) return;
    setBusy(true); setErr(null);
    try { await fn(); onSaved?.(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  };
  const start = () => run(() => apiPost(`/quality/inspections/${recordId}/start`, {}));

  // Defect Types catalog for the "Add defect" dropdown.
  const { data: defOpts } = useQuery({
    queryKey: ["quality", "defect-options"],
    queryFn: () => apiGet<{ options: { publicId: string; name: string; category: string; severity: string }[] }>("/quality/defect-options"),
    enabled: USE_BACKEND && inProgress,
  });
  const options = defOpts?.options ?? [];

  // Local "add" forms.
  const [chk, setChk] = React.useState({ criterion: "", requirement: "" });
  const [def, setDef] = React.useState<{ defectTypeId: string; qtyAffected: number; description: string; imageDocId: string }>(
    { defectTypeId: "", qtyAffected: 1, description: "", imageDocId: "" });
  const [defImgName, setDefImgName] = React.useState("");
  const [uploading, setUploading] = React.useState(false);

  const uploadDefectImage = async (file: File) => {
    setUploading(true); setErr(null);
    try {
      const form = new FormData();
      form.append("module", "quality");
      form.append("entity_type", "inspection:defect");
      form.append("file", file);
      const r = await apiUpload<{ public_id: string }>("/documents/upload", form);
      setDef((d) => ({ ...d, imageDocId: r.public_id }));
      setDefImgName(file.name);
    } catch { setErr("Could not upload the image."); }
    finally { setUploading(false); }
  };

  const saveCheck = (publicId: string, patch: Partial<{ result: string; actual: string; notes: string }>) => {
    const c = data.checks.find((x) => x.publicId === publicId);
    if (!c) return;
    run(() => apiPut(`/quality/checks/${publicId}`, {
      criterion: c.criterion, requirement: c.requirement,
      targetValue: c.targetValue, tolerance: c.tolerance,
      actual: patch.actual ?? c.actual, result: patch.result ?? c.result,
      notes: patch.notes ?? c.notes,
    }));
  };
  const addCheck = () => {
    if (!chk.criterion.trim()) return;
    run(() => apiPost(`/quality/inspections/${recordId}/checks`, { ...chk, result: "Pending" }))
      .then(() => setChk({ criterion: "", requirement: "" }));
  };
  const delCheck = (id: string) => run(() => apiDelete(`/quality/checks/${id}`));
  const addDefect = () => {
    if (!def.defectTypeId) return;
    run(() => apiPost(`/quality/inspections/${recordId}/defects`, def))
      .then(() => { setDef({ defectTypeId: "", qtyAffected: 1, description: "", imageDocId: "" }); setDefImgName(""); });
  };
  const delDefect = (id: string) => run(() => apiDelete(`/quality/defects/log/${id}`));
  const complete = () => run(() => apiPost(`/quality/inspections/${recordId}/complete`, {}));

  const CHK_TONE: Record<string, string> = {
    Pass: "text-[#1F9254]", Fail: "text-[#C0392B]", Warning: "text-[#B5691B]",
    NA: "text-muted-foreground", Pending: "text-muted-foreground",
  };

  // Disposition (failed inspections) + re-inspection.
  const [dispo, setDispo] = React.useState({
    disposition: data.disposition ?? "", assignedTo: data.assignedTo ?? "",
    dueDate: data.dueDate ?? "", notes: data.dispositionNotes ?? "",
  });
  const [reMsg, setReMsg] = React.useState<string | null>(null);
  const saveDispo = () => {
    if (!dispo.disposition) { setErr("Select a disposition."); return; }
    run(() => apiPost(`/quality/inspections/${recordId}/disposition`, dispo));
  };
  const reinspect = async () => {
    if (!recordId) return;
    setBusy(true); setErr(null);
    try {
      const r = await apiPost<{ inspection_no: string }>(`/quality/inspections/${recordId}/reinspect`, {});
      setReMsg(`Re-inspection ${r.inspection_no} created — open it from the inspection list or history below.`);
      onSaved?.();
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not create re-inspection."); }
    finally { setBusy(false); }
  };

  const kv = (k: string, v: React.ReactNode) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{k}</span>
      <span className="text-[13px] font-semibold text-foreground">{v}</span>
    </div>
  );

  if (editingHdr) {
    return (
      <InlineFieldEditor
        title={`Edit ${data.item}`}
        sub="Changing AQL recomputes the sample plan; setting a sample size overrides it."
        endpoint={`/quality/inspections/${recordId}`}
        initial={{ inspector: data.editForm.inspector, batchLot: data.editForm.batchLot,
          inspectionType: data.editForm.inspectionType, aql: data.editForm.aql, sampleSize: data.editForm.sampleSize }}
        fields={[
          { name: "inspector", label: "Inspector" },
          { name: "batchLot", label: "Batch / Lot" },
          { name: "inspectionType", label: "Inspection type", type: "select", options: data.typeOptions },
          { name: "aql", label: "AQL level", type: "select", options: data.aqlOptions },
          { name: "sampleSize", label: "Sample size" },
        ]}
        onCancel={() => setEditingHdr(false)}
        onSaved={() => { setEditingHdr(false); onSaved?.(); }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Item header bar with Edit */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
          <span className="font-bold text-foreground">{h.inspectionNo}</span>
          <span>·</span><span>{data.item}</span>
          <span>·</span><span>{h.stage}</span>
          <ToneBadge tone={/pass/i.test(h.result) ? "green" : /fail/i.test(h.result) ? "red" : /progress/i.test(h.result) ? "navy" : "neutral"} dot={false}>{h.result}</ToneBadge>
        </div>
        <Button size="sm" variant="outline" disabled={!canWrite} onClick={() => setEditingHdr(true)}>
          <Pencil size={13} strokeWidth={2} /> Edit
        </Button>
      </div>

      {/* Progress stepper */}
      <Panel title="Inspection progress">
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
          {data.progress.map((p, i) => (
            <React.Fragment key={p.key}>
              <span className={
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold " +
                (p.current ? "bg-brand-orange text-white"
                  : p.done ? "bg-[#E7F4EC] text-[#1F9254]" : "bg-muted text-muted-foreground")
              }>
                <span className={"flex h-4 w-4 items-center justify-center rounded-full text-[10px] " +
                  (p.done ? "bg-[#1F9254] text-white" : p.current ? "bg-white/25 text-white" : "bg-border text-muted-foreground")}>
                  {p.done ? "✓" : i + 1}
                </span>
                {p.label}
              </span>
              {i < data.progress.length - 1 && <span className="text-muted-foreground">›</span>}
            </React.Fragment>
          ))}
        </div>
      </Panel>

      {/* Production / batch information */}
      <Panel title="Production & batch">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {kv("Order", h.order)}
          {kv("Product", h.product)}
          {kv("SKU", h.sku)}
          {kv("Batch / Lot", h.batchLot)}
          {kv("Stage", h.stage)}
          {kv("Inspection type", h.inspectionType)}
          {kv("Inspector", h.inspector)}
          {kv("Date", h.date ? new Date(h.date).toLocaleDateString() : "—")}
        </div>
      </Panel>

      {/* AQL sampling */}
      <Panel title="AQL sampling" sub={aql.codeLetter ? `Code letter ${aql.codeLetter} · General Level II` : undefined}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { k: "Production qty", v: aql.lotQty || "—" },
            { k: "AQL level", v: aql.aql },
            { k: "Sample size", v: aql.sampleSize },
            { k: "Max defects", v: aql.maxDefects },
            { k: "Actual defects", v: aql.actualDefects },
            { k: "AQL result", v: passed ? "Within limit" : "Exceeded" },
          ].map((c) => (
            <div key={c.k} className={"rounded-xl border px-3 py-2.5 " +
              (c.k === "AQL result"
                ? (passed ? "border-[#BfE6CE] bg-[#E7F4EC]" : "border-[#F3C9C4] bg-[#FBEAEA]")
                : "border-border/60 bg-muted/30")}>
              <div className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-muted-foreground">{c.k}</div>
              <div className={"mt-1 text-[15px] font-extrabold tabular " +
                (c.k === "AQL result" ? (passed ? "text-[#1F9254]" : "text-[#C0392B]") : "text-foreground")}>
                {c.v}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Quality summary */}
      <Panel title="Quality summary">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-[13px]">
            <span>Sampled: <b className="tabular">{s.sampled}</b></span>
            <span>Defects: <b className="tabular">{s.defects}</b></span>
            <span>Defect rate: <b className="tabular">{s.defectRate}%</b></span>
            <span>Max allowed: <b className="tabular">{s.maxDefects}</b></span>
          </div>
          <ToneBadge tone={/pass/i.test(s.evaluation) ? "green" : /fail/i.test(s.evaluation) ? "red" : "neutral"} dot={false}>
            {s.evaluation}
          </ToneBadge>
        </div>
        {data.shipmentRef && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#E7F4EC] px-4 py-2.5 text-[13px] font-semibold text-[#1F9254]">
            ✓ Shipment created · {data.shipmentRef}
          </div>
        )}
      </Panel>

      {/* Checklist */}
      <Panel title="Checklist" sub="Each criterion must resolve (no Pending) before completion. Numeric target ± tolerance auto-scores.">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 text-left font-bold">Criterion</th>
              <th className="pb-2 text-left font-bold">Requirement</th>
              <th className="pb-2 text-left font-bold">Actual</th>
              <th className="pb-2 text-left font-bold">Result</th>
              {inProgress && <th className="pb-2"></th>}
            </tr>
          </thead>
          <tbody>
            {data.checks.map((c) => (
              <tr key={c.publicId} className="border-t border-border/50 align-top">
                <td className="py-2 pr-2 font-semibold text-foreground">{c.criterion}</td>
                <td className="py-2 pr-2 text-muted-foreground">
                  {c.requirement || (c.targetValue != null ? `${c.targetValue} ± ${c.tolerance ?? 0}` : "—")}
                </td>
                <td className="py-2 pr-2">
                  {inProgress ? (
                    <input defaultValue={c.actual} placeholder="—"
                      onBlur={(e) => e.target.value !== c.actual && saveCheck(c.publicId, { actual: e.target.value })}
                      className="w-24 rounded-md border border-border/70 bg-transparent px-2 py-1 text-[12px] outline-none" />
                  ) : (c.actual || "—")}
                </td>
                <td className="py-2 pr-2">
                  {inProgress ? (
                    <select value={c.result} onChange={(e) => saveCheck(c.publicId, { result: e.target.value })}
                      className={"rounded-md border border-border/70 bg-transparent px-2 py-1 text-[12px] font-bold outline-none " + (CHK_TONE[c.result] ?? "")}>
                      {["Pending", "Pass", "Fail", "Warning", "NA"].map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : <span className={"font-bold " + (CHK_TONE[c.result] ?? "")}>{c.result}</span>}
                </td>
                {inProgress && (
                  <td className="py-2 text-right">
                    <button onClick={() => delCheck(c.publicId)} disabled={busy}
                      className="text-muted-foreground hover:text-[#C0392B]"><Trash2 size={14} /></button>
                  </td>
                )}
              </tr>
            ))}
            {data.checks.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No checklist items yet.</td></tr>
            )}
          </tbody>
        </table>
        {inProgress && (
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <input value={chk.criterion} onChange={(e) => setChk({ ...chk, criterion: e.target.value })}
              placeholder="New criterion" className="rounded-md border border-border/70 bg-transparent px-2 py-1.5 text-[12px] outline-none" />
            <input value={chk.requirement} onChange={(e) => setChk({ ...chk, requirement: e.target.value })}
              placeholder="Requirement / spec" className="flex-1 rounded-md border border-border/70 bg-transparent px-2 py-1.5 text-[12px] outline-none" />
            <Button size="sm" variant="outline" onClick={addCheck} disabled={busy || !chk.criterion.trim()}>
              <Plus size={14} /> Add check
            </Button>
          </div>
        )}
      </Panel>

      {/* Defects */}
      <Panel title="Defects" sub="Logged from the Defect Types catalog; category & severity auto-fill. Attach a photo per defect.">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 text-left font-bold">Ref</th>
              <th className="pb-2 text-left font-bold">Defect</th>
              <th className="pb-2 text-left font-bold">Severity</th>
              <th className="pb-2 text-center font-bold">Qty</th>
              <th className="pb-2 text-left font-bold">Photo</th>
              {inProgress && <th className="pb-2"></th>}
            </tr>
          </thead>
          <tbody>
            {data.defects.map((d) => (
              <tr key={d.publicId} className="border-t border-border/50">
                <td className="py-2 font-bold text-foreground">{d.defectNo}</td>
                <td className="py-2">{d.name}<span className="ml-1 text-[11px] text-muted-foreground">({d.category})</span>
                  {d.description && <div className="text-[11px] text-muted-foreground">{d.description}</div>}
                </td>
                <td className="py-2"><ToneBadge tone={/crit/i.test(d.severity) ? "red" : /major/i.test(d.severity) ? "red" : "amber"} dot={false}>{d.severity}</ToneBadge></td>
                <td className="py-2 text-center tabular">{d.qtyAffected}</td>
                <td className="py-2">
                  {d.imageDocId ? (
                    <a href={apiUrl(`/documents/${d.imageDocId}/download`)} target="_blank" rel="noreferrer">
                      <img src={apiUrl(`/documents/${d.imageDocId}/download`)} alt="defect"
                        className="h-10 w-10 rounded-md border border-border/60 object-cover" />
                    </a>
                  ) : <span className="text-muted-foreground">—</span>}
                </td>
                {inProgress && (
                  <td className="py-2 text-right">
                    <button onClick={() => delDefect(d.publicId)} disabled={busy}
                      className="text-muted-foreground hover:text-[#C0392B]"><Trash2 size={14} /></button>
                  </td>
                )}
              </tr>
            ))}
            {data.defects.length === 0 && (
              <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">No defects logged.</td></tr>
            )}
          </tbody>
        </table>
        {inProgress && (
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <select value={def.defectTypeId} onChange={(e) => setDef({ ...def, defectTypeId: e.target.value })}
              className="rounded-md border border-border/70 bg-transparent px-2 py-1.5 text-[12px] outline-none">
              <option value="">Select defect type…</option>
              {options.map((o) => <option key={o.publicId} value={o.publicId}>{o.name} · {o.severity}</option>)}
            </select>
            <input type="number" min={1} value={def.qtyAffected}
              onChange={(e) => setDef({ ...def, qtyAffected: Math.max(1, Number(e.target.value) || 1) })}
              className="w-16 rounded-md border border-border/70 bg-transparent px-2 py-1.5 text-[12px] outline-none" />
            <input value={def.description} onChange={(e) => setDef({ ...def, description: e.target.value })}
              placeholder="Description" className="flex-1 rounded-md border border-border/70 bg-transparent px-2 py-1.5 text-[12px] outline-none" />
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border/70 px-2.5 py-1.5 text-[12px] font-semibold text-foreground hover:bg-muted">
              {uploading ? "Uploading…" : def.imageDocId ? "✓ Photo" : "Add photo"}
              <input type="file" accept="image/*" className="hidden" disabled={uploading}
                onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadDefectImage(file); e.target.value = ""; }} />
            </label>
            <Button size="sm" variant="outline" onClick={addDefect} disabled={busy || uploading || !def.defectTypeId}>
              <Plus size={14} /> Add defect
            </Button>
            {def.imageDocId && <span className="text-[11px] text-muted-foreground">{defImgName}</span>}
          </div>
        )}
      </Panel>

      {err && <div className="rounded-md bg-[#FBEAEA] p-3 text-[13px] font-semibold text-[#C0392B]">{err}</div>}

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        {data.canStart && (
          <Button size="sm" disabled={busy || !canWrite} onClick={start}>
            {busy ? "Starting…" : "Start inspection"}
          </Button>
        )}
        {inProgress && (
          <Button size="sm" disabled={busy || !canWrite} onClick={complete}>
            {busy ? "Evaluating…" : "Complete inspection"}
          </Button>
        )}
        {data.canStart && (
          <span className="text-[12px] text-muted-foreground">Start moves the inspection to In Progress.</span>
        )}
        {inProgress && (
          <span className="text-[12px] text-muted-foreground">Completing auto-scores the result from the checklist + AQL.</span>
        )}
      </div>


      {/* Disposition (failed inspections) */}
      {(data.canDispose || data.disposition) && (
        <Panel title="Disposition & corrective action"
               sub={`Failure reason: ${s.evaluation}. Affected quantity: ${s.defects}.`}>
          {data.disposition && (
            <div className="mb-3 flex flex-wrap items-center gap-2 text-[13px]">
              <span className="text-muted-foreground">Current:</span>
              <ToneBadge tone="navy" dot={false}>{data.disposition}</ToneBadge>
              {data.assignedTo && <span>· Assigned to <b>{data.assignedTo}</b></span>}
              {data.dueDate && <span>· Due {new Date(data.dueDate).toLocaleDateString()}</span>}
            </div>
          )}
          {data.canDispose && (
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground">Disposition</label>
                <select value={dispo.disposition} onChange={(e) => setDispo({ ...dispo, disposition: e.target.value })}
                  className="rounded-md border border-border/70 bg-transparent px-2 py-1.5 text-[13px] outline-none">
                  <option value="">Select…</option>
                  {data.dispositionOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground">Assigned to</label>
                <input value={dispo.assignedTo} onChange={(e) => setDispo({ ...dispo, assignedTo: e.target.value })}
                  placeholder="Team / person" className="rounded-md border border-border/70 bg-transparent px-2 py-1.5 text-[13px] outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground">Due date</label>
                <input type="date" value={dispo.dueDate ?? ""} onChange={(e) => setDispo({ ...dispo, dueDate: e.target.value })}
                  className="rounded-md border border-border/70 bg-transparent px-2 py-1.5 text-[13px] outline-none" />
              </div>
              <input value={dispo.notes} onChange={(e) => setDispo({ ...dispo, notes: e.target.value })}
                placeholder="Notes" className="min-w-[160px] flex-1 rounded-md border border-border/70 bg-transparent px-2 py-1.5 text-[13px] outline-none" />
              <Button size="sm" variant="outline" disabled={busy || !canWrite} onClick={saveDispo}>Save disposition</Button>
              <Button size="sm" disabled={busy || !canWrite} onClick={reinspect}>Create re-inspection</Button>
            </div>
          )}
          {reMsg && <div className="mt-3 rounded-md bg-[#E7F4EC] p-3 text-[13px] font-semibold text-[#1F9254]">{reMsg}</div>}
        </Panel>
      )}

      {/* Inspection history */}
      <Panel title="Inspection history">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 text-left font-bold">Inspection</th>
              <th className="pb-2 text-left font-bold">Date</th>
              <th className="pb-2 text-left font-bold">Stage</th>
              <th className="pb-2 text-left font-bold">Inspector</th>
              <th className="pb-2 text-center font-bold">Defects</th>
              <th className="pb-2 text-left font-bold">Result</th>
            </tr>
          </thead>
          <tbody>
            {data.history.map((r) => (
              <tr key={r.publicId} className={"border-t border-border/50 " + (r.current ? "bg-muted/40" : "")}>
                <td className="py-2.5 font-bold text-foreground">{r.inspectionNo}{r.current ? " ·" : ""}</td>
                <td className="py-2.5 text-muted-foreground">{r.date ? new Date(r.date).toLocaleDateString() : "—"}</td>
                <td className="py-2.5 text-foreground">{r.stage}</td>
                <td className="py-2.5 text-foreground">{r.inspector}</td>
                <td className="py-2.5 text-center tabular text-foreground">{r.defects}</td>
                <td className="py-2.5"><ToneBadge tone={/pass/i.test(r.result) ? "green" : /fail/i.test(r.result) ? "red" : "neutral"} dot={false}>{r.result}</ToneBadge></td>
              </tr>
            ))}
            {data.history.length === 0 && (
              <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No inspection history for this order.</td></tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

/** Order-level shipment for a grouped inspection. Locked until EVERY item's
 *  inspection is Final and passed; creates one shipment for the whole order. */
function InspectionShipmentBar({
  data, canWrite, onDone,
}: {
  data: NonNullable<DetailModel["inspection"]>["shipment"];
  canWrite?: boolean;
  onDone?: () => void;
}) {
  const [carrier, setCarrier] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const locked = !data.allPassed;

  // Carrier type-ahead backed by the existing carriers in the Shipments module.
  const [carriers, setCarriers] = React.useState<{ name: string; service: string }[]>([]);
  const [carrierOpen, setCarrierOpen] = React.useState(false);
  const carrierTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadCarriers = React.useCallback((q: string, openAfter: boolean) => {
    if (!USE_BACKEND) return;
    if (carrierTimer.current) clearTimeout(carrierTimer.current);
    carrierTimer.current = setTimeout(async () => {
      try {
        const r = await apiGet<{ carriers: { name: string; service: string }[] }>(
          `/shipments/carriers/search?q=${encodeURIComponent(q.trim())}`);
        setCarriers(r.carriers ?? []);
        if (openAfter) setCarrierOpen((r.carriers ?? []).length > 0);
      } catch { setCarriers([]); }
    }, 150);
  }, []);
  React.useEffect(() => { loadCarriers("", false); }, [loadCarriers]);

  const create = async () => {
    if (!data.inspectionId) return;
    if (!carrier.trim() || !destination.trim()) { setErr("Enter carrier and destination."); return; }
    setBusy(true); setErr(null);
    try { await apiPost(`/quality/inspections/${data.inspectionId}/pass`, { carrier, destination }); onDone?.(); }
    catch { setErr("Could not create the shipment."); }
    finally { setBusy(false); }
  };

  // Already shipped → show the reference.
  if (data.shipmentRef) {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#BfE6CE] bg-[#E7F4EC] px-5 py-3.5 text-[13px] font-semibold text-[#1F9254]">
        ✓ Shipment created for this order · {data.shipmentRef}
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-border/60 p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[15px] font-bold text-foreground">Create shipment</div>
          <div className="text-[13px] text-muted-foreground">
            {locked
              ? `Locked — every item must be a Final-stage pass first (${data.passedCount}/${data.total} cleared).`
              : "All items cleared (Final + passed) — enter carrier & destination to ship this order."}
          </div>
        </div>
        {locked && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[12px] font-bold text-muted-foreground">
            🔒 {data.passedCount}/{data.total} cleared
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="relative">
          <input value={carrier}
            onChange={(e) => { setCarrier(e.target.value); loadCarriers(e.target.value, true); }}
            onFocus={() => { setCarrierOpen(carriers.length > 0); loadCarriers(carrier, true); }}
            onBlur={() => setTimeout(() => setCarrierOpen(false), 120)}
            placeholder="Carrier" disabled={locked} autoComplete="off"
            className="w-48 rounded-md border border-border/70 bg-transparent px-2.5 py-1.5 text-[13px] outline-none disabled:opacity-50" />
          {carrierOpen && !locked && carriers.length > 0 && (
            <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-lg">
              {carriers.map((c) => (
                <li key={c.name}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setCarrier(c.name); setCarrierOpen(false); }}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] hover:bg-muted">
                    <span className="font-semibold text-foreground">{c.name}</span>
                    {c.service && <span className="truncate text-muted-foreground">{c.service}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destination" disabled={locked}
          className="flex-1 rounded-md border border-border/70 bg-transparent px-2.5 py-1.5 text-[13px] outline-none disabled:opacity-50" />
        <Button size="sm" disabled={locked || busy || !canWrite} onClick={create}>
          {busy ? "Creating…" : "Create shipment"}
        </Button>
      </div>
      {err && <div className="mt-2 text-[12px] font-semibold text-[#C0392B]">{err}</div>}
    </div>
  );
}

type EditField = { name: string; label: string; type?: "text" | "select"; options?: string[] };

/** Generic header-field editor used by the drill-down Edit button (shipment,
 *  inspection header). PUTs the whole field set to `endpoint`. */
function InlineFieldEditor({
  title, sub, fields, initial, endpoint, onCancel, onSaved,
}: {
  title: string; sub?: string; fields: EditField[]; initial: Record<string, string>;
  endpoint: string; onCancel: () => void; onSaved: () => void;
}) {
  const [f, setF] = React.useState<Record<string, string>>(initial);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const save = async () => {
    setSaving(true); setError(null);
    try { await apiPut(endpoint, f); onSaved(); }
    catch { setError("Could not save changes. Please try again."); setSaving(false); }
  };
  return (
    <Panel title={title} sub={sub}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map((fl) => (
          <div key={fl.name}>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground">{fl.label}</label>
            {fl.type === "select" ? (
              <select value={f[fl.name] ?? ""} onChange={(e) => set(fl.name, e.target.value)}
                className="w-full rounded-md border border-border/70 bg-transparent px-2 py-1.5 text-[13px] outline-none">
                {(fl.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input value={f[fl.name] ?? ""} onChange={(e) => set(fl.name, e.target.value)}
                className="w-full rounded-md border border-border/70 bg-transparent px-2 py-1.5 text-[13px] outline-none" />
            )}
          </div>
        ))}
      </div>
      {error && <div className="mt-3 rounded-md bg-[#FBEAEA] p-3 text-[13px] font-semibold text-[#C0392B]">{error}</div>}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </div>
    </Panel>
  );
}

function tabContentFor(
  d: DetailModel,
  ctx: { recordId?: string; onSaved?: () => void; canWrite?: boolean; writeReason?: string | null } = {},
): Record<string, React.ReactNode> {
  /* INSPECTION — one workspace tab per item (production line) */
  if (d.variant === "inspection" && d.inspection) {
    const map: Record<string, React.ReactNode> = {};
    d.inspection.items.forEach((it) => {
      if (it.placeholder) {
        map[it.tabLabel] = (
          <Panel title={`${it.item} — inspection pending`}>
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="text-[15px] font-bold text-foreground">Production not completed yet</span>
              <span className="text-[13px] text-muted-foreground">
                This item is still in production. Its inspection opens automatically once its
                production finishes; the order can only ship after every item passes.
              </span>
            </div>
          </Panel>
        );
      } else {
        map[it.tabLabel] = (
          <InspectionWorkspace
            key={it.publicId}
            data={it}
            recordId={it.publicId}
            onSaved={ctx.onSaved}
            canWrite={ctx.canWrite}
          />
        );
      }
    });
    return map;
  }


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
                ["HS code", "Origin", "Weight", "Composition", "Fabric"].includes(s.k)
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
            canWrite={ctx.canWrite}
            writeReason={ctx.writeReason}
          />
        ) : e.supplierCard ? (
          <SupplierCard
            card={e.supplierCard}
            form={e.supplierForm}
            recordId={ctx.recordId}
            onSaved={ctx.onSaved}
            canWrite={ctx.canWrite}
            writeReason={ctx.writeReason}
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
  // View-only roles (core/roles.py <module>.read without .write) see every
  // edit affordance on this page disabled with a tooltip, not missing.
  const { canWrite, reason: writeReason } = useModuleAccess(module ?? "");
  const content: Record<string, React.ReactNode> = {
    ...tabContentFor(d, { recordId, onSaved: afterSave, canWrite, writeReason }),
  };
  const tabs = d.tabs.length ? d.tabs : ["Overview"];

  // The stock article grid is editable in place via the header Edit button.
  const canEditStock = d.variant === "stockarticle" && !!d.stock && !!recordId;
  // The catalog product's variant matrix is editable the same way.
  const canEditProduct = d.variant === "product" && !!d.product && !!recordId;
  // Shipment header is editable via the header Edit button. (Inspection items
  // are edited per-tab inside their own workspace, so no header Edit here.)
  const canEditShipment = d.variant === "shipment" && !!d.shipment?.form && !!recordId;
  const editableVariant = canEditStock || canEditProduct || canEditShipment;
  const canEdit = editableVariant && canWrite;

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

  if (canEditShipment && editing) {
    const sf = d.shipment!.form!;
    content[tabs[0]] = (
      <InlineFieldEditor
        title="Edit shipment" sub="Carrier, destination, ETA & status"
        endpoint={`/shipments/${recordId}`}
        initial={{ carrier: sf.carrier, destination: sf.destination, eta: sf.eta, status: sf.status }}
        fields={[
          { name: "carrier", label: "Carrier" },
          { name: "destination", label: "Destination" },
          { name: "eta", label: "ETA" },
          { name: "status", label: "Status", type: "select", options: d.shipment!.statusOptions ?? [] },
        ]}
        onCancel={() => setEditing(false)} onSaved={afterSave}
      />
    );
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
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer size={15} strokeWidth={2} /> Print
                </Button>
                {/* Only show Edit where the drill-down actually supports editing —
                    no dead-stub buttons on read-only detail variants. */}
                {editableVariant && (
                  <Button
                    variant="navy"
                    size="sm"
                    onClick={canEdit ? () => setEditing(true) : undefined}
                    disabled={!canWrite}
                    title={!canWrite ? writeReason ?? undefined : undefined}
                  >
                    <Pencil size={15} strokeWidth={2} /> Edit
                  </Button>
                )}
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

      {/* Order-level shipment (inspection group): locked until all items pass */}
      {d.variant === "inspection" && d.inspection && (
        <InspectionShipmentBar
          data={d.inspection.shipment}
          canWrite={canWrite}
          onDone={afterSave}
        />
      )}

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
