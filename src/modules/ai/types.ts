import type { z } from "zod";
import type * as schemas from "./schema";

export type AiReport = z.infer<typeof schemas.aiReportSchema>;

export type { Cell, Row, ListConfig, ScreenConfig } from "@/lib/screen-types";
