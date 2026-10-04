export type BuildingId = 'it-tower' | 'education' | 'hospital' | 'residential' | 'retail';

export interface LoadBreakdown {
  hvac: number;
  lighting: number;
  equipment: number;
  it: number;
  pumps: number;
  critical?: number;
  other: number;
}

export interface BuildingControls {
  occupancy: number; // 0 to 100 (%)
  hvacSetpoint: number; // in °C (e.g., 22 - 27)
  lightingLevel: number; // 0 to 100 (%)
  flexibleLoad: number; // 0 to 100 (%)
  evCharging: boolean; // on/off
  evOffPeakShift?: boolean; // shift to off-peak
}

export interface BuildingConstraints {
  minTemperature: number; // e.g. 23.5
  maxTemperature: number; // e.g. 25.0
  criticalLoads: string[];
  maxDemandCap: number; // kW
}

export interface BuildingData {
  id: BuildingId;
  name: string;
  category: 'Commercial' | 'Institutional' | 'Healthcare' | 'Residential' | 'Retail';
  tagline: string;
  areaSqFt: number;
  capacityPeople: number;
  floors: number;
  gridNodeId: 'node-a' | 'node-b' | 'both';
  position3D: [number, number, number]; // x, y, z
  dimensions3D: [number, number, number]; // width, height, depth
  accentColor: string;
  glowColor: string;

  // Baseline configuration
  baselineControls: BuildingControls;
  baselinePeakDemand: number; // kW
  baselineDailyEnergy: number; // kWh

  // Current user-adjusted controls
  currentControls: BuildingControls;

  // Constraints & Operational limits
  constraints: BuildingConstraints;

  // Solar & Storage asset configuration
  solarStorage?: SolarStorageConfig;
}

export interface SolarStorageConfig {
  hasSolar: boolean;
  pvCapacityKWp: number;
  hasBess: boolean;
  bessCapacityKWh: number;
  maxChargeRateKW: number;
}

export interface SolarStorageMetrics {
  currentPvGenerationKW: number;
  dailySolarGenerationKWh: number;
  selfConsumptionPct: number;
  gridExportKW: number;
  avoidedCo2KgToday: number;
  solarSavingsINRToday: number;
  bessSocPct: number;
  bessFlowKW: number; // positive = discharging to building, negative = charging from PV
  bessStatus: 'charging' | 'discharging' | 'standby';
}

export type GridNodeId = 'external-feeder' | 'node-a' | 'node-b';

export interface GridNode {
  id: GridNodeId;
  name: string;
  description: string;
  position3D: [number, number, number];
  capacityKW: number; // max capacity in kW
  connectedBuildingIds: BuildingId[];
}

export interface TariffConfig {
  energyRate: number; // ₹ per kWh, e.g. 8.00
  demandCharge: number; // ₹ per kW of peak demand, e.g. 300.00
  billingPeriodDays: number; // default 30
  currencySymbol: string; // ₹
}

export interface EnvironmentState {
  timeHours: number; // 0.0 - 24.0
  outdoorTempC: number; // e.g. 28 - 36°C
  humidityPct: number; // e.g. 50 - 85%
  solarRadiationWm2: number; // 0 - 900 W/m²
  isDaytime: boolean;
}

export interface BuildingSimulationResult {
  buildingId: BuildingId;
  currentPowerKW: number;
  baselinePowerKW: number;
  loadBreakdown: LoadBreakdown;
  indoorTempC: number;
  comfortScore: number; // 0 to 100%
  comfortWarning?: string;
  todayEnergyKWh: number;
  peakDemandKW: number;
  dailyCostINR: number;
  baselineDailyCostINR: number;
  gridUtilizationPct: number;
  solarStorage: SolarStorageMetrics;
}

export interface GridNodeState {
  nodeId: GridNodeId;
  currentLoadKW: number;
  capacityKW: number;
  utilizationPct: number;
  status: 'normal' | 'moderate' | 'stressed';
}

export interface CitySimulationResult {
  totalCurrentPowerKW: number;
  baselineTotalPowerKW: number;
  cityGridUtilizationPct: number;
  todayEnergyMWh: number;
  baselineTodayEnergyMWh: number;
  peakDemandMW: number;
  baselinePeakDemandMW: number;
  estimatedDailyCostINR: number;
  baselineDailyCostINR: number;
  co2EmissionsTons: number;
  totalSolarGenerationKW: number;
  todaySolarEnergyMWh: number;
  totalAvoidedCo2Tons: number;
  totalSolarSavingsINR: number;
  cityBessTotalSocPct: number;
  incomingBulkGridKW: number;
  solarAbsorptionKW: number;
  voltageStabilityIndex: number;
  phaseBalance: { phaseA: number; phaseB: number; phaseC: number };
  powerFactor: number;
  buildingResults: Record<BuildingId, BuildingSimulationResult>;
  gridNodeStates: Record<GridNodeId, GridNodeState>;
}

export interface SavedScenario {
  id: string;
  name: string;
  description: string;
  timestamp: string;
  buildingControls: Record<BuildingId, BuildingControls>;
  estimatedDailySavingsINR: number;
  peakReductionKW: number;
  energySavingsPct: number;
}
