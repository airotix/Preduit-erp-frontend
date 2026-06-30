"use client";

import {
  Bar,
  BarChart,
  Cell as RCell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  Tooltip,
} from "recharts";
import { Icon } from "@/components/icon";
import { Card } from "@/components/ui/card";
import type { DashboardConfig } from "@/lib/screen-types";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function DashboardView({ config }: { config: DashboardConfig }) {
  const barData = config.bars.map((v, i) => ({ m: MONTHS[i], v }));
  const maxBar = Math.max(...config.bars);

  return (
    <div className="space-y-4">
      {/* metric tiles */}
      <div className="grid grid-cols-4 gap-4">
        {config.metrics.map((m) => (
          <Card key={m.label} className="p-5">
            <div className="flex items-start justify-between">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: m.iconBg, color: m.iconColor }}
              >
                <Icon name={pascal(m.icon)} size={20} strokeWidth={1.9} />
              </div>
              <span
                className="flex items-center gap-1 text-[13px] font-bold"
                style={{ color: m.up ? "#1F7A53" : "#C0392B" }}
              >
                <Icon
                  name={m.up ? "TrendingUp" : "TrendingDown"}
                  size={15}
                  strokeWidth={2.2}
                />
                {m.delta}
              </span>
            </div>
            <div className="mt-4 text-[27px] font-extrabold tracking-tight text-foreground">
              {m.value}
            </div>
            <div className="text-[13px] font-semibold text-muted-foreground">
              {m.label}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground/80">{m.sub}</div>
          </Card>
        ))}
      </div>

      {/* chart + donut */}
      <div className="grid grid-cols-[1.7fr_1fr] gap-4">
        <Card className="p-5">
          <div className="mb-1 text-base font-extrabold text-foreground">
            {config.chartTitle}
          </div>
          <div className="text-[13px] text-muted-foreground">
            {config.chartSub}
          </div>
          <div className="mt-5 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barCategoryGap="28%">
                <XAxis
                  dataKey="m"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#9499A6", fontWeight: 700 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(38,43,63,0.04)" }}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #ECEDF1",
                    fontSize: 12,
                    boxShadow: "0 6px 18px rgba(38,43,63,0.10)",
                  }}
                  formatter={(v) => [`${v}%`, "vs target"]}
                />
                <Bar dataKey="v" radius={[6, 6, 0, 0]}>
                  {barData.map((d, i) => (
                    <RCell
                      key={i}
                      fill={d.v === maxBar ? "#F36523" : "#D8DBE3"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="flex flex-col p-5">
          <div className="mb-4 text-base font-extrabold text-foreground">
            {config.donutTitle}
          </div>
          <div className="relative mx-auto h-[170px] w-[170px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={config.donut}
                  dataKey="pct"
                  innerRadius={56}
                  outerRadius={82}
                  paddingAngle={2}
                  stroke="none"
                >
                  {config.donut.map((s, i) => (
                    <RCell key={i} fill={s.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[22px] font-extrabold text-foreground">
                {config.donutTotal}
              </span>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Total
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {config.donut.map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between text-[13px]"
              >
                <span className="flex items-center gap-2 text-[#3A4150]">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ background: s.color }}
                  />
                  {s.label}
                </span>
                <span className="font-bold tabular text-foreground">
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* table + activity */}
      <div className="grid grid-cols-[1.7fr_1fr] gap-4">
        <Card className="p-5">
          <div className="mb-4 text-base font-extrabold text-foreground">
            {config.tableTitle}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr>
                {config.tableCols.map((c) => (
                  <th
                    key={c.l}
                    className="pb-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground"
                    style={{ textAlign: c.a }}
                  >
                    {c.l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {config.tableData.map((row, i) => {
                const accent = row[row.length - 1] as string;
                const cells = row.slice(0, -1);
                return (
                  <tr key={i} className="border-t border-border/50">
                    {cells.map((cell, j) => (
                      <td
                        key={j}
                        className="py-2.5 text-[#3A4150]"
                        style={{ textAlign: config.tableCols[j]?.a }}
                      >
                        {j === 0 ? (
                          <span className="flex items-center gap-2.5 font-semibold text-foreground">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ background: accent }}
                            />
                            {cell}
                          </span>
                        ) : (
                          <span className={j >= 2 ? "tabular" : ""}>{cell}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card className="p-5">
          <div className="mb-4 text-base font-extrabold text-foreground">
            Recent activity
          </div>
          <div className="space-y-3.5">
            {config.activity.map((a, i) => (
              <div key={i} className="flex gap-3">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ background: a.bg, color: a.color }}
                >
                  <Icon name={pascal(a.icon)} size={16} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] leading-snug text-[#3A4150]">
                    {a.text}
                  </div>
                  <div className="text-xs text-muted-foreground">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/** Convert kebab lucide names ("trending-up") to PascalCase ("TrendingUp"). */
function pascal(s: string) {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}
