import type { z } from "zod";
import type * as schemas from "./schema";

export type Product = z.infer<typeof schemas.productSchema>;
export type Category = z.infer<typeof schemas.categorySchema>;
export type Attribute = z.infer<typeof schemas.attributeSchema>;

export type { Cell, Row, ListConfig, ScreenConfig } from "@/lib/screen-types";
