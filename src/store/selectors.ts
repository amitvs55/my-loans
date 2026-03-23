import type { Loan } from '../types/loan';
import type { Payment } from '../types/payment';
import { calculateRemainingBalance } from '../utils/emi';
import { getMonthsElapsed, getNextDueDate } from '../utils/date';

type StoreState = {
  loans: Record<string, Loan>;
  payments: Record<string, Payment[]>;
};

export function selectAllLoans(state: StoreState): Loan[] {
  return Object.values(state.loans).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function selectActiveLoans(state: StoreState): Loan[] {
  return selectAllLoans(state).filter(l => l.status !== 'paid');
}

export function selectLoanById(id: string) {
  return (state: StoreState): Loan | undefined => state.loans[id];
}

export function selectPaymentsForLoan(loanId: string) {
  return (state: StoreState): Payment[] => state.payments[loanId] || [];
}

export function selectTotalDebt(state: StoreState): number {
  return Object.values(state.loans)
    .filter(l => l.status !== 'paid')
    .reduce((total, loan) => {
      const elapsed = getMonthsElapsed(loan.startDate);
      const remaining = calculateRemainingBalance(
        loan.principal, loan.annualRate, loan.tenureMonths, elapsed, loan.emiAmount
      );
      return total + remaining;
    }, 0);
}

export function selectTotalMonthlyEmi(state: StoreState): number {
  return Object.values(state.loans)
    .filter(l => l.status !== 'paid')
    .reduce((total, loan) => total + loan.emiAmount, 0);
}

export function selectNextDueDate(state: StoreState): Date | null {
  const activeLoans = Object.values(state.loans).filter(l => l.status !== 'paid');
  if (activeLoans.length === 0) return null;

  const dates = activeLoans.map(l => {
    const elapsed = getMonthsElapsed(l.startDate);
    return getNextDueDate(l.startDate, elapsed);
  });

  return dates.reduce((earliest, d) => (d < earliest ? d : earliest));
}

export function selectLoanProgress(loanId: string) {
  return (state: StoreState): { paid: number; remaining: number; percentage: number } => {
    const loan = state.loans[loanId];
    if (!loan) return { paid: 0, remaining: 0, percentage: 0 };

    const elapsed = getMonthsElapsed(loan.startDate);
    const remaining = calculateRemainingBalance(
      loan.principal, loan.annualRate, loan.tenureMonths, elapsed, loan.emiAmount
    );
    const paid = loan.principal - remaining;
    const percentage = loan.principal > 0 ? Math.min(100, (paid / loan.principal) * 100) : 0;

    return { paid, remaining, percentage };
  };
}

export function selectLoanCount(state: StoreState): number {
  return Object.values(state.loans).filter(l => l.status !== 'paid').length;
}
