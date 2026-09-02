"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";
const INPUT =
  "w-full h-12 rounded-[10px] border border-[#e4e0d6] bg-white px-3.5 text-[15px] text-[#26241f] placeholder:text-[#b3ab9e] outline-none transition-colors focus:border-[#F58220] focus:ring-2 focus:ring-[#F58220]/20";
const LABEL = "mb-2 block text-[13px] font-bold text-[#3a372f]";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [devToken, setDevToken] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      const j = await res.json().catch(() => ({}));
      if (j?.devToken) setDevToken(j.devToken as string);   // dev only: email isn't wired yet
    } catch { /* neutral confirmation regardless */ } finally { setBusy(false); setSent(true); }
  };

  const back = (
    <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-[14px] font-bold text-[#7A756C] hover:text-[#F58220]">
      <ArrowLeft size={16} /> Back to sign in
    </Link>
  );

  if (sent) {
    return (
      <div>
        {back}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#ECFBEF] text-[#189315]">
          <MailCheck size={22} />
        </div>
        <h1 className="text-[34px] font-extrabold leading-none tracking-tight text-[#211f1c]">Check your email</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#8a8579]">
          If an account exists for <span className="font-semibold text-[#26241f]">{email}</span>, we&apos;ve sent a
          single-use reset link. It expires in 30 minutes.
        </p>
        {devToken && (
          <Link href={`/reset-password?token=${encodeURIComponent(devToken)}`}
                className="mt-5 inline-block rounded-lg bg-[#FEF6E7] px-3 py-2.5 text-[13px] font-semibold text-[#8A6D1B] hover:underline">
            Dev: open reset link →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      {back}
      <h1 className="text-[40px] font-extrabold leading-none tracking-tight text-[#211f1c]">Reset your password</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[#8a8579]">
        Enter the email tied to your Preduit account and we&apos;ll send a secure reset link. It expires in 30 minutes.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className={LABEL}>Work email</label>
          <input id="email" type="email" autoComplete="email" placeholder="owner@northgate.co"
                 className={INPUT} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <button type="submit" disabled={busy}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#F58220] text-[15px] font-bold text-white transition-colors hover:bg-[#EA6C18] disabled:opacity-60">
          {busy ? <><Loader2 size={17} className="animate-spin" /> Sending…</> : "Send reset link"}
        </button>
      </form>
    </div>
  );
}
