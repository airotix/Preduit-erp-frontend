import type {
  ColumnAlign, DashboardConfig, ScreenConfig, ActivityItem,
} from "@/lib/screen-types";

interface MetricOverride {
  label?: string;
  value?: string;
  delta?: string;
  up?: boolean;
  sub?: string;
}
interface DonutOverride {
  label: string;
  value?: string;
  pct?: number;
}
interface TableOverride {
  title?: string;
  cols?: { l: string; a: ColumnAlign }[];
  rows: (string | number)[][];
}
interface AlertsOverride {
  title?: string;
  items: ActivityItem[];
}
export interface DashboardOverrides {
  /** Legacy: substitute metric values by matching label. */
  metrics?: Record<string, MetricOverride>;
  /** Positional metric override — keeps the mock's icon styling per slot. */
  metricsList?: MetricOverride[];
  donut?: DonutOverride[];
  donutTotal?: string;
  donutTitle?: string;
  bars?: number[];
  table?: TableOverride;
  alerts?: AlertsOverride;
}

function hasLiveData(ov: DashboardOverrides): boolean {
  return (
    ov.metricsList != null ||
    ov.metrics != null ||
    ov.donut != null ||
    ov.bars != null ||
    ov.table != null ||
    ov.alerts != null ||
    ov.donutTotal != null
  );
}

/** Wipe mock KPIs so an empty backend response never shows fictional numbers. */
function emptyFromMock(cfg: DashboardConfig): DashboardConfig {
  cfg.metrics = cfg.metrics.map((m) => ({
    ...m,
    value: "—",
    delta: "",
  }));
  if (cfg.bars) cfg.bars = cfg.bars.map(() => 0);
  cfg.donut = [];
  cfg.donutTotal = "0";
  cfg.tableData = [];
  cfg.activity = [];
  return cfg;
}

/**
 * Merge real values from the backend onto the mock dashboard config. Layout,
 * icons and colours are preserved; the backend supplies the live numbers,
 * table rows and per-module alerts.
 *
 * Rules when the backend is live:
 * - Empty `{}` → clear every mock KPI (never show design placeholders).
 * - Sections omitted from a partial override (e.g. no `bars`) are cleared too,
 *   so inventory/production never leave fake charts on screen.
 */
export function mergeDashboard(
  mock: ScreenConfig,
  ov: DashboardOverrides | null | undefined
): ScreenConfig {
  if (mock.kind !== "dashboard") return mock;
  const cfg: DashboardConfig = JSON.parse(JSON.stringify(mock));
  if (!ov || !hasLiveData(ov)) return emptyFromMock(cfg);

  // Metrics — positional (preferred) keeps each mock tile's icon/colour.
  if (ov.metricsList) {
    ov.metricsList.forEach((o, i) => {
      const m = cfg.metrics[i];
      if (!m) return;
      if (o.label != null) m.label = o.label;
      if (o.value != null) m.value = o.value;
      m.delta = o.delta ?? "";            // empty hides the trend pill
      if (o.up != null) m.up = o.up;
      if (o.sub != null) m.sub = o.sub;
    });
  } else if (ov.metrics) {
    for (const m of cfg.metrics) {
      const o = ov.metrics[m.label];
      if (!o) continue;
      if (o.value != null) m.value = o.value;
      if (o.delta != null) m.delta = o.delta;
      if (o.up != null) m.up = o.up;
      if (o.sub != null) m.sub = o.sub;
    }
  } else {
    cfg.metrics = cfg.metrics.map((m) => ({ ...m, value: "—", delta: "" }));
  }

  // Donut — full replace, or clear when the backend has nothing for it.
  if (ov.donut) {
    const palette = cfg.donut.map((s) => s.color);
    const fallback = ["#262B3F", "#5B6478", "#8A6D3B", "#4A6B5D", "#6E5B7B", "#C2511A"];
    cfg.donut = ov.donut.map((d, i) => ({
      label: d.label,
      value: d.value ?? "",
      pct: d.pct ?? 0,
      color: palette[i] ?? fallback[i % fallback.length],
    }));
  } else {
    cfg.donut = [];
    cfg.donutTotal = "0";
  }
  if (ov.donutTotal != null) cfg.donutTotal = ov.donutTotal;
  if (ov.donutTitle != null) cfg.donutTitle = ov.donutTitle;

  if (ov.bars) {
    cfg.bars = ov.bars;
  } else if (cfg.bars) {
    cfg.bars = cfg.bars.map(() => 0);
  }

  // Table — replace when supplied; otherwise clear mock rows.
  if (ov.table) {
    if (ov.table.title != null) cfg.tableTitle = ov.table.title;
    if (ov.table.cols != null) cfg.tableCols = ov.table.cols;
    if (ov.table.rows != null) cfg.tableData = ov.table.rows;
  } else {
    cfg.tableData = [];
  }

  // Alerts — replace when supplied; otherwise clear mock activity.
  if (ov.alerts) {
    cfg.activity = ov.alerts.items;
    cfg.activityTitle = ov.alerts.title ?? "Alerts";
  } else {
    cfg.activity = [];
  }

  return cfg;
}
