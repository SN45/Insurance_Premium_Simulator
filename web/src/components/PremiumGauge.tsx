import type { FC } from 'react';

export const PremiumGauge: FC<{ premium: number; risk: number }> = ({ premium, risk }) => {
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const pct = Math.round((risk ?? 0) * 100);

  return (
    <div className="space-y-3">
      <div className="text-4xl font-extrabold tracking-tight">{fmt.format(Number(premium || 0))}</div>
      <div className="text-sm text-neutral-600 dark:text-neutral-300">Risk Score: {pct}%</div>
      <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-black dark:bg-white transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
