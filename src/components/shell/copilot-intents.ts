/**
 * Rule-based (no-AI) intent parsing for the Copilot chatbot. It maps a typed
 * message to a feature (module/tab) and an action — navigate, show data, or
 * count — using keyword scoring over the navigation registry + a synonym map.
 * Leftover words (e.g. a customer or product name) become a free-text row
 * filter, so "what did mamu order" → Sales Orders filtered by "mamu".
 */
import { MODULES } from "@/config/navigation";

export interface Cmd {
  key: string;
  module: string;
  moduleLabel: string;
  tab: string;
  tabLabel: string;
  label: string;
  href: string;
  kind: string;
  /** Stemmed keyword set used for matching (whole words, not substrings). */
  words: Set<string>;
}

// Extra search keywords per module/tab so everyday phrasing resolves.
const SYNONYMS: Record<string, string> = {
  "procurement/pos": "po pos purchase order purchase orders bought buy",
  "procurement/suppliers": "supplier vendors vendor",
  "procurement/receipts": "grn goods receipt received",
  "inventory/alerts": "low stock reorder alerts running out replenish",
  "inventory/stock": "stock on hand stock levels quantity",
  "inventory/transfers": "transfer move stock",
  "sales/orders": "orders sales order so sold sell",
  "sales/invoices": "invoice invoices billing ar bill",
  "sales/customers": "customer clients client buyer",
  "sales/returns": "returns rma refund",
  "finance/customerledger": "receivable ar customer ledger",
  "finance/supplierledger": "payable ap supplier ledger",
  "finance/cashledger": "cash ledger",
  "finance/bankledger": "bank ledger",
  "quality/inspections": "inspection qc quality check aql",
  "quality/defects": "defect defect types",
  "shipments/shipments": "shipment shipping dispatch delivery carrier",
  "production/porders": "production manufacturing work order mo",
  "catalog/products": "product products catalog sku item items",
};

// Very light stemming so "ordered"/"orders" reduce to "order", etc.
function stem(t: string): string {
  if (t.length > 5 && t.endsWith("ing")) return t.slice(0, -3);
  if (t.length > 4 && t.endsWith("ed")) return t.slice(0, -2);
  if (t.length > 4 && t.endsWith("es")) return t.slice(0, -2);
  if (t.length > 3 && t.endsWith("s")) return t.slice(0, -1);
  return t;
}
function wordSet(s: string): Set<string> {
  return new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(stem));
}

export const COMMANDS: Cmd[] = MODULES.flatMap((m) =>
  (m.tabs ?? []).map((t) => {
    const key = `${m.id}/${t.id}`;
    // Keyword set = tab label + tab id + module id + synonyms. The module
    // *label* is deliberately excluded — e.g. "Sales & Orders" would otherwise
    // make every sales sub-tab match "orders".
    return {
      key,
      module: m.id,
      moduleLabel: m.label,
      tab: t.id,
      tabLabel: t.label,
      label: `${m.label} · ${t.label}`,
      href: `/${m.id}/${t.id}`,
      kind: t.kind,
      words: wordSet(`${t.label} ${t.id} ${m.id} ${SYNONYMS[key] ?? ""}`),
    };
  })
);

const NAV_VERB = /\b(go to|goto|open|navigate|take me|jump to|switch to)\b/;
const COUNT_VERB = /\b(how many|count|number of|total number)\b/;
const DATA_VERB =
  /\b(show|list|display|view|see|get|find|pull|give me|data|which|whats|what's|what are|what did)\b/;
// Status/filter words worth splitting out so "show open orders" filters rows.
const FILTERS = [
  "open", "overdue", "paid", "void", "pending", "in progress", "pass", "passed",
  "fail", "failed", "packed", "shipped", "delivered", "cancelled", "canceled",
  "low", "active", "inactive", "draft", "partial", "complete", "completed",
  "approved", "rejected", "hold", "scrap", "new", "in transit", "customs",
];
const STOP = new Set([
  "the", "a", "an", "of", "for", "my", "our", "all", "me", "please",
  "in", "on", "to", "with", "and", "any", "some", "current",
  // question / filler words that shouldn't be treated as a name.
  // NOTE: keep "order"/"invoice"/etc. OUT of here — they're feature keywords.
  "what", "did", "do", "does", "was", "were", "is", "are", "has", "have", "had",
  "make", "made", "i", "you", "from", "by", "about",
]);

function tokenMatches(cmd: Cmd, t: string): boolean {
  return cmd.words.has(stem(t));
}

export type FilterKind = "status" | "text" | null;

export type Intent =
  | { type: "navigate"; cmd: Cmd }
  | { type: "data"; cmd: Cmd; mode: "list" | "count"; filter: string | null; filterKind: FilterKind }
  | { type: "ambiguous"; candidates: Cmd[]; mode: "navigate" | "data"; filter: string | null; filterKind: FilterKind }
  | { type: "help" };

export function parse(raw: string): Intent {
  const msg = ` ${raw.toLowerCase().trim()} `;
  if (!raw.trim()) return { type: "help" };

  const isNav = NAV_VERB.test(msg);
  const isCount = COUNT_VERB.test(msg);

  // Pull out a status filter keyword (longest match wins).
  let filter: string | null = null;
  for (const f of [...FILTERS].sort((a, b) => b.length - a.length)) {
    if (msg.includes(` ${f} `) || msg.includes(` ${f}s `)) { filter = f; break; }
  }

  // Remaining tokens used to match a feature.
  let text = raw.toLowerCase();
  text = text.replace(NAV_VERB, " ").replace(COUNT_VERB, " ").replace(DATA_VERB, " ");
  if (filter) text = text.replace(new RegExp(`\\b${filter}s?\\b`, "g"), " ");
  // Words that participate in feature matching (stop words excluded).
  const tokens = text.split(/[^a-z0-9]+/).filter((t) => t && !STOP.has(t));

  if (tokens.length === 0 && !filter) return { type: "help" };

  const scored = COMMANDS
    .map((c) => {
      const matched = tokens.filter((t) => tokenMatches(c, t));
      return { c, score: matched.length, matched };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return { type: "help" };

  const top = scored[0].score;
  const winners = scored.filter((r) => r.score === top);
  const mode: "navigate" | "data" = isNav ? "navigate" : "data";

  // Leftover words that didn't match the chosen feature become a free-text row
  // filter (a customer/supplier/product name), unless a status filter is set.
  let filterKind: FilterKind = filter ? "status" : null;
  if (!filter && !isNav) {
    // Any word that isn't part of the matched feature keywords is a name.
    const leftover = tokens.filter((t) => t.length >= 3 && !tokenMatches(winners[0].c, t));
    if (leftover.length > 0) { filter = leftover.join(" "); filterKind = "text"; }
  }

  if (winners.length > 1) {
    return { type: "ambiguous", candidates: winners.slice(0, 3).map((r) => r.c), mode, filter, filterKind };
  }
  const cmd = winners[0].c;
  if (isNav) return { type: "navigate", cmd };
  return { type: "data", cmd, mode: isCount ? "count" : "list", filter, filterKind };
}
