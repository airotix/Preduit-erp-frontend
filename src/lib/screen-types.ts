import type { Tone } from "@/lib/tone";

/**
 * A normalized table cell. A cell may be a plain string/number, or a rich
 * object describing badges, avatars, monospace numerics, etc.
 * Ported verbatim from the original mock's cell model.
 */
export type Cell =
  | string
  | number
  | {
      /** Primary text */
      t?: string;
      /** Secondary line (renders under the primary text, or as avatar caption) */
      sub?: string;
      /** Render as a pill badge with the given tone */
      badge?: Tone;
      /** Render with a leading round avatar (initials derived from `t`) */
      avatar?: boolean;
      /** Bold + darker text */
      strong?: boolean;
      /** Tabular / monospace numerics */
      mono?: boolean;
      /** Explicit text color override */
      color?: string;
      /** Horizontal alignment */
      align?: "left" | "center" | "right";
    };

export type ColumnAlign = "left" | "center" | "right";

export interface ColumnDef {
  label: string;
  align?: ColumnAlign;
  /** Optional fixed width, e.g. "120px" */
  w?: string;
}

/** A row is an ordered list of cells, one per column. */
export type Row = Cell[];

/** List screen — a searchable, sortable, paginated data grid. */
export interface ListConfig {
  kind: "list";
  search?: string;
  /** Filter facet labels (rendered as dropdown chips) */
  filters?: string[];
  /** Primary action button label */
  action?: string;
  columns: ColumnDef[];
  rows: Row[];
  /** Total record count (for the "1–N of total" range) */
  total?: number;
  /** Stable public ids parallel to rows[] (from the backend), used to open the
   *  real detail record for a clicked row. Absent for mock screens. */
  ids?: string[];
  /** Raw editable field values parallel to rows[] — prefill the Edit form.
   *  Present on editable backend screens. */
  records?: Record<string, unknown>[];
}

/* ---------- Dashboard ---------- */

export interface Metric {
  label: string;
  value: string;
  delta: string;
  up: boolean;
  sub: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

export interface DonutSegment {
  label: string;
  value: string;
  pct: number;
  color: string;
}

export interface ActivityItem {
  icon: string;
  bg: string;
  color: string;
  text: string;
  time: string;
}

export interface DashboardConfig {
  kind: "dashboard";
  metrics: Metric[];
  chartTitle: string;
  chartSub: string;
  /** 12 monthly values (0–100) */
  bars: number[];
  donutTitle: string;
  donutTotal: string;
  donut: DonutSegment[];
  tableTitle: string;
  tableCols: { l: string; a: ColumnAlign }[];
  /** rows: [...cells, accentColorHex] */
  tableData: (string | number)[][];
  activity: ActivityItem[];
}

/* ---------- Board (kanban) ---------- */

export interface BoardCard {
  ref: string;
  public_id?: string;
  title: string;
  sub: string;
  meta: string;
  metaIcon: string;
  av: string;
  tone: Tone;
  tag?: string;
  approvable?: boolean;
  aLabel?: string;
  bLabel?: string;
}

export interface BoardColumn {
  title: string;
  accent: string;
  count: number;
  cards: BoardCard[];
}

export interface BoardConfig {
  kind: "board";
  columns: BoardColumn[];
}

/* ---------- Settings ---------- */

export interface SettingsGroup {
  title: string;
  items: { label: string; sub: string; enabled: boolean }[];
}

export interface SettingsConfig {
  kind: "settings";
  groups: SettingsGroup[];
}

export type ScreenConfig =
  | ListConfig
  | DashboardConfig
  | BoardConfig
  | SettingsConfig;
