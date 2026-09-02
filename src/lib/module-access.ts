"use client";

import { useAuth } from "@/lib/auth";

/**
 * Per-module read/write access for the signed-in user's role, mirroring
 * backend/app/core/roles.py's <module>.read / <module>.write permissions
 * (enforced there via require_module — this is the UI-side mirror so write
 * controls can be disabled instead of just failing at the API).
 */
export interface ModuleAccess {
  canRead: boolean;
  canWrite: boolean;
  /** Set when canWrite is false — pass straight into a disabled control's
   *  title attribute so hovering explains why it's greyed out. */
  reason: string | null;
}

const MODULE_LABEL: Record<string, string> = {
  dashboard: "Dashboards", catalog: "Catalog", inventory: "Inventory",
  sales: "Sales & Orders", procurement: "Procurement", finance: "Finance",
  production: "Production", quality: "Quality", shipments: "Shipments",
  ai: "Demand Planning", orderhistory: "Order History", commerce: "Channels",
};

export function useModuleAccess(module: string): ModuleAccess {
  const { user, hasPermission } = useAuth();
  // Not loaded yet (or dev bypass with no principal) — stay permissive so
  // controls don't flash disabled before auth resolves.
  if (!user) return { canRead: true, canWrite: true, reason: null };
  const canWrite = hasPermission(`${module}.write`);
  const canRead = canWrite || hasPermission(`${module}.read`);
  const label = MODULE_LABEL[module] ?? module;
  return {
    canRead,
    canWrite,
    reason: canWrite ? null : `Your role (${user.role ?? "this role"}) has view-only access to ${label}.`,
  };
}
