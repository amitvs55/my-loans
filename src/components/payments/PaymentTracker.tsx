import { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { useLoanStore } from '../../store/loan-store';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import styles from './PaymentTracker.module.css';

interface PaymentTrackerProps {
  loanId: string;
  emiAmount: number;
}

export default function PaymentTracker({ loanId, emiAmount }: PaymentTrackerProps) {
  const payments = useLoanStore(s => s.payments[loanId] || []);
  const { markEmiPaid, recordPrepayment, removePayment } = useLoanStore();
  const [showPrepayment, setShowPrepayment] = useState(false);
  const [prepaymentAmount, setPrepaymentAmount] = useState('');
  const [prepaymentDate, setPrepaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const isCurrentMonthPaid = payments.some(
    p => p.month === currentMonth && p.year === currentYear && p.type === 'emi'
  );

  const handleMarkPaid = () => {
    markEmiPaid(loanId, currentMonth, currentYear, emiAmount);
  };

  const handlePrepayment = () => {
    const amount = parseFloat(prepaymentAmount);
    if (amount > 0) {
      recordPrepayment(loanId, amount, prepaymentDate);
      setPrepaymentAmount('');
      setShowPrepayment(false);
    }
  };

  const emiPayments = payments.filter(p => p.type === 'emi').sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  const prepayments = payments.filter(p => p.type === 'prepayment').sort((a, b) => {
    return new Date(b.paidDate || '').getTime() - new Date(a.paidDate || '').getTime();
  });

  return (
    <div className={styles.wrapper}>
      <Card className={styles.currentMonth}>
        <div className={styles.currentHeader}>
          <div>
            <p className={styles.monthLabel}>
              {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
            <p className={styles.emiLabel}>EMI: {formatINR(emiAmount)}</p>
          </div>
          {isCurrentMonthPaid ? (
            <Badge variant="success" size="md">Paid</Badge>
          ) : (
            <Button size="sm" onClick={handleMarkPaid} icon={<Check size={16} />}>
              Mark Paid
            </Button>
          )}
        </div>
      </Card>

      <Card className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Extra Payments</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowPrepayment(!showPrepayment)}
            icon={<Plus size={16} />}
          >
            Add
          </Button>
        </div>

        {showPrepayment && (
          <div className={styles.prepaymentForm}>
            <Input
              label="Amount"
              type="number"
              prefix="₹"
              value={prepaymentAmount}
              onChange={e => setPrepaymentAmount(e.target.value)}
              placeholder="50000"
            />
            <Input
              label="Date"
              type="date"
              value={prepaymentDate}
              onChange={e => setPrepaymentDate(e.target.value)}
            />
            <Button size="sm" onClick={handlePrepayment} fullWidth>
              Record Prepayment
            </Button>
          </div>
        )}

        {prepayments.length === 0 && !showPrepayment && (
          <p className={styles.empty}>No extra payments recorded yet.</p>
        )}

        {prepayments.map(p => (
          <div key={p.id} className={styles.paymentItem}>
            <div>
              <span className={styles.paymentAmount}>{formatINR(p.amount)}</span>
              <span className={styles.paymentDate}>
                {p.paidDate ? formatDate(p.paidDate, 'dd MMM yyyy') : ''}
              </span>
            </div>
            <button
              className={styles.deleteBtn}
              onClick={() => removePayment(loanId, p.id)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </Card>

      <Card className={styles.section}>
        <h3 className={styles.sectionTitle}>EMI Payment History</h3>
        {emiPayments.length === 0 ? (
          <p className={styles.empty}>No EMI payments recorded yet.</p>
        ) : (
          emiPayments.map(p => (
            <div key={p.id} className={styles.paymentItem}>
              <div>
                <span className={styles.paymentAmount}>{formatINR(p.amount)}</span>
                <span className={styles.paymentDate}>
                  {new Date(p.year, p.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })}
                </span>
              </div>
              <Badge variant="success">Paid</Badge>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
