import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, type PieLabelRenderProps } from 'recharts';
import Card from '../ui/Card';
import { formatINR } from '../../utils/currency';
import styles from './LoanPieChart.module.css';

interface LoanPieChartProps {
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
  interestRemaining: number;
}

const COLORS = ['#00D2C6', '#FF6B6B', '#4A5568'];

export default function LoanPieChart({
  principalPaid,
  interestPaid,
  remainingBalance,
  interestRemaining,
}: LoanPieChartProps) {
  const data = [
    { name: 'Principal Paid', value: Math.round(principalPaid) },
    { name: 'Interest Paid', value: Math.round(interestPaid) },
    { name: 'Remaining', value: Math.round(remainingBalance + interestRemaining) },
  ].filter(d => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  const renderLabel = (props: PieLabelRenderProps) => {
    const value = Number(props.value || 0);
    const pct = ((value / total) * 100).toFixed(1);
    return `${pct}%`;
  };

  return (
    <Card className={styles.card}>
      <h3 className={styles.title}>Payment Breakdown</h3>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              label={renderLabel}
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: unknown) => formatINR(Number(value))}
              contentStyle={{
                background: '#1A1A2E',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.legend}>
        {data.map((item, i) => (
          <div key={item.name} className={styles.legendItem}>
            <div className={styles.legendDot} style={{ backgroundColor: COLORS[i] }} />
            <div className={styles.legendInfo}>
              <span className={styles.legendLabel}>{item.name}</span>
              <span className={styles.legendValue}>{formatINR(item.value)}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
