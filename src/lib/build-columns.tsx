import type { ColumnDef as TanstackColumnDef } from "@tanstack/react-table";
import type { ColumnDef, Row } from "@/lib/screen-types";
import { CellRenderer, cellText } from "@/components/screens/cell-renderer";

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

/**
 * Build TanStack Table column definitions from the ERP's lightweight
 * column model. Each row is an ordered array of cells; column `i` reads
 * cell `i`. Sorting and global filtering operate on the cell's text.
 */
export function buildColumns(columns: ColumnDef[]): TanstackColumnDef<Row>[] {
  return columns.map((col, i) => ({
    id: `${i}-${col.label}`,
    accessorFn: (row: Row) => cellText(row[i]),
    header: () => (
      <span className={alignClass[col.align ?? "left"]}>{col.label}</span>
    ),
    cell: ({ row }) => (
      <div className={alignClass[col.align ?? "left"]}>
        <CellRenderer cell={row.original[i]} />
      </div>
    ),
    enableSorting: true,
    sortingFn: "alphanumeric",
    meta: { align: col.align ?? "left", width: col.w, label: col.label },
  }));
}
