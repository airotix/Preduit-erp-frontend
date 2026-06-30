import { z } from "zod";

export const channelSchema = z.object({
  name: z.string().min(1, "Required"),
  type: z.enum(["Storefront", "Marketplace", "B2B"]),
});

export const SCHEMAS = {
  "channels": channelSchema,
} as const;

export function getSchema(tab: string): z.ZodObject<z.ZodRawShape> | undefined {
  return (SCHEMAS as Record<string, z.ZodObject<z.ZodRawShape>>)[tab];
}
