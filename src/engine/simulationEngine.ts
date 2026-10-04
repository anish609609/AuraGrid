import {
  BuildingData,
  BuildingId,
  BuildingControls,
  BuildingSimulationResult,
  CitySimulationResult,
  EnvironmentState,
  GridNodeState,
  GridNodeId,
  LoadBreakdown,
  TariffConfig,
  SolarStorageMetrics,
} from '../types/city';
import { GRID_NODES } from '../data/initialCity';

/**
 * Calculates deterministic Chennai weather parameters for a given hour of the day (0 - 24)
 */
export function getEnvironmentForHour(hour: number): EnvironmentState {
  const normHour = ((hour % 24) + 24) % 24;
  // Diurnal temperature cycle: min at 5:00 (27°C), max at 14:00 (35.5°C)
  const tempPeakHour = 14.0;
  const tempFactor = Math.cos(((normHour - tempPeakHour) / 12) * Math.PI); // 1 at 14:00, -1 at 02:00
  const outdoorTempC = 31.25 + 4.25 * tempFactor; // 27.0°C to 35.5°C

  // Humidity is inverse to temperature: 86% at 05:00, 56% at 14:00
  const humidityPct = 71 - 15 * tempFactor;

  // Solar radiation: 0 before 6:00 and after 18:30, peaks at 12:30 at ~840 W/m²
  let solarRadiationWm2 = 0;
  if (normHour >= 6.0 && normHour <= 18.5) {
    const sunProgress = (normHour - 6.0) / 12.5; // 0 to 1
    solarRadiationWm2 = Math.sin(sunProgress * Math.PI) * 850;
  }

  const isDaytime = normHour >= 6.0 && normHour <= 18.5;

  return {
    timeHours: normHour,
    outdoorTempC: Math.round(outdoorTempC * 10) / 10,
    humidityPct: Math.round(humidityPct),
    solarRadiationWm2: Math.round(solarRadiationWm2),
    isDaytime,
  };
}

/**
 * Hourly occupancy fraction profile (0.0 to 1.0) for each building type
 */
function getHourlyOccupancyMultiplier(buildingId: BuildingId, hour: number): number {
  const h = ((hour % 24) + 24) % 24;
  switch (buildingId) {
    case 'it-tower':
      // Low night (0.1), ramps up 07:30 - 09:30, peak 10:00 - 18:00, drops after 19:00
      if (h < 6.5) return 0.08;
      if (h < 9.0) return 0.08 + ((h - 6.5) / 2.5) * 0.85;
      if (h <= 18.0) return 0.95;
      if (h <= 20.5) return 0.95 - ((h - 18.0) / 2.5) * 0.75;
      return 0.12;

    case 'education':
      // Night (0.04), ramps 07:30, class hours 08:30 - 16:30 (0.92), drops to 0.1 by 19:00
      if (h < 7.0) return 0.04;
      if (h < 9.0) return 0.04 + ((h - 7.0) / 2.0) * 0.88;
      if (h <= 16.5) return 0.92;
      if (h <= 19.5) return 0.92 - ((h - 16.5) / 3.0) * 0.82;
      return 0.06;

    case 'hospital':
      // 24/7 continuous operation, shifts at 07:00, 14:00, 21:00
      if (h >= 0 && h < 6) return 0.72;
      if (h >= 6 && h <= 19) return 0.90;
      return 0.80;

    case 'residential':
      // Morning surge (06:30 - 09:00), low daytime (0.28), high evening surge (18:00 - 23:00)
      if (h < 6.0) return 0.90;
      if (h <= 9.0) return 0.85;
      if (h < 17.5) return 0.32;
      if (h <= 22.5) return 0.95;
      return 0.88;

    case 'retail':
      // Closed night/morning, opens 10:00, high afternoon/evening (14:00 - 21:30)
      if (h < 9.5) return 0.05;
      if (h < 11.5) return 0.05 + ((h - 9.5) / 2.0) * 0.55;
      if (h < 16.0) return 0.65;
      if (h <= 21.5) return 0.95;
      return 0.15;
  }
}

/**
 * Calculates the power load for a specific building at a given hour
 */
