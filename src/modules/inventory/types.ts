import type { z } from "zod";
import type * as schemas from "./schema";

export type StockItem = z.infer<typeof schemas.stockItemSchema>;
export type Location = z.infer<typeof schemas.locationSchema>;
export type Transfer = z.infer<typeof schemas.transferSchema>;
export type ReorderAlert = z.infer<typeof schemas.reorderAlertSchema>;

export type { Cell, Row, ListConfig, ScreenConfig } from "@/lib/screen-types";
