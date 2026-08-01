/**
 * TypeScript contracts for the Forcaster engine's HTTP API, ported from the
 * standalone app's `lib/api/forecast.ts`. These mirror what the engine returns
 * so the AI Insights screens can be typed end-to-end.
 */

export interface AiSyncState {
  status: "idle" | "ok" | "error" | "offline";
  lastSyncedAt: string | null;
  message: string | null;
}

// --- Setup tab -------------------------------------------------------------
export interface SeasonConfig {
  name: string;
  currency: string;
  budget: number;
  targetMargin: number;
  budgetBandPct: number;
  costRatio: number;
}

export interface ErpStatus {
  enabled: boolean;
  configured: boolean;
  hasHistoryQuery: boolean;
  baseUrl: string | null;
  enseigne: string | null;
  mode: "erp" | "sample";
  provider: string;
}

export interface ForecastJobStatus {
  jobId: string | null;
  status: string;
  lastRun: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface BacktestJobStatus {
  runId: number | null;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export type Scenario = "conservative" | "base" | "optimistic";
export const SCENARIOS: Scenario[] = ["conservative", "base", "optimistic"];
export type Confidence = "high" | "medium" | "low";

// --- Dashboard --------------------------------------------------------------
export interface DashboardData {
  kpis: Array<{
    label: string;
    value: string;
    subLabel: string;
    trend: "up" | "down" | "neutral";
    trendValue: number;
  }>;
  financialSummary: {
    budgetUsed: number;
    budgetTotal: number;
    margin: number;
    targetMargin: number;
    coverage: number;
    totalPurchaseCost: number;
    expectedTurnover: number;
  };
  confidenceDistribution: Record<string, number>;
  lastPipelineRun: string | null;
  totalSKUs: number;
}

export interface AuditEntry {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  previous_value: string | null;
  new_value: string | null;
  details: string | null;
}

// --- Products / KPIs --------------------------------------------------------
export interface ProductRow {
  skuId: string;
  name: string;
  style: string;
  category: string;
  status: string;
  season: string;
  diffusionRate: number;
  depthPerCustomer: number;
  reorderRate: number;
  totalUnitsSold: number;
  buyingCustomers: number;
  sizeBreakdown: Record<string, number>;
  aiConfidence: string;
}

// --- Projections ------------------------------------------------------------
export interface ScenarioBreakdown {
  confirmed: number;
  probableReorders: number;
  nonVisitedProjection: number;
  total: number;
}

export interface Explainability {
  confirmedOrders: { units: number; customerCount: number };
  probableReorders: { units: number; reorderRate: number; likelyCustomers: number };
  nonVisitedDemand: { units: number; matchedCustomers: number; clusterProfile: string };
  keySignals: {
    diffusionRate: number;
    depthPerCustomer: number;
    customerCluster: string;
    scenarioMultiplier: number;
  };
}

export interface ProjectionRow {
  skuId: string;
  skuName: string;
  category: string;
  scenarios: Record<Scenario, ScenarioBreakdown>;
  confidence: Confidence;
  explainability: Explainability;
}

export interface ProjectionDetail {
  skuId: string;
  skuName: string;
  category: string;
  productInfo: {
    reference: string;
    name: string;
    matiere: string;
    theme: string;
    famille: string;
    sousFamille: string;
    rayon: string;
    saison: string;
  };
  stockSummary: {
    forecastedQuantity: number;
    supplierOrder: number;
    stock: number;
    total: number;
  };
  colorVariants: Array<{
    color: string;
    totalDeProduit: Record<string, number>;
    forecastedQuantity: Record<string, number>;
    totalDeFournisseur: Record<string, number>;
    totalDeCitNegoce: Record<string, number>;
    totalDeLeStock: Record<string, number>;
  }>;
  sizeColumns?: string[];
  confidence: Confidence;
}

// --- Budget -----------------------------------------------------------------
export interface BudgetData {
  summary: {
    totalPurchaseCost: number;
    seasonBudget: number;
    expectedTurnover: number;
    grossMargin: number;
    grossMarginPercent: number;
    scenario?: string;
    costRatio?: number;
    costEstimated?: boolean;
    budgetsByScenario?: Record<string, number>;
  };
  categories: Array<{
    category: string;
    purchaseCost: number;
    budgetPercent: number;
    marginPercent: number;
    status: "on_target" | "below_margin" | "over_budget";
    skus: Array<{
      skuId: string;
      name: string;
      purchaseCost: number;
      margin: number;
      targetMargin: number;
    }>;
  }>;
}

// --- Recommendations --------------------------------------------------------
export interface SizeBreakdownRow {
  size: string;
  recommended: number;
  manualOverride: number | null;
  finalQty: number;
  minUnits: number | null;
  maxUnits: number | null;
  blocked: boolean;
  rounding: string | null;
}

export interface RecommendationRow {
  skuId: string;
  skuName: string;
  category: string;
  status: string;
  locked: boolean;
  reference?: string;
  couleur?: string;
  scenarios: Record<Scenario, ScenarioBreakdown>;
  currentScenarioTotal: number;
  sizeBreakdown: SizeBreakdownRow[];
  confidence: string;
  explainability: Explainability;
  financialImpact: {
    purchaseCost: number;
    expectedTurnover: number;
    grossMargin: number;
    marginPercent: number;
    budgetImpactPercent: number;
  };
}

// --- Validation -------------------------------------------------------------
export interface ValidationData {
  scenarioMetrics: Record<
    string,
    {
      totalUnits: number;
      purchaseCost: number;
      budgetUsage: number;
      grossMargin: number;
      skusAtRisk: number;
    }
  >;
  overrides: Array<{
    skuId: string;
    skuName: string;
    reference: string;
    couleur: string;
    taille: string;
    aiRecommended: number;
    userOverride: number;
    reasonTag: string;
    notes: string;
  }>;
}

// --- Customer coverage ------------------------------------------------------
export type CustomerTypology = "independent" | "chain" | "key_account";
export type VisitedStatus = "visited" | "not_visited";

export interface AiCustomer {
  id: string;
  name: string;
  typology: CustomerTypology;
  region: string;
  categories: string[];
  reorderFrequency: number;
  avgBasket: number;
  status: VisitedStatus;
  matchedTo?: string;
  similarityScore?: number;
  matchConfidence?: Confidence;
}

export interface PurchaseHistoryItem {
  skuId: string;
  skuName: string;
  season: string;
  units: number;
  value: number;
}

export interface CustomersV2Response {
  customers: AiCustomer[];
  regions: string[];
  latestSeason: string | null;
}

export interface CustomerDetailV2Response {
  customer: string;
  purchaseHistory: PurchaseHistoryItem[];
  seasons: string[];
}

// --- Forecast accuracy (backtest) -------------------------------------------
export interface ForecastAccuracyData {
  headline: {
    wmape: number | null;
    bias: number | null;
    coverage80: number | null;
    lastRunAt: string | null;
    skuCount: number;
  };
  byModelType: Array<{
    modelType: string;
    wmape: number | null;
    bias: number | null;
    coverage80: number | null;
    skuCount: number;
  }>;
  byCategory: Array<{
    famille: string;
    wmape: number | null;
    bias: number | null;
    coverage80: number | null;
    skuCount: number;
  }>;
  trend: Array<{
    foldMonth: string;
    wmape: number | null;
    bias: number | null;
    coverage80: number | null;
  }>;
}
