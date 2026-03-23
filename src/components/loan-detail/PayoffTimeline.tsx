import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import { formatDate, formatMonthYear } from '../../utils/date';
import styles from './PayoffTimeline.module.css';

interface PayoffTimelineProps {
  startDate: string;
  payoffDate: Date;
  percentage: number;
  elapsed: number;
  tenureMonths: number;
}

export default function PayoffTimeline({
  startDate,
  payoffDate,
  percentage,
  elapsed,
  tenureMonths,
}: PayoffTimelineProps) {
  return (
    <Card className={styles.card}>
      <h3 className={styles.title}>Payoff Timeline</h3>

      <div className={styles.timeline}>
        <div className={styles.point}>
          <div className={`${styles.dot} ${styles.dotCompleted}`} />
          <span className={styles.pointLabel}>Start</span>
          <span className={styles.pointDate}>{formatDate(startDate, 'MMM yyyy')}</span>
        </div>
        <div className={styles.bar}>
          <ProgressBar percentage={percentage} height={8} />
        </div>
        <div className={styles.point}>
          <div className={`${styles.dot} ${percentage >= 99.5 ? styles.dotCompleted : styles.dotPending}`} />
          <span className={styles.pointLabel}>Payoff</span>
          <span className={styles.pointDate}>{formatMonthYear(payoffDate)}</span>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{elapsed}</span>
          <span className={styles.statLabel}>Months Completed</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>{Math.max(0, tenureMonths - elapsed)}</span>
          <span className={styles.statLabel}>Months Remaining</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>{tenureMonths}</span>
          <span className={styles.statLabel}>Total Tenure</span>
        </div>
      </div>
    </Card>
  );
}
