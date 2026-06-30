import type { z } from "zod";
import type * as schemas from "./schema";

export type PurchaseOrder = z.infer<typeof schemas.purchaseOrderSchema>;
export type GoodsReceipt = z.infer<typeof schemas.goodsReceiptSchema>;
export type Supplier = z.infer<typeof schemas.supplierSchema>;

export type { Cell, Row, ListConfig, ScreenConfig } from "@/lib/screen-types";
