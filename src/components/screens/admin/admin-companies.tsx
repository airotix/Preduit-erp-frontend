"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, ShieldAlert } from "lucide-react";
import { USE_BACKEND, ApiError } from "@/lib/api-client";
import { getCompanies } from "@/lib/admin-api";

const CARD = "rounded-[14px] border border-[#ECE7DD] bg-white";

export function AdminCompanies() {
  const companies = useQuery({ queryKey: ["companies"], queryFn: getCompanies, enabled: USE_BACKEND });

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

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Companies" value={rows.length} />
        <Stat label="Total users" value={totalUsers} />
        <Stat label="Active subscriptions" value={rows.filter((c) => c.subscriptionStatus && c.subscriptionStatus !== "cancelled").length} />
      </div>

      <section className={CARD}>
        <div className="border-b border-[#F0ECE3] px-5 py-4">
          <h2 className="text-[15px] font-extrabold text-[#211f1c]">All companies</h2>
        </div>
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="border-b border-[#F0ECE3] text-left text-[11px] font-bold uppercase tracking-wide text-[#a39c8f]">
              <th className="px-5 py-2.5">Company</th>
              <th className="px-5 py-2.5">Plan</th>
              <th className="px-5 py-2.5">Currency</th>
              <th className="px-5 py-2.5 text-right">Users</th>
              <th className="px-5 py-2.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {companies.isLoading && <tr><td colSpan={5} className="px-5 py-8 text-center text-[#a39c8f]">Loading…</td></tr>}
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
              </tr>
            ))}
          </tbody>
        </table>
      </section>
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
