export interface AmortizationEntry {
  month: number;
  emi: number;
  principalComponent: number;
  interestComponent: number;
  prepayment: number;
  openingBalance: number;
  closingBalance: number;
}
