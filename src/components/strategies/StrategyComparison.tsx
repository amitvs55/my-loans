import { useState, useMemo } from 'react';
import { TrendingUp, Snowflake, Zap } from 'lucide-react';
import { useLoanStore } from '../../store/loan-store';
import { compareStrategies } from '../../utils/payoff-strategies';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import Card from '../ui/Card';
import Slider from '../ui/Slider';
import Badge from '../ui/Badge';
import StrategyChart from './StrategyChart';
import styles from './StrategyComparison.module.css';

export default function StrategyComparison() {
  const loansRecord = useLoanStore(s => s.loans);
  const loans = useMemo(() => Object.values(loansRecord).filter(l => l.status !== 'paid'), [loansRecord]);
  const [extraBudget, setExtraBudget] = useState(5000);

  const totalEMI = loans.reduce((s, l) => s + l.emiAmount, 0);
  const maxExtra = Math.round(totalEMI);

  const comparison = useMemo(() => {
    return compareStrategies(loans, extraBudget);
  }, [loans, extraBudget]);

  const strategies = [
    { data: comparison.current, icon: <Zap size={18} />, color: 'var(--color-text-muted)' },
    { data: comparison.avalanche, icon: <TrendingUp size={18} />, color: 'var(--color-accent)' },
    { data: comparison.snowball, icon: <Snowflake size={18} />, color: '#6366F1' },
  ];

  return (
    <div className={styles.wrapper}>
      <Card className={styles.section}>
        <h3 className={styles.sectionTitle}>Extra Monthly Budget</h3>
        <p className={styles.subtitle}>
          How much extra can you put towards your loans each month?
        </p>
        <Slider
          label="Extra Budget"
          value={extraBudget}
          min={0}
          max={maxExtra}
          step={500}
          onChange={setExtraBudget}
          formatValue={(v) => formatINR(v)}
        />
      </Card>

      <div className={styles.strategyCards}>
        {strategies.map(({ data, icon, color }) => (
          <Card key={data.name} className={styles.strategyCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon} style={{ color }}>{icon}</div>
              <div>
                <h4 className={styles.cardTitle}>{data.name}</h4>
                {data.interestSaved > 0 && (
                  <Badge variant="success">Save {formatINR(data.interestSaved)}</Badge>
                )}
              </div>
            </div>
            <div className={styles.cardStats}>
              <div className={styles.cardStat}>
                <span className={styles.cardStatLabel}>Debt-Free</span>
                <span className={styles.cardStatValue}>
                  {data.totalMonths > 0 ? formatDate(data.debtFreeDate, 'MMM yyyy') : 'Now'}
                </span>
              </div>
              <div className={styles.cardStat}>
                <span className={styles.cardStatLabel}>Total Interest</span>
                <span className={styles.cardStatValue}>{formatINR(data.totalInterest)}</span>
              </div>
              <div className={styles.cardStat}>
                <span className={styles.cardStatLabel}>Months</span>
                <span className={styles.cardStatValue}>{data.totalMonths}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {loans.length >= 2 && (
        <Card className={styles.section}>
          <h3 className={styles.sectionTitle}>Balance Over Time</h3>
          <StrategyChart
            current={comparison.current}
            avalanche={comparison.avalanche}
            snowball={comparison.snowball}
          />
        </Card>
      )}

      {/* How it works */}
      <Card className={styles.section}>
        <h3 className={styles.sectionTitle}>How These Strategies Work</h3>
        <div className={styles.explainer}>
          <div className={styles.explainItem}>
            <strong className={styles.explainTitle}>
              <TrendingUp size={14} /> Avalanche Method
            </strong>
            <p>Pay minimums on all loans. Put extra money towards the <em>highest interest rate</em> loan first. Mathematically saves the most money.</p>
          </div>
          <div className={styles.explainItem}>
            <strong className={styles.explainTitle}>
              <Snowflake size={14} /> Snowball Method
            </strong>
            <p>Pay minimums on all loans. Put extra money towards the <em>smallest balance</em> first. Provides quick psychological wins.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
