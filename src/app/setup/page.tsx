"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { SetupWizard } from "@/components/setup/setup-wizard";

/** Post-signup company setup. Only shown to a signed-in owner whose workspace
 *  hasn't been set up yet; everyone else is bounced to login / the app. */
export default function SetupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  React.useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    if (user.company?.setupComplete !== false) router.replace("/dashboard/overview");
  }, [loading, user, router]);

  if (loading || !user || user.company?.setupComplete !== false) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f6f5ef] text-[13px] font-semibold text-[#8a8579]">
        Loading…
      </div>
    );
  }
  return <SetupWizard />;
}
