/**
 * Static demo fixtures for the Demand Planning (AI) module.
 *
 * When AI_DEMO is on (see ai-client), every aiGet/aiPost/aiPut is served from
 * here instead of the forecasting engine — so the module renders the full
 * Forecaster layout with realistic data and no backend running.
 */
import type { Scenario, ScenarioBreakdown, Explainability } from "@/lib/ai-types";

const SIZES = ["S", "M", "L", "XL"];

const scen = (total: number): ScenarioBreakdown => ({
  confirmed: Math.round(total * 0.5),
  probableReorders: Math.round(total * 0.3),
  nonVisitedProjection: total - Math.round(total * 0.5) - Math.round(total * 0.3),
  total,
});
const scenarios = (b: number): Record<Scenario, ScenarioBreakdown> => ({
  conservative: scen(Math.round(b * 0.75)),
  base: scen(b),
  optimistic: scen(Math.round(b * 1.3)),
});
const expl = (diff: number, depth: number, reorder: number, cluster: string): Explainability => ({
  confirmedOrders: { units: Math.round(diff * 100), customerCount: Math.round(depth) },
  probableReorders: { units: Math.round(reorder * 80), reorderRate: reorder, likelyCustomers: 8 },
  nonVisitedDemand: { units: 14, matchedCustomers: 5, clusterProfile: cluster },
  keySignals: {
    diffusionRate: diff, depthPerCustomer: depth,
    customerCluster: cluster, scenarioMultiplier: 1.0,
  },
});
const sizeMap = (vals: number[]) => Object.fromEntries(SIZES.map((s, i) => [s, vals[i] ?? 0]));

// ── Catalogue of demo SKUs (shared across every tab for consistency) ──
const SKUS = [
  { ref: "KNT-0142", name: "Merino Crew Knit", cat: "Knitwear", colour: "Navy", supplier: "Anhui Knit Mills",
    base: 320, conf: "high", diff: 0.34, depth: 7.2, reorder: 0.41, sizes: [70, 110, 95, 45], status: "Reorder" },
  { ref: "SHT-0211", name: "Oxford Shirt", cat: "Shirts", colour: "White", supplier: "Lahore Textiles Co",
    base: 260, conf: "high", diff: 0.29, depth: 6.1, reorder: 0.37, sizes: [55, 90, 80, 35], status: "Reorder" },
  { ref: "BTM-0098", name: "Tailored Chino", cat: "Bottoms", colour: "Stone", supplier: "Supreme",
    base: 180, conf: "medium", diff: 0.22, depth: 4.8, reorder: 0.3, sizes: [40, 60, 55, 25], status: "New" },
  { ref: "OUT-0067", name: "Quilted Field Jacket", cat: "Outerwear", colour: "Olive", supplier: "Noor Leather",
    base: 140, conf: "medium", diff: 0.19, depth: 4.1, reorder: 0.26, sizes: [30, 45, 45, 20], status: "Reorder" },
  { ref: "SHT-0188", name: "Linen Camp Shirt", cat: "Shirts", colour: "Sand", supplier: "Lahore Textiles Co",
    base: 95, conf: "low", diff: 0.11, depth: 2.9, reorder: 0.18, sizes: [22, 32, 28, 13], status: "New" },
  { ref: "BTM-0151", name: "Stretch Denim Jean", cat: "Bottoms", colour: "Indigo", supplier: "Supreme",
    base: 210, conf: "high", diff: 0.31, depth: 6.6, reorder: 0.39, sizes: [48, 72, 64, 26], status: "Reorder" },
];

const products = SKUS.map((s) => ({
  skuId: s.ref, name: s.name, style: s.ref, category: s.cat, status: s.status,
  season: "Fall '26", diffusionRate: s.diff, depthPerCustomer: s.depth, reorderRate: s.reorder,
  totalUnitsSold: s.base * 4, buyingCustomers: Math.round(s.depth * 6), sizeBreakdown: sizeMap(s.sizes),
  aiConfidence: s.conf,
}));

const projections = SKUS.map((s) => ({
  skuId: s.ref, skuName: s.name, category: s.cat, scenarios: scenarios(s.base),
  confidence: s.conf as string, explainability: expl(s.diff, s.depth, s.reorder, `${s.cat} · wholesale`),
}));

