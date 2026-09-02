"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, ArrowRight, CornerDownLeft } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { fetchScreen } from "@/modules/registry";
import type { Cell, ListConfig } from "@/lib/screen-types";
import { COMMANDS, parse, type Cmd, type FilterKind, type Intent } from "@/components/shell/copilot-intents";

function cellText(c: Cell): string {
  if (c == null) return "";
  if (typeof c === "string" || typeof c === "number") return String(c);
  const o = c as { t?: string; sub?: string };
  return [o.t, o.sub].filter(Boolean).join(" ");
}
// A row matches when every word of the filter appears somewhere in the row.
function rowMatches(row: Cell[], filter: string): boolean {
  const hay = row.map(cellText).join(" ").toLowerCase();
  return filter.split(/\s+/).filter(Boolean).every((term) => hay.includes(term));
}
// Human phrasing for the summary line.
function describe(cmd: Cmd, n: number, filter: string | null, kind: FilterKind): string {
  const noun = cmd.tabLabel.toLowerCase();
  if (!filter) return `${n} ${noun}`;
  if (kind === "text") return `${n} ${noun} matching “${filter}”`;
  return `${n} ${filter} ${noun}`;
}

type Msg =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "bot"; kind: "text"; text: string }
  | { id: number; role: "bot"; kind: "nav"; cmd: Cmd; text: string }
  | { id: number; role: "bot"; kind: "chips"; text: string; options: Cmd[]; mode: "navigate" | "data"; filter: string | null; filterKind: FilterKind }
  | { id: number; role: "bot"; kind: "table"; cmd: Cmd; columns: ListConfig["columns"]; rows: Cell[][]; total: number; summary: string };

// Distributive omit so each union member keeps its own keys.
type MsgInput = Msg extends infer T ? (T extends { id: number } ? Omit<T, "id"> : never) : never;

const EXAMPLES = ["Show open orders", "Low stock", "Go to Suppliers", "How many inspections"];
let SEQ = 1;

