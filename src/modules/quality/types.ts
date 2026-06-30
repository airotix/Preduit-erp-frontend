import type { z } from "zod";
import type * as schemas from "./schema";

export type Inspection = z.infer<typeof schemas.inspectionSchema>;
export type DefectType = z.infer<typeof schemas.defectTypeSchema>;

export type { Cell, Row, ListConfig, ScreenConfig } from "@/lib/screen-types";
