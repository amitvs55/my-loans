import { useMemo } from 'react';
import { Banknote } from 'lucide-react';
import { useLoanStore } from '../store/loan-store';
import SummaryCard from '../components/dashboard/SummaryCard';
import LoanListItem from '../components/dashboard/LoanListItem';
import FAB from '../components/ui/FAB';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const loansRecord = useLoanStore(s => s.loans);
  const loadSampleData = useLoanStore(s => s.loadSampleData);
  const navigate = useNavigate();

  const loans = useMemo(() => {
    return Object.values(loansRecord)
      .filter(l => l.status !== 'paid')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [loansRecord]);

  if (loans.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.headerBar}>
          <h1 className={styles.title}>My Loans</h1>
        </div>
        <EmptyState
          icon={<Banknote size={32} />}
          title="No Active Loans"
          description="Add your first loan to start tracking your debt and accelerate your payoff journey."
          action={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button onClick={() => navigate('/add-loan')}>Add Your First Loan</Button>
              <Button variant="ghost" onClick={loadSampleData}>Load Sample Data</Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerBar}>
        <h1 className={styles.title}>My Loans</h1>
        <span className={styles.greeting}>Track & Accelerate</span>
      </div>

      <SummaryCard />

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Active Loans</h2>
        <span className={styles.count}>{loans.length}</span>
      </div>

      <div className="stagger-children">
        {loans.map((loan) => (
          <LoanListItem key={loan.id} loan={loan} />
        ))}
      </div>

      <FAB />
    </div>
  );
}
