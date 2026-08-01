import type { Cell, ColumnDef } from "@/lib/screen-types";
import type { Tone } from "@/lib/tone";
import { initials } from "@/lib/tone";

/* ---------- detail model ---------- */
export interface MetaItem {
  k: string;
  v: string;
}
export interface TimelineItem {
  icon: string;
  tone: Tone;
  title: string;
  time: string;
  done: boolean;
}
export interface DetailModel {
  variant:
    | "product"
    | "order"
    | "invoice"
    | "journal"
    | "receipt"
    | "entity"
    | "report"
    | "generic"
    | "productionorder"
    | "bomline"
    | "stockarticle";
  ref: string;
  title: string;
  statusLabel: string;
  statusTone: Tone;
  meta: MetaItem[];
  tabs: string[];
  product?: {
    sizes: string[];
    matrix: { name: string; hex: string; cells: { q: number; tone: "red" | "amber" | "neutral" }[] }[];
    specs: MetaItem[];
    prices?: { retail: string; wholesale: string; online: string };
    image?: string | null;
  };
  doc?: {
    lines: { name: string; sku: string; qty: number; price: string; total: string }[];
    totals: MetaItem[];
    grand: string;
    timelineTitle: string;
    partyTitle: string;
    timeline: TimelineItem[];
    party: { name: string; email: string; phone: string; addr: string };
  };
  journal?: {
    ledger: { acct: string; desc: string; debit: string; credit: string }[];
    ledgerDebit: string;
    ledgerCredit: string;
    sourceNote: string;
  };
  receipt?: {
    lines: { name: string; sku: string; ordered: number; received: number; outstanding: number; badge: string; tone: Tone }[];
    note: string;
  };
  entity?: {
    scorecardTitle: string;
    scorecard: { label: string; value: string; sub: string; tone: Tone }[];
    relatedTitle: string;
    related: { a: string; b: string; c: string; tone: Tone; s: string }[];
    contact: { name: string; email: string; phone: string; addr: string };
    timeline: TimelineItem[];
  };
  report?: {
    lede: string;
    figures: { label: string; value: string; sub: string }[];
    sections: { heading: string; body: string }[];
  };
  generic?: { timeline: TimelineItem[] };
  porder?: {
    materials: { component: string; material: string; qty: string; cost: string }[];
    timeline: TimelineItem[];
  };
  bomOrders?: { a: string; b: string; c: string; tone: Tone; s: string }[];
  shipment?: {
    tracking: TimelineItem[];
    contents: { name: string; sku: string; qty: number }[];
  };
  stock?: {
    sizes: string[];
    colors: { name: string; hex: string; total: number; cells: number[] }[];
    locations: { location: string; on_hand: number; reserved: number; available: number }[];
  };
}

/* ---------- helpers ---------- */
function txt(row: Cell[], i: number, key: "t" | "sub" = "t"): string {
  const c = row[i];
  if (c == null) return "";
  if (typeof c === "string" || typeof c === "number")
    return key === "sub" ? "" : String(c);
  return key === "sub" ? c.sub ?? "" : c.t ?? "";
}
function vtone(q: number): "red" | "amber" | "neutral" {
  if (q === 0) return "red";
  if (q < 40) return "amber";
  return "neutral";
}
const tl = (
  icon: string,
  tone: Tone,
  title: string,
  time: string,
  done: boolean
): TimelineItem => ({ icon, tone, title, time, done });

/**
 * Build the slide-over detail for a clicked row — ported from the original
 * Apparel ERP `detailData()`. The live row provides the headline values;
 * the deeper sections use representative sample data.
 */
