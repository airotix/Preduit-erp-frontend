import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email"),
  role: z.enum([
    "Admin",
    "Manager",
    "Merchandiser",
    "Accountant",
    "User Overview",
    "Logistics / Inventory",
  ]),
  department: z.string().min(1, "Required"),
});

export const roleSchema = z.object({
  name: z.string().min(1, "Required"),
  scope: z.string().min(1, "Required"),
});

export const approvalRuleSchema = z.object({
  name: z.string().min(1, "Required"),
  condition: z.string().min(1, "Required"),
  approver: z.string().min(1, "Required"),
});

export const documentSchema = z.object({
  name: z.string().min(1, "Required"),
  type: z.enum(["Contract", "Tech pack", "Policy", "Shipping"]),
});

export const SCHEMAS = {
  "users": userSchema,
  "roles": roleSchema,
  "approvalrules": approvalRuleSchema,
  "doclibrary": documentSchema,
} as const;

export function getSchema(tab: string): z.ZodObject<z.ZodRawShape> | undefined {
  return (SCHEMAS as Record<string, z.ZodObject<z.ZodRawShape>>)[tab];
}
