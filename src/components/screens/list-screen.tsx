"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef as TanstackColumnDef } from "@tanstack/react-table";
import type { z } from "zod";
import { DataTable } from "@/components/screens/data-table";
import { AutoForm } from "@/components/screens/auto-form";
import { detailTypeFor } from "@/config/detail-types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { ListConfig, Row } from "@/lib/screen-types";
import { delay } from "@/lib/mock-fetch";

interface ListScreenProps {
  module: string;
  tab: string;
  config: ListConfig;
  columns: TanstackColumnDef<Row>[];
  schema?: z.ZodObject<z.ZodRawShape>;
  actionLabel: string;
}

export function ListScreen({
  module,
  tab,
  config,
  columns,
  schema,
  actionLabel,
}: ListScreenProps) {
  const [open, setOpen] = React.useState(false);
  const detailType = detailTypeFor(module, tab);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Clicking a row navigates to its full detail page (with sub-tabs),
  // matching the original Apparel ERP HTML, instead of a slide-over.
  const openRecord = React.useCallback(
    (row: Row) => {
      const index = config.rows.indexOf(row);
      if (index >= 0) router.push(`/${module}/${tab}/${index}`);
    },
    [config.rows, module, tab, router]
  );

  // Optimistic-friendly create mutation against the in-memory store.
  const create = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      await delay(400);
      return values;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["screen", module, tab] });
      setOpen(false);
    },
  });

  return (
    <>
      <DataTable
        columns={columns}
        data={config.rows}
        searchPlaceholder={config.search}
        filters={config.filters}
        actionLabel={actionLabel}
        total={config.total}
        onAction={() => setOpen(true)}
        onRowClick={detailType ? openRecord : undefined}
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{actionLabel}</SheetTitle>
            <SheetDescription>
              {schema
                ? "Fill in the details below. Validated with Zod."
                : "Create form for this entity is not yet defined."}
            </SheetDescription>
          </SheetHeader>
          {schema ? (
            <AutoForm
              schema={schema}
              submitLabel={actionLabel}
              pending={create.isPending}
              onSubmit={(v) => create.mutate(v as Record<string, unknown>)}
            />
          ) : (
            <div className="px-6 py-10 text-sm text-muted-foreground">
              No schema registered for <code>{module}/{tab}</code>.
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
