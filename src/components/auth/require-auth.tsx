"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

/** Gate the ERP shell: render only when authenticated; otherwise bounce to /login. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    // Owner hasn't finished the setup wizard yet — force it before the app.
    if (user.company && user.company.setupComplete === false) router.replace("/setup");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#C8CCD5] text-[13px] font-semibold text-[#5B6478]">
        Loading…
      </div>
    );
  }
  if (!user) return null;
  return <>{children}</>;
}
