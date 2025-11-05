// web/src/api.ts
import axios from "axios";
import type { RiskResult } from "./types";

const base = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
export const api = axios.create({ baseURL: base, withCredentials: false });

// ---- premium endpoints ----
export async function getPreview(userId: string): Promise<RiskResult> {
  const r = await api.get(`/premium/preview`, { params: { userId } });
  return r.data;
}

export async function postWhatIf(
  userId: string,
  metrics: Record<string, number>
): Promise<RiskResult> {
  const payload = {
    UserId: userId,
    Steps: metrics.Steps,
    RestingHR: metrics.RestingHR,
    BMI: metrics.BMI,
    SleepHours: metrics.SleepHours,
    DrivingScore: metrics.DrivingScore,
    MilesDriven: metrics.MilesDriven,
  };
  const r = await api.post(`/premium/whatif`, payload);
  return r.data;
}

export async function getLatestMetrics(userId: string) {
  const r = await api.get(`/metrics/latest`, { params: { userId } });
  return r.data;
}
