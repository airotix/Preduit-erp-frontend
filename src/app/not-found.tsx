"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-[#C8CCD5]">
      <div className="text-[64px] font-extrabold tracking-tight text-brand-navy">
        404
      </div>
      <p className="text-muted-foreground">This screen doesn’t exist.</p>
      <Button asChild>
        <Link href="/dashboard/overview">Back to dashboard</Link>
      </Button>
    </div>
  );
}
