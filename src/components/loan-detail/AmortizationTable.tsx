import { useState } from 'react';
import type { AmortizationEntry } from '../../types/amortization';
import Card from '../ui/Card';
import { formatINR } from '../../utils/currency';
import { getMonthsElapsed } from '../../utils/date';
import styles from './AmortizationTable.module.css';

interface AmortizationTableProps {
  schedule: AmortizationEntry[];
  startDate: string;
}

export default function AmortizationTable({ schedule, startDate }: AmortizationTableProps) {
  const [showAll, setShowAll] = useState(false);
  const elapsed = getMonthsElapsed(startDate);
  const displaySchedule = showAll ? schedule : schedule.slice(0, 24);

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Amortization Schedule</h3>
        <span className={styles.count}>{schedule.length} months</span>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>EMI</th>
              <th>Principal</th>
              <th>Interest</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {displaySchedule.map((entry) => (
              <tr
                key={entry.month}
                className={entry.month <= elapsed ? styles.paidRow : ''}
              >
                <td className={styles.monthCol}>{entry.month}</td>
                <td>{formatINR(entry.emi)}</td>
                <td>{formatINR(entry.principalComponent)}</td>
                <td>{formatINR(entry.interestComponent)}</td>
                <td className={styles.balanceCol}>{formatINR(entry.closingBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {schedule.length > 24 && (
        <button
          className={styles.showMore}
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Show Less' : `Show All ${schedule.length} Months`}
        </button>
      )}

      <div className={styles.totals}>
        <div className={styles.totalItem}>
          <span>Total Principal</span>
          <strong>{formatINR(schedule.reduce((s, e) => s + e.principalComponent, 0))}</strong>
        </div>
        <div className={styles.totalItem}>
          <span>Total Interest</span>
          <strong>{formatINR(schedule.reduce((s, e) => s + e.interestComponent, 0))}</strong>
        </div>
        <div className={styles.totalItem}>
          <span>Total Payable</span>
          <strong>{formatINR(schedule.reduce((s, e) => s + e.emi, 0))}</strong>
        </div>
      </div>
    </Card>
  );
}
