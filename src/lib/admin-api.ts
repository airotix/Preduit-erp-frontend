/**
 * Team administration + platform overview API (self-managed auth, AUTH-D).
 * All calls hit the backend /auth/* endpoints and are permission-guarded there
 * (admin.users for team management; platform-admin for the company overview).
 */
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";

export interface TeamUser {
  id: string;
  email: string;
  name: string;
  role: string | null;
  isOwner: boolean;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin: string | null;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "revoked";
  expiresAt: string | null;
  createdAt: string | null;
  devToken?: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  currency: string;
  status: string;
  users: number;
  activeUsers: number;
  plan: string | null;
  subscriptionStatus: string | null;
  seatLimit: number | null;
}

export const getTeamUsers = () => apiGet<{ users: TeamUser[] }>("/auth/users").then((r) => r.users);
export const getAssignableRoles = () => apiGet<{ roles: string[] }>("/auth/roles").then((r) => r.roles);
export const getInvitations = () =>
  apiGet<{ invitations: Invitation[] }>("/auth/invitations").then((r) => r.invitations);
export const getCompanies = () =>
  apiGet<{ companies: Company[] }>("/auth/companies").then((r) => r.companies);

export const inviteTeammate = (email: string, role: string) =>
  apiPost<Invitation>("/auth/invitations", { email, role });
export const revokeInvitation = (id: string) => apiDelete<Invitation>(`/auth/invitations/${id}`);
export const updateTeamUser = (id: string, patch: { role?: string; isActive?: boolean }) =>
  apiPatch<TeamUser>(`/auth/users/${id}`, patch);
