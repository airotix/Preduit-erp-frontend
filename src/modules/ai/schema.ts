import { z } from "zod";

export const aiReportSchema = z.object({
  name: z.string().min(1, "Required"),
  period: z.string().min(1, "Required"),
});

export const SCHEMAS = {
  "aireports": aiReportSchema,
} as const;

export function getSchema(tab: string): z.ZodObject<z.ZodRawShape> | undefined {
  return (SCHEMAS as Record<string, z.ZodObject<z.ZodRawShape>>)[tab];
}
