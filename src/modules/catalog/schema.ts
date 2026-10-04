import { z } from "zod";

export const productSchema = z.object({
  title: z.string().min(1, "Required"),
  // User-supplied; uniqueness is enforced by the backend (tenant + SKU).
  sku: z.string().min(1, "Required").max(64, "Max 64 characters"),
  // Not a static enum: the Category picker is populated live from
  // GET /catalog/categories (see list-screen.tsx's `dynamicOptions`), so a
  // category created moments ago is selectable immediately. Validation here
  // just requires a non-empty value — the live list is what constrains choice.
  category: z.string().min(1, "Required"),
  season: z.string().trim().min(1, "Required").max(40, "Max 40 characters"),
  status: z.enum(["Active", "Draft", "Discontinued"]),
  // Price columns on the products table — required on create/edit.
  retailPrice: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
  wholesalePrice: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
  onlinePrice: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
  supplierPrice: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
  imageUrl: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Required"),
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
