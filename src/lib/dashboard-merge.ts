import type { DashboardConfig, ScreenConfig } from "@/lib/screen-types";

interface MetricOverride {
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
export interface DashboardOverrides {
  metrics?: Record<string, MetricOverride>;
  donut?: DonutOverride[];
  donutTotal?: string;
  bars?: number[];
}

/**
 * Merge real KPI values from the backend onto the mock dashboard config.
 * Structure, labels, icons, colours, table and activity feed are preserved —
 * only the numeric values are substituted where the backend supplies them.
 */
export function mergeDashboard(
  mock: ScreenConfig,
  ov: DashboardOverrides | null | undefined
): ScreenConfig {
  if (mock.kind !== "dashboard" || !ov) return mock;
  const cfg: DashboardConfig = JSON.parse(JSON.stringify(mock));

  if (ov.metrics) {
    for (const m of cfg.metrics) {
      const o = ov.metrics[m.label];
      if (!o) continue;
      if (o.value != null) m.value = o.value;
      if (o.delta != null) m.delta = o.delta;
      if (o.up != null) m.up = o.up;
      if (o.sub != null) m.sub = o.sub;
    }
  }
  if (ov.donut) {
    for (const seg of cfg.donut) {
      const o = ov.donut.find((d) => d.label === seg.label);
      if (!o) continue;
      if (o.value != null) seg.value = o.value;
      if (o.pct != null) seg.pct = o.pct;
    }
  }
  if (ov.donutTotal != null) cfg.donutTotal = ov.donutTotal;
  if (ov.bars) cfg.bars = ov.bars;
  return cfg;
}
