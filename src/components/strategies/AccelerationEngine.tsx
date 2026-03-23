import { useState, useMemo } from 'react';
import { Zap, TrendingDown, Clock, Target } from 'lucide-react';
import Card from '../ui/Card';
import Slider from '../ui/Slider';
import Badge from '../ui/Badge';
import { calculateExtraEMIImpact, calculatePrepaymentImpact, calculateRequiredEMI } from '../../utils/emi';
import { formatINR } from '../../utils/currency';
import { addMonthsToDate, formatMonthYear } from '../../utils/date';
import type { ScenarioResult } from '../../types/strategy';
import styles from './AccelerationEngine.module.css';

interface AccelerationEngineProps {
  loanId: string;
  currentBalance: number;
  annualRate: number;
  remainingMonths: number;
  currentEMI: number;
  startDate: string;
}

export default function AccelerationEngine({
  currentBalance,
  annualRate,
  remainingMonths,
  currentEMI,
}: AccelerationEngineProps) {
  const [extraEMI, setExtraEMI] = useState(0);
  const [prepayment, setPrepayment] = useState(0);

  const maxExtraEMI = Math.round(currentEMI * 2);
  const maxPrepayment = Math.round(currentBalance * 0.5);

  // Current plan
  const currentPlan = useMemo(() => {
    const impact = calculateExtraEMIImpact(currentBalance, annualRate, remainingMonths, 0, currentEMI);
    return {
      label: 'Current Plan',
      monthlyEmi: currentEMI,
      totalMonths: remainingMonths,
      payoffDate: formatMonthYear(addMonthsToDate(new Date(), remainingMonths)),
      totalInterest: impact.totalInterestOriginal,
      totalAmount: currentEMI * remainingMonths,
      interestSaved: 0,
      timeSavedMonths: 0,
    };
  }, [currentBalance, annualRate, remainingMonths, currentEMI]);

  // Scenario: Extra EMI only
  const extraEMIScenario = useMemo((): ScenarioResult | null => {
    if (extraEMI <= 0) return null;
    const impact = calculateExtraEMIImpact(currentBalance, annualRate, remainingMonths, extraEMI, currentEMI);
    const newEMI = currentEMI + extraEMI;
    return {
      label: `+${formatINR(extraEMI)}/mo`,
      monthlyEmi: newEMI,
      totalMonths: impact.newTenure,
      payoffDate: formatMonthYear(addMonthsToDate(new Date(), impact.newTenure)),
      totalInterest: impact.totalInterestNew,
      totalAmount: newEMI * impact.newTenure,
      interestSaved: impact.interestSaved,
      timeSavedMonths: impact.timeSavedMonths,
    };
  }, [extraEMI, currentBalance, annualRate, remainingMonths, currentEMI]);

  // Scenario: Prepayment only
  const prepaymentScenario = useMemo((): ScenarioResult | null => {
    if (prepayment <= 0) return null;
    const impact = calculatePrepaymentImpact(currentBalance, annualRate, remainingMonths, prepayment, currentEMI);
    return {
      label: `${formatINR(prepayment)} prepay`,
      monthlyEmi: currentEMI,
      totalMonths: impact.newTenure,
      payoffDate: formatMonthYear(addMonthsToDate(new Date(), impact.newTenure)),
      totalInterest: impact.totalInterestNew,
      totalAmount: currentEMI * impact.newTenure + prepayment,
      interestSaved: impact.interestSaved,
      timeSavedMonths: impact.timeSavedMonths,
    };
  }, [prepayment, currentBalance, annualRate, remainingMonths, currentEMI]);

  // Scenario: Combined
  const combinedScenario = useMemo((): ScenarioResult | null => {
    if (extraEMI <= 0 && prepayment <= 0) return null;
    const newBalance = Math.max(0, currentBalance - prepayment);
    if (newBalance <= 0) {
      return {
        label: 'Combined',
        monthlyEmi: currentEMI + extraEMI,
        totalMonths: 0,
        payoffDate: formatMonthYear(new Date()),
        totalInterest: 0,
        totalAmount: prepayment,
        interestSaved: currentPlan.totalInterest,
        timeSavedMonths: remainingMonths,
      };
    }
    const impact = calculateExtraEMIImpact(newBalance, annualRate, remainingMonths, extraEMI, currentEMI);
    const newEMI = currentEMI + extraEMI;
    return {
      label: 'Combined',
      monthlyEmi: newEMI,
      totalMonths: impact.newTenure,
      payoffDate: formatMonthYear(addMonthsToDate(new Date(), impact.newTenure)),
      totalInterest: impact.totalInterestNew,
      totalAmount: newEMI * impact.newTenure + prepayment,
      interestSaved: currentPlan.totalInterest - impact.totalInterestNew,
      timeSavedMonths: remainingMonths - impact.newTenure,
    };
  }, [extraEMI, prepayment, currentBalance, annualRate, remainingMonths, currentEMI, currentPlan.totalInterest]);

  // Fastest payoff presets
  const presets = useMemo(() => {
    const targets = [
      { label: '6 months faster', months: Math.max(6, remainingMonths - 6) },
      { label: '12 months faster', months: Math.max(6, remainingMonths - 12) },
      { label: 'Finish in 12 months', months: 12 },
    ];

    return targets.map(t => {
      if (t.months >= remainingMonths) return null;
      const requiredEMI = calculateRequiredEMI(currentBalance, annualRate, t.months);
      const extraNeeded = requiredEMI - currentEMI;
      if (extraNeeded <= 0) return null;
      const impact = calculateExtraEMIImpact(currentBalance, annualRate, remainingMonths, extraNeeded, currentEMI);
      return {
        ...t,
        requiredEMI,
        extraNeeded,
        interestSaved: impact.interestSaved,
        targetMonths: t.months,
      };
    }).filter(Boolean);
  }, [currentBalance, annualRate, remainingMonths, currentEMI, currentPlan.totalInterest]);

  const scenarios = [currentPlan, extraEMIScenario, prepaymentScenario, combinedScenario].filter(Boolean) as ScenarioResult[];

  return (
    <div className={styles.wrapper}>
      {/* Hero Banner */}
      <Card variant="accent" className={styles.heroBanner}>
        <div className={styles.heroIcon}>
          <Zap size={24} />
        </div>
        <h2 className={styles.heroTitle}>Payoff Acceleration Engine</h2>
        <p className={styles.heroSubtitle}>How fast can you finish this loan?</p>
      </Card>

      {/* Current Plan Summary */}
      <Card className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Clock size={18} /> Current Payoff Plan
        </h3>
        <div className={styles.planGrid}>
          <div className={styles.planItem}>
            <span className={styles.planLabel}>Remaining</span>
            <span className={styles.planValue}>{remainingMonths} months</span>
          </div>
          <div className={styles.planItem}>
            <span className={styles.planLabel}>Interest Left</span>
            <span className={styles.planValue}>{formatINR(currentPlan.totalInterest)}</span>
          </div>
          <div className={styles.planItem}>
            <span className={styles.planLabel}>Payoff Date</span>
            <span className={styles.planValue}>{currentPlan.payoffDate}</span>
          </div>
          <div className={styles.planItem}>
            <span className={styles.planLabel}>Monthly EMI</span>
            <span className={styles.planValue}>{formatINR(currentEMI)}</span>
          </div>
        </div>
      </Card>

      {/* Scenario Simulator */}
      <Card className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <TrendingDown size={18} /> Scenario Simulator
        </h3>

        <div className={styles.sliders}>
          <Slider
            label="Extra Monthly Payment"
            value={extraEMI}
            min={0}
            max={maxExtraEMI}
            step={Math.max(500, Math.round(maxExtraEMI / 100) * 10)}
            onChange={setExtraEMI}
            formatValue={(v) => formatINR(v)}
          />

          {extraEMIScenario && (
            <div className={styles.impactBanner}>
              <span className={styles.impactSave}>Save {formatINR(extraEMIScenario.interestSaved)}</span>
              <span className={styles.impactTime}>{extraEMIScenario.timeSavedMonths} months faster</span>
            </div>
          )}

          <Slider
            label="One-Time Prepayment"
            value={prepayment}
            min={0}
            max={maxPrepayment}
            step={Math.max(10000, Math.round(maxPrepayment / 50) * 1000)}
            onChange={setPrepayment}
            formatValue={(v) => formatINR(v)}
          />

          {prepaymentScenario && (
            <div className={styles.impactBanner}>
              <span className={styles.impactSave}>Save {formatINR(prepaymentScenario.interestSaved)}</span>
              <span className={styles.impactTime}>{prepaymentScenario.timeSavedMonths} months faster</span>
            </div>
          )}

          {combinedScenario && (extraEMI > 0 && prepayment > 0) && (
            <div className={`${styles.impactBanner} ${styles.impactCombined}`}>
              <Zap size={16} />
              <div>
                <strong>Combined Impact:</strong> Finish {combinedScenario.timeSavedMonths} months earlier, save {formatINR(combinedScenario.interestSaved)} in interest!
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Comparison Table */}
      {scenarios.length > 1 && (
        <Card className={styles.section}>
          <h3 className={styles.sectionTitle}>Plan Comparison</h3>
          <div className={styles.comparisonTable}>
            <div className={styles.compRow}>
              <div className={styles.compHeader}></div>
              {scenarios.map((s, i) => (
                <div key={i} className={`${styles.compHeader} ${i === 0 ? '' : styles.compHighlight}`}>
                  {s.label}
                </div>
              ))}
            </div>
            <div className={styles.compRow}>
              <div className={styles.compLabel}>Monthly EMI</div>
              {scenarios.map((s, i) => (
                <div key={i} className={styles.compValue}>{formatINR(s.monthlyEmi)}</div>
              ))}
            </div>
            <div className={styles.compRow}>
              <div className={styles.compLabel}>Payoff Date</div>
              {scenarios.map((s, i) => (
                <div key={i} className={styles.compValue}>{s.payoffDate}</div>
              ))}
            </div>
            <div className={styles.compRow}>
              <div className={styles.compLabel}>Total Interest</div>
              {scenarios.map((s, i) => (
                <div key={i} className={styles.compValue}>{formatINR(s.totalInterest)}</div>
              ))}
            </div>
            <div className={styles.compRow}>
              <div className={styles.compLabel}>Savings</div>
              {scenarios.map((s, i) => (
                <div key={i} className={`${styles.compValue} ${s.interestSaved > 0 ? styles.savings : ''}`}>
                  {s.interestSaved > 0 ? formatINR(s.interestSaved) : '—'}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Fastest Payoff Presets */}
      <Card className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Target size={18} /> Fastest Payoff Path
        </h3>
        <div className={styles.presets}>
          {presets.map((preset: any, i: number) => (
            <div key={i} className={styles.preset} onClick={() => setExtraEMI(Math.round(preset.extraNeeded))}>
              <div className={styles.presetHeader}>
                <Badge variant="info" size="md">{preset.label}</Badge>
              </div>
              <div className={styles.presetDetails}>
                <div>
                  <span className={styles.presetLabel}>Required EMI</span>
                  <span className={styles.presetValue}>{formatINR(preset.requiredEMI)}</span>
                </div>
                <div>
                  <span className={styles.presetLabel}>Extra/mo</span>
                  <span className={styles.presetValue}>+{formatINR(preset.extraNeeded)}</span>
                </div>
                <div>
                  <span className={styles.presetLabel}>Interest Saved</span>
                  <span className={`${styles.presetValue} ${styles.savingsText}`}>{formatINR(preset.interestSaved)}</span>
                </div>
              </div>
            </div>
          ))}
          {presets.length === 0 && (
            <p className={styles.emptyPresets}>
              This loan is close to completion. Great work!
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
