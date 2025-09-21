import type { FC } from 'react';

type Props = { values: Record<string, number>; onChange: (k: string, v: number) => void; };

export const MetricSliders: FC<Props> = ({ values, onChange }) => {
  const fields: [string, number, number, number, string][] = [
    ['Steps', 2000, 12000, 100, 'steps/day'],
    ['RestingHR', 50, 90, 1, 'bpm'],
    ['BMI', 18.5, 32, 0.1, ''],
    ['SleepHours', 5, 8, 0.1, 'hrs'],
    ['DrivingScore', 50, 100, 1, '/100'],
    ['MilesDriven', 0, 1500, 10, '/mo'],
  ];

  return (
    <div className="grid gap-4">
      {fields.map(([k, min, max, step, unit]) => (
        <div key={k} className="rounded-xl border p-4 bg-white dark:bg-neutral-900 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <label className="font-medium">{k}</label>
            <span className="text-sm text-neutral-600 dark:text-neutral-300">
              {values[k].toFixed(step < 1 ? 1 : 0)} {unit}
            </span>
          </div>
          <input
            className="w-full accent-black dark:accent-white"
            type="range"
            min={min} max={max} step={step} value={values[k]}
            onChange={(e)=>onChange(k, Number(e.target.value))}
          />
        </div>
      ))}
    </div>
  );
};
