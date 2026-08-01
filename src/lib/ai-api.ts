/**
 * Typed engine endpoints for the AI Insights module. Thin wrappers over the
 * ai-client, mirroring the Forcaster app's flat forecast API.
 */
import { aiGet, aiPost, aiPut, aiUrl } from "@/lib/ai-client";
import type {
  DashboardData,
  AuditEntry,
  ProductRow,
  ProjectionRow,
  ProjectionDetail,
  BudgetData,
  RecommendationRow,
  ValidationData,
  CustomersV2Response,
  CustomerDetailV2Response,
  ForecastAccuracyData,
  AiSyncState,
  SeasonConfig,
  ErpStatus,
  ForecastJobStatus,
  BacktestJobStatus,
} from "@/lib/ai-types";

// Dashboard
export const fetchAiDashboard = () => aiGet<DashboardData>("/dashboard");
export const fetchAiAudit = (limit = 10) =>
  aiGet<AuditEntry[]>("/audit", { limit });

// Products / KPIs
export const fetchAiProducts = (params?: {
  season?: string;
  category?: string;
  status?: string;
  search?: string;
}) => aiGet<ProductRow[]>("/products", params);

// Projections
export const fetchAiProjections = (params?: { season?: string; search?: string }) =>
  aiGet<ProjectionRow[]>("/projections", params);
export const fetchAiProjectionDetail = (reference: string) =>
  aiGet<ProjectionDetail>(`/projections/${encodeURIComponent(reference)}/detail`);

// Budget
export const fetchAiBudget = (scenario?: string) =>
  aiGet<BudgetData>("/budget", { scenario });

// Recommendations
export const fetchAiRecommendations = (params?: {
  season?: string;
  scenario?: string;
  search?: string;
  status?: string;
  category?: string;
}) => aiGet<RecommendationRow[]>("/recommendations", params);

export const updateAiRecommendation = (
  reference: string,
  couleur: string,
  data: { sizeBreakdown: Array<{ size: string; finalQty: number }>; reason?: string; notes?: string }
) =>
  aiPut<{ status: string }>(
    `/recommendations/${encodeURIComponent(reference)}/${encodeURIComponent(couleur)}`,
    data
  );

export const lockAiRecommendation = (reference: string, couleur: string) =>
  aiPost<{ status: string }>(
    `/recommendations/${encodeURIComponent(reference)}/${encodeURIComponent(couleur)}/lock`
  );

export const unlockAiRecommendation = (reference: string, couleur: string) =>
  aiPost<{ status: string }>(
    `/recommendations/${encodeURIComponent(reference)}/${encodeURIComponent(couleur)}/unlock`
  );

// Validation & overrides
export const fetchAiValidation = (scenario?: string) =>
  aiGet<ValidationData>("/validation", { scenario });
export const revertAiOverride = (reference: string, couleur?: string, taille?: string) =>
  aiPost<{ status: string; reverted: number }>("/overrides/revert", { reference, couleur, taille });
export const revertAllAiOverrides = () =>
  aiPost<{ status: string; reverted: number }>("/overrides/revert-all");

// Customers
export const fetchAiCustomers = () => aiGet<CustomersV2Response>("/customers");
export const fetchAiCustomerDetail = (customer: string, season?: string) =>
  aiGet<CustomerDetailV2Response>("/customer-detail", { customer, season });

// Forecast accuracy (backtest)
export const fetchAiForecastAccuracy = () =>
  aiGet<ForecastAccuracyData>("/forecast/accuracy");

// Sync — refresh the ERP's snapshot store from the engine + read its state
export const fetchAiSyncState = () => aiGet<AiSyncState>("/sync-state");
export const runAiSync = () => aiPost<{ status: string; snapshots?: number }>("/sync");

// Setup — season config (ERP-owned) + pipeline triggers (proxied to engine)
export const fetchAiSeasonConfig = () => aiGet<Partial<SeasonConfig>>("/season-config");
export const saveAiSeasonConfig = (cfg: SeasonConfig) =>
  aiPost<SeasonConfig>("/season-config", cfg);
export const fetchAiIngestStatus = () => aiGet<ErpStatus>("/ingest/status");
export const runAiIngest = () =>
  aiPost<{ rowsAdded?: number; rowsUpdated?: number; rowsSkipped?: number; mode?: string }>("/ingest/sync");
export const fetchAiForecastJob = () => aiGet<ForecastJobStatus>("/forecast/job");
export const refreshAiForecast = () => aiPost<{ jobId: string; status: string }>("/forecast/refresh");
export const fetchAiBacktestStatus = () => aiGet<BacktestJobStatus>("/forecast/backtest-status");
export const runAiBacktest = () => aiPost<{ runId: number; status: string }>("/forecast/backtest");

export { aiUrl };
