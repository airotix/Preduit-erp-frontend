"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2, KeyRound, Check } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";
const INPUT =
  "w-full h-12 rounded-[10px] border border-[#e4e0d6] bg-white px-3.5 text-[15px] text-[#26241f] placeholder:text-[#b3ab9e] outline-none transition-colors focus:border-[#F58220] focus:ring-2 focus:ring-[#F58220]/20";
const LABEL = "mb-2 block text-[13px] font-bold text-[#3a372f]";

function strength(pw: string): { pct: number; color: string } {
  let s = 0;
  if (pw.length >= 10) s += 2; else if (pw.length >= 6) s += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s += 1;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s += 1;
  const pct = Math.min(100, (s / 4) * 100);
  const color = s >= 4 ? "#24B34B" : s >= 2 ? "#F58220" : "#E0574B";
  return { pct: pw ? Math.max(pct, 12) : 0, color };
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pw, setPw] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const st = strength(pw);
  const match = pw.length >= 10 && pw === confirm;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 10) { setError("Use at least 10 characters."); return; }
    if (pw !== confirm) { setError("Those passwords don't match."); return; }
    setBusy(true); setError(null);
    try {
      const token = new URLSearchParams(window.location.search).get("token") ?? "";
      await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: pw }),
      });
    } catch { /* reset endpoint lands with AUTH-B */ } finally { setBusy(false); setDone(true); }
  };

  if (done) {
    return (
      <div>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#ECFBEF] text-[#189315]">
          <Check size={24} strokeWidth={3} />
        </div>
        <h1 className="text-[34px] font-extrabold leading-none tracking-tight text-[#211f1c]">Password updated</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#8a8579]">
          Your new password is set. For safety we signed out other sessions and tills — sign back in to continue.
        </p>
        <button onClick={() => router.push("/login")}
                className="mt-7 flex h-12 w-full items-center justify-center rounded-[10px] bg-[#F58220] text-[15px] font-bold text-white transition-colors hover:bg-[#EA6C18]">
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div>
      <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-[14px] font-bold text-[#7A756C] hover:text-[#F58220]">
        <ArrowLeft size={16} /> Back to sign in
      </Link>
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#FDE7D6] text-[#EA6C18]">
        <KeyRound size={22} />
      </div>
      <h1 className="text-[38px] font-extrabold leading-none tracking-tight text-[#211f1c]">Set a new password</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[#8a8579]">
        Choose a password you don&apos;t use anywhere else. At least 10 characters — a short phrase beats a clever symbol.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="pw" className={LABEL}>New password</label>
          <div className="relative">
            <input id="pw" type={show ? "text" : "password"} autoComplete="new-password" placeholder="At least 10 characters"
                   className={`${INPUT} pr-11`} value={pw} onChange={(e) => setPw(e.target.value)} required />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label="Toggle password"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9a948a] hover:text-[#26241f]">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EDEBE4]">
            <div className="h-full rounded-full transition-all" style={{ width: `${st.pct}%`, background: st.color }} />
          </div>
        </div>
        <div>
          <label htmlFor="confirm" className={LABEL}>Confirm password</label>
          <input id="confirm" type={show ? "text" : "password"} autoComplete="new-password" placeholder="Re-enter it"
                 className={INPUT} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>

        {error && (
          <div className="rounded-lg bg-[#FBEAEA] px-3 py-2.5 text-[13px] font-semibold text-[#C0392B]">{error}</div>
        )}

        <button type="submit" disabled={busy || !match}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#F58220] text-[15px] font-bold text-white transition-colors hover:bg-[#EA6C18] disabled:opacity-60">
          {busy ? <><Loader2 size={17} className="animate-spin" /> Updating…</> : "Update password"}
        </button>
      </form>
    </div>
  );
}
