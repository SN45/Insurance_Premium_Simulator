import axios from 'axios';
import type { RiskResult } from './types';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE });

export async function getPreview(userId: string): Promise<RiskResult> {
  const { data } = await api.get('/premium/preview', { params: { userId } });
  return data as RiskResult;
}

export async function postWhatIf(userId: string, values: Record<string, number>): Promise<RiskResult> {
  const { data } = await api.post('/premium/whatif', {
    userId,
    Steps: values.Steps, RestingHR: values.RestingHR, BMI: values.BMI,
    SleepHours: values.SleepHours, DrivingScore: values.DrivingScore, MilesDriven: values.MilesDriven,
  });
  return data as RiskResult;
}

export async function getLatestMetrics(userId: string): Promise<Record<string, number>> {
  const { data } = await api.get('/metrics/latest', { params: { userId } });
  return data as Record<string, number>;
}
