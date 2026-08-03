"use client";

import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { USE_BACKEND } from "@/lib/api-client";
import { getTeamUsers } from "@/lib/admin-api";

const CARD = "rounded-[14px] border border-[#ECE7DD] bg-white";

/** Mirrors app/core/roles.py — the single source of truth for authorization. */
const ROLE_REFERENCE: { name: string; scope: string; full: string; read: string }[] = [
  { name: "Super Admin", scope: "Platform-wide (all companies)", full: "Everything, across every company",
    read: "Assigned by Preduit, not from this screen" },
  { name: "Admin", scope: "This company", full: "Full access — every module plus team & settings",
    read: "—" },
  { name: "Manager", scope: "This company",
    full: "Dashboard, Catalog, Inventory, Sales, Procurement, Production, Quality, Shipments",
    read: "Finance, Demand Planning" },
  { name: "Merchandiser", scope: "This company", full: "Catalog, Inventory, Sales, Demand Planning",
    read: "Dashboard, Production" },
  { name: "Accountant", scope: "This company", full: "Finance", read: "Dashboard, Sales, Procurement" },
  { name: "Logistics / Inventory", scope: "This company",
    full: "Inventory, Shipments, Procurement, Production", read: "Dashboard, Catalog" },
];

export function AdminRoles() {
  const users = useQuery({ queryKey: ["team-users"], queryFn: getTeamUsers, enabled: USE_BACKEND });
  const countFor = (role: string) => (users.data ?? []).filter((u) => u.role === role).length;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2.5 rounded-[12px] border border-[#EAE4F7] bg-[#F6F2FE] px-4 py-3 text-[13px] text-[#5B4A86]">
        <ShieldCheck size={17} className="mt-0.5 shrink-0" />
        <p>Roles are fixed platform-wide and map to a set of module permissions. Assign them per member on the
          Users tab. Super Admin is granted by Preduit and can&apos;t be assigned from here.</p>
      </div>

      <section className={CARD}>
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="border-b border-[#F0ECE3] text-left text-[11px] font-bold uppercase tracking-wide text-[#a39c8f]">
              <th className="px-5 py-2.5">Role</th>
              <th className="px-5 py-2.5">Full access</th>
              <th className="px-5 py-2.5">View-only</th>
              <th className="px-5 py-2.5 text-right">Members</th>
            </tr>
          </thead>
          <tbody>
            {ROLE_REFERENCE.map((r) => (
              <tr key={r.name} className="border-b border-[#F5F2EB] align-top last:border-0">
                <td className="px-5 py-3.5">
                  <div className="font-extrabold text-[#26241f]">{r.name}</div>
                  <div className="mt-0.5 text-[12px] text-[#a39c8f]">{r.scope}</div>
                </td>
                <td className="px-5 py-3.5 text-[#3a372f]">{r.full}</td>
                <td className="px-5 py-3.5 text-[#8a8579]">{r.read}</td>
                <td className="px-5 py-3.5 text-right font-bold text-[#26241f]">
                  {USE_BACKEND && !r.name.startsWith("Super") ? countFor(r.name) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
