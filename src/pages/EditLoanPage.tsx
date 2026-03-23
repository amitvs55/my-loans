import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useLoanStore } from '../store/loan-store';
import LoanForm from '../components/loan-form/LoanForm';
import styles from './FormPage.module.css';

export default function EditLoanPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const loan = useLoanStore(s => s.loans[id || '']);

  if (!loan) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 40 }}>
          Loan not found.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.back}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>Edit Loan</h1>
        <div style={{ width: 20 }} />
      </div>
      <LoanForm existingLoan={loan} />
    </div>
  );
}
