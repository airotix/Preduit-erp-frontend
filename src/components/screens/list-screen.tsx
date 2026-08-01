"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef as TanstackColumnDef } from "@tanstack/react-table";
import type { z } from "zod";
import { DataTable } from "@/components/screens/data-table";
import { AutoForm } from "@/components/screens/auto-form";
import { OrderForm } from "@/components/screens/order-form";
import { PurchaseOrderForm } from "@/components/screens/po-form";
import { ProductionStartModal } from "@/components/screens/production/production-start-modal";
import { FinanceFormSheet } from "@/components/screens/finance/finance-form-sheet";
import { Button } from "@/components/ui/button";
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
import { apiPost, apiPut, USE_BACKEND } from "@/lib/api-client";

/** module/tab → backend POST path for wired create forms. */
const CREATE_ENDPOINTS: Record<string, string> = {
  "catalog/products": "/catalog/products",
  "catalog/categories": "/catalog/categories",
  "catalog/attributes": "/catalog/attributes",
  "sales/customers": "/sales/customers",
  "sales/orders": "/sales/orders",
  "sales/invoices": "/sales/invoices",
  "sales/returns": "/sales/returns",
  "inventory/stock": "/inventory/stock",
  "inventory/locations": "/inventory/locations",
  "inventory/transfers": "/inventory/transfers",
  "inventory/alerts": "/inventory/alerts",
  "procurement/pos": "/procurement/pos",
  "procurement/receipts": "/procurement/receipts",
  "procurement/suppliers": "/procurement/suppliers",
  "finance/coa": "/finance/coa",
  "finance/journals": "/finance/journals",
  "finance/payments": "/finance/payments",
  "finance/bills": "/finance/bills",
  "production/porders": "/production/porders",
  "production/bom": "/production/bom",
  "quality/inspections": "/quality/inspections",
  "quality/defects": "/quality/defects",
  "shipments/shipments": "/shipments/shipments",
  "shipments/carriers": "/shipments/carriers",
  "admin/users": "/admin/users",
  "admin/roles": "/admin/roles",
  "admin/approvalrules": "/admin/approvalrules",
};

/** module/tab → backend PUT path builder for editable rows. */
const UPDATE_ENDPOINTS: Record<string, (id: string) => string> = {
  "finance/coa": (id) => `/finance/coa/${id}`,
  "finance/journals": (id) => `/finance/journals/${id}`,
  "finance/payments": (id) => `/finance/payments/${id}`,
  "finance/bills": (id) => `/finance/bills/${id}`,
  "catalog/products": (id) => `/catalog/products/${id}`,
  "catalog/categories": (id) => `/catalog/categories/${id}`,
  "catalog/attributes": (id) => `/catalog/attributes/${id}`,
  "sales/customers": (id) => `/sales/customers/${id}`,
  "inventory/locations": (id) => `/inventory/locations/${id}`,
  "procurement/suppliers": (id) => `/procurement/suppliers/${id}`,
  "production/bom": (id) => `/production/bom/${id}`,
  "quality/defects": (id) => `/quality/defects/${id}`,
  "shipments/carriers": (id) => `/shipments/carriers/${id}`,
  "admin/users": (id) => `/admin/users/${id}`,
  "admin/roles": (id) => `/admin/roles/${id}`,
  "admin/approvalrules": (id) => `/admin/approvalrules/${id}`,
};

/** module/tab → per-row status transition endpoint + allowed statuses. */
const STATUS_ENDPOINTS: Record<string, (id: string) => string> = {
  "sales/orders": (id) => `/sales/orders/${id}/status`,
  "sales/invoices": (id) => `/sales/invoices/${id}/status`,
  "sales/returns": (id) => `/sales/returns/${id}/status`,
  "procurement/pos": (id) => `/procurement/pos/${id}/status`,
  "procurement/receipts": (id) => `/procurement/receipts/${id}/status`,
  "inventory/transfers": (id) => `/inventory/transfers/${id}/status`,
  "quality/inspections": (id) => `/quality/inspections/${id}/status`,
  "shipments/shipments": (id) => `/shipments/shipments/${id}/status`,
};
const STATUS_OPTIONS: Record<string, string[]> = {
  "sales/orders": ["New", "Picking", "Packed", "Shipped", "Cancelled"],
  "sales/invoices": ["Open", "Paid", "Overdue", "Void"],
  "sales/returns": ["Inspecting", "Refunded", "Rejected"],
  "procurement/pos": ["Pending approval", "Approved", "Rejected", "Received"],
  "procurement/receipts": ["Expected", "Partial", "Complete"],
  "inventory/transfers": ["Draft", "In transit", "Received", "Cancelled"],
  "quality/inspections": ["Pending", "Pass", "Fail"],
  "shipments/shipments": ["Label created", "In transit", "Customs", "Out for delivery", "Delivered"],
};

