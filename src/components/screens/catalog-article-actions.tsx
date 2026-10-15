"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { CatalogArticleResolutionDialog } from "@/components/screens/catalog-article-resolution-dialog";

export function CatalogArticleActions({ id, canWrite, onEdit, onDeleted, onResolved }: {
  id: string;
  canWrite: boolean;
  onEdit: () => void;
  onDeleted: () => void;
  onResolved?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [resolving, setResolving] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, right: 0 });

  React.useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node) &&
          !triggerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    const closeOnScroll = () => setOpen(false);
    window.addEventListener("scroll", closeOnScroll, true);
    window.addEventListener("resize", closeOnScroll);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", closeOnScroll, true);
      window.removeEventListener("resize", closeOnScroll);
    };
  }, [open]);

  return <>
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button ref={triggerRef} type="button" aria-label="More article actions" aria-expanded={open}
        onClick={() => {
          const rect = triggerRef.current?.getBoundingClientRect();
          if (rect) setMenuPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
          setOpen((value) => !value);
        }}
        className="inline-flex items-center gap-1 rounded-md border border-border/70 px-2 py-1 text-[12px] font-semibold text-[#4A4F61] hover:bg-muted">
        <MoreHorizontal size={15} /> More
      </button>
      {open && typeof document !== "undefined" && createPortal(<div ref={menuRef} style={menuPosition}
        className="fixed z-[90] min-w-36 rounded-md border border-border bg-white p-1 shadow-lg">
        <button type="button" disabled={!canWrite} onClick={() => { setOpen(false); onEdit(); }}
          className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50">
          <Pencil size={14} /> Edit
        </button>
        <button type="button" disabled={!canWrite} onClick={() => { setOpen(false); setResolving(true); }}
          className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:opacity-50">
          <Trash2 size={14} /> Delete
        </button>
      </div>, document.body)}
    </div>
    {resolving && <CatalogArticleResolutionDialog id={id}
      onClose={() => setResolving(false)} onDeleted={() => { setResolving(false); onDeleted(); }}
      onResolved={onResolved} />}
  </>;
}
