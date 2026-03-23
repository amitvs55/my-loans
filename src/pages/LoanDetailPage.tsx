import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Edit3, Trash2 } from 'lucide-react';
import { useLoan } from '../hooks/use-loan';
import { useLoanStore } from '../store/loan-store';
import LoanHeader from '../components/loan-detail/LoanHeader';
import LoanPieChart from '../components/loan-detail/LoanPieChart';
import AmortizationTable from '../components/loan-detail/AmortizationTable';
import PayoffTimeline from '../components/loan-detail/PayoffTimeline';
import PaymentTracker from '../components/payments/PaymentTracker';
import PaymentCalendar from '../components/payments/PaymentCalendar';
import AccelerationEngine from '../components/strategies/AccelerationEngine';
import styles from './LoanDetailPage.module.css';

const TABS = ['Overview', 'Amortization', 'Payments', 'Accelerate'] as const;
type Tab = typeof TABS[number];

export default function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const deleteLoan = useLoanStore(s => s.deleteLoan);
  const loanData = useLoan(id || '');

  if (!loanData) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 40 }}>
          Loan not found.
        </p>
      </div>
    );
  }

  const { loan, payments, elapsed, remainingBalance, percentage, remainingMonths, nextDue, interestPaid, principalPaid, interestRemaining, payoffDate, schedule } = loanData;

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this loan?')) {
      deleteLoan(loan.id);
      navigate('/');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button onClick={() => navigate('/')} className={styles.back}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.pageTitle}>Loan Details</h1>
        <div className={styles.actions}>
          <button onClick={() => navigate(`/edit-loan/${loan.id}`)} className={styles.actionBtn}>
            <Edit3 size={18} />
          </button>
          <button onClick={handleDelete} className={`${styles.actionBtn} ${styles.deleteBtn}`}>
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <LoanHeader
        name={loan.name}
        lender={loan.lender}
        loanType={loan.loanType}
        principal={loan.principal}
        emiAmount={loan.emiAmount}
        annualRate={loan.annualRate}
        tenureMonths={loan.tenureMonths}
        remainingBalance={remainingBalance}
        remainingMonths={remainingMonths}
        percentage={percentage}
        nextDue={nextDue}
        status={loan.status}
        missedEmis={loan.missedEmis}
      />

      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'Overview' && (
          <div className="animate-fade-in">
            <LoanPieChart
              principalPaid={principalPaid}
              interestPaid={interestPaid}
              remainingBalance={remainingBalance}
              interestRemaining={interestRemaining}
            />
            <PayoffTimeline
              startDate={loan.startDate}
              payoffDate={payoffDate}
              percentage={percentage}
              elapsed={elapsed}
              tenureMonths={loan.tenureMonths}
            />
          </div>
        )}

        {activeTab === 'Amortization' && (
          <div className="animate-fade-in">
            <AmortizationTable schedule={schedule} startDate={loan.startDate} />
          </div>
        )}

        {activeTab === 'Payments' && (
          <div className="animate-fade-in">
            <PaymentTracker loanId={loan.id} emiAmount={loan.emiAmount} />
            <div style={{ marginTop: 12 }}>
              <PaymentCalendar
                payments={payments}
                startDate={loan.startDate}
                tenureMonths={loan.tenureMonths}
              />
            </div>
          </div>
        )}

        {activeTab === 'Accelerate' && (
          <div className="animate-fade-in">
            <AccelerationEngine
              loanId={loan.id}
              currentBalance={remainingBalance}
              annualRate={loan.annualRate}
              remainingMonths={remainingMonths}
              currentEMI={loan.emiAmount}
              startDate={loan.startDate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
