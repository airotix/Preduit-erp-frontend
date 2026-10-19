"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const router = useRouter();
  useEffect(() => { router.replace("/quality/inspections"); }, [router]);
  return <p className="p-6 text-sm">Opening the quality queue…</p>;
}
