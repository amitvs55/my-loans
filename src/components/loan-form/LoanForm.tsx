import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { subMonths, format } from 'date-fns';
import type { Loan, LoanType } from '../../types/loan';
import { useLoanStore } from '../../store/loan-store';
import { calculateEMI } from '../../utils/emi';
import { formatINR } from '../../utils/currency';
import { getMonthsElapsed } from '../../utils/date';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Card from '../ui/Card';
import styles from './LoanForm.module.css';

const loanTypeOptions = [
  { value: 'home', label: 'Home Loan' },
  { value: 'personal', label: 'Personal Loan' },
  { value: 'vehicle', label: 'Vehicle Loan' },
  { value: 'education', label: 'Education Loan' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'other', label: 'Other' },
];

type DateInputMode = 'start_date' | 'remaining_months';

interface LoanFormProps {
  existingLoan?: Loan;
}

export default function LoanForm({ existingLoan }: LoanFormProps) {
  const navigate = useNavigate();
  const { addLoan, updateLoan } = useLoanStore();

  const [name, setName] = useState(existingLoan?.name || '');
  const [lender, setLender] = useState(existingLoan?.lender || '');
  const [principal, setPrincipal] = useState(existingLoan?.principal?.toString() || '');
  const [annualRate, setAnnualRate] = useState(existingLoan?.annualRate?.toString() || '');
  const [tenureMonths, setTenureMonths] = useState(existingLoan?.tenureMonths?.toString() || '');
  const [startDate, setStartDate] = useState(existingLoan?.startDate || '');
  const [remainingMonths, setRemainingMonths] = useState('');
  const [dateInputMode, setDateInputMode] = useState<DateInputMode>('start_date');
  const [emiAmount, setEmiAmount] = useState(existingLoan?.emiAmount?.toString() || '');
  const [loanType, setLoanType] = useState<LoanType>(existingLoan?.loanType || 'home');
  const [prepaymentAmount, setPrepaymentAmount] = useState(existingLoan?.prepaymentAmount?.toString() || '0');
  const [missedEmis, setMissedEmis] = useState(existingLoan?.missedEmis?.toString() || '0');
  const [emiManuallySet, setEmiManuallySet] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // If editing, compute remaining months from existing data
  useEffect(() => {
    if (existingLoan) {
      const elapsed = getMonthsElapsed(existingLoan.startDate);
      const remaining = Math.max(0, existingLoan.tenureMonths - elapsed);
      setRemainingMonths(remaining.toString());
    }
  }, [existingLoan]);

  const autoCalcEMI = useCallback(() => {
    const p = parseFloat(principal);
    const r = parseFloat(annualRate);
    const n = parseInt(tenureMonths);
    if (p > 0 && r >= 0 && n > 0 && !emiManuallySet) {
      const emi = calculateEMI(p, r, n);
      setEmiAmount(emi.toFixed(0));
    }
  }, [principal, annualRate, tenureMonths, emiManuallySet]);

  useEffect(() => {
    autoCalcEMI();
  }, [autoCalcEMI]);

  // When remaining months changes and mode is remaining_months, compute start date
  useEffect(() => {
    if (dateInputMode === 'remaining_months') {
      const rem = parseInt(remainingMonths);
      const tenure = parseInt(tenureMonths);
      if (rem > 0 && tenure > 0 && rem <= tenure) {
        const elapsed = tenure - rem;
        const computedStart = subMonths(new Date(), elapsed);
        setStartDate(format(computedStart, 'yyyy-MM-dd'));
      }
    }
  }, [remainingMonths, tenureMonths, dateInputMode]);

  const calculatedEMI = (() => {
    const p = parseFloat(principal);
    const r = parseFloat(annualRate);
    const n = parseInt(tenureMonths);
    if (p > 0 && r >= 0 && n > 0) {
      return calculateEMI(p, r, n);
    }
    return 0;
  })();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Loan name is required';
    if (!lender.trim()) newErrors.lender = 'Lender is required';
    if (!principal || parseFloat(principal) <= 0) newErrors.principal = 'Enter valid amount';
    if (!annualRate || parseFloat(annualRate) < 0) newErrors.annualRate = 'Enter valid rate';
    if (!tenureMonths || parseInt(tenureMonths) <= 0) newErrors.tenureMonths = 'Enter valid tenure';

    if (dateInputMode === 'start_date') {
      if (!startDate) newErrors.startDate = 'Start date is required';
    } else {
      const rem = parseInt(remainingMonths);
      const tenure = parseInt(tenureMonths);
      if (!remainingMonths || rem <= 0) {
        newErrors.remainingMonths = 'Enter valid remaining months';
      } else if (tenure > 0 && rem > tenure) {
        newErrors.remainingMonths = 'Cannot exceed total tenure';
      }
    }

    if (!emiAmount || parseFloat(emiAmount) <= 0) newErrors.emiAmount = 'Enter valid EMI';

    const missed = parseInt(missedEmis);
    if (missed < 0) newErrors.missedEmis = 'Cannot be negative';
    const tenure = parseInt(tenureMonths);
    if (tenure > 0 && missed > tenure) newErrors.missedEmis = 'Cannot exceed tenure';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const loanData = {
      name: name.trim(),
      lender: lender.trim(),
      principal: parseFloat(principal),
      annualRate: parseFloat(annualRate),
      tenureMonths: parseInt(tenureMonths),
      startDate,
      emiAmount: parseFloat(emiAmount),
      loanType,
      status: 'active' as const,
      prepaymentAmount: parseFloat(prepaymentAmount) || 0,
      missedEmis: parseInt(missedEmis) || 0,
    };

    if (existingLoan) {
      updateLoan(existingLoan.id, loanData);
    } else {
      addLoan(loanData);
    }

    navigate('/');
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <Card className={styles.section}>
        <h3 className={styles.sectionTitle}>Loan Details</h3>
        <div className={styles.fields}>
          <Input
            label="Loan Name"
            placeholder='e.g. "Home Loan - SBI"'
            value={name}
            onChange={e => setName(e.target.value)}
            error={errors.name}
          />
          <Input
            label="Lender Name"
            placeholder="e.g. State Bank of India"
            value={lender}
            onChange={e => setLender(e.target.value)}
            error={errors.lender}
          />
          <Select
            label="Loan Type"
            options={loanTypeOptions}
            value={loanType}
            onChange={e => setLoanType(e.target.value as LoanType)}
          />
        </div>
      </Card>

      <Card className={styles.section}>
        <h3 className={styles.sectionTitle}>Financial Details</h3>
        <div className={styles.fields}>
          <Input
            label="Principal Amount"
            type="number"
            prefix="₹"
            placeholder="4000000"
            value={principal}
            onChange={e => setPrincipal(e.target.value)}
            error={errors.principal}
          />
          <div className={styles.row}>
            <Input
              label="Annual Interest Rate"
              type="number"
              suffix="%"
              placeholder="8.5"
              step="0.1"
              value={annualRate}
              onChange={e => setAnnualRate(e.target.value)}
              error={errors.annualRate}
            />
            <Input
              label="Tenure (Months)"
              type="number"
              placeholder="240"
              value={tenureMonths}
              onChange={e => setTenureMonths(e.target.value)}
              error={errors.tenureMonths}
            />
          </div>

          {/* Date Input Mode Toggle */}
          <div className={styles.toggleGroup}>
            <label className={styles.toggleLabel}>When did the loan start?</label>
            <div className={styles.toggleButtons}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${dateInputMode === 'start_date' ? styles.toggleBtnActive : ''}`}
                onClick={() => setDateInputMode('start_date')}
              >
                Start Date
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${dateInputMode === 'remaining_months' ? styles.toggleBtnActive : ''}`}
                onClick={() => setDateInputMode('remaining_months')}
              >
                Remaining Months
              </button>
            </div>
          </div>

          {dateInputMode === 'start_date' ? (
            <Input
              label="Loan Start Date"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              error={errors.startDate}
            />
          ) : (
            <Input
              label="Remaining Months"
              type="number"
              placeholder={`e.g. ${parseInt(tenureMonths) > 12 ? parseInt(tenureMonths) - 12 : tenureMonths || '180'}`}
              value={remainingMonths}
              onChange={e => setRemainingMonths(e.target.value)}
              error={errors.remainingMonths}
              hint={startDate ? `Computed start: ${format(new Date(startDate), 'MMM yyyy')}` : undefined}
            />
          )}
        </div>
      </Card>

      <Card className={styles.section}>
        <h3 className={styles.sectionTitle}>EMI Details</h3>
        <div className={styles.fields}>
          {calculatedEMI > 0 && (
            <div className={styles.calculatedEmi}>
              <span>Calculated EMI:</span>
              <strong>{formatINR(calculatedEMI)}</strong>
            </div>
          )}
          <Input
            label="EMI Amount (editable)"
            type="number"
            prefix="₹"
            placeholder="Auto-calculated"
            value={emiAmount}
            onChange={e => {
              setEmiAmount(e.target.value);
              setEmiManuallySet(true);
            }}
            error={errors.emiAmount}
          />
          {emiManuallySet && (
            <button
              type="button"
              className={styles.resetEmi}
              onClick={() => {
                setEmiManuallySet(false);
                autoCalcEMI();
              }}
            >
              Reset to calculated EMI
            </button>
          )}
          <Input
            label="Prepayment Amount (Optional)"
            type="number"
            prefix="₹"
            placeholder="0"
            value={prepaymentAmount}
            onChange={e => setPrepaymentAmount(e.target.value)}
            hint="Lump sum already paid towards principal"
          />
        </div>
      </Card>

      <Card className={styles.section}>
        <h3 className={styles.sectionTitle}>Payment History</h3>
        <div className={styles.fields}>
          <Input
            label="Missed EMIs"
            type="number"
            placeholder="0"
            value={missedEmis}
            onChange={e => setMissedEmis(e.target.value)}
            error={errors.missedEmis}
            hint="Number of EMIs you have missed or not paid"
          />
          {parseInt(missedEmis) > 0 && (
            <div className={styles.missedWarning}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>
                {parseInt(missedEmis)} missed EMI{parseInt(missedEmis) > 1 ? 's' : ''} = approx.{' '}
                <strong>{formatINR(parseInt(missedEmis) * (parseFloat(emiAmount) || 0))}</strong> overdue
              </span>
            </div>
          )}
        </div>
      </Card>

      <div className={styles.actions}>
        <Button type="submit" fullWidth size="lg">
          {existingLoan ? 'Update Loan' : 'Add Loan'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          fullWidth
          onClick={() => navigate(-1)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
