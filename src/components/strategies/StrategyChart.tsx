import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { StrategyResult } from '../../types/strategy';
import { formatINRCompact } from '../../utils/currency';
import styles from './StrategyChart.module.css';

interface StrategyChartProps {
  current: StrategyResult;
  avalanche: StrategyResult;
  snowball: StrategyResult;
}

export default function StrategyChart({ current, avalanche, snowball }: StrategyChartProps) {
  const chartData = useMemo(() => {
    const maxMonths = Math.max(current.totalMonths, avalanche.totalMonths, snowball.totalMonths);
    const data: { month: number; current: number; avalanche: number; snowball: number }[] = [];

    for (let m = 0; m <= maxMonths; m++) {
      const getBalance = (strategy: StrategyResult, month: number): number => {
        return strategy.plans.reduce((total, plan) => {
          if (month === 0) {
            return total + (plan.monthlyBreakdown[0]?.balance || 0) + (plan.monthlyBreakdown[0]?.principal || 0);
          }
          const entry = plan.monthlyBreakdown[month - 1];
          return total + (entry?.balance || 0);
        }, 0);
      };

      // Only push every Nth month to keep chart readable
      const step = maxMonths > 120 ? 6 : maxMonths > 48 ? 3 : 1;
      if (m % step === 0 || m === maxMonths) {
        data.push({
          month: m,
          current: Math.round(getBalance(current, m)),
          avalanche: Math.round(getBalance(avalanche, m)),
          snowball: Math.round(getBalance(snowball, m)),
        });
      }
    }

    return data;
  }, [current, avalanche, snowball]);

  return (
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(136, 146, 164, 0.15)" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: '#8892A4' }}
            tickLine={false}
            label={{ value: 'Months', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#8892A4' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#8892A4' }}
            tickLine={false}
            tickFormatter={(v) => formatINRCompact(v)}
            width={50}
          />
          <Tooltip
            formatter={(value: unknown, name: unknown) => [formatINRCompact(Number(value)), String(name)]}
            contentStyle={{
              background: '#1A1A2E',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
          <Line
            type="monotone"
            dataKey="current"
            stroke="#8892A4"
            strokeWidth={2}
            dot={false}
            name="Current"
          />
          <Line
            type="monotone"
            dataKey="avalanche"
            stroke="#00D2C6"
            strokeWidth={2}
            dot={false}
            name="Avalanche"
          />
          <Line
            type="monotone"
            dataKey="snowball"
            stroke="#6366F1"
            strokeWidth={2}
            dot={false}
            name="Snowball"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
