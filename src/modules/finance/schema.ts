import { z } from "zod";

export const accountSchema = z.object({
  code: z.string().min(1, "Required"),
  name: z.string().min(1, "Required"),
  type: z.enum(["Asset", "Liability", "Equity", "Income", "Expense"]),
  subtype: z
    .enum([
      "Current asset",
      "Fixed asset",
      "Current liability",
      "Long-term liability",
      "Equity",
      "Operating income",
      "Other income",
      "Operating expense",
      "Other expense",
    ])
    .optional(),
  currency: z.enum(["EUR", "USD", "GBP", "PKR", "AED"]),
  openingBalance: z.number({ invalid_type_error: "Must be a number" }).optional(),
  taxRate: z.number({ invalid_type_error: "Must be a number" }).optional(),
  parent: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

export const journalEntrySchema = z.object({
  reference: z.string().min(1, "Required"),
  memo: z.string().min(1, "Required"),
  debit: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
  credit: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
  status: z.enum(["Draft", "Posted", "Void"]).default("Draft"),
  date: z.string().optional(),
});

export const paymentSchema = z.object({
  party: z.string().min(1, "Required"),
  amount: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
  type: z.enum(["Receipt", "Disbursement"]),
  method: z.enum(["Bank transfer", "Card", "Cash", "Cheque"]).optional(),
  reference: z.string().optional(),
  allocatedTo: z.string().optional(),
  date: z.string().optional(),
  status: z.enum(["Pending", "Cleared", "Failed"]).default("Pending"),
  notes: z.string().optional(),
});

export const billSchema = z.object({
  supplier: z.string().min(1, "Required"),
  poRef: z.string().optional(),
  amount: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
  dueDate: z.string().optional(),
  status: z.enum(["Open", "Scheduled", "Paid"]).default("Open"),
});

export const SCHEMAS = {
  "coa": accountSchema,
  "journals": journalEntrySchema,
  "payments": paymentSchema,
  "bills": billSchema,
} as const;

export function getSchema(tab: string): z.ZodObject<z.ZodRawShape> | undefined {
  return (SCHEMAS as Record<string, z.ZodObject<z.ZodRawShape>>)[tab];
}
