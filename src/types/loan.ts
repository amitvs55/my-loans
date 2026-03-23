export type LoanType = 'home' | 'personal' | 'vehicle' | 'education' | 'credit_card' | 'other';
export type LoanStatus = 'active' | 'paid' | 'overdue';

export interface Loan {
  id: string;
  name: string;
  lender: string;
  principal: number;
  annualRate: number;
  tenureMonths: number;
  startDate: string; // ISO YYYY-MM-DD
  emiAmount: number;
  loanType: LoanType;
  status: LoanStatus;
  prepaymentAmount: number; // lump sum already paid
  missedEmis: number; // number of missed/unpaid EMIs
  createdAt: string;
}

export const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  home: 'Home Loan',
  personal: 'Personal Loan',
  vehicle: 'Vehicle Loan',
  education: 'Education Loan',
  credit_card: 'Credit Card',
  other: 'Other',
};

export const LOAN_TYPE_ICONS: Record<LoanType, string> = {
  home: 'Home',
  personal: 'User',
  vehicle: 'Car',
  education: 'GraduationCap',
  credit_card: 'CreditCard',
  other: 'Banknote',
};
