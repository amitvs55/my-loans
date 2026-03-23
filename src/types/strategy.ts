export interface PayoffPlan {
  loanId: string;
  loanName: string;
  monthlyPayment: number;
  totalInterest: number;
  totalMonths: number;
  payoffDate: string;
  monthlyBreakdown: MonthlyPayment[];
}

export interface MonthlyPayment {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface StrategyResult {
  name: string;
  plans: PayoffPlan[];
  totalInterest: number;
  totalMonths: number;
  debtFreeDate: string;
  interestSaved: number;
}

export interface ScenarioResult {
  label: string;
  monthlyEmi: number;
  totalMonths: number;
  payoffDate: string;
  totalInterest: number;
  totalAmount: number;
  interestSaved: number;
  timeSavedMonths: number;
}
