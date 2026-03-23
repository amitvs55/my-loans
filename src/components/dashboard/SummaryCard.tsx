import { Wallet, Calendar, TrendingDown } from 'lucide-react';
import Card from '../ui/Card';
import { useDashboardStats } from '../../hooks/use-dashboard-stats';
import { formatINR, formatINRCompact } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import styles from './SummaryCard.module.css';

export default function SummaryCard() {
  const { totalDebt, totalEmi, nextDueDate, loanCount } = useDashboardStats();

  return (
    <Card variant="accent" className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className={styles.subtitle}>Total Outstanding Debt</p>
          <h2 className={styles.amount}>{formatINRCompact(totalDebt)}</h2>
          <p className={styles.full}>{formatINR(totalDebt)}</p>
        </div>
        <div className={styles.badge}>
          {loanCount} Active Loan{loanCount !== 1 ? 's' : ''}
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statIcon}>
            <Wallet size={16} />
          </div>
          <div>
            <p className={styles.statLabel}>Monthly EMI</p>
            <p className={styles.statValue}>{formatINR(totalEmi)}</p>
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statIcon}>
            <Calendar size={16} />
          </div>
          <div>
            <p className={styles.statLabel}>Next Due</p>
            <p className={styles.statValue}>
              {nextDueDate ? formatDate(nextDueDate, 'dd MMM') : 'N/A'}
            </p>
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statIcon}>
            <TrendingDown size={16} />
          </div>
          <div>
            <p className={styles.statLabel}>Loans</p>
            <p className={styles.statValue}>{loanCount}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
