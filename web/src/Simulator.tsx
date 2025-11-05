// web/src/Simulator.tsx
import { useEffect, useRef, useState } from 'react';
import { getPreview, postWhatIf, getLatestMetrics } from './api';
import { PremiumGauge } from './components/PremiumGauge';
import { BreakdownChart } from './components/BreakdownChart';
import { MetricSliders } from './components/MetricSliders';
import { FactorTable } from './components/FactorTable';
import { downloadQuotePdf } from './pdf';
import type { RiskResult } from './types';
import { currentUser } from './auth';

const DEMO_USER = '00000000-0000-0000-0000-000000000001';

export default function Simulator() {
  const u = currentUser(); // { id, email, fullName } | null (Identity)
  // For now, always use demo GUID for backend data:
  const USER_GUID_FOR_API = DEMO_USER;

  const [vals, setVals] = useState<Record<string, number>>({
    Steps: 6000,
    RestingHR: 68,
    BMI: 26,
    SleepHours: 7,
    DrivingScore: 82,
    MilesDriven: 450,
  });
  const [result, setResult] = useState<RiskResult | null>(null);
  const [busyReset, setBusyReset] = useState(false);
  const [busyPdf, setBusyPdf] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Refs for PDF snapshots
  const refPremium = useRef<HTMLDivElement | null>(null);
  const refChart   = useRef<HTMLDivElement | null>(null);
  const refFactors = useRef<HTMLDivElement | null>(null);

  // Debounced recompute while dragging sliders
  const timer = useRef<number | null>(null);
  const onSlider = (k: string, v: number) => {
    const next = { ...vals, [k]: v };
    setVals(next);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        const r = await postWhatIf(USER_GUID_FOR_API, next);
        setResult(r);
        setErr(null);
      } catch (e: any) {
        setErr(e?.message ?? 'Failed to compute');
      }
    }, 250);
  };

  // Reset everything to DB state (for this user)
  const resetToDb = async () => {
    setBusyReset(true);
    setErr(null);
    try {
      const [preview, latest] = await Promise.all([
        getPreview(USER_GUID_FOR_API),
        getLatestMetrics(USER_GUID_FOR_API),
      ]);
      setVals({
        Steps:        Number((latest as any).Steps        ?? 6000),
        RestingHR:    Number((latest as any).RestingHR    ?? 68),
        BMI:          Number((latest as any).BMI          ?? 26),
        SleepHours:   Number((latest as any).SleepHours   ?? 7),
        DrivingScore: Number((latest as any).DrivingScore ?? 82),
        MilesDriven:  Number((latest as any).MilesDriven  ?? 450),
      });
      setResult(preview);
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to fetch latest');
    } finally {
      setBusyReset(false);
    }
  };

  // Generate PDF of current view (show signed-in name if present)
  const getQuotePdf = async () => {
    if (!result) return;
    setBusyPdf(true);
    try {
      const userLine = u?.fullName ? `${u.fullName} (${USER_GUID_FOR_API})` : USER_GUID_FOR_API;
      await downloadQuotePdf({
        userId: userLine,
        premium: result.premium,
        risk: result.riskScore,
        metrics: vals,
        nodes: {
          premium: refPremium.current,
          chart: refChart.current,
          factors: refFactors.current,
        },
      });
    } finally {
      setBusyPdf(false);
    }
  };

  // Initial load + whenever auth user changes (keeps greeting fresh)
  useEffect(() => { void resetToDb(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [u?.id]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 grid gap-6 md:grid-cols-5">
      {/* Left column */}
      <section className="md:col-span-3 space-y-6">
        <div
          ref={refPremium}
          className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <h3 className="mb-4 text-lg font-semibold">
            Current Premium{u ? ` — ${u.fullName}` : ''}
          </h3>
          <PremiumGauge premium={result?.premium ?? 0} risk={result?.riskScore ?? 0} />
        </div>

        {err && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200">
            {err}
          </div>
        )}

        <div
          ref={refChart}
          className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <h3 className="text-lg font-semibold">Contribution Breakdown</h3>
          <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-300">
            Each bar shows <b>weight × badness</b> (badness ∈ 0–1). Sum = overall risk score.
          </p>
          {result?.components ? (
            <BreakdownChart components={result.components} />
          ) : (
            <div className="text-neutral-500 text-sm">Adjust sliders or Reset.</div>
          )}
        </div>

        <div
          ref={refFactors}
          className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <FactorTable components={result?.components} />
        </div>
      </section>

      {/* Right column */}
      <aside className="md:col-span-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Sliders</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={getQuotePdf}
                disabled={!result || busyPdf}
                className="px-3 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-60"
                title="Download the current quote as PDF"
              >
                {busyPdf ? 'Building…' : 'Get Quote (PDF)'}
              </button>
              <button
                onClick={resetToDb}
                disabled={busyReset}
                className="px-3 py-2 rounded-lg bg-black text-white disabled:opacity-60 dark:bg-white dark:text-black"
                title="Reset sliders & premium to saved DB values"
              >
                {busyReset ? 'Resetting…' : 'Reset'}
              </button>
            </div>
          </div>

          <MetricSliders values={vals} onChange={onSlider} />

          <p className="mt-3 text-xs text-neutral-600 dark:text-neutral-300">
            Steps / SleepHours / DrivingScore — higher is better (lower risk).<br />
            RestingHR / BMI / MilesDriven — higher is worse (higher risk).
          </p>
        </div>
      </aside>
    </main>
  );
}
