"use client";

import * as React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

const LOCK_SECONDS = 15 * 60; // 15-minute lockout window

export default function LockedPage() {
  const [left, setLeft] = React.useState(LOCK_SECONDS);

  React.useEffect(() => {
    // Honour an "until" query param (epoch ms) when the backend supplies one.
    try {
      const until = Number(new URLSearchParams(window.location.search).get("until"));
      if (until > Date.now()) setLeft(Math.ceil((until - Date.now()) / 1000));
    } catch { /* ignore */ }
  }, []);

  React.useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [left]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const unlocked = left <= 0;

  return (
    <div>
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#FBE4E1] text-[#D6483B]">
        <Lock size={22} />
      </div>
      <h1 className="text-[38px] font-extrabold leading-none tracking-tight text-[#211f1c]">
        Account temporarily locked
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[#8a8579]">
        Five sign-in attempts failed, so we&apos;ve paused sign-in on this account to keep it safe. Nothing has been
        deleted — access returns on its own.
      </p>

      <div className="mt-7 rounded-[14px] border border-[#f0d9d5] bg-[#FEF6F5] px-5 py-4">
        <div className="text-[12px] font-bold tracking-[0.12em] text-[#B9483C]">
          {unlocked ? "READY" : "UNLOCKS IN"}
        </div>
        <div className="mt-1 font-mono text-[34px] font-extrabold leading-none tabular-nums text-[#211f1c]">
          {unlocked ? "You can sign in now" : `${mm}:${ss}`}
        </div>
      </div>

      <div className="mt-7 space-y-3">
        {unlocked ? (
          <Link href="/login"
                className="flex h-12 w-full items-center justify-center rounded-[10px] bg-[#F58220] text-[15px] font-bold text-white transition-colors hover:bg-[#EA6C18]">
            Back to sign in
          </Link>
        ) : (
          <Link href="/forgot-password"
                className="flex h-12 w-full items-center justify-center rounded-[10px] bg-[#F58220] text-[15px] font-bold text-white transition-colors hover:bg-[#EA6C18]">
            Reset my password
          </Link>
        )}
        <Link href="mailto:"
              className="flex h-12 w-full items-center justify-center rounded-[10px] border border-[#e4e0d6] bg-white text-[15px] font-bold text-[#26241f] transition-colors hover:bg-[#faf7f1]">
          Contact your workspace admin
        </Link>
      </div>

      <p className="mt-6 text-[12.5px] leading-relaxed text-[#9a948a]">
        Resetting your password clears the lock straight away. Repeated lockouts are flagged to your workspace owner.
      </p>
    </div>
  );
}
