import type { Loan } from '../types/loan';
import type { StrategyResult, PayoffPlan, MonthlyPayment } from '../types/strategy';
import { calculateRemainingBalance } from './emi';
import { getMonthsElapsed, addMonthsToDate, toISODate } from './date';

interface WorkingLoan {
  id: string;
  name: string;
  balance: number;
  rate: number;
  emi: number;
  monthlyRate: number;
}

function getWorkingLoans(loans: Loan[]): WorkingLoan[] {
  return loans
    .filter(l => l.status === 'active')
    .map(l => {
      const elapsed = getMonthsElapsed(l.startDate);
      const remaining = calculateRemainingBalance(l.principal, l.annualRate, l.tenureMonths, elapsed, l.emiAmount);
      return {
        id: l.id,
        name: l.name,
        balance: remaining,
        rate: l.annualRate,
        emi: l.emiAmount,
        monthlyRate: l.annualRate / 12 / 100,
      };
    })
    .filter(l => l.balance > 0);
}

function simulatePayoff(
  loans: WorkingLoan[],
  extraBudget: number,
  sortFn: (a: WorkingLoan, b: WorkingLoan) => number
): { plans: PayoffPlan[]; totalInterest: number; totalMonths: number } {
  // Deep clone working loans
  const activeLoansList = loans.map(l => ({ ...l }));
  activeLoansList.sort(sortFn);

  const totalMinEMI = activeLoansList.reduce((s, l) => s + l.emi, 0);
  let totalBudget = totalMinEMI + extraBudget;

  const planMap = new Map<string, MonthlyPayment[]>();
  const interestMap = new Map<string, number>();

  for (const l of activeLoansList) {
    planMap.set(l.id, []);
    interestMap.set(l.id, 0);
  }

  let month = 0;
  const MAX_MONTHS = 600; // safety cap

  while (activeLoansList.some(l => l.balance > 0.5) && month < MAX_MONTHS) {
    month++;
    let remainingBudget = totalBudget;

    // Pay minimum EMI on all loans
    for (const loan of activeLoansList) {
      if (loan.balance <= 0.5) continue;
      const interest = loan.balance * loan.monthlyRate;
      const payment = Math.min(loan.emi, loan.balance + interest);
      const principal = payment - interest;

      loan.balance = Math.max(0, loan.balance - principal);
      remainingBudget -= payment;

      const totalInterest = (interestMap.get(loan.id) || 0) + interest;
      interestMap.set(loan.id, totalInterest);

      planMap.get(loan.id)!.push({
        month,
        payment: Math.round(payment * 100) / 100,
        principal: Math.round(principal * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.round(loan.balance * 100) / 100,
      });
    }

    // Apply surplus to target loan (first in sorted order that still has balance)
    if (remainingBudget > 0) {
      // Re-sort to find current target
      const activeWithBalance = activeLoansList.filter(l => l.balance > 0.5);
      activeWithBalance.sort(sortFn);

      if (activeWithBalance.length > 0) {
        const target = activeWithBalance[0];
        const extraPrincipal = Math.min(remainingBudget, target.balance);
        target.balance = Math.max(0, target.balance - extraPrincipal);

        // Update the last monthly payment entry for this loan
        const entries = planMap.get(target.id)!;
        const lastEntry = entries[entries.length - 1];
        lastEntry.payment += Math.round(extraPrincipal * 100) / 100;
        lastEntry.principal += Math.round(extraPrincipal * 100) / 100;
        lastEntry.balance = Math.round(target.balance * 100) / 100;
      }
    }

    // When a loan is paid off, its EMI is freed up (totalBudget stays the same,
    // which naturally redirects the freed EMI)
  }

  const plans: PayoffPlan[] = loans.map(l => {
    const breakdown = planMap.get(l.id) || [];
    const loanInterest = interestMap.get(l.id) || 0;
    return {
      loanId: l.id,
      loanName: l.name,
      monthlyPayment: l.emi,
      totalInterest: Math.round(loanInterest),
      totalMonths: breakdown.length,
      payoffDate: toISODate(addMonthsToDate(new Date(), breakdown.length)),
      monthlyBreakdown: breakdown,
    };
  });

  const totalInterest = plans.reduce((s, p) => s + p.totalInterest, 0);

  return { plans, totalInterest, totalMonths: month };
}

/**
 * Avalanche method: highest interest rate first
 */
export function calculateAvalanche(loans: Loan[], extraBudget: number = 0): StrategyResult {
  const working = getWorkingLoans(loans);
  if (working.length === 0) {
    return { name: 'Avalanche', plans: [], totalInterest: 0, totalMonths: 0, debtFreeDate: toISODate(new Date()), interestSaved: 0 };
  }

  const result = simulatePayoff(working, extraBudget, (a, b) => b.rate - a.rate);
  return {
    name: 'Avalanche',
    ...result,
    debtFreeDate: toISODate(addMonthsToDate(new Date(), result.totalMonths)),
    interestSaved: 0, // calculated relative to current plan
  };
}

/**
 * Snowball method: smallest balance first
 */
export function calculateSnowball(loans: Loan[], extraBudget: number = 0): StrategyResult {
  const working = getWorkingLoans(loans);
  if (working.length === 0) {
    return { name: 'Snowball', plans: [], totalInterest: 0, totalMonths: 0, debtFreeDate: toISODate(new Date()), interestSaved: 0 };
  }

  const result = simulatePayoff(working, extraBudget, (a, b) => a.balance - b.balance);
  return {
    name: 'Snowball',
    ...result,
    debtFreeDate: toISODate(addMonthsToDate(new Date(), result.totalMonths)),
    interestSaved: 0,
  };
}

/**
 * Current plan: no extra payments, each loan independent
 */
export function calculateCurrentPlan(loans: Loan[]): StrategyResult {
  const working = getWorkingLoans(loans);
  if (working.length === 0) {
    return { name: 'Current Plan', plans: [], totalInterest: 0, totalMonths: 0, debtFreeDate: toISODate(new Date()), interestSaved: 0 };
  }

  const result = simulatePayoff(working, 0, () => 0); // no sorting preference
  return {
    name: 'Current Plan',
    ...result,
    debtFreeDate: toISODate(addMonthsToDate(new Date(), result.totalMonths)),
    interestSaved: 0,
  };
}

/**
 * Compare all strategies
 */
export function compareStrategies(loans: Loan[], extraBudget: number = 0) {
  const current = calculateCurrentPlan(loans);
  const avalanche = calculateAvalanche(loans, extraBudget);
  const snowball = calculateSnowball(loans, extraBudget);

  avalanche.interestSaved = current.totalInterest - avalanche.totalInterest;
  snowball.interestSaved = current.totalInterest - snowball.totalInterest;

  return { current, avalanche, snowball };
}
