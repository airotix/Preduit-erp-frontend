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

/**
 * Merge real values from the backend onto the mock dashboard config. Layout,
 * icons and colours are preserved; the backend supplies the live numbers,
 * table rows and per-module alerts.
 */
export function mergeDashboard(
  mock: ScreenConfig,
  ov: DashboardOverrides | null | undefined
): ScreenConfig {
  if (mock.kind !== "dashboard" || !ov) return mock;
  const cfg: DashboardConfig = JSON.parse(JSON.stringify(mock));

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
  }

  // Donut — full replace, reusing the mock palette by index.
  if (ov.donut) {
    const palette = cfg.donut.map((s) => s.color);
    const fallback = ["#262B3F", "#5B6478", "#8A6D3B", "#4A6B5D", "#6E5B7B", "#C2511A"];
    cfg.donut = ov.donut.map((d, i) => ({
      label: d.label,
      value: d.value ?? "",
      pct: d.pct ?? 0,
      color: palette[i] ?? fallback[i % fallback.length],
    }));
  }
  if (ov.donutTotal != null) cfg.donutTotal = ov.donutTotal;
  if (ov.donutTitle != null) cfg.donutTitle = ov.donutTitle;
  if (ov.bars) cfg.bars = ov.bars;

  // Table — replace title / columns / rows when supplied.
  if (ov.table) {
    if (ov.table.title != null) cfg.tableTitle = ov.table.title;
    if (ov.table.cols != null) cfg.tableCols = ov.table.cols;
    if (ov.table.rows != null) cfg.tableData = ov.table.rows;
  }

  // Alerts — replace the activity feed + its section title.
  if (ov.alerts) {
    cfg.activity = ov.alerts.items;
    cfg.activityTitle = ov.alerts.title ?? "Alerts";
  }

  return cfg;
}
