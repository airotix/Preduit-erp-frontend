"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Download } from "lucide-react";
import { apiGet, apiUpload, apiUrl, USE_BACKEND } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";
import { ToneBadge } from "@/components/tone-badge";

export interface TechPack {
  status: "Pending" | "Received";
  productPublicId?: string | null;
  document: { public_id: string; filename: string; size_bytes: number } | null;
}

/** Catalog and production use the same attachment and Received status. */
export function TechPackPanel({ articleId, lineId, initialData }: {
  articleId?: string; lineId?: string; initialData?: TechPack;
}) {
  const module = articleId ? "catalog" : "production";
  const { canWrite, reason } = useModuleAccess(module);
  const qc = useQueryClient();
  const path = articleId ? `/catalog/products/${articleId}/tech-pack` : `/production/lines/${lineId}/tech-pack`;
  const { data, error } = useQuery<TechPack>({
    queryKey: ["tech-pack", module, articleId || lineId],
    queryFn: () => apiGet<TechPack>(path), initialData,
    enabled: USE_BACKEND && !!(articleId || lineId),
  });
  const upload = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return apiUpload<TechPack>(path, form);
    },
    onSuccess: (pack) => {
      qc.setQueryData(["tech-pack", module, articleId || lineId], pack);
      qc.invalidateQueries({ queryKey: ["tech-pack"] });
      qc.invalidateQueries({ queryKey: ["screen", "production"] });
      qc.invalidateQueries({ queryKey: ["production"] });
      qc.invalidateQueries({ queryKey: ["detail"] });
    },
  });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToneBadge tone={data?.status === "Received" ? "green" : "amber"} dot={false}>
          {data?.status || "Pending"}
        </ToneBadge>
        {data?.document && <span className="break-all text-sm font-semibold">{data.document.filename}</span>}
      </div>
      {!data?.document && <p className="text-sm text-muted-foreground">Upload the tech pack to mark this stage Received.</p>}
      <div className="flex flex-wrap items-center gap-2">
        <label title={!canWrite ? reason || undefined : undefined}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold ${canWrite && !upload.isPending ? "cursor-pointer hover:bg-muted" : "opacity-50"}`}>
          <Upload size={14} /> {upload.isPending ? "Uploading…" : data?.document ? "Replace tech pack" : "Upload tech pack"}
          <input type="file" className="hidden" disabled={!USE_BACKEND || !canWrite || upload.isPending}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.csv,.txt"
            onChange={(event) => { const file = event.target.files?.[0]; if (file) upload.mutate(file); event.target.value = ""; }} />
        </label>
        {data?.document && <a href={apiUrl(`/documents/${data.document.public_id}/download`)}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold hover:bg-muted">
          <Download size={14} /> Download
        </a>}
      </div>
      {(upload.error || error) && <p role="alert" className="text-sm text-destructive">{(upload.error || error)?.message}</p>}
    </div>
  );
}
