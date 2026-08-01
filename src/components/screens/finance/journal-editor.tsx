"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from "@/components/ui/sheet";
import { apiGet, apiPost, USE_BACKEND } from "@/lib/api-client";

interface AccountOpt { code: string; name: string; label: string; type: string }
interface Line { account: string; debit: string; credit: string }

const blank = (): Line => ({ account: "", debit: "", credit: "" });
const n = (s: string) => Number(s) || 0;

/** Balanced, multi-line journal entry editor → POST /finance/journal-entries. */
export function JournalEditor({
  open, onOpenChange, onPosted,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPosted: () => void;
}) {
  const [reference, setReference] = React.useState("");
  const [date, setDate] = React.useState("");
  const [memo, setMemo] = React.useState("");
  const [lines, setLines] = React.useState<Line[]>([blank(), blank()]);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setReference(""); setDate(""); setMemo("");
      setLines([blank(), blank()]); setError(null); setSaving(false);
    }
  }, [open]);

  const { data: accounts } = useQuery<AccountOpt[]>({
    queryKey: ["finance", "accounts"],
    queryFn: () => apiGet<AccountOpt[]>("/finance/accounts"),
    enabled: USE_BACKEND && open,
  });

  const totalDebit = lines.reduce((s, l) => s + n(l.debit), 0);
  const totalCredit = lines.reduce((s, l) => s + n(l.credit), 0);
  const balanced = totalDebit > 0 && Math.round((totalDebit - totalCredit) * 100) === 0;

  const patch = (i: number, x: Partial<Line>) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...x } : l)));

  const submit = async () => {
    if (!memo.trim()) return setError("Memo is required.");
    const valid = lines.filter((l) => l.account && (n(l.debit) > 0 || n(l.credit) > 0));
    if (valid.length < 2) return setError("Add at least two account lines with amounts.");
    if (!balanced) return setError("Entry is not balanced — debits must equal credits.");
    setSaving(true); setError(null);
    try {
      await apiPost("/finance/journal-entries", {
        reference: reference.trim() || null,
        date: date || null,
        memo: memo.trim(),
        lines: valid.map((l) => ({ account: l.account, debit: n(l.debit), credit: n(l.credit) })),
      });
      onPosted();
    } catch {
      setError("Could not post the entry. Please try again.");
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>New journal entry</SheetTitle>
          <SheetDescription>Post a balanced double-entry journal to the general ledger.</SheetDescription>
        </SheetHeader>

        <div className="erp-scroll flex-1 space-y-4 overflow-y-auto px-6 pb-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ref">Reference</Label>
              <Input id="ref" placeholder="Auto (JE-…)" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jdate">Date</Label>
              <Input id="jdate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="memo">Memo<span className="ml-0.5 text-brand-orange">*</span></Label>
            <Input id="memo" placeholder="What is this entry for?" value={memo} onChange={(e) => setMemo(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Lines</Label>
            <div className="grid grid-cols-[1fr_100px_100px_auto] gap-2 text-[11px] font-bold uppercase text-muted-foreground">
              <span>Account</span><span className="text-right">Debit</span><span className="text-right">Credit</span><span />
            </div>
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_100px_100px_auto] items-center gap-2">
                <Select value={l.account} onValueChange={(v) => patch(i, { account: v })}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {(accounts ?? []).map((a) => (
                      <SelectItem key={a.code} value={a.label}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" min={0} step="any" className="text-right" value={l.debit}
                  onChange={(e) => patch(i, { debit: e.target.value, credit: "" })} />
                <Input type="number" min={0} step="any" className="text-right" value={l.credit}
                  onChange={(e) => patch(i, { credit: e.target.value, debit: "" })} />
                <button type="button" onClick={() => setLines((ls) => ls.length > 2 ? ls.filter((_, j) => j !== i) : ls)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-red-600 disabled:opacity-40"
                  disabled={lines.length <= 2} aria-label="Remove line">
                  <Trash2 size={15} strokeWidth={2} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setLines((ls) => [...ls, blank()])}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[13px] font-semibold text-muted-foreground hover:border-primary hover:text-foreground">
              <Plus size={15} strokeWidth={2.5} /> Add line
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3 text-[13px]">
            <span className="font-semibold text-muted-foreground">
              Debits {totalDebit.toLocaleString()} · Credits {totalCredit.toLocaleString()}
            </span>
            <span className={"font-extrabold " + (balanced ? "text-[#2E9E6B]" : "text-[#C0392B]")}>
              {balanced ? "Balanced ✓" : `Out by ${Math.abs(totalDebit - totalCredit).toLocaleString()}`}
            </span>
          </div>

          {error && <div className="rounded-md bg-[#FBEAEA] p-3 text-sm font-semibold text-[#C0392B]">{error}</div>}
        </div>

        <SheetFooter>
          <SheetClose asChild><Button type="button" variant="outline">Cancel</Button></SheetClose>
          <Button type="button" onClick={submit} disabled={saving || !balanced}>
            {saving ? "Posting…" : "Post entry"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
