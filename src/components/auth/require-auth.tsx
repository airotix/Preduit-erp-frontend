"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

/** Gate the ERP shell: render only when authenticated; otherwise bounce to /login. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) router.replace("/login");
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