export function calculateBuildingPower(
  building: BuildingData,
  controls: BuildingControls,
  env: EnvironmentState,
  hour: number
): {
  totalKW: number;
  breakdown: LoadBreakdown;
  indoorTempC: number;
  comfortScore: number;
  comfortWarning?: string;
} {
  const occFraction = getHourlyOccupancyMultiplier(building.id, hour) * (controls.occupancy / 100);

  // 1. HVAC Calculation
  // Delta T between outdoor temperature and HVAC setpoint
  const deltaT = Math.max(0, env.outdoorTempC - controls.hvacSetpoint);
  const solarThermalGain = (env.solarRadiationWm2 / 1000) * 1.5; // kW thermal equiv
  const occInternalGain = occFraction * (building.capacityPeople * 0.12); // ~120W sensible heat per person in kW

  // Base HVAC capacity by building type
  let hvacBaseKW = 0;
  let itCoreKW = 0;
  let criticalKW = 0;
  let equipmentBaseKW = 0;
  let lightingBaseKW = 0;
  let pumpsBaseKW = 0;
  let otherBaseKW = 0;

  switch (building.id) {
    case 'it-tower':
      hvacBaseKW = 220;
      itCoreKW = 145; // Protected non-curtailable server rack load
      criticalKW = 45; // Emergency elevator & telecom
      equipmentBaseKW = 50 * (controls.flexibleLoad / 100) * occFraction;
      lightingBaseKW = 55 * (controls.lightingLevel / 100);
      pumpsBaseKW = 35;
      otherBaseKW = 25;
      break;

    case 'education':
      hvacBaseKW = 100;
      itCoreKW = 28; // Campus computer labs & network
      criticalKW = 20; // Cryo research & emergency
      equipmentBaseKW = 45 * (controls.flexibleLoad / 100) * occFraction;
      lightingBaseKW = 38 * (controls.lightingLevel / 100);
      pumpsBaseKW = 18;
      otherBaseKW = 15;
      break;

    case 'hospital':
      hvacBaseKW = 160;
      itCoreKW = 35; // Hospital MIS, records
      criticalKW = 160; // 🔒 ICU, Operation Theatres, Life Support - PROTECTED
      equipmentBaseKW = 40 * (controls.flexibleLoad / 100);
      lightingBaseKW = 42 * (controls.lightingLevel / 100);
      pumpsBaseKW = 30;
      otherBaseKW = 25;
      break;

    case 'residential':
      hvacBaseKW = 120;
      itCoreKW = 10;
      criticalKW = 15; // Elevator & hallway emergency
      equipmentBaseKW = 65 * (controls.flexibleLoad / 100) * (0.3 + 0.7 * occFraction);
      lightingBaseKW = 35 * (controls.lightingLevel / 100) * (env.isDaytime ? 0.35 : 0.95);
      pumpsBaseKW = 20;
      otherBaseKW = 15;
      break;

    case 'retail':
      hvacBaseKW = 110;
      itCoreKW = 12;
      criticalKW = 25; // Smoke evacuation & cold room minimum
      equipmentBaseKW = 55 * (controls.flexibleLoad / 100) * occFraction;
      lightingBaseKW = 48 * (controls.lightingLevel / 100);
      pumpsBaseKW = 15;
      otherBaseKW = 20;
      break;
  }

  // Adjust HVAC with deltaT and internal gains
  // Standard rule: 7-9% change in HVAC energy per 1°C setpoint change
  const baselineSetpoint = building.baselineControls.hvacSetpoint;
  const setpointDelta = controls.hvacSetpoint - baselineSetpoint;
  const setpointMultiplier = Math.max(0.6, 1.0 - setpointDelta * 0.08); // e.g. 24 -> 25 gives 0.92 (-8%)

  const thermalLoadRatio = (deltaT + solarThermalGain * 0.4 + occInternalGain * 0.05) / 10;
  const activeHvacKW = hvacBaseKW * setpointMultiplier * Math.max(0.35, Math.min(1.4, thermalLoadRatio * 0.85 + 0.25));

  // EV charging load
  let evKW = 0;
  if (controls.evCharging) {
    if (controls.evOffPeakShift) {
      // Off-peak charging between 23:00 and 06:00
      if (hour >= 23 || hour <= 6) {
        evKW = building.id === 'residential' ? 45 : building.id === 'it-tower' ? 25 : 15;
      }
    } else {
      // Normal daytime charging during work / evening hours
      if (building.id === 'it-tower' && hour >= 9 && hour <= 17) {
        evKW = 35;
      } else if (building.id === 'residential' && (hour >= 18 && hour <= 23)) {
        evKW = 40;
      } else if (building.id === 'retail' && hour >= 12 && hour <= 20) {
        evKW = 20;
      } else if (building.id === 'hospital') {
        evKW = 15;
      }
    }
  }

  const calculatedHvac = Math.round(activeHvacKW);
  const calculatedLighting = Math.round(lightingBaseKW);
  const calculatedEquipment = Math.round(equipmentBaseKW + evKW);
  const calculatedIT = Math.round(itCoreKW);
  const calculatedPumps = Math.round(pumpsBaseKW);
  const calculatedCritical = Math.round(criticalKW);
  const calculatedOther = Math.round(otherBaseKW);

  const totalKW =
    calculatedHvac +
    calculatedLighting +
    calculatedEquipment +
    calculatedIT +
    calculatedPumps +
    calculatedCritical +
    calculatedOther;

  // Indoor Temperature calculation
  // Slight drift: if outdoor temp is 35 and setpoint is 25, indoor temp stabilizes at 25.1°C
  const indoorTempC = Math.round((controls.hvacSetpoint + (env.outdoorTempC - controls.hvacSetpoint) * 0.04) * 10) / 10;

  // Comfort Score (0 - 100%)
  // Ideal comfort is between 23.5 and 24.5°C
  let comfortScore = 100;
  const idealMid = 24.0;
  const tempDiff = Math.abs(indoorTempC - idealMid);
  if (tempDiff > 0.5) {
    comfortScore = Math.max(60, Math.round(100 - (tempDiff - 0.5) * 18));
  }

  // Comfort constraint warning check
  let comfortWarning: string | undefined = undefined;
  if (building.id === 'it-tower') {
    if (indoorTempC < building.constraints.minTemperature) {
      comfortWarning = `Indoor temp (${indoorTempC}°C) is below recommended 23.5°C. Risk of overcooling & thermal discomfort.`;
    } else if (indoorTempC > building.constraints.maxTemperature) {
      comfortWarning = `Indoor temp (${indoorTempC}°C) exceeds recommended 25.0°C limit for commercial IT occupancy.`;
    }
  } else if (indoorTempC > building.constraints.maxTemperature) {
    comfortWarning = `Indoor temp (${indoorTempC}°C) exceeds guideline limit (${building.constraints.maxTemperature}°C).`;
  }

  return {
    totalKW,
    breakdown: {
      hvac: calculatedHvac,
      lighting: calculatedLighting,
      equipment: calculatedEquipment,
      it: calculatedIT,
      pumps: calculatedPumps,
      critical: calculatedCritical,
      other: calculatedOther,
    },
    indoorTempC,
    comfortScore,
    comfortWarning,
  };
}

