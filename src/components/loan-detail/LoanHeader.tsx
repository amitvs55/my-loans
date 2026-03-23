import { Home, User, Car, GraduationCap, CreditCard, Banknote } from 'lucide-react';
import type { LoanType } from '../../types/loan';
import Badge from '../ui/Badge';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import styles from './LoanHeader.module.css';

const iconMap: Record<LoanType, React.FC<{ size?: number }>> = {
  home: Home, personal: User, vehicle: Car,
  education: GraduationCap, credit_card: CreditCard, other: Banknote,
};

interface LoanHeaderProps {
  name: string;
  lender: string;
  loanType: LoanType;
  principal: number;
  emiAmount: number;
  annualRate: number;
  tenureMonths: number;
  remainingBalance: number;
  remainingMonths: number;
  percentage: number;
  nextDue: Date;
  status: string;
  missedEmis?: number;
}

export default function LoanHeader(props: LoanHeaderProps) {
  const Icon = iconMap[props.loanType] || Banknote;
  const isPaid = props.percentage >= 99.5;
  const hasMissed = (props.missedEmis || 0) > 0;
  const isOverdue = props.status === 'overdue' || hasMissed;

  return (
    <div className={styles.header}>
      <div className={styles.top}>
        <div className={styles.iconWrapper}>
          <Icon size={24} />
        </div>
        <div className={styles.info}>
          <h2 className={styles.name}>{props.name}</h2>
          <p className={styles.lender}>{props.lender}</p>
        </div>
        <Badge variant={isPaid ? 'success' : isOverdue ? 'danger' : 'info'} size="md">
          {isPaid ? 'Paid Off' : isOverdue ? (hasMissed ? `${props.missedEmis} Missed` : 'Overdue') : 'On Track'}
        </Badge>
      </div>

      {hasMissed && (
        <div className={styles.missedBanner}>
          <span>⚠️ {props.missedEmis} missed EMI{(props.missedEmis || 0) > 1 ? 's' : ''} — overdue amount: <strong>{formatINR((props.missedEmis || 0) * props.emiAmount)}</strong></span>
        </div>
      )}

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Remaining</span>
          <span className={styles.statValue}>{formatINR(props.remainingBalance)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Monthly EMI</span>
          <span className={styles.statValue}>{formatINR(props.emiAmount)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Interest Rate</span>
          <span className={styles.statValue}>{props.annualRate}%</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Months Left</span>
          <span className={styles.statValue}>{props.remainingMonths}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Next Due</span>
          <span className={styles.statValue}>{formatDate(props.nextDue, 'dd MMM yyyy')}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Progress</span>
          <span className={styles.statValue}>{Math.round(props.percentage)}%</span>
        </div>
      </div>
    </div>
  );
}
