import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Home, User, Car, GraduationCap, CreditCard, Banknote, ChevronRight } from 'lucide-react';
import type { Loan, LoanType } from '../../types/loan';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';
import { calculateRemainingBalance } from '../../utils/emi';
import { formatINR } from '../../utils/currency';
import { formatDate, getMonthsElapsed, getNextDueDate } from '../../utils/date';
import styles from './LoanListItem.module.css';

const iconMap: Record<LoanType, React.FC<{ size?: number }>> = {
  home: Home,
  personal: User,
  vehicle: Car,
  education: GraduationCap,
  credit_card: CreditCard,
  other: Banknote,
};

interface LoanListItemProps {
  loan: Loan;
}

export default function LoanListItem({ loan }: LoanListItemProps) {
  const navigate = useNavigate();
  const Icon = iconMap[loan.loanType] || Banknote;

  const { paid, remaining, percentage, nextDue } = useMemo(() => {
    const el = getMonthsElapsed(loan.startDate);
    const rem = calculateRemainingBalance(
      loan.principal, loan.annualRate, loan.tenureMonths, el, loan.emiAmount
    );
    const p = loan.principal - rem;
    const pct = loan.principal > 0 ? Math.min(100, (p / loan.principal) * 100) : 0;
    const nd = getNextDueDate(loan.startDate, el);
    return { paid: p, remaining: rem, percentage: pct, nextDue: nd };
  }, [loan]);

  const hasMissedEmis = (loan.missedEmis || 0) > 0;
  const isOverdue = loan.status === 'overdue' || hasMissedEmis;
  const isPaid = loan.status === 'paid' || percentage >= 99.5;

  const statusBadge = isPaid
    ? { variant: 'success' as const, label: 'Paid Off' }
    : isOverdue
    ? { variant: 'danger' as const, label: hasMissedEmis ? `${loan.missedEmis} Missed` : 'Overdue' }
    : { variant: 'info' as const, label: 'On Track' };

  return (
    <Card
      className={styles.item}
      onClick={() => navigate(`/loan/${loan.id}`)}
    >
      <div className={styles.top}>
        <div className={styles.iconWrapper}>
          <Icon size={20} />
        </div>
        <div className={styles.info}>
          <div className={styles.nameRow}>
            <h3 className={styles.name}>{loan.name}</h3>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </div>
          <p className={styles.lender}>{loan.lender}</p>
        </div>
        <ChevronRight size={18} className={styles.chevron} />
      </div>

      <div className={styles.details}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Principal</span>
          <span className={styles.detailValue}>{formatINR(loan.principal)}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>EMI</span>
          <span className={styles.detailValue}>{formatINR(loan.emiAmount)}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Rate</span>
          <span className={styles.detailValue}>{loan.annualRate}%</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Next Due</span>
          <span className={styles.detailValue}>{formatDate(nextDue, 'dd MMM')}</span>
        </div>
      </div>

      <div className={styles.progressWrapper}>
        <ProgressBar
          percentage={percentage}
          color={isPaid ? 'var(--color-paid)' : isOverdue ? 'var(--color-overdue)' : 'var(--color-accent)'}
          showLabel
        />
        <div className={styles.progressInfo}>
          <span>Paid: {formatINR(paid)}</span>
          <span>Remaining: {formatINR(remaining)}</span>
        </div>
      </div>
    </Card>
  );
}
