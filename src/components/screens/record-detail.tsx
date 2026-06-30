"use client";

import { Icon } from "@/components/icon";
import { ToneBadge } from "@/components/tone-badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";
import { avatarColor, initials, tone as toneOf } from "@/lib/tone";
import type { Cell, ColumnDef } from "@/lib/screen-types";
import {
  buildDetail,
  type DetailModel,
  type MetaItem,
  type TimelineItem,
} from "@/modules/detail/detail-data";

function pascal(s: string) {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function MetaGrid({ items }: { items: MetaItem[] }) {
  return (
    <div className="grid grid-cols-4 gap-3 border-y border-border/60 bg-muted/40 px-6 py-4">
      {items.map((m) => (
        <div key={m.k}>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {m.k}
          </div>
          <div className="mt-0.5 font-bold text-foreground">{m.v}</div>
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
      {children}
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

function Lines({
  lines,
  totals,
  grand,
}: NonNullable<DetailModel["doc"]>) {
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
              <td className="py-2.5 text-right font-bold tabular text-foreground">{l.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
        {totals.map((t) => (
          <div key={t.k} className="flex justify-between text-[13px] text-muted-foreground">
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

export function RecordDetail({
  open,
  onOpenChange,
  type,
  row,
  columns,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  type: string;
  row: Cell[] | null;
  columns: ColumnDef[];
}) {
  if (!row) return null;
  const d = buildDetail(type, row, columns);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full p-0 sm:max-w-[640px]">
        <SheetHeader className="px-6 pb-4 pr-12">
          <div className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
            {d.ref}
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-foreground">{d.title}</h2>
            <ToneBadge tone={d.statusTone}>{d.statusLabel}</ToneBadge>
          </div>
        </SheetHeader>

        <MetaGrid items={d.meta} />

        <div className="erp-scroll flex-1 space-y-7 overflow-y-auto px-6 py-6">
          {/* PRODUCT */}
          {d.variant === "product" && d.product && (
            <>
              <div>
                <SectionTitle>Variant matrix · units on hand</SectionTitle>
                <table className="w-full text-[13px]">
                  <thead>
                    <tr>
                      <th className="pb-2 text-left text-[11px] font-bold uppercase text-muted-foreground">
                        Color
                      </th>
                      {d.product.sizes.map((s) => (
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
                    {d.product.matrix.map((c) => (
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
              </div>
              <div>
                <SectionTitle>Specifications</SectionTitle>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {d.product.specs.map((s) => (
                    <div key={s.k} className="flex justify-between border-b border-border/50 pb-2 text-[13px]">
                      <span className="text-muted-foreground">{s.k}</span>
                      <span className="font-semibold text-foreground">{s.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ORDER / INVOICE */}
          {(d.variant === "order" || d.variant === "invoice") && d.doc && (
            <>
              <Lines {...d.doc} />
              <div>
                <SectionTitle>{d.doc.timelineTitle}</SectionTitle>
                <Timeline items={d.doc.timeline} />
              </div>
              <PartyCard party={d.doc.party} title={d.doc.partyTitle} />
            </>
          )}

          {/* JOURNAL */}
          {d.variant === "journal" && d.journal && (
            <>
              <div>
                <SectionTitle>Ledger lines</SectionTitle>
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-[11px] uppercase text-muted-foreground">
                      <th className="pb-2 text-left font-bold">Account</th>
                      <th className="pb-2 text-right font-bold">Debit</th>
                      <th className="pb-2 text-right font-bold">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.journal.ledger.map((l, i) => (
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
                      <td className="py-2.5 text-right tabular">{d.journal.ledgerDebit}</td>
                      <td className="py-2.5 text-right tabular">{d.journal.ledgerCredit}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <SectionTitle>Source</SectionTitle>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  {d.journal.sourceNote}
                </p>
              </div>
            </>
          )}

          {/* RECEIPT */}
          {d.variant === "receipt" && d.receipt && (
            <>
              <div>
                <SectionTitle>Received lines</SectionTitle>
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
                    {d.receipt.lines.map((l, i) => (
                      <tr key={i} className="border-t border-border/50">
                        <td className="py-2.5">
                          <div className="font-semibold text-foreground">{l.name}</div>
                          <div className="text-xs text-muted-foreground">{l.sku}</div>
                        </td>
                        <td className="py-2.5 text-right tabular">{l.ordered}</td>
                        <td className="py-2.5 text-right tabular">{l.received}</td>
                        <td className="py-2.5 text-right tabular">{l.outstanding}</td>
                        <td className="py-2.5 text-right">
                          <ToneBadge tone={l.tone} dot={false}>{l.badge}</ToneBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {d.receipt.note}
              </p>
            </>
          )}

          {/* ENTITY (supplier / customer) */}
          {d.variant === "entity" && d.entity && (
            <>
              <div>
                <SectionTitle>{d.entity.scorecardTitle}</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  {d.entity.scorecard.map((s) => {
                    const k = toneOf(s.tone);
                    return (
                      <div key={s.label} className="rounded-xl p-4" style={{ background: k.bg }}>
                        <div className="text-[22px] font-extrabold" style={{ color: k.fg }}>
                          {s.value}
                        </div>
                        <div className="text-[13px] font-semibold text-foreground">{s.label}</div>
                        <div className="text-xs text-muted-foreground">{s.sub}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <SectionTitle>{d.entity.relatedTitle}</SectionTitle>
                <div className="space-y-2">
                  {d.entity.related.map((r) => (
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
                        <ToneBadge tone={r.tone} dot={false}>{r.s}</ToneBadge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <PartyCard party={d.entity.contact} title="Contact" />
              <div>
                <SectionTitle>Activity</SectionTitle>
                <Timeline items={d.entity.timeline} />
              </div>
            </>
          )}

          {/* AI REPORT */}
          {d.variant === "report" && d.report && (
            <>
              <p className="text-[15px] leading-relaxed text-foreground">{d.report.lede}</p>
              <div className="grid grid-cols-4 gap-3">
                {d.report.figures.map((f) => (
                  <div key={f.label} className="rounded-xl bg-muted/60 p-3">
                    <div className="text-lg font-extrabold text-foreground">{f.value}</div>
                    <div className="text-[12px] font-semibold text-foreground">{f.label}</div>
                    <div className="text-xs text-muted-foreground">{f.sub}</div>
                  </div>
                ))}
              </div>
              {d.report.sections.map((s) => (
                <div key={s.heading}>
                  <SectionTitle>{s.heading}</SectionTitle>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </>
          )}

          {/* GENERIC (inspection / shipment) */}
          {d.variant === "generic" && d.generic && (
            <div>
              <SectionTitle>Timeline</SectionTitle>
              <Timeline items={d.generic.timeline} />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