export function buildDetail(
  type: string,
  row: Cell[],
  _columns: ColumnDef[]
): DetailModel {
  if (type === "product") {
    const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
    const colors = [
      { name: "Navy", hex: "#262B3F", qty: [40, 44, 420, 120, 60, 22] },
      { name: "Stone", hex: "#C9C2B3", qty: [18, 38, 96, 70, 30, 12] },
      { name: "Charcoal", hex: "#4A4F61", qty: [25, 80, 210, 150, 44, 0] },
    ];
    return {
      variant: "product",
      ref: txt(row, 0, "sub") || "APP-KNT-0142",
      title: txt(row, 0) || "Merino Crew Knit",
      statusLabel: "Active",
      statusTone: "green",
      meta: [
        { k: "Category", v: txt(row, 1) || "Knitwear" },
        { k: "Season", v: txt(row, 2) || "Fall '26" },
        { k: "Retail price", v: txt(row, 4) || "€129.00" },
        { k: "Variants", v: txt(row, 3) || "18" },
      ],
      tabs: ["Overview", "Variant matrix", "Inventory", "Pricing", "Activity"],
      product: {
        sizes,
        matrix: colors.map((c) => ({
          name: c.name,
          hex: c.hex,
          cells: c.qty.map((q) => ({ q, tone: vtone(q) })),
        })),
        specs: [
          { k: "Composition", v: "100% Extrafine Merino Wool" },
          { k: "Gauge", v: "12gg" },
          { k: "Care", v: "Hand wash cold · Dry flat" },
          { k: "Origin", v: "Made in Pakistan" },
          { k: "HS code", v: "6110.11.00" },
          { k: "Weight", v: "320 g" },
        ],
      },
    };
  }

  if (type === "order") {
    const lines = [
      { name: "Merino Crew Knit", sku: "NVY · M", qty: 4, price: "€129.00", total: "€516.00" },
      { name: "Oxford Shirt", sku: "WHT · L", qty: 3, price: "€69.00", total: "€207.00" },
      { name: "Tailored Chino Pant", sku: "STN · 32", qty: 3, price: "€89.00", total: "€267.00" },
      { name: "Cashmere Scarf", sku: "CML", qty: 2, price: "€119.00", total: "€238.00" },
    ];
    const party = txt(row, 1) || "Maison Lyon";
    return {
      variant: "order",
      ref: txt(row, 0) || "#SO-12354",
      title: party,
      statusLabel: "Picking",
      statusTone: "amber",
      meta: [
        { k: "Channel", v: "Wholesale" },
        { k: "Order date", v: "21 Jan 2026" },
        { k: "Items", v: "12" },
        { k: "Total", v: txt(row, 4) || "€4,820" },
      ],
      tabs: ["Summary", "Items", "Fulfillment", "Invoices", "Activity"],
      doc: {
        lines,
        totals: [
          { k: "Subtotal", v: "€1,228.00" },
          { k: "Volume discount (10%)", v: "−€122.80" },
          { k: "Shipping", v: "€48.00" },
          { k: "VAT (19%)", v: "€219.79" },
        ],
        grand: "€1,372.99",
        timelineTitle: "Fulfillment status",
        partyTitle: "Customer",
        timeline: [
          tl("shopping-bag", "accent", "Order placed", "21 Jan · 14:05", true),
          tl("check-circle-2", "green", "Payment confirmed", "21 Jan · 14:06", true),
          tl("box", "amber", "Picking in progress", "Lahore DC · now", true),
          tl("package", "neutral", "Packed", "Pending", false),
          tl("truck", "neutral", "Shipped", "Pending", false),
        ],
        party: {
          name: party,
          email: "maison.lyon@b2b.fr",
          phone: "+33 4 72 00 11 22",
          addr: "14 Rue de la République, 69002 Lyon, France",
        },
      },
    };
  }

  if (type === "invoice") {
    const party = txt(row, 1) || "Maison Lyon";
    return {
      variant: "invoice",
      ref: txt(row, 0) || "INV-8841",
      title: party,
      statusLabel: "Open",
      statusTone: "amber",
      meta: [
        { k: "Customer", v: party },
        { k: "Issued", v: "14 Jun 2026" },
        { k: "Due", v: "14 Jul 2026" },
        { k: "Balance", v: "€2,420" },
      ],
      tabs: ["Summary", "Lines", "Payments", "Activity"],
      doc: {
        lines: [
          { name: "Merino Crew Knit", sku: "NVY · M", qty: 4, price: "€129.00", total: "€516.00" },
          { name: "Oxford Shirt", sku: "WHT · L", qty: 3, price: "€69.00", total: "€207.00" },
          { name: "Tailored Chino Pant", sku: "STN · 32", qty: 3, price: "€89.00", total: "€267.00" },
          { name: "Cashmere Scarf", sku: "CML", qty: 2, price: "€119.00", total: "€238.00" },
        ],
        totals: [
          { k: "Subtotal", v: "€1,228.00" },
          { k: "Volume discount (10%)", v: "−€122.80" },
          { k: "Shipping", v: "€48.00" },
          { k: "VAT (19%)", v: "€219.79" },
        ],
        grand: "€1,372.99",
        timelineTitle: "Payment activity",
        partyTitle: "Billed to",
        timeline: [
          tl("file-text", "navy", "Invoice issued", "14 Jun · 09:00", true),
          tl("send", "navy", "Sent to customer", "14 Jun · 09:02", true),
          tl("banknote", "green", "Part payment received · €2,400", "23 Jun · 11:20", true),
          tl("clock", "amber", "Balance due · €2,420", "Due 14 Jul", false),
        ],
        party: {
          name: party,
          email: "maison.lyon@b2b.fr",
          phone: "+33 4 72 00 11 22",
          addr: "14 Rue de la République, 69002 Lyon, France",
        },
      },
    };
  }

  if (type === "journal") {
    return {
      variant: "journal",
      ref: txt(row, 0) || "JE-4471",
      title: txt(row, 2) || "Revenue & COGS · SO-12353 shipped",
      statusLabel: "Posted",
      statusTone: "green",
      meta: [
        { k: "Date", v: "27 Jun 2026" },
        { k: "Source", v: "SO-12353" },
        { k: "Debit", v: "€416.00" },
        { k: "Credit", v: "€416.00" },
      ],
      tabs: ["Lines", "Source", "Activity"],
      journal: {
        ledger: [
          { acct: "1100 · Accounts receivable", desc: "Invoice to customer", debit: "€287.00", credit: "—" },
          { acct: "4000 · Sales revenue", desc: "Revenue recognized", debit: "—", credit: "€287.00" },
          { acct: "5000 · Cost of goods sold", desc: "COGS posted at cost", debit: "€129.00", credit: "—" },
          { acct: "1200 · Inventory", desc: "Inventory relieved", debit: "—", credit: "€129.00" },
        ],
        ledgerDebit: "€416.00",
        ledgerCredit: "€416.00",
        sourceNote:
          "Auto-posted when sales order SO-12353 shipped — it recognizes revenue against receivables and relieves inventory at cost into COGS. Total debits equal total credits, so the entry is balanced.",
      },
    };
  }

  if (type === "goodsreceipt") {
    const po = txt(row, 1) || "PO-5582";
    const supplier = txt(row, 2) || "Anhui Knit Mills";
    const mk = (name: string, sku: string, ordered: number, received: number) => {
      const out = ordered - received;
      const tone: Tone = out === 0 ? "green" : received === 0 ? "neutral" : "amber";
      return {
        name,
        sku,
        ordered,
        received,
        outstanding: out,
        badge: out === 0 ? "Complete" : received === 0 ? "Awaiting" : "Partial",
        tone,
      };
    };
    return {
      variant: "receipt",
      ref: txt(row, 0) || "GRN-3319",
      title: "Receipt against " + po,
      statusLabel: "Partial",
      statusTone: "amber",
      meta: [
        { k: "PO", v: po },
        { k: "Supplier", v: supplier },
        { k: "Received", v: "26 Jun 2026" },
        { k: "Location", v: "Lahore DC" },
      ],
      tabs: ["Lines", "Documents", "Activity"],
      receipt: {
        lines: [
          mk("Merino yarn 2/28 · Navy", "YRN-MER-NVY", 800, 800),
          mk("Merino yarn 2/28 · Charcoal", "YRN-MER-CHR", 600, 400),
          mk("Merino yarn 2/28 · Stone", "YRN-MER-STN", 400, 0),
        ],
        note:
          "Receiving against " + po +
          " posts the received quantity into Lahore DC inventory and accrues accounts payable. Outstanding units stay open on the PO until fully received.",
      },
    };
  }

  if (type === "supplier" || type === "customer") {
    const isSup = type === "supplier";
    const name = txt(row, 0) || (isSup ? "Anhui Knit Mills" : "Maison Lyon");
    return {
      variant: "entity",
      ref: isSup ? "SUP-0142" : "CUST-0481",
      title: name,
      statusLabel: isSup ? "Preferred" : "Wholesale",
      statusTone: isSup ? "green" : "navy",
      meta: isSup
        ? [
            { k: "Region", v: "China" },
            { k: "Lead time", v: "45 days" },
            { k: "Open POs", v: "2" },
            { k: "YTD spend", v: "€184K" },
          ]
        : [
            { k: "Region", v: "France" },
            { k: "Orders", v: "64" },
            { k: "Open invoices", v: "1" },
            { k: "Lifetime", v: "€284K" },
          ],
      tabs: isSup
        ? ["Overview", "Purchase Orders", "Scorecard", "Activity"]
        : ["Overview", "Orders", "Invoices", "Activity"],
      entity: {
        scorecardTitle: isSup ? "Vendor scorecard" : "Customer health",
        scorecard: isSup
          ? [
              { label: "On-time delivery", value: "94%", sub: "last 12 mo", tone: "green" },
              { label: "Defect rate", value: "1.6%", sub: "AQL 2.5", tone: "amber" },
              { label: "Price rating", value: "4.3 / 5", sub: "vs market", tone: "navy" },
              { label: "Overall score", value: "4.6", sub: "preferred", tone: "accent" },
            ]
          : [
              { label: "On-time payment", value: "92%", sub: "trailing", tone: "green" },
              { label: "Avg order", value: "€4,440", sub: "last 12 mo", tone: "navy" },
              { label: "Return rate", value: "2.1%", sub: "of units", tone: "amber" },
              { label: "Lifetime value", value: "€284K", sub: "since 2021", tone: "accent" },
            ],
        relatedTitle: isSup ? "Recent purchase orders" : "Recent orders",
        related: isSup
          ? [
              { a: "PO-5582", b: "6 lines · Merino yarn", c: "€42,800", tone: "amber", s: "Pending" },
              { a: "PO-5571", b: "8 lines · Knit panels", c: "€38,200", tone: "green", s: "Received" },
              { a: "PO-5560", b: "5 lines · Yarn", c: "€29,400", tone: "green", s: "Received" },
            ]
          : [
              { a: "#SO-12354", b: "12 items · Wholesale", c: "€4,820", tone: "amber", s: "Picking" },
              { a: "#SO-12290", b: "38 items · Wholesale", c: "€14,600", tone: "green", s: "Delivered" },
              { a: "#SO-12244", b: "22 items · Wholesale", c: "€8,900", tone: "green", s: "Delivered" },
            ],
        contact: isSup
          ? { name, email: "sales@anhuiknit.cn", phone: "+86 551 6000 1234", addr: "Hefei, Anhui, China" }
          : { name, email: "maison.lyon@b2b.fr", phone: "+33 4 72 00 11 22", addr: "14 Rue de la République, 69002 Lyon, France" },
        timeline: isSup
          ? [
              tl("truck", "green", "PO-5571 received in full", "2 days ago", true),
              tl("badge-check", "amber", "QC flagged 1.6% defect rate", "1 week ago", true),
              tl("file-text", "navy", "Annual price agreement renewed", "2 weeks ago", true),
            ]
          : [
              tl("shopping-bag", "amber", "Order SO-12354 placed", "6 days ago", true),
              tl("banknote", "green", "Invoice INV-8821 paid", "2 weeks ago", true),
              tl("package", "navy", "Order SO-12290 delivered", "3 weeks ago", true),
            ],
      },
    };
  }

  if (type === "aireport") {
    return {
      variant: "report",
      ref: "AI-RPT-2026Q2",
      title: txt(row, 0) || "Q2 2026 executive summary",
      statusLabel: "Generated",
      statusTone: "accent",
      meta: [
        { k: "Period", v: "Apr–Jun 2026" },
        { k: "Generated", v: "27 Jun 2026" },
        { k: "Confidence", v: "91%" },
        { k: "Sources", v: "6 modules" },
      ],
      tabs: ["Summary", "Figures", "Methodology"],
      report: {
        lede:
          "We closed Q2 ahead of plan. Net revenue reached €4.82M, up 12.4% on the prior quarter and 104% against target, led by wholesale demand across continental Europe and a strong Core shirting program. Margin held at 43.8% despite freight inflation, and we enter Fall '26 with healthy cover on hero styles — though four outerwear variants need immediate replenishment.",
        figures: [
          { label: "Net revenue", value: "€4.82M", sub: "+12.4% QoQ" },
          { label: "Gross margin", value: "43.8%", sub: "+0.6 pts" },
          { label: "Sell-through", value: "88%", sub: "Fall '26" },
          { label: "Stockout risk", value: "4 styles", sub: "outerwear" },
        ],
        sections: [
          { heading: "What drove the quarter", body: "Wholesale contributed 42% of orders, with Nordic Retail Group and Maison Lyon expanding their buys. Oxford Shirt and Tailored Chino remained the volume engine at €633K combined, while Merino Crew Knit over-indexed against forecast as temperatures dropped early across northern markets." },
          { heading: "Where to act now", body: "Wool Overcoat and Field Jacket are below reorder point with zero-to-low cover against a forecast 378-unit demand. We recommend approving the four AI-drafted replenishment POs this week to protect Fall '26 sell-through. Bursa Denim remains on watch — 88% on-time and a 3.1% defect rate warrant a sourcing review." },
          { heading: "Cash & receivables", body: "Cash position is solid at €1.84M. One receivable — Studio Norte at €11,900 — has aged past 30 days and should be chased before quarter close." },
        ],
      },
    };
  }

  /* generic — inspection / shipment */
  const isInsp = type === "inspection";
  return {
    variant: "generic",
    ref: isInsp ? txt(row, 0, "sub") || "Final inspection" : txt(row, 1) || "Order",
    title: txt(row, 0) || "Record",
    statusLabel: isInsp ? "Pass" : "In transit",
    statusTone: isInsp ? "green" : "amber",
    meta: isInsp
      ? [
          { k: "Order", v: txt(row, 1) || "MO-3308" },
          { k: "AQL", v: "2.5" },
          { k: "Defects", v: txt(row, 3) || "3" },
          { k: "Inspector", v: "S. Marino" },
        ]
      : [
          { k: "Order", v: txt(row, 1) || "#SO-12353" },
          { k: "Carrier", v: txt(row, 2) || "DHL Express" },
          { k: "Destination", v: txt(row, 3) || "Paris, FR" },
          { k: "ETA", v: "29 Jun" },
        ],
    tabs: isInsp ? ["Checklist", "Defects", "Photos"] : ["Tracking", "Contents", "Documents"],
    generic: {
      timeline: isInsp
        ? [
            tl("clipboard-list", "navy", "Inspection opened", "24 Jun · 09:10", true),
            tl("search", "amber", "Sampling · AQL 2.5", "24 Jun · 09:40", true),
            tl("alert-triangle", "red", "3 minor defects logged", "24 Jun · 10:15", true),
            tl("check-circle-2", "green", "Passed · accepted", "24 Jun · 10:30", true),
          ]
        : [
            tl("package", "navy", "Label created", "26 Jun · 11:00", true),
            tl("warehouse", "navy", "Picked up · Lahore DC", "27 Jun · 08:30", true),
            tl("truck", "amber", "In transit · Dubai hub", "now", true),
            tl("map-pin", "neutral", "Out for delivery", "Pending", false),
            tl("check-circle-2", "neutral", "Delivered", "Pending", false),
          ],
    },
  };
}

export const _avatarInitials = initials;
