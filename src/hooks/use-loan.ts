import { useMemo } from 'react';
import { useLoanStore } from '../store/loan-store';
import { calculateRemainingBalance, generateAmortizationSchedule, calculateTotalInterest } from '../utils/emi';
import { getMonthsElapsed, getNextDueDate, addMonthsToDate } from '../utils/date';

export function useLoan(id: string) {
  const loan = useLoanStore(s => s.loans[id]);
  const payments = useLoanStore(s => s.payments[id] || []);

  return useMemo(() => {
    if (!loan) return null;

    const elapsed = getMonthsElapsed(loan.startDate);
    const remainingBalance = calculateRemainingBalance(
      loan.principal, loan.annualRate, loan.tenureMonths, elapsed, loan.emiAmount
    );
    const paid = loan.principal - remainingBalance;
    const percentage = loan.principal > 0 ? Math.min(100, (paid / loan.principal) * 100) : 0;
    const remainingMonths = Math.max(0, loan.tenureMonths - elapsed);
    const nextDue = getNextDueDate(loan.startDate, elapsed);
    const totalInterest = calculateTotalInterest(loan.principal, loan.annualRate, loan.tenureMonths, loan.emiAmount);
    const schedule = generateAmortizationSchedule(loan.principal, loan.annualRate, loan.tenureMonths, loan.emiAmount);

    const interestPaid = schedule.slice(0, elapsed).reduce((s, e) => s + e.interestComponent, 0);
    const principalPaid = paid;
    const interestRemaining = totalInterest - interestPaid;
    const payoffDate = addMonthsToDate(loan.startDate, loan.tenureMonths);

    return {
      loan,
      payments,
      elapsed,
      remainingBalance,
      paid,
      percentage,
      remainingMonths,
      nextDue,
      totalInterest,
      interestPaid,
      principalPaid,
      interestRemaining,
      payoffDate,
      schedule,
    };
  }, [loan, payments]);
}
