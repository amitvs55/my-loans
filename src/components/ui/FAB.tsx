import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import styles from './FAB.module.css';

export default function FAB() {
  const navigate = useNavigate();

  return (
    <button
      className={styles.fab}
      onClick={() => navigate('/add-loan')}
      aria-label="Add new loan"
    >
      <Plus size={24} strokeWidth={2.5} />
    </button>
  );
}
