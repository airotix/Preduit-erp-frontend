"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MailOpen } from "lucide-react";
import { useAuth, postAuthPath } from "@/lib/auth";

export default function VerifyPage() {
  const router = useRouter();
  const { verifyEmail, resendVerification } = useAuth();
  const [email, setEmail] = React.useState("");
  const [digits, setDigits] = React.useState<string[]>(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = React.useState(30);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search).get("email");
      if (p) setEmail(p);
    } catch { /* ignore */ }
  }, []);

  React.useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const setDigit = (i: number, v: string) => {
    const c = v.replace(/\D/g, "").slice(-1);
    setDigits((d) => { const n = [...d]; n[i] = c; return n; });
    if (c && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };
  const onPaste = (e: React.ClipboardEvent) => {
    const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (t) { e.preventDefault(); setDigits(t.padEnd(6, "").split("").slice(0, 6)); refs.current[Math.min(t.length, 5)]?.focus(); }
  };

  const code = digits.join("");

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) { setError("Enter all six digits."); return; }
    setBusy(true); setError(null);
    try {
      const user = await verifyEmail(email, code);
      router.push(postAuthPath(user));
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code doesn't match.");
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null); setSeconds(30);
    try {
      const r = await resendVerification(email);
      if (r?.devCode) setDevCode(r.devCode);
    } catch { /* neutral */ }
  };

  return (
    <div>
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#FDE7D6] text-[#EA6C18]">
        <MailOpen size={22} />
      </div>
      <h1 className="text-[36px] font-extrabold leading-none tracking-tight text-[#211f1c]">Verify your email</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[#8a8579]">
        We sent a 6-digit code to <span className="font-bold text-[#26241f]">{email || "your email"}</span>. Enter it
        below to secure your workspace.
      </p>

      <form onSubmit={verify} className="mt-7">
        <div className="flex gap-2.5" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input key={i} ref={(el) => { refs.current[i] = el; }} inputMode="numeric" maxLength={1} value={d}
                   onChange={(e) => setDigit(i, e.target.value)} onKeyDown={(e) => onKey(i, e)}
                   className="h-14 w-full rounded-[10px] border border-[#e4e0d6] bg-white text-center text-[22px] font-bold text-[#26241f] outline-none focus:border-[#F58220] focus:ring-2 focus:ring-[#F58220]/20" />
          ))}
        </div>
        {error && (
          <div className="mt-4 rounded-lg bg-[#FBEAEA] px-3 py-2.5 text-[13px] font-semibold text-[#C0392B]">{error}</div>
        )}
        {devCode && (
          <div className="mt-4 rounded-lg bg-[#FEF6E7] px-3 py-2.5 text-[13px] font-semibold text-[#8A6D1B]">
            Dev code: <span className="font-mono">{devCode}</span>
          </div>
        )}

        <button type="submit" disabled={busy}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#F58220] text-[15px] font-bold text-white transition-colors hover:bg-[#EA6C18] disabled:opacity-60">
          {busy ? <><Loader2 size={17} className="animate-spin" /> Verifying…</> : "Verify and continue"}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-[13px]">
        <span className="text-[#9a948a]">{seconds > 0 ? `You can resend in ${seconds}s` : "Didn't get it?"}</span>
        <button onClick={resend} disabled={seconds > 0}
                className="font-semibold text-[#7A756C] enabled:text-[#F58220] enabled:hover:underline disabled:cursor-default">
          Resend code
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[#efece4] pt-3 text-[13px]">
        <span className="text-[#9a948a]">Wrong address?</span>
        <Link href="/signup" className="font-bold text-[#26241f] underline hover:text-[#F58220]">Change email</Link>
      </div>
    </div>
  );
}
