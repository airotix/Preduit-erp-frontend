/**
 * Module registry — aggregates every feature module's public surface so the
 * generic App Router shell can resolve the right data source, table columns
 * and create-form schema for any /<module>/<tab> route.
 *
 * Each module folder exposes the same contract (see modules/<module>/index.ts):
 *   - fetchScreen(tab): Promise<ScreenConfig>   (api/, wraps the in-memory store)
 *   - getColumns(tab):  TanStack column defs    (columns.ts)
 *   - getSchema(tab):   Zod schema | undefined  (schema.ts)
 */
import type { ColumnDef as TanstackColumnDef } from "@tanstack/react-table";
import type { z } from "zod";
import type { Row, ScreenConfig } from "@/lib/screen-types";

import * as dashboard from "./dashboard";
import * as catalog from "./catalog";
import * as inventory from "./inventory";
import * as sales from "./sales";
import * as procurement from "./procurement";
import * as finance from "./finance";
import * as production from "./production";
import * as quality from "./quality";
import * as shipments from "./shipments";
import * as commerce from "./commerce";
import * as ai from "./ai";
import * as admin from "./admin";

interface ModuleContract {
  fetchScreen: (tab: string) => Promise<ScreenConfig>;
  getColumns: (tab: string) => TanstackColumnDef<Row>[];
  getSchema: (tab: string) => z.ZodObject<z.ZodRawShape> | undefined;
}

const REGISTRY: Record<string, ModuleContract> = {
  dashboard,
  catalog,
  inventory,
  sales,
  procurement,
  finance,
  production,
  quality,
  shipments,
  commerce,
  ai,
  admin,
};

export function fetchScreen(module: string, tab: string): Promise<ScreenConfig> {
  const m = REGISTRY[module];
  if (!m) return Promise.reject(new Error(`Unknown module: ${module}`));
  return m.fetchScreen(tab);
}

export function getColumns(module: string, tab: string) {
  return REGISTRY[module]?.getColumns(tab) ?? [];
}

export function getSchema(module: string, tab: string) {
  return REGISTRY[module]?.getSchema(tab);
}