/**
 * Calculates real-time Solar PV generation and Battery Storage (BESS) telemetry
 */
export function calculateSolarAndBess(
  building: BuildingData,
  env: EnvironmentState,
  hour: number,
  buildingLoadKW: number,
  tariff: TariffConfig
): SolarStorageMetrics {
  const config = building.solarStorage || {
    hasSolar: false,
    pvCapacityKWp: 0,
    hasBess: false,
    bessCapacityKWh: 0,
    maxChargeRateKW: 0,
  };

  // 1. PV Generation output based on solar radiation (0 to ~850 W/m²) and temperature derating
  let currentPvGenerationKW = 0;
  if (config.hasSolar && env.solarRadiationWm2 > 0) {
    const irradRatio = env.solarRadiationWm2 / 1000;
    // Solar efficiency: ~84% performance ratio after inverter and thermal losses
    currentPvGenerationKW = Math.round(config.pvCapacityKWp * irradRatio * 0.84);
  }

  // Daily solar generation integration: roughly 4.85 equivalent peak sun hours in Chennai
  const dailySolarGenerationKWh = config.hasSolar ? Math.round(config.pvCapacityKWp * 4.85) : 0;

  // Self-consumption vs export
  const selfConsumedKW = Math.min(buildingLoadKW, currentPvGenerationKW);
  const gridExportKW = Math.max(0, currentPvGenerationKW - buildingLoadKW);
  const selfConsumptionPct = currentPvGenerationKW > 0 ? Math.round((selfConsumedKW / currentPvGenerationKW) * 100) : 100;

  // Avoided CO2 and solar bill savings
  const avoidedCo2KgToday = Math.round(dailySolarGenerationKWh * 0.72);
  const solarSavingsINRToday = Math.round(dailySolarGenerationKWh * tariff.energyRate);

  // 2. Battery Storage (BESS) calculation
  let bessSocPct = 50;
  let bessFlowKW = 0;
  let bessStatus: 'charging' | 'discharging' | 'standby' = 'standby';

  if (config.hasBess && config.bessCapacityKWh > 0) {
    if (hour >= 10.0 && hour <= 15.0) {
      bessStatus = 'charging';
      const chargeProgress = (hour - 10.0) / 5.0;
      bessSocPct = Math.round(35 + chargeProgress * 58);
      bessFlowKW = -Math.round(config.maxChargeRateKW * Math.min(1.0, (env.solarRadiationWm2 / 600 || 0.4)));
    } else if (hour > 15.0 && hour < 18.0) {
      bessStatus = 'standby';
      bessSocPct = 92;
      bessFlowKW = 0;
    } else if (hour >= 18.0 && hour <= 22.0) {
      bessStatus = 'discharging';
      const dischargeProgress = (hour - 18.0) / 4.0;
      bessSocPct = Math.round(92 - dischargeProgress * 65);
      bessFlowKW = Math.round(config.maxChargeRateKW * 0.9);
    } else {
      bessStatus = 'standby';
      bessSocPct = 28;
      bessFlowKW = 0;
    }
  }

  return {
    currentPvGenerationKW,
    dailySolarGenerationKWh,
    selfConsumptionPct,
    gridExportKW,
    avoidedCo2KgToday,
    solarSavingsINRToday,
    bessSocPct,
    bessFlowKW,
    bessStatus,
  };
}

