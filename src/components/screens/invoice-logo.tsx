"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchImageObjectUrl, getCompanyProfile } from "@/lib/company-profile-api";

/** The company's cover photo from the company profile is its invoice logo (falls back to the profile picture), shown above the company name. */
export function InvoiceLogo({ className }: { className?: string }) {
  const profile = useQuery({ queryKey: ["company-profile"], queryFn: getCompanyProfile, staleTime: 5 * 60_000 });
  const docId = profile.data?.coverDocId || profile.data?.logoDocId || null;
  const image = useQuery({
    queryKey: ["company-logo-image", docId],
    queryFn: () => fetchImageObjectUrl(docId as string),
    enabled: !!docId,
    staleTime: 5 * 60_000,
  });
  if (!image.data) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={image.data} alt={`${profile.data?.companyName || "Company"} logo`}
    className={className ?? "mx-auto mb-1 max-h-16 max-w-[160px] object-contain"} />;
}
