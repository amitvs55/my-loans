import { useMemo } from 'react';
import { useLoanStore } from '../store/loan-store';
import { selectTotalDebt, selectTotalMonthlyEmi, selectNextDueDate, selectLoanCount } from '../store/selectors';

export function useDashboardStats() {
  const loans = useLoanStore(s => s.loans);

  return useMemo(() => {
    const state = { loans, payments: {} };
    return {
      totalDebt: selectTotalDebt(state),
      totalEmi: selectTotalMonthlyEmi(state),
      nextDueDate: selectNextDueDate(state),
      loanCount: selectLoanCount(state),
    };
  }, [loans]);
}
