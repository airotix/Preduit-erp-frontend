"use client";

import * as React from "react";
import type { Scenario } from "@/lib/ai-types";

interface AiState {
  scenario: Scenario;
  setScenario: (s: Scenario) => void;
  season: string | null;
  setSeason: (s: string | null) => void;
}

const AiContext = React.createContext<AiState | null>(null);

const STORAGE_KEY = "ai-insights-prefs";

/** Module-scoped state (scenario + active season) shared across AI tabs. */
export function AiProvider({ children }: { children: React.ReactNode }) {
  const [scenario, setScenarioState] = React.useState<Scenario>("base");
  const [season, setSeasonState] = React.useState<string | null>(null);

  // Restore prefs after mount (avoids SSR hydration mismatch).
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { scenario?: Scenario; season?: string | null };
        if (p.scenario) setScenarioState(p.scenario);
        if (p.season !== undefined) setSeasonState(p.season);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = React.useCallback((s: Scenario, se: string | null) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ scenario: s, season: se }));
    } catch {
      /* ignore */
    }
  }, []);

  const setScenario = React.useCallback(
    (s: Scenario) => {
      setScenarioState(s);
      persist(s, season);
    },
    [persist, season]
  );

  const setSeason = React.useCallback(
    (se: string | null) => {
      setSeasonState(se);
      persist(scenario, se);
    },
    [persist, scenario]
  );

  const value = React.useMemo(
    () => ({ scenario, setScenario, season, setSeason }),
    [scenario, setScenario, season, setSeason]
  );

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>;
}

export function useAi(): AiState {
  const ctx = React.useContext(AiContext);
  if (!ctx) throw new Error("useAi must be used within <AiProvider>");
  return ctx;
}
