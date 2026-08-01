"use client";

import * as React from "react";
import { Upload, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiGet, apiUpload, apiUrl, USE_BACKEND } from "@/lib/api-client";

interface Doc {
  public_id: string;
  doc_id: string;
  filename: string;
  content_type?: string;
  size_bytes: number;
  created_at?: string;
}

function isImage(d: Doc): boolean {
  if (d.content_type?.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(d.filename);
}

function humanSize(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} MB`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} KB`;
  return `${n} B`;
}

/**
 * Reusable attachments panel — lists and uploads files for a record via the
 * generic /documents service. Files get a module-prefixed doc id (e.g. PRC-000042).
 */
export function DocumentsPanel({
  module,
  entityRef,
  entityType,
}: {
  module: string;
  entityRef: string;
  entityType?: string;
}) {
  const [docs, setDocs] = React.useState<Doc[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    if (!USE_BACKEND) return;
    try {
      const q = `?module=${encodeURIComponent(module)}&entity_ref=${encodeURIComponent(entityRef)}`;
      setDocs(await apiGet<Doc[]>(`/documents${q}`));
    } catch {
      /* leave list as-is */
    }
  }, [module, entityRef]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("module", module);
      form.append("entity_ref", entityRef);
      if (entityType) form.append("entity_type", entityType);
      form.append("file", file);
      await apiUpload("/documents/upload", form);
      await load();
    } catch {
      setError("Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          Documents
        </div>
        <input ref={inputRef} type="file" className="hidden" onChange={onFile} />
        <Button size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Upload size={15} strokeWidth={2} /> {busy ? "Uploading…" : "Upload"}
        </Button>
      </div>

      {error && <div className="text-sm font-semibold text-destructive">{error}</div>}

      {docs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 py-10 text-center text-[13px] text-muted-foreground">
          No documents yet. Upload one to attach it to this record.
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <div
              key={d.public_id}
              className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {isImage(d) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={apiUrl(`/documents/${d.public_id}/download`)}
                    alt={d.filename}
                    className="h-9 w-9 rounded-lg border border-border/60 object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <FileText size={16} />
                  </span>
                )}
                <div>
                  <div className="font-semibold text-foreground">{d.filename}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.doc_id} · {humanSize(d.size_bytes)}
                  </div>
                </div>
              </div>
              <a
                href={apiUrl(`/documents/${d.public_id}/download`)}
                className="inline-flex items-center gap-1 rounded-md border border-border/70 px-2.5 py-1.5 text-[12px] font-semibold text-[#4A4F61] hover:bg-muted"
              >
                <Download size={13} strokeWidth={2} /> Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
