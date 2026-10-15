"use client";
import { BatchWorkList } from "./production/batch-workspace";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef as TanstackColumnDef } from "@tanstack/react-table";
import type { z } from "zod";
import { DataTable } from "@/components/screens/data-table";
import { AutoForm } from "@/components/screens/auto-form";
import { CategoryDeleteButton } from "@/components/screens/category-delete-button";
import { CatalogArticleActions } from "@/components/screens/catalog-article-actions";
import { OrderForm } from "@/components/screens/order-form";
import { CreateShortagePOButton } from "@/components/screens/sales/order-fulfillment";
import { PurchaseOrderForm } from "@/components/screens/po-form";
import { QCReopenDialog } from "@/components/screens/qc-reopen-dialog";
import type { DetailModel } from "@/modules/detail/detail-data";
import { InspectionForm } from "@/components/screens/inspection-form";
import { TransferForm } from "@/components/screens/transfer-form";
import { StockReceiptForm } from "@/components/screens/stock-receipt-form";
import { WarehouseReceivingPanel } from "@/components/screens/warehouse-receiving-panel";
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
import { apiGet, apiPost, apiPut, USE_BACKEND } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";
import { buildColumns } from "@/lib/build-columns";

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
  // PO status changes happen in the Approval queue, not the main list.
  "procurement/receipts": (id) => `/procurement/receipts/${id}/status`,
  "inventory/transfers": (id) => `/inventory/transfers/${id}/status`,
  // Inspection results are decided inside the per-item workspace (Start →
  // Complete), not via an inline status dropdown on the grouped list.
  "shipments/shipments": (id) => `/shipments/shipments/${id}/status`,
};
const STATUS_OPTIONS: Record<string, string[]> = {
  "sales/orders": ["New", "Packed", "Shipped", "Cancelled"],
  "sales/invoices": ["Open", "Paid", "Overdue", "Void"],
  "sales/returns": ["Inspecting", "Refunded", "Rejected"],
  "inventory/transfers": ["Draft", "In transit", "Received", "Cancelled"],
  "quality/inspections": ["Pending", "Pass", "Fail"],
  "shipments/shipments": ["Pending", "Label created", "Dispatched", "In transit", "Customs", "Out for delivery", "Delivered"],
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
  const [editRecord, setEditRecord] = React.useState<{ id: string; values: Record<string, unknown> } | null>(null);
  const [actionResult, setActionResult] = React.useState<string | null>(null);
  const detailType = detailTypeFor(module, tab);
  const router = useRouter();
  const queryClient = useQueryClient();
  // View-only roles (core/roles.py <module>.read without .write) keep every
  // write action out of reach: New/Edit/status-change/Start/Ship. The "+ New"
  // button stays visible-but-disabled with a tooltip; row-level icon actions
  // are simply omitted, consistent with how they're already conditionally
  // shown per row based on business state (e.g. startableRows).
  const { canWrite, reason } = useModuleAccess(module);

  const key = `${module}/${tab}`;
  const updateBuilder = UPDATE_ENDPOINTS[key];
  const canEdit =
    USE_BACKEND &&
    !!schema &&
    !!updateBuilder &&
    !!config.records?.length &&
    !!config.ids?.length &&
    canWrite;

  const openRecord = React.useCallback(
    (row: Row) => {
      const index = config.rows.indexOf(row);
      if (index >= 0) router.push(`/${module}/${tab}/${USE_BACKEND ? config.ids?.[index] ?? index : index}`);
    },
    [config.rows, config.ids, module, tab, router]
  );

  // Save = create (editIndex null) or update (editIndex set).
  const save = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      if (editIndex != null) {
        const id = editRecord?.id;
        if (USE_BACKEND && updateBuilder && id) {
          return apiPut(updateBuilder(id), values);
        }
        await delay(400);
        return values;
      }
      // A PO raised from Reorder Alerts is a real procurement PO.
      const path = isReorderPOCreate ? "/procurement/pos" : CREATE_ENDPOINTS[key];
      if (USE_BACKEND && path) {
        return apiPost(path, values);
      }
      await delay(400);
      return values;
    },
    onSuccess: (result) => {
      if (module === "inventory" && tab === "stock") {
        setActionResult(`Received ${(result as { received?: number })?.received ?? 0} units into inventory.`);
      }
      if (module === "inventory" && tab === "transfers") {
        setActionResult("Stock transferred successfully.");
        for (const key of [["screen", "inventory"], ["screen", "catalog"], ["inventory"], ["catalog"], ["detail"]]) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["screen", module, tab] });
      if (module === "finance" || isPOCreate || isReorderPOCreate) {
        queryClient.invalidateQueries({ queryKey: ["finance"] });
      }
      if (module === "catalog" && tab === "products") {
        queryClient.invalidateQueries({ queryKey: ["catalog", "season-names"] });
      }
      if (module === "sales" && tab === "orders") {
        for (const key of [["screen", "inventory"], ["screen", "shipments"], ["screen", "sales"], ["finance"]]) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
      if (module === "inventory" && tab === "stock") {
        for (const key of [["screen", "catalog"], ["catalog"], ["inventory"], ["screen", "sales"], ["sales"], ["screen", "shipments"]]) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
      if (module === "procurement" && tab === "receipts") {
        for (const key of [["screen", "sales"], ["screen", "shipments"], ["screen", "inventory"], ["screen", "procurement"]]) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
      // PO raised from Reorder Alerts must refresh the Procurement PO list too.
      if (isReorderPOCreate) {
        queryClient.invalidateQueries({ queryKey: ["screen", "procurement", "pos"] });
      }
      if (isPOCreate || isReorderPOCreate) {
        queryClient.invalidateQueries({ queryKey: ["procurement", "invoices"] });
        queryClient.invalidateQueries({ queryKey: ["screen", "production"] });
        queryClient.invalidateQueries({ queryKey: ["production"] });
      }
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
  const canStatus = USE_BACKEND && !!statusBuilder && !!statusOpts && !!config.ids?.length && canWrite;
  const rowStatuses = config.records?.map(
    (r) => (r as { status?: string } | undefined)?.status
  );
  const [failedInspectionId, setFailedInspectionId] = React.useState<string | null>(null);
  const { data: failedInspection } = useQuery({
    queryKey: ["quality", "recovery", failedInspectionId],
    queryFn: () => apiGet<DetailModel>(`/quality/inspections/${failedInspectionId}/detail`),
    enabled: !!failedInspectionId,
  });
  const setStatus = useMutation({
    mutationFn: async ({ index, status }: { index: number; status: string }) => {
      const id = config.ids?.[index];
      if (USE_BACKEND && statusBuilder && id) {
        return apiPost(statusBuilder(id), { status });
      }
      await delay(300);
      return null;
    },
    onSuccess: (_, variables) => {
      if (module === "procurement" && tab === "pos") {
        for (const key of [["screen", "production"], ["production"], ["screen", "quality"], ["screen", "sales"], ["detail"]]) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
      if (module === "finance") queryClient.invalidateQueries({ queryKey: ["finance"] });
      if (module === "quality" && tab === "inspections" && variables.status === "Fail") {
        setFailedInspectionId(config.ids?.[variables.index] ?? null);
      }
      queryClient.invalidateQueries({ queryKey: ["screen", module, tab] });
      if (module === "sales" || module === "shipments" || module === "quality") {
        for (const key of [["screen", "sales"], ["screen", "shipments"], ["screen", "inventory"], ["screen", "procurement"]]) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
    },
  });

  const isEdit = editIndex != null;
  // Keep the original record identity and values while the table refreshes.
  const defaultValues = isEdit ? editRecord?.values
    : module === "catalog" && tab === "products" ? { status: "Draft" } : undefined;
  // Sales orders + purchase orders use bespoke multi-line create forms.
  const isOrderCreate = !isEdit && module === "sales" && tab === "orders";
  const isPOCreate = !isEdit && module === "procurement" && tab === "pos";
  // "Create PO" on the inventory Reorder Alerts page reuses the very same
  // procurement PO form and posts to /procurement/pos, so the order lands in
  // Procurement and flows through exactly like any other PO.
  const isReorderPOCreate = !isEdit && module === "inventory" && tab === "alerts";
  const isTransferCreate = !isEdit && module === "inventory" && tab === "transfers";
  const isStockReceiptCreate = !isEdit && module === "inventory" && tab === "stock";
  // New inspection uses a bespoke form with an order-driven Item picker.
  const isInspectionCreate = !isEdit && module === "quality" && tab === "inspections";
  // Production orders get a per-row "Start production" button + modal.
  const isProductionOrders = module === "production" && tab === "porders";
  // Order History is a read-only cross-module drill-down — no create form.
  const isOrderHistory = module === "orderhistory" && tab === "shipped";
  // Product form's Category field is populated from the live category list
  // (not a hardcoded enum) so a category created moments ago is selectable
  // immediately, instead of only appearing after a code change.
  const isCatalogProducts = module === "catalog" && tab === "products";
  const { data: categoryNames } = useQuery({
    queryKey: ["catalog", "category-names"],
    queryFn: () => apiGet<string[]>("/catalog/categories"),
    enabled: USE_BACKEND && isCatalogProducts && open,
  });
  const { data: seasonNames } = useQuery({
    queryKey: ["catalog", "season-names"],
    queryFn: () => apiGet<string[]>("/catalog/seasons"),
    enabled: USE_BACKEND && isCatalogProducts && open,
  });
  const seasonSuggestions = Array.from(new Map(
    [...(seasonNames ?? []), "Core", "Spring '26", "Fall '26", "Winter '26"]
      .map((name) => [name.toLowerCase(), name])
  ).values());
  return (
    <>
      {USE_BACKEND && module === "quality" && tab === "inspections" && <BatchWorkList kind="quality" />}
      {USE_BACKEND && module === "shipments" && tab === "shipments" && <BatchWorkList kind="shipments" />}
      {USE_BACKEND && module === "inventory" && tab === "stock" && <BatchWorkList kind="inventory" />}
      {USE_BACKEND && module === "inventory" && tab === "stock" && <WarehouseReceivingPanel />}
      {USE_BACKEND && module === "inventory" && tab === "stock" && <div className="mb-4">
        <Link href="/inventory/movements" className="inline-block rounded-md border px-3 py-2 text-sm font-semibold">View stock movement history</Link>
      </div>}
      {failedInspectionId && <QCReopenDialog inspectionId={failedInspectionId} open onOpenChange={(value) => { if (!value) setFailedInspectionId(null); }}
        canReopenProduction={failedInspection?.inspection?.items.some((item) => item.publicId === failedInspectionId && !item.placeholder && item.canReopenProduction)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["screen", "quality"] });
          queryClient.invalidateQueries({ queryKey: ["screen", "production"] });
        }} />}
      <DataTable
        columns={isProductionOrders && USE_BACKEND ? buildColumns(config.columns) : columns}
        data={config.rows}
        records={config.records}
        searchPlaceholder={config.search}
        filters={config.filters}
        actionLabel={actionLabel}
        total={config.total}
        onAction={
          isOrderHistory || isProductionOrders || !canWrite
            ? undefined
            : () => {
                if (USE_BACKEND && module === "procurement" && tab === "receipts") {
                  router.push("/inventory/stock");
                  return;
                }
                setEditIndex(null);
                setActionResult(null);
                setOpen(true);
              }
        }
        actionDisabled={!isOrderHistory && !isProductionOrders && !canWrite}
        actionDisabledReason={reason ?? undefined}
        onRowClick={detailType ? openRecord : undefined}
        renderRowAction={isCatalogProducts && USE_BACKEND ? (i) => config.ids?.[i] ?
          <CatalogArticleActions key={config.ids[i]} id={config.ids[i]} canWrite={canWrite}
            onEdit={() => router.push(`/catalog/products/${config.ids![i]}?edit=1`)}
            onDeleted={() => { void queryClient.invalidateQueries(); }} /> : null
          : module === "catalog" && tab === "categories" && USE_BACKEND && canWrite ? (i) =>
          config.ids?.[i] ? <CategoryDeleteButton key={config.ids[i]} id={config.ids[i]} name={String(config.records?.[i]?.name ?? "this category")} /> : null
          : module === "sales" && tab === "orders" && USE_BACKEND ? (i) =>
          config.records?.[i]?.status === "PO needed" && config.ids?.[i]
            ? <CreateShortagePOButton orderId={config.ids[i]} /> : null : undefined}
        // Production is started per-item inside each order's item tab, not from
        // the orders list — so no order-level "Start production" row action.
        onStartRow={undefined}
        startableRows={undefined}
        // Shipments are created from Quality (once every item passes), never
        // from Production — so no "Send shipment" row action here.
        onShipRow={undefined}
        shippableRows={undefined}
        onEditRow={
          canEdit && !isCatalogProducts
            ? (i) => {
                const id = config.ids?.[i];
                if (!id) return;
                setEditRecord({ id, values: { ...config.records?.[i] } });
                setEditIndex(i);
                setOpen(true);
              }
            : undefined
        }
        statusOptions={canStatus ? statusOpts : undefined}
        rowStatuses={canStatus ? rowStatuses : undefined}
        onStatusChange={
          canStatus
            ? (i, s) => {
                setStatus.mutate({ index: i, status: s });
              }
            : undefined
        }
      />

      <Sheet
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setEditIndex(null);
            save.reset();
          }
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {isEdit ? "Edit details" : actionConfig ? actionConfig.title : actionLabel}
            </SheetTitle>
            {actionConfig && !schema ? (
              <SheetDescription>{actionConfig.body}</SheetDescription>
            ) : null}
          </SheetHeader>
          {isOrderCreate ? (
            <OrderForm
              pending={save.isPending}
              onSubmit={(v) => save.mutate(v as unknown as Record<string, unknown>)}
            />
          ) : isPOCreate || isReorderPOCreate ? (
            <PurchaseOrderForm
              pending={save.isPending}
              onSubmit={(v) => save.mutate(v as unknown as Record<string, unknown>)}
            />
          ) : isTransferCreate ? (
            <TransferForm
              pending={save.isPending}
              onSubmit={(v) => save.mutate(v as unknown as Record<string, unknown>)}
            />
          ) : isStockReceiptCreate ? (
            <StockReceiptForm
              pending={save.isPending}
              onSubmit={(v) => save.mutate(v as unknown as Record<string, unknown>)}
            />
          ) : isInspectionCreate ? (
            <InspectionForm
              pending={save.isPending}
              onSubmit={(v) => save.mutate(v as unknown as Record<string, unknown>)}
            />
          ) : schema ? (
            <AutoForm
              key={isEdit ? `edit-${editRecord?.id}` : "create"}
              schema={schema}
              submitLabel={isEdit ? "Save changes" : actionLabel}
              pending={save.isPending}
              defaultValues={defaultValues}
              dynamicOptions={isCatalogProducts ? { category: categoryNames ?? [],
                ...(!isEdit ? { status: ["Draft"] } : {}) } : undefined}
              intro={isCatalogProducts && !isEdit
                ? "New articles start as Draft. Add colour and size variants, then activate the article to make it available for new orders."
                : undefined}
              textSuggestions={isCatalogProducts ? { season: seasonSuggestions } : undefined}
              numericPrefixes={isCatalogProducts ? { sku: "SKU-" } : undefined}
              serverError={
                save.isError
                  ? save.error instanceof Error
                    ? save.error.message
                    : "Could not save"
                  : undefined
              }
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


    </>
  );
}
