"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, ShieldAlert, UserPlus, Check, Copy } from "lucide-react";
import { USE_BACKEND, ApiError } from "@/lib/api-client";
import {
  getTeamUsers, getInvitations, getAssignableRoles, inviteTeammate,
  revokeInvitation, updateTeamUser, type Invitation,
} from "@/lib/admin-api";

const CARD = "rounded-[14px] border border-[#ECE7DD] bg-white";
const BTN_PRIMARY =
  "inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#F58220] px-4 text-[13.5px] font-bold text-white transition-colors hover:bg-[#EA6C18] disabled:opacity-60";
const SELECT =
  "h-9 rounded-[8px] border border-[#e4e0d6] bg-white px-2.5 text-[13px] font-semibold text-[#26241f] outline-none focus:border-[#F58220]";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

export function AdminUsers() {
  const qc = useQueryClient();
  const users = useQuery({ queryKey: ["team-users"], queryFn: getTeamUsers, enabled: USE_BACKEND });
  const invites = useQuery({ queryKey: ["invitations"], queryFn: getInvitations, enabled: USE_BACKEND });
  const roles = useQuery({ queryKey: ["assignable-roles"], queryFn: getAssignableRoles, enabled: USE_BACKEND });

  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("");
  const [inviteErr, setInviteErr] = React.useState<string | null>(null);
  const [lastLink, setLastLink] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => { if (!role && roles.data?.length) setRole(roles.data[0]); }, [roles.data, role]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["team-users"] });
    qc.invalidateQueries({ queryKey: ["invitations"] });
  };

  const sendInvite = useMutation({
    mutationFn: () => inviteTeammate(email.trim(), role),
    onSuccess: (inv: Invitation) => {
      setEmail(""); setInviteErr(null); setCopied(false);
      if (inv.devToken) setLastLink(`${window.location.origin}/accept-invite?token=${encodeURIComponent(inv.devToken)}`);
      invalidate();
    },
    onError: (e) => setInviteErr(e instanceof Error ? e.message : "Could not send the invite."),
  });

  const revoke = useMutation({ mutationFn: revokeInvitation, onSuccess: invalidate });
  const setRoleFor = useMutation({
    mutationFn: (v: { id: string; role: string }) => updateTeamUser(v.id, { role: v.role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team-users"] }),
  });
  const setActiveFor = useMutation({
    mutationFn: (v: { id: string; isActive: boolean }) => updateTeamUser(v.id, { isActive: v.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team-users"] }),
  });

  if (!USE_BACKEND) {
    return <Notice icon={<ShieldAlert size={18} />} title="Backend required"
                   body="Team management reads and writes live data. Enable the backend (NEXT_PUBLIC_USE_BACKEND=true) to manage members." />;
  }
  if (users.error instanceof ApiError && users.error.status === 403) {
    return <Notice icon={<ShieldAlert size={18} />} title="You don't have access"
                   body="Only workspace owners and admins can manage the team. Ask an owner to change your role if you need access." />;
  }

  const roleOptions = roles.data ?? [];
  const pending = (invites.data ?? []).filter((i) => i.status === "pending");
  const copyLink = async () => {
    if (!lastLink) return;
    try { await navigator.clipboard.writeText(lastLink); setCopied(true); } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      {/* Invite */}
      <section className={CARD}>
        <div className="border-b border-[#F0ECE3] px-5 py-4">
          <h2 className="text-[15px] font-extrabold text-[#211f1c]">Invite a teammate</h2>
          <p className="mt-0.5 text-[13px] text-[#8a8579]">They&apos;ll get a link to set a password and join with the role you pick.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3 px-5 py-4">
          <div className="min-w-[240px] flex-1">
            <label className="mb-1.5 block text-[12px] font-bold text-[#3a372f]">Work email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com"
                   className="h-10 w-full rounded-[10px] border border-[#e4e0d6] bg-white px-3 text-[14px] text-[#26241f] outline-none focus:border-[#F58220]" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-[#3a372f]">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className={`${SELECT} h-10`}>
              {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button className={BTN_PRIMARY} disabled={!email.trim() || !role || sendInvite.isPending}
                  onClick={() => sendInvite.mutate()}>
            {sendInvite.isPending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Send invite
          </button>
        </div>
        {inviteErr && <div className="mx-5 mb-4 rounded-lg bg-[#FBEAEA] px-3 py-2 text-[13px] font-semibold text-[#C0392B]">{inviteErr}</div>}
        {lastLink && (
          <div className="mx-5 mb-4 flex items-center gap-2 rounded-lg bg-[#FEF6E7] px-3 py-2.5 text-[12.5px] text-[#8A6D1B]">
            <span className="truncate font-mono">{lastLink}</span>
            <button onClick={copyLink} className="ml-auto inline-flex shrink-0 items-center gap-1 font-bold hover:underline">
              {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy link</>}
            </button>
          </div>
        )}
      </section>

      {/* Members */}
      <section className={CARD}>
        <div className="border-b border-[#F0ECE3] px-5 py-4">
          <h2 className="text-[15px] font-extrabold text-[#211f1c]">Team members</h2>
        </div>
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="border-b border-[#F0ECE3] text-left text-[11px] font-bold uppercase tracking-wide text-[#a39c8f]">
              <th className="px-5 py-2.5">Member</th>
              <th className="px-5 py-2.5">Role</th>
              <th className="px-5 py-2.5">Last sign-in</th>
              <th className="px-5 py-2.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.isLoading && <tr><td colSpan={4} className="px-5 py-8 text-center text-[#a39c8f]">Loading…</td></tr>}
            {users.data?.map((u) => (
              <tr key={u.id} className="border-b border-[#F5F2EB] last:border-0">
                <td className="px-5 py-3">
                  <div className="font-bold text-[#26241f]">{u.name}
                    {u.isOwner && <span className="ml-2 rounded-full bg-[#FDE7D6] px-2 py-0.5 text-[10px] font-bold text-[#C2511A]">OWNER</span>}
                    {!u.emailVerified && <span className="ml-2 rounded-full bg-[#F3EFE6] px-2 py-0.5 text-[10px] font-bold text-[#8a8579]">UNVERIFIED</span>}
                  </div>
                  <div className="text-[12.5px] text-[#8a8579]">{u.email}</div>
                </td>
                <td className="px-5 py-3">
                  {u.isOwner ? (
                    <span className="font-semibold text-[#6f6a60]">{u.role}</span>
                  ) : (
                    <select className={SELECT} value={u.role ?? ""} disabled={setRoleFor.isPending}
                            onChange={(e) => setRoleFor.mutate({ id: u.id, role: e.target.value })}>
                      {!roleOptions.includes(u.role ?? "") && u.role && <option value={u.role}>{u.role}</option>}
                      {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  )}
                </td>
                <td className="px-5 py-3 text-[#6f6a60]">{fmtDate(u.lastLogin)}</td>
                <td className="px-5 py-3 text-right">
                  {u.isOwner ? (
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#189315]">● Active</span>
                  ) : (
                    <button disabled={setActiveFor.isPending}
                            onClick={() => setActiveFor.mutate({ id: u.id, isActive: !u.isActive })}
                            className={"rounded-[8px] px-3 py-1.5 text-[12.5px] font-bold transition-colors " +
                              (u.isActive ? "bg-[#ECFBEF] text-[#189315] hover:bg-[#DFF6E4]" : "bg-[#F3EFE6] text-[#8a8579] hover:bg-[#EBE6DB]")}>
                      {u.isActive ? "● Active" : "○ Inactive"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Pending invitations */}
      <section className={CARD}>
        <div className="border-b border-[#F0ECE3] px-5 py-4">
          <h2 className="text-[15px] font-extrabold text-[#211f1c]">Pending invitations</h2>
        </div>
        {pending.length === 0 ? (
          <div className="flex items-center gap-2 px-5 py-6 text-[13px] text-[#a39c8f]">
            <Mail size={16} /> No invitations waiting to be accepted.
          </div>
        ) : (
          <table className="w-full text-[13.5px]">
            <tbody>
              {pending.map((i) => (
                <tr key={i.id} className="border-b border-[#F5F2EB] last:border-0">
                  <td className="px-5 py-3 font-semibold text-[#26241f]">{i.email}</td>
                  <td className="px-5 py-3 text-[#6f6a60]">{i.role}</td>
                  <td className="px-5 py-3 text-[12.5px] text-[#a39c8f]">Expires {fmtDate(i.expiresAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <button disabled={revoke.isPending} onClick={() => revoke.mutate(i.id)}
                            className="rounded-[8px] px-3 py-1.5 text-[12.5px] font-bold text-[#C0392B] transition-colors hover:bg-[#FBEAEA]">
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Notice({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="mx-auto mt-10 max-w-[520px] rounded-[14px] border border-[#ECE7DD] bg-white p-6 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#FDF2E6] text-[#C2511A]">{icon}</div>
      <h3 className="text-[16px] font-extrabold text-[#211f1c]">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-[380px] text-[13.5px] leading-relaxed text-[#8a8579]">{body}</p>
    </div>
  );
}