const recommendations = SKUS.map((s) => ({
  skuId: s.ref, skuName: s.name, category: s.cat, status: s.status, locked: false,
  reference: s.ref, couleur: s.colour, scenarios: scenarios(s.base), currentScenarioTotal: s.base,
  sizeBreakdown: SIZES.map((size, i) => ({
    size, recommended: s.sizes[i], manualOverride: null, finalQty: s.sizes[i],
    minUnits: 0, maxUnits: null, blocked: false, rounding: null,
  })),
  confidence: s.conf as string, explainability: expl(s.diff, s.depth, s.reorder, `${s.cat} · wholesale`),
  financialImpact: {
    purchaseCost: s.base * 18, expectedTurnover: s.base * 42, grossMargin: s.base * 24,
    marginPercent: 57, budgetImpactPercent: Math.round((s.base * 18) / 2400),
  },
}));

const projectionDetail = (ref: string) => {
  const s = SKUS.find((x) => x.ref === ref) ?? SKUS[0];
  return {
    skuId: s.ref, skuName: s.name, category: s.cat,
    productInfo: {
      reference: s.ref, name: s.name, matiere: "Cotton blend", theme: "Core",
      famille: s.cat, sousFamille: s.cat, rayon: "Menswear", saison: "Fall '26",
    },
    stockSummary: {
      forecastedQuantity: s.base, supplierOrder: Math.round(s.base * 0.4),
      stock: Math.round(s.base * 0.25), total: Math.round(s.base * 0.65),
    },
    colorVariants: [{
      color: s.colour,
      forecastedQuantity: sizeMap(s.sizes),
      totalDeFournisseur: sizeMap(s.sizes.map((v) => Math.round(v * 0.4))),
      totalDeLeStock: sizeMap(s.sizes.map((v) => Math.round(v * 0.25))),
      totalDeCitNegoce: sizeMap(s.sizes.map(() => 0)),
      totalDeProduit: sizeMap(s.sizes.map((v) => Math.round(v * 0.65))),
    }],
    sizeColumns: SIZES,
    confidence: s.conf as string,
  };
};

const customers = {
  customers: [
    { id: "CUS-1001", name: "Maison Lyon", typology: "chain", region: "FR", categories: ["Knitwear", "Shirts"], reorderFrequency: 0.42, avgBasket: 4440, status: "visited" },
    { id: "CUS-1002", name: "Nordic Retail Group", typology: "key_account", region: "SE", categories: ["Outerwear"], reorderFrequency: 0.38, avgBasket: 8200, status: "visited" },
    { id: "CUS-1003", name: "Amelia Chen", typology: "independent", region: "SG", categories: ["Shirts", "Bottoms"], reorderFrequency: 0.29, avgBasket: 2610, status: "visited" },
    { id: "CUS-1051", name: "Berlin Menswear", typology: "independent", region: "DE", categories: ["Knitwear"], reorderFrequency: 0.0, avgBasket: 0, status: "not_visited", matchedTo: "Maison Lyon", similarityScore: 0.86, matchConfidence: "high" },
    { id: "CUS-1052", name: "Milano Uomo", typology: "chain", region: "IT", categories: ["Outerwear", "Bottoms"], reorderFrequency: 0.0, avgBasket: 0, status: "not_visited", matchedTo: "Nordic Retail Group", similarityScore: 0.79, matchConfidence: "medium" },
  ],
  regions: ["FR", "SE", "SG", "DE", "IT"],
  latestSeason: "Fall '26",
};

const customerDetail = (customer: string) => ({
  customer,
  purchaseHistory: SKUS.slice(0, 4).map((s) => ({
    skuId: s.ref, skuName: s.name, season: "Spring '26", units: Math.round(s.base / 6), value: Math.round(s.base * 6),
  })),
  seasons: ["Spring '26", "Fall '25", "Spring '25"],
});

const validation = {
  scenarioMetrics: {
    conservative: { totalUnits: 903, purchaseCost: 16254, budgetUsage: 68, grossMargin: 21672, skusAtRisk: 1 },
    base: { totalUnits: 1205, purchaseCost: 21690, budgetUsage: 90, grossMargin: 28920, skusAtRisk: 2 },
    optimistic: { totalUnits: 1566, purchaseCost: 28188, budgetUsage: 117, grossMargin: 37584, skusAtRisk: 4 },
  },
  overrides: [
    { skuId: "SHT-0188", skuName: "Linen Camp Shirt", reference: "SHT-0188", couleur: "Sand", taille: "M", aiRecommended: 32, userOverride: 20, reasonTag: "Low confidence", notes: "Trim first drop until reorder signal." },
    { skuId: "OUT-0067", skuName: "Quilted Field Jacket", reference: "OUT-0067", couleur: "Olive", taille: "XL", aiRecommended: 20, userOverride: 28, reasonTag: "Buyer insight", notes: "Strong pre-book from key accounts." },
  ],
};

