import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { FC } from 'react';
import type { RiskComponent } from '../types';

const labelMap: Record<string, string> = {
  RestingHR: 'Resting HR',
  SleepHours: 'Sleep Hours',
  DrivingScore: 'D_Score',
  MilesDriven: 'Miles Driven',
};

export const BreakdownChart: FC<{ components: RiskComponent[] }> = ({ components }) => {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const handler = () => setDark(document.documentElement.classList.contains('dark'));
    window.addEventListener('themechange', handler);
    return () => window.removeEventListener('themechange', handler);
  }, []);

  const data = components.map(c => ({
    key: c.metric,
    name: labelMap[c.metric] ?? c.metric,
    value: +c.contribution.toFixed(3),
  }));

  const tickColor = dark ? '#e5e7eb' : '#111827';
  const axisColor = dark ? '#374151' : '#e5e7eb';
  const barFill   = dark ? '#ffffff' : '#000000';
  const tipBg     = dark ? '#111111' : '#ffffff';
  const tipFg     = dark ? '#ffffff' : '#111111';
  const tipBorder = dark ? '#374151' : '#e5e7eb';

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} onMouseLeave={() => setHovered(null)}>
          <XAxis
            dataKey="name"
            interval={0}          // <-- show ALL labels
            tick={{ fill: tickColor }}
            stroke={axisColor}
            tickMargin={8}
            // angle={-10}        // (uncomment if you want angled labels)
            // height={40}
          />
          <YAxis
            domain={[0, 0.4]}
            tick={{ fill: tickColor }}
            stroke={axisColor}
            tickFormatter={(v) => (typeof v === 'number' ? v.toFixed(1) : String(v))}
            label={{ value: 'Contribution (weight × badness)', angle: -90, position: 'insideLeft', fill: tickColor }}
          />
          <Tooltip
            cursor={false}
            wrapperStyle={{ outline: 'none' }}
            contentStyle={{ backgroundColor: tipBg, color: tipFg, border: `1px solid ${tipBorder}` }}
            formatter={(v: any, _n: any, item: any) => [Number(v).toFixed(3), item?.payload?.name ?? 'Contribution']}
          />
          <Bar
            dataKey="value"
            fill={barFill}
            onMouseEnter={(_, idx) => setHovered(idx)}
            onMouseMove={(_, idx) => setHovered(idx)}
          >
            {data.map((_, i) => {
              const active = hovered === i;
              return (
                <Cell
                  key={i}
                  style={{
                    transition: 'transform 180ms ease, filter 180ms ease',
                    transformBox: 'fill-box',
                    transformOrigin: 'center bottom',
                    transform: active ? 'translateY(-6px) scaleY(1.06)' : 'none',
                    filter: active
                      ? (dark ? 'drop-shadow(0 8px 12px rgba(0,0,0,0.65))'
                              : 'drop-shadow(0 8px 12px rgba(0,0,0,0.35))')
                      : 'none',
                    cursor: 'pointer',
                  }}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
