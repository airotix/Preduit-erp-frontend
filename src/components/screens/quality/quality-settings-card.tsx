"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiGet, apiPut } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { LoadingBlock, Notice } from "@/components/ui/notice";

type QualitySettings = { aql: string; options: string[]; canEdit: boolean };

/** Company-wide AQL level for new quality inspections (System Settings). */
export function QualitySettingsCard() {
  const client = useQueryClient();
  const settings = useQuery({
    queryKey: ["quality", "settings"],
    queryFn: () => apiGet<QualitySettings>("/quality/settings"),
  });
  const [choice, setChoice] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: (aql: string) => apiPut("/quality/settings", { aql }),
    onSuccess: () => {
      setChoice(null);
      client.invalidateQueries({ queryKey: ["quality"] });
    },
  });
  const data = settings.data;
  const value = choice ?? data?.aql ?? "2.5";
  return (
    <Card>
      <div className="border-b border-border/60 px-5 py-4 font-extrabold text-foreground">Quality</div>
      {settings.isLoading && <div className="p-5"><LoadingBlock rows={1} /></div>}
      {settings.isError && <div className="p-5"><Notice tone="red">Could not load the quality settings.</Notice></div>}
      {data && (
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <div className="font-semibold text-foreground">AQL level</div>
            <div className="text-[13px] text-muted-foreground">
              Acceptable quality level for every new inspection. Lower is stricter. Inspections already recorded keep the level they were created with.
            </div>
            {!data.canEdit && <div className="mt-1 text-[13px] text-muted-foreground">Only an administrator can change this.</div>}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-[120px]">
              <NativeSelect aria-label="AQL level" value={value} disabled={!data.canEdit || save.isPending}
                onChange={(e) => setChoice(e.target.value)}>
                {data.options.map((option) => <option key={option} value={option}>{option}</option>)}
              </NativeSelect>
            </div>
            {data.canEdit && (
              <Button type="button" disabled={save.isPending || value === data.aql} onClick={() => save.mutate(value)}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            )}
          </div>
          {save.isError && (
            <div className="w-full"><Notice tone="red">{save.error instanceof ApiError || save.error instanceof Error ? save.error.message : "Could not save."}</Notice></div>
          )}
        </div>
      )}
    </Card>
  );
}
