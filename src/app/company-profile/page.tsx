"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { CompanyProfilePage } from "@/components/company/company-profile";

export default function CompanyProfileRoute() {
  const router = useRouter();
  const { user, loading } = useAuth();

  React.useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    if (user.company?.setupComplete === false) router.replace("/setup");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#fbfaf7] text-[13px] font-semibold text-[#8a8579]">
        Loading…
      </div>
    );
  }
  return <CompanyProfilePage />;
}
