import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { useLoanStore } from '../store/loan-store';
import StrategyComparison from '../components/strategies/StrategyComparison';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router';
import styles from './StrategiesPage.module.css';

export default function StrategiesPage() {
  const loansRecord = useLoanStore(s => s.loans);
  const navigate = useNavigate();

  const loans = useMemo(() => {
    return Object.values(loansRecord).filter(l => l.status !== 'paid');
  }, [loansRecord]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Payoff Strategies</h1>
        <span className={styles.badge}>{loans.length} Loan{loans.length !== 1 ? 's' : ''}</span>
      </div>

      {loans.length < 2 ? (
        <EmptyState
          icon={<TrendingUp size={32} />}
          title="Need 2+ Loans"
          description="Add at least 2 active loans to compare payoff strategies like Avalanche and Snowball."
          action={
            <Button onClick={() => navigate('/add-loan')}>Add a Loan</Button>
          }
        />
      ) : (
        <div className={styles.content}>
          <StrategyComparison />
        </div>
      )}
    </div>
  );
}
