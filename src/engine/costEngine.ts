import { TariffConfig } from '../types/city';

export interface BillBreakdown {
  energyKWh: number;
  energyRate: number;
  energyCostINR: number;
  peakDemandKW: number;
  demandCharge: number;
  demandCostINR: number;
  totalEstimatedBillINR: number;
}

export interface CostComparison {
  baselineCostINR: number;
  scenarioCostINR: number;
  dailyDifferenceINR: number; // baseline - scenario (positive = saved, negative = increased)
  dailySavingsPct: number;
  monthlyProjectionINR: number;
  annualProjectionINR: number;
  isSaving: boolean;
}

/**
 * Computes transparent breakdown for energy + demand components
 */
export function calculateBillBreakdown(
  energyKWh: number,
  peakDemandKW: number,
  tariff: TariffConfig
): BillBreakdown {
  const energyCostINR = Math.round(energyKWh * tariff.energyRate);
  // Demand charge is billed over monthly period
  const demandCostINR = Math.round((peakDemandKW * tariff.demandCharge) / tariff.billingPeriodDays);
  const totalEstimatedBillINR = energyCostINR + demandCostINR;

  return {
    energyKWh: Math.round(energyKWh),
    energyRate: tariff.energyRate,
    energyCostINR,
    peakDemandKW: Math.round(peakDemandKW),
    demandCharge: tariff.demandCharge,
    demandCostINR,
    totalEstimatedBillINR,
  };
}

/**
 * Calculates comparative financial delta between Baseline and Current Scenario
 */
export function calculateCostComparison(
  baselineCostINR: number,
  scenarioCostINR: number
): CostComparison {
  const diffINR = baselineCostINR - scenarioCostINR;
  const pct = baselineCostINR > 0 ? (diffINR / baselineCostINR) * 100 : 0;
  const monthlyProjectionINR = Math.round(diffINR * 30);
  const annualProjectionINR = Math.round(diffINR * 365);

  return {
    baselineCostINR: Math.round(baselineCostINR),
    scenarioCostINR: Math.round(scenarioCostINR),
    dailyDifferenceINR: Math.round(diffINR),
    dailySavingsPct: Math.round(pct * 10) / 10,
    monthlyProjectionINR,
    annualProjectionINR,
    isSaving: diffINR >= 0,
  };
}

/**
 * Formats rupee values into clean Indian numbering system (₹, Thousand, Lakh, Crore)
 */
export function formatINR(val: number, options?: { showSign?: boolean; compact?: boolean }): string {
  const absVal = Math.abs(val);
  const sign = options?.showSign ? (val > 0 ? '+' : val < 0 ? '-' : '') : val < 0 ? '-' : '';

  if (options?.compact) {
    if (absVal >= 10000000) {
      // Crores
      const cr = (absVal / 10000000).toFixed(2);
      return `${sign}₹${cr} Cr`;
    }
    if (absVal >= 100000) {
      // Lakhs
      const lk = (absVal / 100000).toFixed(2);
      return `${sign}₹${lk} L`;
    }
    if (absVal >= 1000) {
      const k = (absVal / 1000).toFixed(1);
      return `${sign}₹${k}k`;
    }
  }

  // Standard Indian comma separator: 12,34,567
  const parts = Math.round(absVal).toString().split('');
  let result = '';
  let count = 0;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (count === 3 || (count > 3 && (count - 3) % 2 === 0)) {
      result = ',' + result;
    }
    result = parts[i] + result;
    count++;
  }

  return `${sign}₹${result}`;
}
