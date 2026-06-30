"use client";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { SettingsConfig } from "@/lib/screen-types";

export function SettingsView({ config }: { config: SettingsConfig }) {
  return (
    <div className="max-w-3xl space-y-4">
      {config.groups.map((g) => (
        <Card key={g.title}>
          <div className="border-b border-border/60 px-5 py-4 font-extrabold text-foreground">
            {g.title}
          </div>
          <div className="divide-y divide-border/50">
            {g.items.map((it) => (
              <div
                key={it.label}
                className="flex items-center justify-between px-5 py-4"
              >
                <div>
                  <div className="font-semibold text-foreground">{it.label}</div>
                  <div className="text-[13px] text-muted-foreground">
                    {it.sub}
                  </div>
                </div>
                <Switch defaultChecked={it.enabled} />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
