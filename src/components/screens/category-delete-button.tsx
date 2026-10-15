"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { apiDelete } from "@/lib/api-client";

export function CategoryDeleteButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = React.useState(false);
  const remove = useMutation({
    mutationFn: () => apiDelete(`/catalog/categories/${id}`),
    onSuccess: () => setOpen(false),
  });
  return <>
    <button type="button" onClick={(event) => { event.stopPropagation(); remove.reset(); setOpen(true); }}
      className="inline-flex items-center gap-1 rounded-md border border-border/70 px-2 py-1 text-[12px] font-semibold text-destructive hover:bg-muted"
      aria-label={`Delete category ${name}`}>
      <Trash2 size={13} /> Delete
    </button>
    <Sheet open={open} onOpenChange={(value) => { if (!remove.isPending) setOpen(value); }}>
      <SheetContent onClick={(event) => event.stopPropagation()}>
        <SheetHeader>
          <SheetTitle>Delete category</SheetTitle>
          <SheetDescription>Delete “{name}”? Categories with linked articles or child categories must be reassigned before deletion. Articles and inventory are preserved.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-6 py-6">
          {remove.isError && <p role="alert" className="text-sm text-destructive">{remove.error.message}</p>}
          <div className="flex gap-3">
            <Button variant="outline" disabled={remove.isPending} onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={remove.isPending} onClick={() => remove.mutate()}>
              {remove.isPending ? "Deleting…" : "Delete category"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </>;
}
