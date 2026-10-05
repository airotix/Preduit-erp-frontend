"use client";
import { Table as ResponsiveTable } from "@/components/ui/table";


import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, ShieldAlert, Trash2, Loader2, Plus } from "lucide-react";
import { USE_BACKEND, ApiError } from "@/lib/api-client";
import { getCompanies, deleteCompany } from "@/lib/admin-api";
import { AddWorkspaceWizard } from "@/components/screens/admin/add-workspace-wizard";

const CARD = "rounded-[14px] border border-[#ECE7DD] bg-white";

export function AdminCompanies() {
  const qc = useQueryClient();
  const companies = useQuery({ queryKey: ["companies"], queryFn: getCompanies, enabled: USE_BACKEND });
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  const remove = useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["companies"] }); setConfirmId(null); },
  });

  if (!USE_BACKEND) {
    return <Notice title="Backend required"
                   body="The platform overview lists live companies. Enable the backend to view it." />;
  }
  if (companies.error instanceof ApiError && companies.error.status === 403) {
    return <Notice title="Super Admins only"
                   body="This cross-company overview is available to Preduit platform administrators." />;
  }

  const rows = companies.data ?? [];
  const totalUsers = rows.reduce((s, c) => s + c.users, 0);
  const confirmCompany = rows.find((c) => c.id === confirmId);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Companies" value={rows.length} />
        <Stat label="Total users" value={totalUsers} />
        <Stat label="Active subscriptions" value={rows.filter((c) => c.subscriptionStatus && c.subscriptionStatus !== "cancelled").length} />
      </div>

      <section className={CARD}>
        <div className="flex items-center justify-between border-b border-[#F0ECE3] px-5 py-4">
          <h2 className="text-[15px] font-extrabold text-[#211f1c]">All companies</h2>
          <button onClick={() => setAdding(true)}
                  className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#F58220] px-3.5 py-2 text-[13.5px] font-bold text-white transition-colors hover:bg-[#EA6C18]">
            <Plus size={15} strokeWidth={2.5} /> Add workspace
          </button>
        </div>
        <ResponsiveTable className="w-full text-[13.5px]">
          <thead>
            <tr className="border-b border-[#F0ECE3] text-left text-[11px] font-bold uppercase tracking-wide text-[#a39c8f]">
              <th className="px-5 py-2.5">Company</th>
              <th className="px-5 py-2.5">Plan</th>
              <th className="px-5 py-2.5">Currency</th>
              <th className="px-5 py-2.5 text-right">Users</th>
              <th className="px-5 py-2.5 text-right">Status</th>
              <th className="px-5 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.isLoading && <tr><td colSpan={6} className="px-5 py-8 text-center text-[#a39c8f]">Loading…</td></tr>}
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-[#F5F2EB] last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#FDF2E6] text-[#C2511A]"><Building2 size={16} /></span>
                    <div>
                      <div className="font-bold text-[#26241f]">{c.name}</div>
                      <div className="text-[12px] text-[#a39c8f]">{c.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 capitalize text-[#6f6a60]">{c.plan ?? "—"}{c.subscriptionStatus ? ` · ${c.subscriptionStatus}` : ""}</td>
                <td className="px-5 py-3 text-[#6f6a60]">{c.currency}</td>
                <td className="px-5 py-3 text-right font-bold text-[#26241f]">
                  {c.activeUsers}<span className="font-normal text-[#a39c8f]">/{c.users}</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <span className={"rounded-full px-2.5 py-0.5 text-[11px] font-bold " +
                    (c.status === "Active" ? "bg-[#ECFBEF] text-[#189315]" : "bg-[#F3EFE6] text-[#8a8579]")}>
                    {c.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => setConfirmId(c.id)} title="Delete company"
                          className="rounded-lg p-1.5 text-[#c4b8a8] transition-colors hover:bg-[#FBE8E8] hover:text-[#C0392B]">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </ResponsiveTable>
      </section>

      {adding && (
        <AddWorkspaceWizard
          onClose={() => setAdding(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ["companies"] })}
        />
      )}

      {confirmCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => !remove.isPending && setConfirmId(null)}>
          <div className="w-full max-w-[400px] rounded-[14px] border border-[#ECE7DD] bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-extrabold text-[#211f1c]">Delete company?</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[#6f6a60]">
              This will permanently delete <b>{confirmCompany.name}</b> and all its users, subscriptions, and data. This cannot be undone.
            </p>
            {remove.isError && (
              <div className="mt-3 rounded-lg bg-[#FBEAEA] px-3 py-2 text-[13px] font-semibold text-[#C0392B]">
                {remove.error instanceof Error ? remove.error.message : "Failed to delete"}
              </div>
            )}
            <div className="mt-5 flex gap-3">
              <button onClick={() => setConfirmId(null)} disabled={remove.isPending}
                      className="flex-1 rounded-[10px] border border-[#e4e0d6] px-4 py-2.5 text-[13.5px] font-bold text-[#3a372f] transition-colors hover:bg-[#F5F2EB] disabled:opacity-60">
                Cancel
              </button>
              <button onClick={() => remove.mutate(confirmCompany.id)} disabled={remove.isPending}
                      className="flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#C0392B] px-4 py-2.5 text-[13.5px] font-bold text-white transition-colors hover:bg-[#A93226] disabled:opacity-60">
                {remove.isPending ? <><Loader2 size={14} className="animate-spin" /> Deleting…</> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={CARD + " px-5 py-4"}>
      <div className="text-[12px] font-bold uppercase tracking-wide text-[#a39c8f]">{label}</div>
      <div className="mt-1 text-[28px] font-extrabold text-[#211f1c]">{value}</div>
    </div>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto mt-10 max-w-[520px] rounded-[14px] border border-[#ECE7DD] bg-white p-6 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#FDF2E6] text-[#C2511A]"><ShieldAlert size={18} /></div>
      <h3 className="text-[16px] font-extrabold text-[#211f1c]">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-[380px] text-[13.5px] leading-relaxed text-[#8a8579]">{body}</p>
    </div>
  );
}
