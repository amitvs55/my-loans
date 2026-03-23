import type { Loan } from '../types/loan';
import { calculateEMI } from './emi';

export function getSampleLoans(): Loan[] {
  const homeLoanPrincipal = 4000000;
  const homeLoanRate = 8.5;
  const homeLoanTenure = 240;

  const personalLoanPrincipal = 300000;
  const personalLoanRate = 14;
  const personalLoanTenure = 36;

  return [
    {
      id: 'sample-home-loan',
      name: 'Home Loan - SBI',
      lender: 'State Bank of India',
      principal: homeLoanPrincipal,
      annualRate: homeLoanRate,
      tenureMonths: homeLoanTenure,
      startDate: '2023-01-01',
      emiAmount: calculateEMI(homeLoanPrincipal, homeLoanRate, homeLoanTenure),
      loanType: 'home',
      status: 'active',
      prepaymentAmount: 0,
      missedEmis: 0,
      createdAt: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 'sample-personal-loan',
      name: 'Personal Loan - HDFC',
      lender: 'HDFC Bank',
      principal: personalLoanPrincipal,
      annualRate: personalLoanRate,
      tenureMonths: personalLoanTenure,
      startDate: '2024-06-01',
      emiAmount: calculateEMI(personalLoanPrincipal, personalLoanRate, personalLoanTenure),
      loanType: 'personal',
      status: 'active',
      prepaymentAmount: 0,
      missedEmis: 0,
      createdAt: '2024-06-01T00:00:00.000Z',
    },
  ];
}
