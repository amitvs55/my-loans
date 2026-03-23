export type PaymentType = 'emi' | 'prepayment';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export interface Payment {
  id: string;
  loanId: string;
  month: number; // 1-12
  year: number;
  amount: number;
  type: PaymentType;
  paidDate: string | null; // ISO date
  status: PaymentStatus;
}
