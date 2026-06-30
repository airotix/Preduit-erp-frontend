import type { ColumnDef } from "@tanstack/react-table";
import type { Row } from "@/lib/screen-types";
import { buildColumns } from "@/lib/build-columns";
import { screens } from "./data";

/** TanStack Table column defs for a list tab in the dashboard module. */
export function getColumns(tab: string): ColumnDef<Row>[] {
  const s = screens[tab];
  return s && s.kind === "list" ? buildColumns(s.columns) : [];
}
