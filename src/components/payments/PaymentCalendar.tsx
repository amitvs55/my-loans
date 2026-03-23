import { useMemo } from 'react';
import type { Payment } from '../../types/payment';
import Card from '../ui/Card';
import { addMonthsToDate } from '../../utils/date';
import styles from './PaymentCalendar.module.css';

interface PaymentCalendarProps {
  payments: Payment[];
  startDate: string;
  tenureMonths: number;
}

export default function PaymentCalendar({ payments, startDate, tenureMonths }: PaymentCalendarProps) {
  const months = useMemo(() => {
    const result: { month: number; year: number; label: string; status: 'paid' | 'current' | 'upcoming' | 'past_unpaid' }[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    for (let i = 0; i < Math.min(tenureMonths, 48); i++) {
      const date = addMonthsToDate(startDate, i);
      const m = date.getMonth() + 1;
      const y = date.getFullYear();
      const label = date.toLocaleString('default', { month: 'short' });
      const yearLabel = y.toString().slice(2);

      const isPaid = payments.some(p => p.month === m && p.year === y && p.type === 'emi' && p.status === 'paid');
      const isCurrent = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      const isPast = date < now && !isCurrent;

      let status: 'paid' | 'current' | 'upcoming' | 'past_unpaid';
      if (isPaid) status = 'paid';
      else if (isCurrent) status = 'current';
      else if (isPast) status = 'past_unpaid';
      else status = 'upcoming';

      result.push({ month: m, year: y, label: `${label} '${yearLabel}`, status });
    }

    return result;
  }, [payments, startDate, tenureMonths]);

  return (
    <Card className={styles.card}>
      <h3 className={styles.title}>Payment Calendar</h3>
      <div className={styles.legend}>
        <span className={styles.legendItem}><span className={`${styles.dot} ${styles.paid}`} /> Paid</span>
        <span className={styles.legendItem}><span className={`${styles.dot} ${styles.current}`} /> Current</span>
        <span className={styles.legendItem}><span className={`${styles.dot} ${styles.unpaid}`} /> Unpaid</span>
        <span className={styles.legendItem}><span className={`${styles.dot} ${styles.upcoming}`} /> Upcoming</span>
      </div>
      <div className={styles.grid}>
        {months.map((m, i) => (
          <div
            key={i}
            className={`${styles.cell} ${styles[m.status]}`}
            title={`${m.label} - ${m.status}`}
          >
            <span className={styles.cellLabel}>{m.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