/**
 * Calculates 24h daily energy (kWh) and peak demand (kW) across the entire day
 */
export function simulateFullDayBuilding(
  building: BuildingData,
  controls: BuildingControls,
  tariff: TariffConfig
): {
  dailyEnergyKWh: number;
  peakDemandKW: number;
  dailyCostINR: number;
  hourlyProfile: { hour: number; powerKW: number; costPerHourINR: number }[];
} {
  let totalKWh = 0;
  let maxDemandKW = 0;
  const hourlyProfile: { hour: number; powerKW: number; costPerHourINR: number }[] = [];

  for (let h = 0; h < 24; h++) {
    const env = getEnvironmentForHour(h);
    const { totalKW } = calculateBuildingPower(building, controls, env, h);
    totalKWh += totalKW; // 1 hour step
    if (totalKW > maxDemandKW) {
      maxDemandKW = totalKW;
    }
    hourlyProfile.push({
      hour: h,
      powerKW: totalKW,
      costPerHourINR: totalKW * tariff.energyRate,
    });
  }

  // Transparent bill calculation:
  // Energy Cost = totalKWh * energyRate
  // Demand Cost per day = (peakDemandKW * demandCharge) / billingPeriodDays
  const energyCost = totalKWh * tariff.energyRate;
  const dailyDemandCost = (maxDemandKW * tariff.demandCharge) / tariff.billingPeriodDays;
  const dailyCostINR = Math.round(energyCost + dailyDemandCost);

  return {
    dailyEnergyKWh: Math.round(totalKWh),
    peakDemandKW: Math.round(maxDemandKW),
    dailyCostINR,
    hourlyProfile,
  };
}

/**
 * Master simulation run for the entire smart city at the current time and user parameter state
 */
