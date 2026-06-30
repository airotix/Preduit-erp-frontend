import type { z } from "zod";
import type * as schemas from "./schema";

export type ProductionOrder = z.infer<typeof schemas.productionOrderSchema>;
export type BomLine = z.infer<typeof schemas.bomLineSchema>;

export type { Cell, Row, ListConfig, ScreenConfig } from "@/lib/screen-types";