/** module/tab → a bulk action button (no create form). */
interface ActionConfig {
  path: string;
  title: string;
  body: string;
  confirm: string;
  result: (d: { count: number; total: number }) => string;
}
const ACTION_ENDPOINTS: Record<string, ActionConfig> = {
  "finance/araging": {
    path: "/finance/araging/send-reminders",
    title: "Send payment reminders",
    body: "Send a reminder to every customer with an overdue balance. Each reminder is recorded in the audit log.",
    confirm: "Send reminders",
    result: (d) =>
      `Sent ${d.count} reminder${d.count === 1 ? "" : "s"} · €${Math.round(d.total).toLocaleString()} overdue`,
  },
  "finance/apaging": {
    path: "/finance/apaging/schedule-payments",
    title: "Schedule payments",
    body: "Schedule a payment for every supplier with an outstanding balance. Each is recorded in the audit log.",
    confirm: "Schedule payments",
    result: (d) =>
      `Scheduled ${d.count} payment${d.count === 1 ? "" : "s"} · €${Math.round(d.total).toLocaleString()}`,
  },
};

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
  const [editIndex, setEditIndex] = React.useState<number | null>(null);
  const [actionResult, setActionResult] = React.useState<string | null>(null);
  const detailType = detailTypeFor(module, tab);
  const router = useRouter();
  const queryClient = useQueryClient();

  const key = `${module}/${tab}`;
  const updateBuilder = UPDATE_ENDPOINTS[key];
  const canEdit =
    USE_BACKEND &&
    !!schema &&
    !!updateBuilder &&
    !!config.records?.length &&
    !!config.ids?.length;

  const openRecord = React.useCallback(
    (row: Row) => {
      const index = config.rows.indexOf(row);
      if (index >= 0) router.push(`/${module}/${tab}/${index}`);
    },
    [config.rows, module, tab, router]
  );

  // Save = create (editIndex null) or update (editIndex set).
  const save = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      if (editIndex != null) {
        const id = config.ids?.[editIndex];
        if (USE_BACKEND && updateBuilder && id) {
          return apiPut(updateBuilder(id), values);
        }
        await delay(400);
        return values;
      }
      const path = CREATE_ENDPOINTS[key];
      if (USE_BACKEND && path) {
        return apiPost(path, values);
      }
      await delay(400);
      return values;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["screen", module, tab] });
      setOpen(false);
      setEditIndex(null);
    },
  });

  // Bulk action (e.g. Send reminders / Schedule payments) — no create form.
  const actionConfig = !schema ? ACTION_ENDPOINTS[key] : undefined;
  const runAction = useMutation({
    mutationFn: async () => {
      if (USE_BACKEND && actionConfig) {
        return apiPost<{ count: number; total: number }>(actionConfig.path, {});
      }
      await delay(400);
      return { count: 0, total: 0 };
    },
    onSuccess: (d) => {
      if (actionConfig) setActionResult(actionConfig.result(d));
      queryClient.invalidateQueries({ queryKey: ["screen", module, tab] });
    },
  });

  // Per-row status transitions (document tabs).
  const statusBuilder = STATUS_ENDPOINTS[key];
  const statusOpts = STATUS_OPTIONS[key];
  const canStatus = USE_BACKEND && !!statusBuilder && !!statusOpts && !!config.ids?.length;
  const rowStatuses = config.records?.map(
    (r) => (r as { status?: string } | undefined)?.status
  );
  const setStatus = useMutation({
    mutationFn: async ({ index, status }: { index: number; status: string }) => {
      const id = config.ids?.[index];
      if (USE_BACKEND && statusBuilder && id) {
        return apiPost(statusBuilder(id), { status });
      }
      await delay(300);
      return null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["screen", module, tab] }),
  });

  const isEdit = editIndex != null;
  const defaultValues = isEdit ? config.records?.[editIndex] : undefined;
  // Sales orders + purchase orders use bespoke multi-line create forms.
  const isOrderCreate = !isEdit && module === "sales" && tab === "orders";
  const isPOCreate = !isEdit && module === "procurement" && tab === "pos";
  // Production orders get a per-row "Start production" button + modal.
  const isProductionOrders = module === "production" && tab === "porders";
  const [startOrderId, setStartOrderId] = React.useState<string | null>(null);
  const [shipOrderId, setShipOrderId] = React.useState<string | null>(null);
  const shipOrder = useMutation({
    mutationFn: (v: Record<string, string | number>) =>
      apiPost(`/production/porders/${shipOrderId}/ship`, {
        carrier: v.carrier, destination: v.destination, eta: v.eta || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["screen", "production", "porders"] });
      queryClient.invalidateQueries({ queryKey: ["screen", "shipments"] });
      setShipOrderId(null);
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
        onAction={() => {
          setEditIndex(null);
          setActionResult(null);
          setOpen(true);
        }}
        onRowClick={detailType ? openRecord : undefined}
        onStartRow={
          isProductionOrders && USE_BACKEND
            ? (i) => setStartOrderId(config.ids?.[i] ?? null)
            : undefined
        }
        startableRows={
          isProductionOrders
            ? config.records?.map((r) => !(r as { started?: boolean })?.started)
            : undefined
        }
        onShipRow={
          isProductionOrders && USE_BACKEND
            ? (i) => setShipOrderId(config.ids?.[i] ?? null)
            : undefined
        }
        shippableRows={
          isProductionOrders
            ? config.records?.map((r) => {
                const rec = r as { shippable?: boolean; shipped?: boolean };
                return !!rec?.shippable && !rec?.shipped;
              })
            : undefined
        }
        onEditRow={
          canEdit
            ? (i) => {
                setEditIndex(i);
                setOpen(true);
              }
            : undefined
        }
        statusOptions={canStatus ? statusOpts : undefined}
        rowStatuses={canStatus ? rowStatuses : undefined}
        onStatusChange={
          canStatus ? (i, s) => setStatus.mutate({ index: i, status: s }) : undefined
        }
      />

      <Sheet
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditIndex(null);
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {isEdit ? "Edit details" : actionConfig ? actionConfig.title : actionLabel}
            </SheetTitle>
            <SheetDescription>
              {schema
                ? isEdit
                  ? "Update the details below and save your changes."
                  : "Fill in the details below. Validated with Zod."
                : actionConfig
                  ? actionConfig.body
                  : "Create form for this entity is not yet defined."}
            </SheetDescription>
          </SheetHeader>
          {isOrderCreate ? (
            <OrderForm
              pending={save.isPending}
              onSubmit={(v) => save.mutate(v as unknown as Record<string, unknown>)}
            />
          ) : isPOCreate ? (
            <PurchaseOrderForm
              pending={save.isPending}
              onSubmit={(v) => save.mutate(v as unknown as Record<string, unknown>)}
            />
          ) : schema ? (
            <AutoForm
              key={isEdit ? `edit-${editIndex}` : "create"}
              schema={schema}
              submitLabel={isEdit ? "Save changes" : actionLabel}
              pending={save.isPending}
              defaultValues={defaultValues}
              onSubmit={(v) => save.mutate(v as Record<string, unknown>)}
            />
          ) : actionConfig ? (
            <div className="space-y-4 px-6 py-6">
              {actionResult && (
                <div className="rounded-md bg-[#EAF7EF] p-3 text-sm font-semibold text-[#2E9E6B]">
                  {actionResult}
                </div>
              )}
              <Button onClick={() => runAction.mutate()} disabled={runAction.isPending}>
                {runAction.isPending ? "Working…" : actionConfig.confirm}
              </Button>
            </div>
          ) : (
            <div className="px-6 py-10 text-sm text-muted-foreground">
              No schema registered for <code>{module}/{tab}</code>.
            </div>
          )}
        </SheetContent>
      </Sheet>

      {isProductionOrders && (
        <ProductionStartModal
          open={!!startOrderId}
          onOpenChange={(o) => { if (!o) setStartOrderId(null); }}
          orderId={startOrderId ?? ""}
          onStarted={() => {
            queryClient.invalidateQueries({ queryKey: ["screen", module, tab] });
            setStartOrderId(null);
          }}
        />
      )}

      {isProductionOrders && (
        <FinanceFormSheet
          open={!!shipOrderId}
          onOpenChange={(o) => { if (!o) setShipOrderId(null); }}
          title="Send shipment"
          description="Log this completed order as a shipment."
          submitLabel="Create shipment"
          pending={shipOrder.isPending}
          onSubmit={(v) => shipOrder.mutate(v)}
          fields={[
            { name: "carrier", label: "Carrier", required: true, placeholder: "DHL Express" },
            { name: "destination", label: "Destination", required: true, placeholder: "Paris, FR" },
            { name: "eta", label: "ETA", placeholder: "e.g. 12 Aug" },
          ]}
        />
      )}
    </>
  );
}
