import { z } from "zod";

export const productSchema = z.object({
  title: z.string().min(1, "Required"),
  category: z.enum(["Knitwear", "Bottoms", "Shirts", "Outerwear", "Accessories"]),
  season: z.enum(["Core", "Spring '26", "Fall '26", "Winter '26"]),
  status: z.enum(["Active", "Draft", "Discontinued"]),
  // SKU is auto-generated (SKU-000001…). Three price types seed the first variant.
  retailPrice: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0").optional(),
  wholesalePrice: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0").optional(),
  onlinePrice: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0").optional(),
  imageUrl: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Required"),
  parent: z.string().optional(),
  active: z.boolean().default(false),
});

export const attributeSchema = z.object({
  value: z.string().min(1, "Required"),
  type: z.enum(["Color", "Size"]),
  code: z.string().min(1, "Required"),
});

export const SCHEMAS = {
  "products": productSchema,
  "categories": categorySchema,
  "attributes": attributeSchema,
} as const;

export function getSchema(tab: string): z.ZodObject<z.ZodRawShape> | undefined {
  return (SCHEMAS as Record<string, z.ZodObject<z.ZodRawShape>>)[tab];
}
