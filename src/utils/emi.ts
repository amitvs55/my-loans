import type { AmortizationEntry } from '../types/amortization';

/**
 * Calculate EMI using standard reducing-balance formula:
 * EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]
 */
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (tenureMonths <= 0) return 0;
  if (annualRate === 0) return principal / tenureMonths;

  const R = annualRate / 12 / 100;
  const N = tenureMonths;
  const factor = Math.pow(1 + R, N);
  const emi = (principal * R * factor) / (factor - 1);
  return Math.round(emi * 100) / 100;
}

/**
 * Generate full month-by-month amortization schedule
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  emiOverride?: number,
  prepayments?: { month: number; amount: number }[]
): AmortizationEntry[] {
  const R = annualRate / 12 / 100;
  const emi = emiOverride || calculateEMI(principal, annualRate, tenureMonths);
  const schedule: AmortizationEntry[] = [];
  let balance = principal;

  const prepaymentMap = new Map<number, number>();
  if (prepayments) {
    for (const p of prepayments) {
      prepaymentMap.set(p.month, (prepaymentMap.get(p.month) || 0) + p.amount);
    }
  }

  for (let month = 1; month <= tenureMonths && balance > 0.5; month++) {
    const openingBalance = balance;
    const interestComponent = balance * R;
    let principalComponent = emi - interestComponent;
    const prepayment = prepaymentMap.get(month) || 0;

    // If remaining balance is less than EMI
    if (principalComponent + prepayment >= balance) {
      principalComponent = balance - prepayment;
      if (principalComponent < 0) principalComponent = 0;
    }

    balance = openingBalance - principalComponent - prepayment;
    if (balance < 0.5) balance = 0;

    schedule.push({
      month,
      emi: principalComponent + interestComponent <= 0 ? 0 : Math.min(emi, openingBalance + interestComponent),
      principalComponent: Math.round(principalComponent * 100) / 100,
      interestComponent: Math.round(interestComponent * 100) / 100,
      prepayment,
      openingBalance: Math.round(openingBalance * 100) / 100,
      closingBalance: Math.round(balance * 100) / 100,
    });

    if (balance <= 0) break;
  }

  return schedule;
}

/**
 * Calculate total interest over the loan tenure
 */
export function calculateTotalInterest(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  emiOverride?: number
): number {
  const schedule = generateAmortizationSchedule(principal, annualRate, tenureMonths, emiOverride);
  return schedule.reduce((sum, entry) => sum + entry.interestComponent, 0);
}

/**
 * Calculate remaining balance at a given month
 */
export function calculateRemainingBalance(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  monthsElapsed: number,
  emiOverride?: number
): number {
  if (monthsElapsed <= 0) return principal;
  const schedule = generateAmortizationSchedule(principal, annualRate, tenureMonths, emiOverride);
  if (monthsElapsed >= schedule.length) return 0;
  return schedule[monthsElapsed - 1].closingBalance;
}

/**
 * Calculate the impact of extra monthly payments
 */
export function calculateExtraEMIImpact(
  currentBalance: number,
  annualRate: number,
  remainingMonths: number,
  extraMonthly: number,
  currentEMI?: number
): {
  newTenure: number;
  totalInterestOriginal: number;
  totalInterestNew: number;
  interestSaved: number;
  timeSavedMonths: number;
} {
  const emi = currentEMI || calculateEMI(currentBalance, annualRate, remainingMonths);
  const originalSchedule = generateAmortizationSchedule(currentBalance, annualRate, remainingMonths, emi);
  const newEMI = emi + extraMonthly;

  // Generate new schedule with increased EMI - allow up to original tenure months
  const newSchedule = generateAmortizationSchedule(currentBalance, annualRate, remainingMonths * 2, newEMI);

  const totalInterestOriginal = originalSchedule.reduce((s, e) => s + e.interestComponent, 0);
  const totalInterestNew = newSchedule.reduce((s, e) => s + e.interestComponent, 0);

  return {
    newTenure: newSchedule.length,
    totalInterestOriginal: Math.round(totalInterestOriginal),
    totalInterestNew: Math.round(totalInterestNew),
    interestSaved: Math.round(totalInterestOriginal - totalInterestNew),
    timeSavedMonths: originalSchedule.length - newSchedule.length,
  };
}

/**
 * Calculate the impact of a one-time prepayment
 */
export function calculatePrepaymentImpact(
  currentBalance: number,
  annualRate: number,
  remainingMonths: number,
  prepaymentAmount: number,
  currentEMI?: number
): {
  newTenure: number;
  totalInterestOriginal: number;
  totalInterestNew: number;
  interestSaved: number;
  timeSavedMonths: number;
} {
  const emi = currentEMI || calculateEMI(currentBalance, annualRate, remainingMonths);
  const originalSchedule = generateAmortizationSchedule(currentBalance, annualRate, remainingMonths, emi);

  const newBalance = Math.max(0, currentBalance - prepaymentAmount);
  const newSchedule = generateAmortizationSchedule(newBalance, annualRate, remainingMonths * 2, emi);

  const totalInterestOriginal = originalSchedule.reduce((s, e) => s + e.interestComponent, 0);
  const totalInterestNew = newSchedule.reduce((s, e) => s + e.interestComponent, 0);

  return {
    newTenure: newSchedule.length,
    totalInterestOriginal: Math.round(totalInterestOriginal),
    totalInterestNew: Math.round(totalInterestNew),
    interestSaved: Math.round(totalInterestOriginal - totalInterestNew),
    timeSavedMonths: originalSchedule.length - newSchedule.length,
  };
}

/**
 * Calculate required EMI to finish loan in target months
 */
export function calculateRequiredEMI(
  currentBalance: number,
  annualRate: number,
  targetMonths: number
): number {
  return calculateEMI(currentBalance, annualRate, targetMonths);
}
