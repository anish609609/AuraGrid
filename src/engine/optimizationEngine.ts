import { BuildingData, BuildingControls } from '../types/city';

export interface OptimizationStep {
  buildingId: string;
  buildingName: string;
  title: string;
  description: string;
  impactType: 'peak' | 'energy' | 'cost' | 'comfort';
}

export interface OptimizationResult {
  optimizedBuildings: BuildingData[];
  stepsApplied: OptimizationStep[];
  headlineSavingsINRPerDay: number;
  monthlySavingsINR: number;
  annualSavingsINR: number;
  peakReductionPct: number;
  energyReductionPct: number;
  costReductionPct: number;
  gridStressTransition: string;
}

/**
 * Applies rule-based energy optimization across all 5 buildings in the city
 */
export function optimizeCityBuildings(buildings: BuildingData[]): {
  updatedBuildings: BuildingData[];
  actionsTaken: string[];
} {
  const actionsTaken: string[] = [];

  const updatedBuildings = buildings.map((b) => {
    const newControls: BuildingControls = { ...b.currentControls };

    if (b.id === 'it-tower') {
      // IT HVAC setpoint: increase from 24.0°C to 25.0°C (safe within 23.5 - 25.0°C limit)
      newControls.hvacSetpoint = 25.0;
      // Dim lighting from 100% to 80% (daylight harvesting)
      newControls.lightingLevel = 80;
      // Curtail non-critical flexible load from 80% to 65% (IT core is 100% protected)
      newControls.flexibleLoad = 65;
      actionsTaken.push('IT Building: Tuned HVAC setpoint to 25.0°C & dimmed lighting to 80%');
    } else if (b.id === 'education') {
      // University: HVAC setpoint to 25.0°C, lighting to 75%, flexible loads to 60%
      newControls.hvacSetpoint = 25.0;
      newControls.lightingLevel = 75;
      newControls.flexibleLoad = 55;
      actionsTaken.push('Education Campus: Reduced lighting by 15% & lab idle equipment standby');
    } else if (b.id === 'hospital') {
      // Hospital: CRITICAL LOADS ARE UNTOUCHED!
      // Only tune administrative HVAC from 23°C to 23.8°C, flexible auxiliary from 50% to 45%
      newControls.hvacSetpoint = 23.8;
      newControls.flexibleLoad = 45;
      actionsTaken.push('Hospital: Maintained 100% ICU/Surgical power; optimized administrative HVAC');
    } else if (b.id === 'residential') {
      // Residential: Shift EV charging to off-peak night window!
      newControls.evCharging = true;
      newControls.evOffPeakShift = true;
      newControls.hvacSetpoint = 24.5;
      newControls.lightingLevel = 75;
      newControls.flexibleLoad = 60;
      actionsTaken.push('Residential: Shifted 100 EV charge bays to off-peak night hours (23:00 - 05:00)');
    } else if (b.id === 'retail') {
      // Retail: Pre-cool atrium, dim decorative lighting to 80%, shift non-essential display refrigeration
      newControls.hvacSetpoint = 24.5;
      newControls.lightingLevel = 80;
      newControls.flexibleLoad = 50;
      actionsTaken.push('Retail Center: Dimmed atrium lighting & shifted flexible cold store defrost cycles');
    }

    return {
      ...b,
      currentControls: newControls,
    };
  });

  return { updatedBuildings, actionsTaken };
}
