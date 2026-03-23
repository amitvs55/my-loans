import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import LoanForm from '../components/loan-form/LoanForm';
import styles from './FormPage.module.css';

export default function AddLoanPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.back}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>Add New Loan</h1>
        <div style={{ width: 20 }} />
      </div>
      <LoanForm />
    </div>
  );
}
