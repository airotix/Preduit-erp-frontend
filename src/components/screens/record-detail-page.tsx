"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Pencil } from "lucide-react";
import { Icon } from "@/components/icon";
import { ToneBadge } from "@/components/tone-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { avatarColor, initials, tone as toneOf } from "@/lib/tone";
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
  party: { name: string; email: string; phone: string; addr: string };
  title: string;
}) {
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
        </div>
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

/* ------------------------------------------------------------------ *
 * Tab content per detail variant. Returns an ordered list keyed by the
 * model's own `tabs` labels so the sub-tab bar always matches the data.
 * ------------------------------------------------------------------ */

function tabContentFor(d: DetailModel): Record<string, React.ReactNode> {
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
          <Panel title="Specifications">
            <Specs specs={p.specs} />
          </Panel>
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
        <Panel title="Pricing & trade" sub="Retail price and trade details">
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {[
              { k: "Retail price", v: d.meta.find((m) => m.k === "Retail price")?.v ?? "—" },
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
    const map: Record<string, React.ReactNode> = {};
    d.tabs.forEach((t, i) => {
      if (i === 0) map[t] = primary;
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
        <Panel>
          <PartyCard party={e.contact} title="Contact" />
        </Panel>
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
}: {
  type: string;
  row: Cell[];
  columns: ColumnDef[];
  backHref: string;
  backLabel: string;
}) {
  const d = buildDetail(type, row, columns);
  const content = tabContentFor(d);
  const tabs = d.tabs.length ? d.tabs : ["Overview"];

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
            <Button variant="outline" size="sm">
              <Printer size={15} strokeWidth={2} /> Print
            </Button>
            <Button variant="navy" size="sm">
              <Pencil size={15} strokeWidth={2} /> Edit
            </Button>
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
