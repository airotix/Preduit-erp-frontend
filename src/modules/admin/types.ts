import type { z } from "zod";
import type * as schemas from "./schema";

export type User = z.infer<typeof schemas.userSchema>;
export type Role = z.infer<typeof schemas.roleSchema>;
export type ApprovalRule = z.infer<typeof schemas.approvalRuleSchema>;
export type DocumentItem = z.infer<typeof schemas.documentSchema>;

export type { Cell, Row, ListConfig, ScreenConfig } from "@/lib/screen-types";
