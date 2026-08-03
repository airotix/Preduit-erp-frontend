"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

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

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = React.useState({ first: "", last: "", email: "", password: "" });
  const [show, setShow] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const st = strength(form.password);
  const valid = form.first.trim() && form.email.trim() && form.password.length >= 10;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) { setError("Please complete all fields (password ≥ 10 characters)."); return; }
    setBusy(true); setError(null);
    try {
      const ownerName = `${form.first.trim()} ${form.last.trim()}`.trim();
      // Business details are captured in the next (setup) step; seed a placeholder
      // workspace name for now so the owner account exists and can sign in.
      await register({ ownerName, companyName: `${form.first.trim()}'s workspace`, email: form.email, password: form.password });
      router.push(`/verify?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account");
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <span className="text-[13px] font-bold text-[#F58220]">Step 1 of 2</span>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EDEBE4]">
          <span className="block h-full rounded-full bg-[#F58220]" style={{ width: "50%" }} />
        </span>
      </div>

      <h1 className="text-[40px] font-extrabold leading-none tracking-tight text-[#211f1c]">Create your account</h1>
      <p className="mt-3 text-[15px] text-[#8a8579]">You&apos;ll be the workspace owner — you can invite your team next.</p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first" className={LABEL}>First name</label>
            <input id="first" className={INPUT} placeholder="Amara" value={form.first} onChange={set("first")} required />
          </div>
          <div>
            <label htmlFor="last" className={LABEL}>Last name</label>
            <input id="last" className={INPUT} placeholder="Okonjo" value={form.last} onChange={set("last")} />
          </div>
        </div>
        <div>
          <label htmlFor="email" className={LABEL}>Work email</label>
          <input id="email" type="email" autoComplete="email" className={INPUT} placeholder="owner@northgate.co" value={form.email} onChange={set("email")} required />
        </div>
        <div>
          <label htmlFor="password" className={LABEL}>Password</label>
          <div className="relative">
            <input id="password" type={show ? "text" : "password"} autoComplete="new-password"
                   placeholder="At least 10 characters" className={`${INPUT} pr-11`} value={form.password} onChange={set("password")} required />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label="Toggle password"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9a948a] hover:text-[#26241f]">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EDEBE4]">
            <div className="h-full rounded-full transition-all" style={{ width: `${st.pct}%`, background: st.color }} />
          </div>
          <p className="mt-1.5 text-[12.5px] text-[#9a948a]">Use at least 10 characters — a short phrase works well.</p>
        </div>

        {error && (
          <div className="rounded-lg bg-[#FBEAEA] px-3 py-2.5 text-[13px] font-semibold text-[#C0392B]">{error}</div>
        )}

        <button type="submit" disabled={busy}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#F58220] text-[15px] font-bold text-white transition-colors hover:bg-[#EA6C18] disabled:opacity-60">
          {busy ? <><Loader2 size={17} className="animate-spin" /> Creating…</> : "Continue"}
        </button>
      </form>

      <p className="mt-6 text-center text-[12.5px] text-[#9a948a]">
        Free for 14 days. No card required — we&apos;ll ask once your first outlet goes live.
      </p>
    </div>
  );
}