export function CopilotPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (open && msgs.length === 0) {
      setMsgs([{ id: SEQ++, role: "bot", kind: "text",
        text: "Hi! I can take you to any part of the app or pull up its data. Try one of these — or just ask." }]);
    }
    if (!open) { setMsgs([]); setInput(""); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  React.useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const push = (m: MsgInput) => setMsgs((prev) => [...prev, { ...m, id: SEQ++ } as Msg]);

  const goTo = (cmd: Cmd) => { onOpenChange(false); router.push(cmd.href); };

  const loadData = async (cmd: Cmd, mode: "list" | "count", filter: string | null, filterKind: FilterKind) => {
    if (cmd.kind !== "list") {   // dashboards etc. — offer to open
      push({ role: "bot", kind: "nav", cmd, text: `${cmd.label} is a dashboard — open it to view.` });
      return;
    }
    setBusy(true);
    try {
      const data = await fetchScreen(cmd.module, cmd.tab);
      if (data.kind !== "list") { push({ role: "bot", kind: "nav", cmd, text: `Open ${cmd.label} to view.` }); return; }
      let rows = data.rows ?? [];
      const lc = filter ? filter.toLowerCase() : null;
      if (lc) rows = rows.filter((r) => rowMatches(r, lc));
      const n = filter ? rows.length : (data.total ?? rows.length);
      if (mode === "count") {
        push({ role: "bot", kind: "text", text: `You have ${describe(cmd, n, filter, filterKind)}.` });
        return;
      }
      push({
        role: "bot", kind: "table", cmd, columns: data.columns, rows, total: n,
        summary: rows.length === 0
          ? `No ${describe(cmd, 0, filter, filterKind).replace(/^0 /, "")} found.`
          : `${describe(cmd, n, filter, filterKind)}${rows.length > 12 ? " — showing first 12" : ""}.`,
      });
    } catch {
      push({ role: "bot", kind: "text", text: "Sorry — I couldn't load that data. You may not have access, or the service is offline." });
    } finally {
      setBusy(false);
    }
  };

  const act = async (intent: Intent) => {
    if (intent.type === "help") {
      push({ role: "bot", kind: "text",
        text: "Try things like “go to suppliers”, “show open orders”, “list low stock”, or “how many inspections”. I connect the app’s built-in features — I don’t make anything up." });
      return;
    }
    if (intent.type === "navigate") {
      push({ role: "bot", kind: "nav", cmd: intent.cmd, text: `Opening ${intent.cmd.label}.` });
      return;
    }
    if (intent.type === "ambiguous") {
      push({ role: "bot", kind: "chips", text: "Which one did you mean?", options: intent.candidates,
        mode: intent.mode, filter: intent.filter, filterKind: intent.filterKind });
      return;
    }
    await loadData(intent.cmd, intent.mode, intent.filter, intent.filterKind);
  };

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || busy) return;
    push({ role: "user", text });
    setInput("");
    await act(parse(text));
  };

  const chooseCandidate = (c: Cmd, mode: "navigate" | "data", filter: string | null, filterKind: FilterKind) => {
    if (mode === "navigate") { push({ role: "bot", kind: "nav", cmd: c, text: `Opening ${c.label}.` }); }
    else void loadData(c, "list", filter, filterKind);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles size={17} className="text-brand-orange" /> Copilot
          </SheetTitle>
        </SheetHeader>

        {/* Thread */}
        <div className="erp-scroll flex-1 space-y-3 overflow-y-auto px-6 pb-2">
          {msgs.map((m) => (
            <MessageBubble key={m.id} m={m} onGo={goTo} onChoose={chooseCandidate} />
          ))}
          {msgs.length <= 1 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {EXAMPLES.map((ex) => (
                <button key={ex} onClick={() => send(ex)}
                  className="rounded-full border border-border/70 bg-muted px-3 py-1.5 text-[12px] font-semibold text-foreground hover:border-primary">
                  {ex}
                </button>
              ))}
            </div>
          )}
          {busy && <div className="px-1 text-[12px] text-muted-foreground">Copilot is looking…</div>}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <div className="border-t border-border/60 px-6 py-3">
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted px-3 py-2">
            <input
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void send(); } }}
              placeholder="Ask Copilot… (e.g. show overdue invoices)"
              className="w-full border-0 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground" />
            <button onClick={() => void send()} disabled={busy || !input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-orange text-white disabled:opacity-40">
              <Send size={15} />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MessageBubble({
  m, onGo, onChoose,
}: {
  m: Msg;
  onGo: (c: Cmd) => void;
  onChoose: (c: Cmd, mode: "navigate" | "data", filter: string | null, filterKind: FilterKind) => void;
}) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand-orange px-3.5 py-2 text-[13px] font-medium text-white">
          {m.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] space-y-2">
        {m.kind === "text" && (
          <div className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-[13px] text-foreground">{m.text}</div>
        )}
        {m.kind === "nav" && (
          <div className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-[13px] text-foreground">
            <div className="mb-2">{m.text}</div>
            <button onClick={() => onGo(m.cmd)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-3 py-1.5 text-[12px] font-bold text-white">
              Go to {m.cmd.tabLabel} <ArrowRight size={13} />
            </button>
          </div>
        )}
        {m.kind === "chips" && (
          <div className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-[13px] text-foreground">
            <div className="mb-2">{m.text}</div>
            <div className="flex flex-wrap gap-2">
              {m.options.map((c) => (
                <button key={c.key} onClick={() => onChoose(c, m.mode, m.filter, m.filterKind)}
                  className="rounded-full border border-border/70 bg-white px-3 py-1.5 text-[12px] font-semibold text-foreground hover:border-primary">
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {m.kind === "table" && (
          <div className="rounded-xl border border-border/60 bg-white">
            <div className="flex items-center justify-between border-b border-border/60 px-3.5 py-2 text-[12px]">
              <span className="font-semibold text-foreground">{m.summary}</span>
              <button onClick={() => onGo(m.cmd)}
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                Open <CornerDownLeft size={12} />
              </button>
            </div>
            {m.rows.length > 0 && (
              <div className="max-h-[300px] overflow-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {m.columns.map((col, i) => (
                        <th key={i} className="px-2.5 py-1.5 text-left font-bold">{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {m.rows.slice(0, 12).map((row, ri) => (
                      <tr key={ri} className="border-t border-border/40">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-2.5 py-1.5 text-foreground">{cellText(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Referenced so the registry is bundled even if tree-shaking is aggressive.
export const COPILOT_FEATURE_COUNT = COMMANDS.length;
