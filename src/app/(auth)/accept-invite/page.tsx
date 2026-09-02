"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";
const INPUT =
  "w-full h-12 rounded-[10px] border border-[#e4e0d6] bg-white px-3.5 text-[15px] text-[#26241f] placeholder:text-[#b3ab9e] outline-none transition-colors focus:border-[#F58220] focus:ring-2 focus:ring-[#F58220]/20";
const LABEL = "mb-2 block text-[13px] font-bold text-[#3a372f]";

interface Peek {
  email: string;
  role: string;
  company: { id: string | null; name: string | null };
}

export default function AcceptInvitePage() {
  const router = useRouter();
  const { acceptInvite } = useAuth();
  const [token, setToken] = React.useState("");
  const [peek, setPeek] = React.useState<Peek | null>(null);
  const [invalid, setInvalid] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token") ?? "";
    setToken(t);
    if (!t) { setInvalid("This invite link is missing its token."); return; }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/invitations/peek?token=${encodeURIComponent(t)}`, { cache: "no-store" });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(typeof j?.detail === "string" ? j.detail : "This invitation is invalid or has expired.");
        }
        setPeek(await res.json());
      } catch (e) {
        setInvalid(e instanceof Error ? e.message : "This invitation is invalid or has expired.");
      }
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 10) { setError("Use at least 10 characters."); return; }
    setBusy(true); setError(null);
    try {
      await acceptInvite(token, name.trim(), pw);
      router.push("/dashboard/overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept the invitation.");
      setBusy(false);
    }
  };

  if (invalid) {
    return (
      <div>
        <h1 className="text-[34px] font-extrabold leading-none tracking-tight text-[#211f1c]">Invitation unavailable</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#8a8579]">{invalid}</p>
        <Link href="/login" className="mt-6 inline-block font-bold text-[#F58220] hover:underline">Go to sign in →</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#FDE7D6] text-[#EA6C18]">
        <UserPlus size={22} />
      </div>
      <h1 className="text-[38px] font-extrabold leading-none tracking-tight text-[#211f1c]">
        Join {peek?.company?.name ?? "the team"}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[#8a8579]">
        {peek
          ? <>You&apos;ve been invited as <span className="font-bold text-[#26241f]">{peek.role}</span> using{" "}
              <span className="font-bold text-[#26241f]">{peek.email}</span>. Set your name and a password to finish.</>
          : "Checking your invitation…"}
      </p>

      {peek && (
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="name" className={LABEL}>Your name</label>
            <input id="name" className={INPUT} placeholder="Amara Okonjo" value={name}
                   onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="pw" className={LABEL}>Password</label>
            <div className="relative">
              <input id="pw" type={show ? "text" : "password"} autoComplete="new-password"
                     placeholder="At least 10 characters" className={`${INPUT} pr-11`} value={pw}
                     onChange={(e) => setPw(e.target.value)} required />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label="Toggle password"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9a948a] hover:text-[#26241f]">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-[#FBEAEA] px-3 py-2.5 text-[13px] font-semibold text-[#C0392B]">{error}</div>
          )}

          <button type="submit" disabled={busy}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#F58220] text-[15px] font-bold text-white transition-colors hover:bg-[#EA6C18] disabled:opacity-60">
            {busy ? <><Loader2 size={17} className="animate-spin" /> Joining…</> : `Join ${peek.company?.name ?? "the team"}`}
          </button>
        </form>
      )}
    </div>
  );
}