const budget = {
  summary: {
    totalPurchaseCost: 21690, seasonBudget: 24000, expectedTurnover: 50610, grossMargin: 28920,
    grossMarginPercent: 57, scenario: "base", costRatio: 0.43, costEstimated: true,
    budgetsByScenario: { conservative: 16254, base: 21690, optimistic: 28188 },
  },
  categories: ["Knitwear", "Shirts", "Bottoms", "Outerwear"].map((c) => ({
    category: c, purchaseCost: 5400, budgetPercent: 22, marginPercent: 57,
    status: "on_target" as const,
    skus: SKUS.filter((s) => s.cat === c).map((s) => ({
      skuId: s.ref, name: s.name, purchaseCost: s.base * 18, margin: 57, targetMargin: 55,
    })),
  })),
};

const dashboard = {
  kpis: [
    { label: "Forecast demand", value: "1,205", subLabel: "units · Fall '26", trend: "up", trendValue: 14 },
    { label: "Projected sell-through", value: "88%", subLabel: "base scenario", trend: "up", trendValue: 5 },
    { label: "Stockout risk", value: "2 SKUs", subLabel: "within 30 days", trend: "down", trendValue: 2 },
    { label: "Forecast accuracy", value: "91%", subLabel: "trailing 3 mo (WMAPE 9%)", trend: "up", trendValue: 2 },
  ],
  financialSummary: {
    budgetUsed: 21690, budgetTotal: 24000, margin: 57, targetMargin: 55, coverage: 0.65,
    totalPurchaseCost: 21690, expectedTurnover: 50610,
  },
  confidenceDistribution: { high: 3, medium: 2, low: 1 },
  lastPipelineRun: new Date().toISOString(),
  totalSKUs: SKUS.length,
};

const forecastAccuracy = {
  headline: { wmape: 9.2, bias: -1.4, coverage80: 82, lastRunAt: new Date().toISOString(), skuCount: 6 },
  byModelType: [
    { modelType: "SARIMA", wmape: 7.8, bias: -0.9, coverage80: 85, skuCount: 3 },
    { modelType: "CATBOOST", wmape: 11.1, bias: -2.2, coverage80: 78, skuCount: 3 },
  ],
  byCategory: ["Knitwear", "Shirts", "Bottoms", "Outerwear"].map((f) => ({
    famille: f, wmape: 9.0, bias: -1.2, coverage80: 82, skuCount: 2,
  })),
  trend: ["2026-03", "2026-04", "2026-05"].map((m, i) => ({
    foldMonth: m, wmape: 11 - i, bias: -2 + i * 0.3, coverage80: 79 + i,
  })),
};

const seasonConfig = { name: "Fall '26", currency: "EUR", budget: 24000, targetMargin: 55, budgetBandPct: 10, costRatio: 0.43 };
const ingestStatus = { enabled: true, configured: true, hasHistoryQuery: true, baseUrl: "erp://preduit", enseigne: "Preduit ERP", mode: "erp", provider: "Preduit ERP" };
const forecastJob = { jobId: "job-demo", status: "completed", lastRun: new Date().toISOString(), errorMessage: null, startedAt: null, finishedAt: new Date().toISOString() };
const backtestStatus = { runId: 12, status: "completed", startedAt: new Date().toISOString(), completedAt: new Date().toISOString() };
const syncState = { status: "ok", lastSyncedAt: new Date().toISOString(), message: "Synced from Preduit ERP" };
const audit: unknown[] = [];

/** Resolve a static fixture for an AI GET path (returns undefined if none). */
export function getAiFixture(path: string): unknown {
  const p = path.split("?")[0];
  if (p === "/dashboard") return dashboard;
  if (p === "/audit") return audit;
  if (p === "/products") return products;
  if (p === "/projections") return projections;
  if (/^\/projections\/[^/]+\/detail$/.test(p)) return projectionDetail(decodeURIComponent(p.split("/")[2]));
  if (p === "/budget") return budget;
  if (p === "/recommendations") return recommendations;
  if (p === "/validation") return validation;
  if (p === "/customers") return customers;
  if (p === "/customer-detail") return customerDetail("Maison Lyon");
  if (p === "/forecast/accuracy") return forecastAccuracy;
  if (p === "/sync-state") return syncState;
  if (p === "/season-config") return seasonConfig;
  if (p === "/ingest/status") return ingestStatus;
  if (p === "/forecast/job") return forecastJob;
  if (p === "/forecast/backtest-status") return backtestStatus;
  // Mutations / unknowns → benign success.
  return { status: "ok" };
}
