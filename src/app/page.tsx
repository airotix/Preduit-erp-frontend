"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import dynamic from "next/dynamic";

const MarketingApp = dynamic(() => import("@/marketing/App"));

/** ERP front door: landing for guests, dashboard for signed-in users. */
export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (loading) return;
    if (user) router.replace("/dashboard/overview");
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f6f5ef] text-[13px] font-semibold text-[#8a8579]">
        Loading…
      </div>
    );
  }

  return <MarketingApp />;
}
