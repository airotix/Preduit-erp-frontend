"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useAuth, postAuthPath } from "@/lib/auth";

const INPUT =
  "w-full h-12 rounded-[10px] border border-[#e4e0d6] bg-white px-3.5 text-[15px] text-[#26241f] placeholder:text-[#b3ab9e] outline-none transition-colors focus:border-[#F58220] focus:ring-2 focus:ring-[#F58220]/20";
const LABEL = "mb-2 block text-[13px] font-bold text-[#3a372f]";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = React.useState("");
  const [business, setBusiness] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [keep, setKeep] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const user = await login(email, password);
      router.push(postAuthPath(user));
    } catch (err) {
      const e = err as Error & { locked?: boolean; until?: number | null };
      if (e?.locked) {
        router.push(e.until ? `/locked?until=${e.until}` : "/locked");
        return;
      }
      setError(err instanceof Error ? err.message : "Sign in failed");
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="text-[40px] font-extrabold leading-none tracking-tight text-[#211f1c]">Welcome back</h1>
      <p className="mt-3 text-[15px] text-[#8a8579]">
        Sign in to {business.trim() ? `${business.trim()}'s` : "your"} workspace.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className={LABEL}>Work email</label>
          <input id="email" type="email" autoComplete="email" placeholder="owner@northgate.co"
                 className={INPUT} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div>
          <label htmlFor="business" className={LABEL}>Business name</label>
          <input id="business" placeholder="Northgate Retail Group"
                 className={INPUT} value={business} onChange={(e) => setBusiness(e.target.value)} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="password" className="text-[13px] font-bold text-[#3a372f]">Password</label>
            <Link href="/forgot-password" className="text-[13px] font-bold text-[#F58220] hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input id="password" type={show ? "text" : "password"} autoComplete="current-password"
                   placeholder="Enter your password" className={`${INPUT} pr-11`} value={password}
                   onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label="Toggle password"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9a948a] hover:text-[#26241f]">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-[13.5px] text-[#5f5a50]">
          <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)}
                 className="h-[18px] w-[18px] rounded accent-[#F58220]" />
          Keep me signed in on this device
        </label>

        {error && (
          <div className="rounded-lg bg-[#FBEAEA] px-3 py-2.5 text-[13px] font-semibold text-[#C0392B]">{error}</div>
        )}

        <button type="submit" disabled={busy}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#F58220] text-[15px] font-bold text-white transition-colors hover:bg-[#EA6C18] disabled:opacity-60">
          {busy ? <><Loader2 size={17} className="animate-spin" /> Signing in…</> : "Sign in"}
        </button>
      </form>

      <div className="mt-7 flex items-start gap-2 text-[12.5px] leading-relaxed text-[#9a948a]">
        <Lock size={15} className="mt-0.5 shrink-0 text-[#1F7A53]" />
        <p>
          Traffic is encrypted with 256-bit TLS. Preduit Retail is SOC 2 Type II audited and PCI-DSS ready — card data
          never touches your ERP.
        </p>
      </div>
    </div>
  );
}
