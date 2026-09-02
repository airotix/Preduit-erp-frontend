import { z } from "zod";

export const productSchema = z.object({
  title: z.string().min(1, "Required"),
  // Not a static enum: the Category picker is populated live from
  // GET /catalog/categories (see list-screen.tsx's `dynamicOptions`), so a
  // category created moments ago is selectable immediately. Validation here
  // just requires a non-empty value — the live list is what constrains choice.
  category: z.string().min(1, "Required"),
  season: z.enum(["Core", "Spring '26", "Fall '26", "Winter '26"]),
  status: z.enum(["Active", "Draft", "Discontinued"]),
  // SKU is auto-generated (SKU-000001…). Four price types seed the first variant.
  retailPrice: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0").optional(),
  wholesalePrice: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0").optional(),
  onlinePrice: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0").optional(),
  supplierPrice: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0").optional(),
  imageUrl: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Required"),
  parent: z.string().optional(),
  // Matches the backend model's own default (Category.is_active defaults to
  // True) — a newly created category should be usable right away, not
  // silently inactive until someone notices and flips this switch.
  active: z.boolean().default(true),
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
