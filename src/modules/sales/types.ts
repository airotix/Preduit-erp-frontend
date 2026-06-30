import type { z } from "zod";
import type * as schemas from "./schema";

export type Order = z.infer<typeof schemas.orderSchema>;
export type Invoice = z.infer<typeof schemas.invoiceSchema>;
export type Customer = z.infer<typeof schemas.customerSchema>;
export type ReturnItem = z.infer<typeof schemas.returnSchema>;

export type { Cell, Row, ListConfig, ScreenConfig } from "@/lib/screen-types";
