import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Loan } from '../types/loan';
import type { Payment } from '../types/payment';
import { getSampleLoans } from '../utils/sample-data';

interface Settings {
  currency: 'INR';
  seedDataLoaded: boolean;
}

interface LoanState {
  loans: Record<string, Loan>;
  payments: Record<string, Payment[]>;
  settings: Settings;

  // Loan CRUD
  addLoan: (loan: Omit<Loan, 'id' | 'createdAt'>) => string;
  updateLoan: (id: string, updates: Partial<Omit<Loan, 'id'>>) => void;
  deleteLoan: (id: string) => void;

  // Payment actions
  markEmiPaid: (loanId: string, month: number, year: number, amount: number) => void;
  recordPrepayment: (loanId: string, amount: number, date: string) => void;
  removePayment: (loanId: string, paymentId: string) => void;

  // Data management
  loadSampleData: () => void;
  clearAllData: () => void;
  exportData: () => string;
  importData: (jsonString: string) => boolean;
}

export const useLoanStore = create<LoanState>()(
  persist(
    (set, get) => ({
      loans: {},
      payments: {},
      settings: {
        currency: 'INR',
        seedDataLoaded: false,
      },

      addLoan: (loanData) => {
        const id = crypto.randomUUID();
        const loan: Loan = {
          ...loanData,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          loans: { ...state.loans, [id]: loan },
          payments: { ...state.payments, [id]: [] },
        }));
        return id;
      },

      updateLoan: (id, updates) => {
        set((state) => {
          const existing = state.loans[id];
          if (!existing) return state;
          return {
            loans: {
              ...state.loans,
              [id]: { ...existing, ...updates },
            },
          };
        });
      },

      deleteLoan: (id) => {
        set((state) => {
          const { [id]: _removed, ...remainingLoans } = state.loans;
          const { [id]: _removedPayments, ...remainingPayments } = state.payments;
          return {
            loans: remainingLoans,
            payments: remainingPayments,
          };
        });
      },

      markEmiPaid: (loanId, month, year, amount) => {
        const payment: Payment = {
          id: crypto.randomUUID(),
          loanId,
          month,
          year,
          amount,
          type: 'emi',
          paidDate: new Date().toISOString().split('T')[0],
          status: 'paid',
        };
        set((state) => ({
          payments: {
            ...state.payments,
            [loanId]: [...(state.payments[loanId] || []), payment],
          },
        }));
      },

      recordPrepayment: (loanId, amount, date) => {
        const d = new Date(date);
        const payment: Payment = {
          id: crypto.randomUUID(),
          loanId,
          month: d.getMonth() + 1,
          year: d.getFullYear(),
          amount,
          type: 'prepayment',
          paidDate: date,
          status: 'paid',
        };
        set((state) => ({
          payments: {
            ...state.payments,
            [loanId]: [...(state.payments[loanId] || []), payment],
          },
        }));
      },

      removePayment: (loanId, paymentId) => {
        set((state) => ({
          payments: {
            ...state.payments,
            [loanId]: (state.payments[loanId] || []).filter(p => p.id !== paymentId),
          },
        }));
      },

      loadSampleData: () => {
        const sampleLoans = getSampleLoans();
        const loansRecord: Record<string, Loan> = {};
        const paymentsRecord: Record<string, Payment[]> = {};

        for (const loan of sampleLoans) {
          loansRecord[loan.id] = loan;
          paymentsRecord[loan.id] = [];
        }

        set((state) => ({
          loans: { ...state.loans, ...loansRecord },
          payments: { ...state.payments, ...paymentsRecord },
          settings: { ...state.settings, seedDataLoaded: true },
        }));
      },

      clearAllData: () => {
        set({
          loans: {},
          payments: {},
          settings: { currency: 'INR', seedDataLoaded: false },
        });
      },

      exportData: () => {
        const state = get();
        return JSON.stringify({
          loans: state.loans,
          payments: state.payments,
          settings: state.settings,
          exportedAt: new Date().toISOString(),
        }, null, 2);
      },

      importData: (jsonString) => {
        try {
          const data = JSON.parse(jsonString);
          if (data.loans && data.payments) {
            set({
              loans: data.loans,
              payments: data.payments,
              settings: data.settings || { currency: 'INR', seedDataLoaded: true },
            });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'my-loans-store',
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as LoanState;
        if (version < 2) {
          // Add missedEmis field to existing loans
          const loans = { ...state.loans };
          for (const id of Object.keys(loans)) {
            if (loans[id] && (loans[id] as Loan & { missedEmis?: number }).missedEmis === undefined) {
              loans[id] = { ...loans[id], missedEmis: 0 };
            }
          }
          return { ...state, loans };
        }
        return state;
      },
    }
  )
);
