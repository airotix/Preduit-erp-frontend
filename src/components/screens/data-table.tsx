"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Pencil,
  Play,
  Truck,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Row } from "@/lib/screen-types";

interface DataTableProps {
  columns: ColumnDef<Row>[];
  data: Row[];
  searchPlaceholder?: string;
  filters?: string[];
  actionLabel?: string;
  onAction?: () => void;
  onRowClick?: (row: Row) => void;
  /** When provided, each row shows an Edit button that calls back with the
   *  row's original data index (aligned with the backend ids/records arrays). */
  onEditRow?: (rowIndex: number) => void;
  /** When provided, each row shows a "Start" button (production workflow). */
  onStartRow?: (rowIndex: number) => void;
  /** Parallel to data: rows where Start should NOT show (e.g. already started). */
  startableRows?: (boolean | undefined)[];
  /** When provided, rows flagged in shippableRows show a "Send shipment" button. */
  onShipRow?: (rowIndex: number) => void;
  shippableRows?: (boolean | undefined)[];
  /** When provided, each row shows a status dropdown (document state transitions). */
  statusOptions?: string[];
  rowStatuses?: (string | null | undefined)[];
  onStatusChange?: (rowIndex: number, status: string) => void;
  total?: number;
}

export function DataTable({
  columns,
  data,
  searchPlaceholder = "Search…",
  filters = [],
  actionLabel = "New",
  onAction,
  onRowClick,
  onEditRow,
  onStartRow,
  startableRows,
  onShipRow,
  shippableRows,
  statusOptions,
  rowStatuses,
  onStatusChange,
  total,
}: DataTableProps) {
  const hasActions = !!onEditRow || !!onStatusChange || !!onStartRow || !!onShipRow;
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  const rowCount = table.getFilteredRowModel().rows.length;
  const grandTotal = total ?? data.length;

  return (
    <div className="rounded-[14px] border border-border/70 bg-white shadow-erp-sm">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-border/60 p-4">
        <div className="flex w-[260px] items-center gap-2 rounded-full border border-border/70 bg-muted px-3.5 py-2 text-muted-foreground">
          <Search size={16} strokeWidth={1.9} />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full border-0 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        {filters.map((f) => (
          <button
            key={f}
            className="flex items-center gap-1.5 rounded-full border border-border/70 bg-white px-3.5 py-2 text-[13px] font-semibold text-[#4A4F61] transition-colors hover:bg-muted"
          >
            <SlidersHorizontal size={14} strokeWidth={1.9} />
            {f}
            <ChevronDown size={14} className="opacity-60" />
          </button>
        ))}

        <div className="flex-1" />

        {onAction && (
          <Button size="sm" onClick={onAction}>
            <Plus size={16} strokeWidth={2.2} />
            {actionLabel}
          </Button>
        )}
      </div>

      {/* table */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="hover:bg-transparent">
              {hg.headers.map((header) => {
                const align =
                  (header.column.columnDef.meta as { align?: string })?.align ??
                  "left";
                const sorted = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    style={{
                      textAlign: align as "left" | "center" | "right",
                      width: (
                        header.column.columnDef.meta as { width?: string }
                      )?.width,
                    }}
                  >
                    <button
                      onClick={header.column.getToggleSortingHandler()}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {sorted === "asc" ? (
                        <ChevronUp size={13} />
                      ) : sorted === "desc" ? (
                        <ChevronDown size={13} />
                      ) : (
                        <ChevronsUpDown size={12} className="opacity-40" />
                      )}
                    </button>
                  </TableHead>
                );
              })}
              {hasActions && <TableHead style={{ width: onStatusChange ? 150 : 64 }} />}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                className={onRowClick ? "cursor-pointer" : ""}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
                {hasActions && (
                  <TableCell style={{ textAlign: "right" }}>
                    {onShipRow && shippableRows?.[row.index] && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onShipRow(row.index);
                        }}
                        className="mr-1 inline-flex items-center gap-1 rounded-md bg-gradient-to-br from-brand-orange to-brand-orange-d px-2 py-1 text-[12px] font-semibold text-white transition-[filter] hover:brightness-95"
                        title="Send shipment"
                      >
                        <Truck size={13} strokeWidth={2} /> Send shipment
                      </button>
                    )}
                    {onStartRow && (startableRows ? startableRows[row.index] !== false : true) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartRow(row.index);
                        }}
                        className="mr-1 inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-[12px] font-semibold text-white transition-colors hover:bg-brand-ink"
                        title="Start production"
                      >
                        <Play size={13} strokeWidth={2} /> Start
                      </button>
                    )}
                    {onEditRow && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditRow(row.index);
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-border/70 px-2 py-1 text-[12px] font-semibold text-[#4A4F61] transition-colors hover:bg-muted"
                        title="Edit"
                      >
                        <Pencil size={13} strokeWidth={2} /> Edit
                      </button>
                    )}
                    {onStatusChange && statusOptions && (
                      <select
                        value={rowStatuses?.[row.index] ?? ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          onStatusChange(row.index, e.target.value);
                        }}
                        className="rounded-md border border-border/70 bg-white px-2 py-1 text-[12px] font-semibold text-[#4A4F61]"
                        title="Change status"
                      >
                        {rowStatuses?.[row.index] &&
                          !statusOptions.includes(rowStatuses[row.index] as string) && (
                            <option value={rowStatuses[row.index] as string}>
                              {rowStatuses[row.index]}
                            </option>
                          )}
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length + (onEditRow ? 1 : 0)}
                className="py-16 text-center text-muted-foreground"
              >
                No records match your search.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* footer */}
      <div className="flex items-center justify-between border-t border-border/60 px-5 py-3.5 text-[13px] text-muted-foreground">
        <span>
          {rowCount > 0 ? "1" : "0"}–{rowCount} of{" "}
          <span className="font-semibold text-foreground">
            {grandTotal.toLocaleString()}
          </span>
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="px-2 tabular">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