export function runCitySimulation(
  buildings: BuildingData[],
  currentHour: number,
  tariff: TariffConfig
): CitySimulationResult {
  const env = getEnvironmentForHour(currentHour);

  const buildingResults: Record<BuildingId, BuildingSimulationResult> = {} as any;
  let totalCurrentPowerKW = 0;
  let baselineTotalPowerKW = 0;
  let todayEnergyKWhTotal = 0;
  let baselineTodayEnergyKWhTotal = 0;
  let cityPeakDemandKW = 0;
  let cityBaselinePeakDemandKW = 0;
  let cityDailyCostINR = 0;
  let cityBaselineDailyCostINR = 0;
  let totalSolarGenerationKW = 0;
  let todaySolarKWhTotal = 0;
  let totalAvoidedCo2KgTotal = 0;
  let totalSolarSavingsINRTotal = 0;
  let totalBessCapacity = 0;
  let weightedSocSum = 0;

  // Track node loads
  const nodeLoads: Record<'node-a' | 'node-b', number> = {
    'node-a': 0,
    'node-b': 0,
  };

  buildings.forEach((b) => {
    // Current controls result
    const currentHourCalc = calculateBuildingPower(b, b.currentControls, env, currentHour);
    const currentFullDay = simulateFullDayBuilding(b, b.currentControls, tariff);
    const solarStorage = calculateSolarAndBess(b, env, currentHour, currentHourCalc.totalKW, tariff);

    // Baseline controls result
    const baselineHourCalc = calculateBuildingPower(b, b.baselineControls, env, currentHour);
    const baselineFullDay = simulateFullDayBuilding(b, b.baselineControls, tariff);

    // Grid node allocation
    if (b.gridNodeId === 'node-a') {
      nodeLoads['node-a'] += currentHourCalc.totalKW;
    } else if (b.gridNodeId === 'node-b') {
      nodeLoads['node-b'] += currentHourCalc.totalKW;
    } else {
      // 'both' (e.g. Hospital dual-feed)
      nodeLoads['node-a'] += currentHourCalc.totalKW * 0.5;
      nodeLoads['node-b'] += currentHourCalc.totalKW * 0.5;
    }

    const gridNodeCapacity = b.gridNodeId === 'node-a' ? 1600 : b.gridNodeId === 'node-b' ? 1400 : 3000;
    const gridUtilPct = Math.round((currentHourCalc.totalKW / gridNodeCapacity) * 100);

    buildingResults[b.id] = {
      buildingId: b.id,
      currentPowerKW: currentHourCalc.totalKW,
      baselinePowerKW: baselineHourCalc.totalKW,
      loadBreakdown: currentHourCalc.breakdown,
      indoorTempC: currentHourCalc.indoorTempC,
      comfortScore: currentHourCalc.comfortScore,
      comfortWarning: currentHourCalc.comfortWarning,
      todayEnergyKWh: currentFullDay.dailyEnergyKWh,
      peakDemandKW: currentFullDay.peakDemandKW,
      dailyCostINR: currentFullDay.dailyCostINR,
      baselineDailyCostINR: baselineFullDay.dailyCostINR,
      gridUtilizationPct: gridUtilPct,
      solarStorage,
    };

    totalCurrentPowerKW += currentHourCalc.totalKW;
    baselineTotalPowerKW += baselineHourCalc.totalKW;
    todayEnergyKWhTotal += currentFullDay.dailyEnergyKWh;
    baselineTodayEnergyKWhTotal += baselineFullDay.dailyEnergyKWh;
    cityPeakDemandKW += currentFullDay.peakDemandKW;
    cityBaselinePeakDemandKW += baselineFullDay.peakDemandKW;
    cityDailyCostINR += currentFullDay.dailyCostINR;
    cityBaselineDailyCostINR += baselineFullDay.dailyCostINR;

    totalSolarGenerationKW += solarStorage.currentPvGenerationKW;
    todaySolarKWhTotal += solarStorage.dailySolarGenerationKWh;
    totalAvoidedCo2KgTotal += solarStorage.avoidedCo2KgToday;
    totalSolarSavingsINRTotal += solarStorage.solarSavingsINRToday;

    if (b.solarStorage?.bessCapacityKWh) {
      totalBessCapacity += b.solarStorage.bessCapacityKWh;
      weightedSocSum += solarStorage.bessSocPct * b.solarStorage.bessCapacityKWh;
    }
  });

  // Calculate Node states
  const totalExternalSupplyKW = Math.round(nodeLoads['node-a'] + nodeLoads['node-b']);
  const gridNodeStates: Record<GridNodeId, GridNodeState> = {
    'external-feeder': {
      nodeId: 'external-feeder',
      currentLoadKW: totalExternalSupplyKW,
      capacityKW: 5000,
      utilizationPct: Math.round((totalExternalSupplyKW / 5000) * 100),
      status:
        totalExternalSupplyKW / 5000 >= 0.90
          ? 'stressed'
          : totalExternalSupplyKW / 5000 >= 0.75
          ? 'moderate'
          : 'normal',
    },
    'node-a': {
      nodeId: 'node-a',
      currentLoadKW: Math.round(nodeLoads['node-a']),
      capacityKW: 1600,
      utilizationPct: Math.round((nodeLoads['node-a'] / 1600) * 100),
      status:
        nodeLoads['node-a'] / 1600 >= 0.90
          ? 'stressed'
          : nodeLoads['node-a'] / 1600 >= 0.75
          ? 'moderate'
          : 'normal',
    },
    'node-b': {
      nodeId: 'node-b',
      currentLoadKW: Math.round(nodeLoads['node-b']),
      capacityKW: 1400,
      utilizationPct: Math.round((nodeLoads['node-b'] / 1400) * 100),
      status:
        nodeLoads['node-b'] / 1400 >= 0.90
          ? 'stressed'
          : nodeLoads['node-b'] / 1400 >= 0.75
          ? 'moderate'
          : 'normal',
    },
  };

  const totalGridCapacityKW = 3000;
  const cityGridUtilizationPct = Math.round((totalCurrentPowerKW / totalGridCapacityKW) * 100);

  // Carbon factor: ~0.72 kg CO2 per kWh = 0.72 tons per MWh
  const todayEnergyMWh = Math.round((todayEnergyKWhTotal / 1000) * 10) / 10;
  const baselineTodayEnergyMWh = Math.round((baselineTodayEnergyKWhTotal / 1000) * 10) / 10;
  const co2EmissionsTons = Math.round(todayEnergyMWh * 0.72 * 10) / 10;

  const todaySolarEnergyMWh = Math.round((todaySolarKWhTotal / 1000) * 10) / 10;
  const totalAvoidedCo2Tons = Math.round((totalAvoidedCo2KgTotal / 1000) * 10) / 10;
  const cityBessTotalSocPct = totalBessCapacity > 0 ? Math.round(weightedSocSum / totalBessCapacity) : 50;
  const incomingBulkGridKW = Math.max(0, totalCurrentPowerKW - totalSolarGenerationKW);
  const solarAbsorptionKW = totalSolarGenerationKW;
  const voltageStabilityIndex = Math.round((0.997 + 0.002 * Math.sin((currentHour / 12) * Math.PI)) * 1000) / 1000;
  const phaseBalance = { phaseA: 99.8, phaseB: 100.1, phaseC: 99.9 };
  const powerFactor = 0.98;

  return {
    totalCurrentPowerKW: Math.round(totalCurrentPowerKW),
    baselineTotalPowerKW: Math.round(baselineTotalPowerKW),
    cityGridUtilizationPct,
    todayEnergyMWh,
    baselineTodayEnergyMWh,
    peakDemandMW: Math.round((cityPeakDemandKW / 1000) * 100) / 100,
    baselinePeakDemandMW: Math.round((cityBaselinePeakDemandKW / 1000) * 100) / 100,
    estimatedDailyCostINR: cityDailyCostINR,
    baselineDailyCostINR: cityBaselineDailyCostINR,
    co2EmissionsTons,
    totalSolarGenerationKW,
    todaySolarEnergyMWh,
    totalAvoidedCo2Tons,
    totalSolarSavingsINR: totalSolarSavingsINRTotal,
    cityBessTotalSocPct,
    incomingBulkGridKW,
    solarAbsorptionKW,
    voltageStabilityIndex,
    phaseBalance,
    powerFactor,
    buildingResults,
    gridNodeStates,
  };
}
