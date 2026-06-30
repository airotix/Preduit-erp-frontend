import type { z } from "zod";
import type * as schemas from "./schema";

export type Shipment = z.infer<typeof schemas.shipmentSchema>;
export type Carrier = z.infer<typeof schemas.carrierSchema>;

export type { Cell, Row, ListConfig, ScreenConfig } from "@/lib/screen-types";
