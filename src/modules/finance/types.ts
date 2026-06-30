import type { z } from "zod";
import type * as schemas from "./schema";

export type Account = z.infer<typeof schemas.accountSchema>;
export type JournalEntry = z.infer<typeof schemas.journalEntrySchema>;
export type Payment = z.infer<typeof schemas.paymentSchema>;

export type { Cell, Row, ListConfig, ScreenConfig } from "@/lib/screen-types";
