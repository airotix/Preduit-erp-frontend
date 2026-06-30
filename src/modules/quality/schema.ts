import { z } from "zod";

export const inspectionSchema = z.object({
  order: z.string().min(1, "Required"),
  stage: z.enum(["Inline", "Final"]),
  aql: z.enum(["2.5", "4.0"]),
});

export const defectTypeSchema = z.object({
  name: z.string().min(1, "Required"),
  category: z.enum(["Stitching", "Fabric", "Trim"]),
  severity: z.enum(["Major", "Minor"]),
});

export const SCHEMAS = {
  "inspections": inspectionSchema,
  "defects": defectTypeSchema,
} as const;

export function getSchema(tab: string): z.ZodObject<z.ZodRawShape> | undefined {
  return (SCHEMAS as Record<string, z.ZodObject<z.ZodRawShape>>)[tab];
}
