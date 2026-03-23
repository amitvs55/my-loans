import { useMemo } from 'react';
import { useLoanStore } from '../store/loan-store';
import { generateAmortizationSchedule } from '../utils/emi';

export function useAmortization(loanId: string) {
  const loan = useLoanStore(s => s.loans[loanId]);
  const payments = useLoanStore(s => s.payments[loanId] || []);

  return useMemo(() => {
    if (!loan) return [];

    const prepayments = payments
      .filter(p => p.type === 'prepayment')
      .map(p => ({
        month: Math.max(1, Math.round(
          (new Date(p.paidDate || '').getTime() - new Date(loan.startDate).getTime()) /
          (1000 * 60 * 60 * 24 * 30)
        )),
        amount: p.amount,
      }));

    return generateAmortizationSchedule(
      loan.principal,
      loan.annualRate,
      loan.tenureMonths,
      loan.emiAmount,
      prepayments.length > 0 ? prepayments : undefined
    );
  }, [loan, payments]);
}
