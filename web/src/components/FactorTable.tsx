import type { FC } from 'react';
import type { RiskComponent } from '../types';

export const FactorTable: FC<{ components: RiskComponent[] | undefined }> = ({ components }) => {
  if (!components?.length) return null;
  return (
    <div className="rounded-2xl shadow-sm border p-6 bg-white dark:bg-neutral-900 dark:border-neutral-800">
      <h3 className="text-lg font-semibold mb-3">Factor Details</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-neutral-500 dark:text-neutral-300">
            <tr>
              <th className="py-2">Metric</th>
              <th className="py-2">Weight</th>
              <th className="py-2">Norm (0–1)</th>
              <th className="py-2">Contribution</th>
            </tr>
          </thead>
          <tbody>
            {components.map(c => (
              <tr key={c.metric} className="border-t dark:border-neutral-800">
                <td className="py-2">{c.metric}</td>
                <td className="py-2">{c.weight.toFixed(2)}</td>
                <td className="py-2">{c.normalized.toFixed(3)}</td>
                <td className="py-2">{c.contribution.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
