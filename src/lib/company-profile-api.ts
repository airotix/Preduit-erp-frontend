import { apiGet, apiPut, apiUpload, apiUrl } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth-token";

export interface CompanyProfile {
  companyName: string;
  about: string;
  logoDocId: string | null;
  coverDocId: string | null;
  industry: string;
  businessType: string;
  salesModel: string;
  founded: string;
  street: string;
  country: string;
  city: string;
  state: string;
  postal: string;
  businessEmail: string;
  phone: string;
  supportLine: string;
  openingHours: string;
  website: string;
  linkedin: string;
  instagram: string;
  facebook: string;
  x: string;
  legalName: string;
  sameAsCompany: boolean;
  registrationNumber: string;
  taxNumber: string;
  bankName: string;
  bankAccount: string;
  bankIban: string;
  bankSwift: string;
  /** Module ids enabled for this company (setup wizard / Modules section).
   *  null/undefined = never set — treated as "every module enabled". */
  enabledModules?: string[] | null;
}

export const getCompanyProfile = () => apiGet<CompanyProfile>("/auth/company/profile");
export const saveCompanyProfile = (p: CompanyProfile) =>
  apiPut<CompanyProfile>("/auth/company/profile", p);

/** Upload a logo/cover through the shared document storage; returns the doc id. */
export async function uploadCompanyImage(kind: "logo" | "cover", file: File): Promise<string> {
  const form = new FormData();
  form.append("module", "company");
  form.append("entity_type", kind);
  form.append("file", file);
  const res = await apiUpload<{ public_id: string }>("/documents/upload", form);
  return res.public_id;
}

/** Fetch a stored image (auth-protected) and return an object URL for <img>. */
export async function fetchImageObjectUrl(docId: string): Promise<string | null> {
  const token = getAccessToken();
  const res = await fetch(apiUrl(`/documents/${docId}/download`), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!res.ok) return null;
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
