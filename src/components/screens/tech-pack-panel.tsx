"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Download } from "lucide-react";
import { apiGet, apiPost, apiUpload, apiUrl, USE_BACKEND } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";
import { ToneBadge } from "@/components/tone-badge";

export interface TechPack {
  status: "Pending" | "Received";
  productPublicId?: string | null;
  approvalOwner?: "catalog" | "production";
  approvedRevision?: number | null;
  pendingRevision?: { id: string; revision: number; status: string; approvedBy?: string | null;
    document: { public_id: string; filename: string; size_bytes: number } | null } | null;
  revisions?: { id: string; revision: number; status: string; approvedBy?: string | null;
    document: { public_id: string; filename: string; size_bytes: number } | null }[];
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
      if (!file.name.toLowerCase().endsWith(".pdf")) throw new Error("Tech packs must be PDF files.");
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
  const approve = useMutation({
    mutationFn: (revisionId: string) => apiPost<TechPack>(`${path}/revisions/${revisionId}/approve`, {}),
    onSuccess: (pack) => {
      qc.setQueryData(["tech-pack", module, articleId || lineId], pack);
      qc.invalidateQueries({ queryKey: ["tech-pack"] });
      qc.invalidateQueries({ queryKey: ["screen", "production"] });
      qc.invalidateQueries({ queryKey: ["production"] });
      qc.invalidateQueries({ queryKey: ["detail"] });
    },
  });
  const canApprove = canWrite && data?.pendingRevision && data.approvalOwner === module;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToneBadge tone={data?.status === "Received" ? "green" : "amber"} dot={false}>
          {data?.approvedRevision ? `Approved revision ${data.approvedRevision}` : "No approved Tech Pack"}
        </ToneBadge>
        {data?.document && <span className="break-all text-sm font-semibold">{data.document.filename}</span>}
      </div>
      {!data?.document && <p className="text-sm text-muted-foreground">Production uses a Tech Pack only after its revision is approved.</p>}
      {data?.pendingRevision && <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
        <div className="font-semibold">Revision {data.pendingRevision.revision} awaiting approval</div>
        <div className="mt-1">{data.pendingRevision.document?.filename ?? "PDF unavailable"}</div>
        {canApprove ? <button type="button" disabled={approve.isPending}
          onClick={() => approve.mutate(data.pendingRevision!.id)}
          className="mt-2 rounded-md bg-[#23263A] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
          {approve.isPending ? "Approving…" : "Approve revision"}
        </button> : data.approvalOwner === "catalog" && data.productPublicId ?
          <Link href={`/catalog/products/${data.productPublicId}`} className="mt-2 inline-block text-xs font-semibold underline">Open article in Catalog for approval</Link> : null}
      </div>}
      <div className="flex flex-wrap items-center gap-2">
        <label title={!canWrite ? reason || undefined : undefined}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold ${canWrite && !upload.isPending ? "cursor-pointer hover:bg-muted" : "opacity-50"}`}>
          <Upload size={14} /> {upload.isPending ? "Uploading…" : "Upload new revision"}
          <input type="file" className="hidden" disabled={!USE_BACKEND || !canWrite || upload.isPending}
            accept=".pdf,application/pdf"
            onChange={(event) => { const file = event.target.files?.[0]; if (file) upload.mutate(file); event.target.value = ""; }} />
        </label>
        {data?.document && <a href={apiUrl(`/documents/${data.document.public_id}/download`)}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold hover:bg-muted">
          <Download size={14} /> Download
        </a>}
      </div>
      {!!data?.revisions?.length && <div className="space-y-1 border-t border-border/60 pt-2 text-xs">
        <div className="font-semibold text-muted-foreground">Revision history</div>
        {data.revisions.map((revision) => <div key={revision.id} className="flex flex-wrap items-center gap-2">
          <span>r{revision.revision} · {revision.status}</span>
          <span>{revision.document?.filename ?? "File unavailable"}</span>
          {revision.document && <a className="font-semibold underline" href={apiUrl(`/documents/${revision.document.public_id}/download`)}>Download</a>}
          {revision.approvedBy && <span className="text-muted-foreground">Approved by {revision.approvedBy}</span>}
        </div>)}
      </div>}
      {(upload.error || approve.error || error) && <p role="alert" className="text-sm text-destructive">{(upload.error || approve.error || error)?.message}</p>}
    </div>
  );
}
