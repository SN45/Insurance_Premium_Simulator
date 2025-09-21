export type RiskComponent = {
    metric: string; weight: number; higherIsBetter: boolean;
    capMin: number; capMax: number; normalized: number; contribution: number;
  };
  export type RiskResult = { premium: number; riskScore: number; components: RiskComponent[] };
  