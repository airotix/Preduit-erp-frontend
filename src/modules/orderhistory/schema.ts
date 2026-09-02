import { z } from "zod";

/** Order History is read-only — no create/edit form for any tab. */
export function getSchema(_tab: string): z.ZodObject<z.ZodRawShape> | undefined {
  return undefined;
}
