import { z } from "zod";

export const accountSchema = z.object({
  code: z.string().min(1, "Required"),
  name: z.string().min(1, "Required"),
  type: z.enum(["Asset", "Liability", "Equity", "Income", "Expense"]),
});

export const journalEntrySchema = z.object({
  reference: z.string().min(1, "Required"),
  memo: z.string().min(1, "Required"),
  debit: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
  credit: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
});

export const paymentSchema = z.object({
  party: z.string().min(1, "Required"),
  amount: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
  type: z.enum(["Receipt", "Disbursement"]),
});

export const SCHEMAS = {
  "coa": accountSchema,
  "journals": journalEntrySchema,
  "payments": paymentSchema,
} as const;

export function getSchema(tab: string): z.ZodObject<z.ZodRawShape> | undefined {
  return (SCHEMAS as Record<string, z.ZodObject<z.ZodRawShape>>)[tab];
}
