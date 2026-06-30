import type { Cell } from "@/lib/screen-types";
import { ToneBadge } from "@/components/tone-badge";
import { avatarColor, initials } from "@/lib/tone";
import { cn } from "@/lib/utils";

/** Normalize a cell to its rich-object form. */
export function normCell(c: Cell): Exclude<Cell, string | number> {
  if (c == null) return { t: "" };
  if (typeof c === "string" || typeof c === "number") return { t: String(c) };
  return c;
}

/** Plain-text projection of a cell — used for global search / sorting. */
export function cellText(c: Cell): string {
  const n = normCell(c);
  return `${n.t ?? ""} ${n.sub ?? ""}`.trim();
}

export function CellRenderer({ cell }: { cell: Cell }) {
  const c = normCell(cell);

  if (c.avatar) {
    return (
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: avatarColor(c.t ?? "") }}
        >
          {initials(c.t ?? "")}
        </span>
        <div className="min-w-0">
          <div className="truncate font-semibold text-foreground">{c.t}</div>
          {c.sub && (
            <div className="truncate text-xs text-muted-foreground">
              {c.sub}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (c.badge) {
    return <ToneBadge tone={c.badge}>{c.t}</ToneBadge>;
  }

  return (
    <div>
      <span
        className={cn(c.strong && "font-bold text-foreground", c.mono && "tabular")}
        style={c.color ? { color: c.color } : undefined}
      >
        {c.t}
      </span>
      {c.sub && <div className="text-xs text-muted-foreground">{c.sub}</div>}
    </div>
  );
}
