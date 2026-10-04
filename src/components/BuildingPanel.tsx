import React, { useState } from 'react';
import {
  BuildingData,
  BuildingControls,
  BuildingSimulationResult,
  EnvironmentState,
  TariffConfig,
} from '../types/city';
import { calculateCostComparison, calculateBillBreakdown, formatINR } from '../engine/costEngine';
import { simulateFullDayBuilding } from '../engine/simulationEngine';
import { ComfortIndicator } from './ComfortIndicator';
import { EducationalTooltip } from './EducationalTooltip';
import {
  X,
  Zap,
  TrendingDown,
  TrendingUp,
  Sliders,
  DollarSign,
  PieChart,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Lock,
  Sun,
  Activity,
  BatteryCharging,
  Leaf,
} from 'lucide-react';

interface BuildingPanelProps {
  building: BuildingData;
  simulationResult: BuildingSimulationResult;
  environment: EnvironmentState;
  tariff: TariffConfig;
  onUpdateControls: (controls: BuildingControls) => void;
  onResetControls: () => void;
  onClose: () => void;
}

export const BuildingPanel: React.FC<BuildingPanelProps> = ({
  building,
  simulationResult,
  environment,
  tariff,
  onUpdateControls,
  onResetControls,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'loads' | 'controls' | 'cost' | 'comfort' | 'solar'>('controls');
  const [showCriticalModal, setShowCriticalModal] = useState(false);

  const controls = building.currentControls;
  const baseline = building.baselineControls;

  // Comparison metrics
  const costComp = calculateCostComparison(
    simulationResult.baselineDailyCostINR,
    simulationResult.dailyCostINR
  );

  const powerDiffKW = simulationResult.currentPowerKW - simulationResult.baselinePowerKW;
  const powerDiffPct =
    simulationResult.baselinePowerKW > 0
      ? Math.round((powerDiffKW / simulationResult.baselinePowerKW) * 100)
      : 0;

  const fullDay = simulateFullDayBuilding(building, controls, tariff);
  const baselineFullDay = simulateFullDayBuilding(building, baseline, tariff);

  const energyDiffKWh = fullDay.dailyEnergyKWh - baselineFullDay.dailyEnergyKWh;
  const energyDiffPct =
    baselineFullDay.dailyEnergyKWh > 0
      ? Math.round((energyDiffKWh / baselineFullDay.dailyEnergyKWh) * 1000) / 10
      : 0;

  const billBreakdown = calculateBillBreakdown(
    fullDay.dailyEnergyKWh,
    fullDay.peakDemandKW,
    tariff
  );

  const handleControlChange = (key: keyof BuildingControls, value: any) => {
    onUpdateControls({
      ...controls,
      [key]: value,
    });
  };

  // SVG 24-hour profile calculation
  const maxProfilePower = Math.max(
    ...fullDay.hourlyProfile.map((p) => p.powerKW),
    ...baselineFullDay.hourlyProfile.map((p) => p.powerKW),
    100
  );

  return (
    <div className="fixed inset-x-0 bottom-0 top-14 sm:top-20 sm:bottom-20 sm:right-4 sm:left-auto sm:w-[440px] sm:max-w-[calc(100vw-32px)] bg-slate-950/95 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl backdrop-blur-2xl flex flex-col z-50 overflow-hidden transition-all duration-300">
      {/* Mobile Top Grab Handle */}
      <div className="w-12 h-1 bg-slate-700/80 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

      {/* Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-800/80 flex items-start justify-between bg-slate-900/40">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: building.accentColor }}
            />
            <h2 className="text-sm sm:text-base font-bold text-slate-100 tracking-wide">
              {building.name}
            </h2>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {building.category} · {building.areaSqFt.toLocaleString()} ft² · {building.floors} floors
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors active:scale-95"
          aria-label="Close panel"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/80 bg-slate-900/20 px-2 py-1.5 gap-1.5 overflow-x-auto no-scrollbar touch-pan-x">
        <button
          onClick={() => setActiveTab('controls')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'controls'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Controls</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'overview'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('loads')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'loads'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Loads</span>
        </button>

        <button
          onClick={() => setActiveTab('cost')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'cost'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Cost & Bill</span>
        </button>

        <button
          onClick={() => setActiveTab('solar')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'solar'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Solar & BESS</span>
        </button>

        <button
          onClick={() => setActiveTab('comfort')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'comfort'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Comfort</span>
        </button>
      </div>

      {/* Tab Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: CONTROLS (Hero Interactive Experience) */}
        {activeTab === 'controls' && (
          <div className="space-y-4">
            {/* Live Scenario Impact Card (Prominent Section 19 Requirement) */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                costComp.isSaving
                  ? 'bg-emerald-950/20 border-emerald-500/30 shadow-emerald-900/10'
                  : 'bg-amber-950/20 border-amber-500/30 shadow-amber-900/10'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Live Scenario Impact
                </span>
                <span
                  className={`text-xs font-mono font-bold flex items-center gap-1 ${
                    costComp.isSaving ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {costComp.isSaving ? (
                    <>
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>Saving ₹{Math.abs(costComp.dailyDifferenceINR).toLocaleString()}/day</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+₹{Math.abs(costComp.dailyDifferenceINR).toLocaleString()}/day increase</span>
                    </>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2.5 font-mono text-[11px]">
                <div>
                  <div className="text-[10px] text-slate-400 font-sans">Power</div>
                  <div className="text-slate-100 font-semibold mt-0.5">
                    {simulationResult.currentPowerKW} kW
                  </div>
                  <div
                    className={`text-[10px] ${
                      powerDiffKW <= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {powerDiffKW <= 0 ? `↓ ${Math.abs(powerDiffPct)}%` : `↑ +${powerDiffPct}%`}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-sans">Daily Energy</div>
                  <div className="text-slate-100 font-semibold mt-0.5">
                    {(fullDay.dailyEnergyKWh / 1000).toFixed(2)} MWh
                  </div>
                  <div
                    className={`text-[10px] ${
                      energyDiffPct <= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {energyDiffPct <= 0 ? `↓ ${Math.abs(energyDiffPct)}%` : `↑ +${energyDiffPct}%`}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-sans">Peak Demand</div>
                  <div className="text-slate-100 font-semibold mt-0.5">
                    {fullDay.peakDemandKW} kW
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Cap: {building.constraints.maxDemandCap} kW
                  </div>
                </div>
              </div>

              {/* Financial Annual Impact Projections */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400 font-sans">Annual Projection:</span>
                <span
                  className={`font-semibold ${
                    costComp.isSaving ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {formatINR(costComp.annualProjectionINR, { showSign: true, compact: true })} / year
                </span>
              </div>
            </div>

            {/* Parameter Sliders */}
            <div className="space-y-4">
              {/* 1. HVAC Setpoint */}
              <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <EducationalTooltip term="hvacSetpoint">
                      <span>HVAC Cooling Setpoint</span>
                    </EducationalTooltip>
                  </span>
                  <div className="font-mono text-xs text-cyan-300 font-bold">
                    {controls.hvacSetpoint.toFixed(1)}°C
                  </div>
                </div>

                <input
                  type="range"
                  min="21.0"
                  max="27.0"
                  step="0.5"
                  value={controls.hvacSetpoint}
                  onChange={(e) => handleControlChange('hvacSetpoint', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Baseline: {baseline.hvacSetpoint}°C</span>
                  <span
                    className={
                      controls.hvacSetpoint > baseline.hvacSetpoint
                        ? 'text-emerald-400'
                        : controls.hvacSetpoint < baseline.hvacSetpoint
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }
                  >
                    {controls.hvacSetpoint !== baseline.hvacSetpoint
                      ? `${
                          controls.hvacSetpoint > baseline.hvacSetpoint ? '↓' : '↑'
                        } ${Math.abs(Math.round((controls.hvacSetpoint - baseline.hvacSetpoint) * 8))}% HVAC energy`
                      : 'At Baseline'}
                  </span>
                </div>
              </div>

              {/* 2. Lighting Level */}
              <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Lighting Dimming Level</span>
                  </span>
                  <div className="font-mono text-xs text-yellow-300 font-bold">
                    {controls.lightingLevel}%
                  </div>
                </div>

                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={controls.lightingLevel}
                  onChange={(e) => handleControlChange('lightingLevel', parseInt(e.target.value))}
                  className="w-full accent-yellow-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Baseline: {baseline.lightingLevel}%</span>
                  <span
                    className={
                      controls.lightingLevel < baseline.lightingLevel
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }
                  >
                    {controls.lightingLevel !== baseline.lightingLevel
                      ? `↓ ${Math.round(((baseline.lightingLevel - controls.lightingLevel) / 100) * 20)} kW shaved`
                      : 'At Baseline'}
                  </span>
                </div>
              </div>

              {/* 3. Flexible / Curtailable Load */}
              <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <EducationalTooltip term="flexibleLoad">
                      <span>Flexible Auxiliary Equipment</span>
                    </EducationalTooltip>
                  </span>
                  <div className="font-mono text-xs text-slate-200 font-bold">
                    {controls.flexibleLoad}%
                  </div>
                </div>

                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={controls.flexibleLoad}
                  onChange={(e) => handleControlChange('flexibleLoad', parseInt(e.target.value))}
                  className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Baseline: {baseline.flexibleLoad}%</span>
                  <span>Non-critical loads only</span>
                </div>
              </div>

              {/* 4. Occupancy Rate */}
              <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    Occupancy Utilization
                  </span>
                  <div className="font-mono text-xs text-slate-200 font-bold">
                    {controls.occupancy}%
                  </div>
                </div>

                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={controls.occupancy}
                  onChange={(e) => handleControlChange('occupancy', parseInt(e.target.value))}
                  className="w-full accent-blue-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Capacity: {building.capacityPeople} occupants</span>
                  <span>
                    Active: {Math.round((controls.occupancy / 100) * building.capacityPeople)} people
                  </span>
                </div>
              </div>

              {/* 5. EV Charging & Peak Shifting */}
              <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    EV Charging Bays
                  </span>
                  <button
                    onClick={() => handleControlChange('evCharging', !controls.evCharging)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      controls.evCharging
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {controls.evCharging ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                {controls.evCharging && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-300">
                      Shift to Off-Peak (23:00 - 05:00)
                    </span>
                    <button
                      onClick={() =>
                        handleControlChange('evOffPeakShift', !controls.evOffPeakShift)
                      }
                      className={`px-2.5 py-0.5 text-[11px] font-mono rounded border transition-all ${
                        controls.evOffPeakShift
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {controls.evOffPeakShift ? 'SHIFTED (OFF-PEAK)' : 'DAYTIME CHARGING'}
                    </button>
                  </div>
                )}
              </div>

              {/* Critical Loads Lock Notice (Especially for Hospital) */}
              {building.id === 'hospital' && (
                <div
                  onClick={() => setShowCriticalModal(true)}
                  className="p-3 bg-rose-950/20 border border-rose-600/30 rounded-xl cursor-pointer hover:border-rose-500/50 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-400" />
                    <div>
                      <div className="text-xs font-semibold text-rose-300">
                        ICU & Surgical Life Support
                      </div>
                      <div className="text-[10px] text-rose-400/80">
                        160 kW critical hospital load is non-curtailable
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-rose-400 group-hover:underline">
                    View Policy
                  </span>
                </div>
              )}
            </div>

            {/* Reset Controls Button */}
            <div className="pt-2">
              <button
                onClick={onResetControls}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all active:scale-98"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Reset to Baseline Parameters</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5 font-mono">
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                <div className="text-[10px] uppercase font-sans tracking-wider text-slate-400">
                  Current Power
                </div>
                <div className="text-lg font-bold text-cyan-400 mt-1">
                  {simulationResult.currentPowerKW} kW
                </div>
                <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                  Baseline: {simulationResult.baselinePowerKW} kW
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                <div className="text-[10px] uppercase font-sans tracking-wider text-slate-400 flex items-center justify-between">
                  <EducationalTooltip term="peakDemand">
                    <span>Peak Demand</span>
                  </EducationalTooltip>
                </div>
                <div className="text-lg font-bold text-slate-100 mt-1">
                  {fullDay.peakDemandKW} kW
                </div>
                <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                  Baseline: {baselineFullDay.peakDemandKW} kW
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                <div className="text-[10px] uppercase font-sans tracking-wider text-slate-400 flex items-center justify-between">
                  <EducationalTooltip term="gridUtilization">
                    <span>Grid Utilization</span>
                  </EducationalTooltip>
                </div>
                <div
                  className={`text-lg font-bold mt-1 ${
                    simulationResult.gridUtilizationPct > 85
                      ? 'text-rose-400'
                      : simulationResult.gridUtilizationPct > 70
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {simulationResult.gridUtilizationPct}%
                </div>
                <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                  Substation Capacity
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                <div className="text-[10px] uppercase font-sans tracking-wider text-slate-400">
                  Daily Est. Cost
                </div>
                <div className="text-lg font-bold text-emerald-400 mt-1">
                  {formatINR(simulationResult.dailyCostINR)}
                </div>
                <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                  Baseline: {formatINR(simulationResult.baselineDailyCostINR)}
                </div>
              </div>
            </div>

            {/* Environmental context */}
            <div className="p-3.5 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Chennai Micro-Climate (Simulated)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 block">Outdoor</span>
                  {environment.outdoorTempC}°C
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Humidity</span>
                  {environment.humidityPct}%
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Solar Rad.</span>
                  {environment.solarRadiationWm2} W/m²
                </div>
              </div>
            </div>

            {/* Comfort summary component */}
            <ComfortIndicator
              score={simulationResult.comfortScore}
              indoorTemp={simulationResult.indoorTempC}
              minTemp={building.constraints.minTemperature}
              maxTemp={building.constraints.maxTemperature}
              warning={simulationResult.comfortWarning}
              energyChangePct={energyDiffPct}
              costChangePct={costComp.dailySavingsPct}
            />
          </div>
        )}

        {/* TAB 3: LOADS BREAKDOWN & 24H LOAD PROFILE */}
        {activeTab === 'loads' && (
          <div className="space-y-4">
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-slate-200 block">
                Load Component Distribution
              </span>

              {Object.entries(simulationResult.loadBreakdown).map(([key, kw]) => {
                if (kw === undefined || kw === 0) return null;
                const pct = Math.round((kw / simulationResult.currentPowerKW) * 100);
                const isCritical = key === 'critical';

                let color = 'bg-cyan-500';
                if (key === 'hvac') color = 'bg-sky-400';
                else if (key === 'lighting') color = 'bg-yellow-400';
                else if (key === 'equipment') color = 'bg-purple-400';
                else if (key === 'it') color = 'bg-blue-500';
                else if (key === 'pumps') color = 'bg-teal-400';
                else if (key === 'critical') color = 'bg-rose-500';

                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 capitalize flex items-center gap-1.5">
                        {isCritical && <Lock className="w-3 h-3 text-rose-400" />}
                        {key === 'hvac' ? 'HVAC Chilled Water' : key}
                      </span>
                      <span className="text-slate-400">
                        <strong className="text-slate-200">{kw} kW</strong> ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 24-Hour Load Profile Chart (Baseline vs Scenario) */}
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">24-Hour Power Demand Curve</span>
                <div className="flex items-center gap-3 font-mono text-[10px]">
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="w-2 h-0.5 bg-slate-500 inline-block" /> Baseline
                  </span>
                  <span className="flex items-center gap-1 text-cyan-400">
                    <span className="w-2 h-0.5 bg-cyan-400 inline-block" /> Scenario
                  </span>
                </div>
              </div>

              {/* Custom SVG Sparkline Graph */}
              <div className="h-32 w-full pt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 240 100">
                  {/* Grid lines */}
                  <line x1="0" y1="20" x2="240" y2="20" stroke="#1e293b" strokeDasharray="2" />
                  <line x1="0" y1="50" x2="240" y2="50" stroke="#1e293b" strokeDasharray="2" />
                  <line x1="0" y1="80" x2="240" y2="80" stroke="#1e293b" strokeDasharray="2" />

                  {/* Baseline curve */}
                  <polyline
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    points={baselineFullDay.hourlyProfile
                      .map((p, i) => `${i * 10},${100 - (p.powerKW / maxProfilePower) * 90}`)
                      .join(' ')}
                  />

                  {/* Scenario curve */}
                  <polyline
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    points={fullDay.hourlyProfile
                      .map((p, i) => `${i * 10},${100 - (p.powerKW / maxProfilePower) * 90}`)
                      .join(' ')}
                  />

                  {/* Current hour marker */}
                  <line
                    x1={environment.timeHours * 10}
                    y1="5"
                    x2={environment.timeHours * 10}
                    y2="95"
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>24:00</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COST & TARIFF (Transparent Bill Breakdown) */}
        {activeTab === 'cost' && (
          <div className="space-y-4">
            {/* Savings headline */}
            <div
              className={`p-4 rounded-xl border text-center ${
                costComp.isSaving
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-amber-950/20 border-amber-500/40'
              }`}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                {costComp.isSaving ? 'YOU SAVE' : 'COST INCREASE'}
              </div>
              <div
                className={`text-2xl font-bold font-mono mt-1 ${
                  costComp.isSaving ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {formatINR(Math.abs(costComp.dailyDifferenceINR))}
                <span className="text-xs font-normal text-slate-400 font-sans"> / day</span>
              </div>
              <div className="text-xs text-slate-300 mt-1 font-mono">
                {costComp.isSaving ? '↓' : '↑'} {Math.abs(costComp.dailySavingsPct)}% versus baseline
              </div>
            </div>

            {/* Projection Cards */}
            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                <div className="text-[10px] font-sans text-slate-400 uppercase">
                  Monthly Projection
                </div>
                <div
                  className={`text-sm font-bold mt-1 ${
                    costComp.isSaving ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {formatINR(costComp.monthlyProjectionINR, { showSign: true, compact: true })}
                </div>
                <div className="text-[10px] text-slate-500 font-sans mt-0.5">30-day period</div>
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                <div className="text-[10px] font-sans text-slate-400 uppercase">
                  Annual Projection
                </div>
                <div
                  className={`text-sm font-bold mt-1 ${
                    costComp.isSaving ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {formatINR(costComp.annualProjectionINR, { showSign: true, compact: true })}
                </div>
                <div className="text-[10px] text-slate-500 font-sans mt-0.5">365-day cycle</div>
              </div>
            </div>

            {/* Transparent Bill Breakdown Section (Explicitly requested in Section 16) */}
            <div className="p-3.5 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3 font-mono">
              <div className="text-xs font-bold text-slate-200 font-sans flex items-center justify-between">
                <span>SIMULATED BILL BREAKDOWN</span>
                <span className="text-[10px] text-slate-400 font-normal">Daily rate</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                  <div>
                    <span className="text-slate-300 block">Energy Consumption</span>
                    <span className="text-[10px] text-slate-500">
                      {billBreakdown.energyKWh.toLocaleString()} kWh × {tariff.currencySymbol}
                      {tariff.energyRate.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-slate-200 font-semibold">
                    {formatINR(billBreakdown.energyCostINR)}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                  <div>
                    <span className="text-slate-300 block">Peak Demand Charge</span>
                    <span className="text-[10px] text-slate-500">
                      {billBreakdown.peakDemandKW} kW × {tariff.currencySymbol}
                      {tariff.demandCharge.toFixed(0)} / 30d
                    </span>
                  </div>
                  <span className="text-slate-200 font-semibold">
                    {formatINR(billBreakdown.demandCostINR)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 text-sm font-bold">
                  <span className="text-slate-200 font-sans">Estimated Daily Total</span>
                  <span className="text-cyan-400">
                    {formatINR(billBreakdown.totalEstimatedBillINR)}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 font-sans leading-relaxed pt-1">
                * Simulated estimation based on prototype tariff model (Energy: ₹
                {tariff.energyRate}/kWh, Demand: ₹{tariff.demandCharge}/kW).
              </p>
            </div>
          </div>
        )}

        {/* TAB 5: COMFORT ANALYSIS */}
        {activeTab === 'comfort' && (
          <div className="space-y-4">
            <ComfortIndicator
              score={simulationResult.comfortScore}
              indoorTemp={simulationResult.indoorTempC}
              minTemp={building.constraints.minTemperature}
              maxTemp={building.constraints.maxTemperature}
              warning={simulationResult.comfortWarning}
              energyChangePct={energyDiffPct}
              costChangePct={costComp.dailySavingsPct}
            />

            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300">
              <span className="font-semibold text-slate-200 block">
                Comfort vs. Cost Optimization Principles
              </span>
              <p className="text-[11px] leading-relaxed text-slate-400">
                In tropical climates like Chennai, every 1°C increase in HVAC setpoint cuts chiller
                compressor power by approximately 7% to 9%. However, exceeding 25.0°C impairs
                cognitive productivity in commercial offices and violates hospital patient wellness
                standards.
              </p>
            </div>
          </div>
        )}

        {/* TAB 6: SOLAR & STORAGE ANALYTICS */}
        {activeTab === 'solar' && (
          <div className="space-y-4 font-sans">
            {building.solarStorage?.hasSolar ? (
              <>
                {/* Real-time Solar PV Generation Output Card */}
                <div className="p-4 bg-gradient-to-br from-amber-950/30 to-slate-900/80 border border-amber-500/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                        Rooftop Photovoltaic Array ({building.solarStorage.pvCapacityKWp} kWp)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {environment.isDaytime ? 'ACTIVE GENERATION' : 'NIGHT STANDBY'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                    <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                      <span className="text-[10px] font-sans text-slate-400 block">Real-time PV Output</span>
                      <span className="text-xl font-bold text-amber-300">
                        {simulationResult.solarStorage.currentPvGenerationKW} kW
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Capacity: {building.solarStorage.pvCapacityKWp} kWp
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                      <span className="text-[10px] font-sans text-slate-400 block">Cumulative Daily Solar</span>
                      <span className="text-xl font-bold text-slate-100">
                        {simulationResult.solarStorage.dailySolarGenerationKWh} kWh
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {(simulationResult.solarStorage.dailySolarGenerationKWh / 1000).toFixed(2)} MWh today
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                    <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                      <span className="text-[10px] font-sans text-slate-400 block">Self-Consumption %</span>
                      <span className="text-base font-bold text-cyan-300">
                        {simulationResult.solarStorage.selfConsumptionPct}%
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Used locally in facility
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                      <span className="text-[10px] font-sans text-slate-400 block">Grid Export Feed-in</span>
                      <span className="text-base font-bold text-emerald-300">
                        {simulationResult.solarStorage.gridExportKW} kW
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Surplus absorbed by grid
                      </span>
                    </div>
                  </div>
                </div>

                {/* Carbon & Financial Savings */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Avoided Carbon</span>
                    </div>
                    <div className="text-lg font-bold font-mono text-emerald-300">
                      {simulationResult.solarStorage.avoidedCo2KgToday} kg CO₂
                    </div>
                    <div className="text-[10px] text-slate-500">Saved today vs grid coal</div>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Net Bill Savings</span>
                    </div>
                    <div className="text-lg font-bold font-mono text-emerald-300">
                      {formatINR(simulationResult.solarStorage.solarSavingsINRToday)}
                    </div>
                    <div className="text-[10px] text-slate-500">Direct tariff cost offset</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-slate-300">
                  <Sun className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Rooftop Solar PV: Zero Installed Capacity
                  </span>
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs leading-relaxed text-slate-400 space-y-2">
                  {building.id === 'hospital' ? (
                    <>
                      <p className="text-rose-300 font-semibold">
                        Emergency Heliport Landing Zone Restriction:
                      </p>
                      <p>
                        Photovoltaic panels are strictly prohibited on CityCare Medical Center's rooftop
                        to maintain unobstructed approach/departure corridors for emergency air ambulances and trauma helicopters.
                      </p>
                      <p className="text-slate-300">
                        Facility is protected by dedicated 150 kWh Emergency Life-Support BESS below.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-emerald-300 font-semibold">
                        Residential Sky Deck & Terrace Garden Allocation:
                      </p>
                      <p>
                        Serena Residential Towers reserves its rooftop parcel for resident recreational
                        sky terraces and bioclimatic pergolas. Clean energy is absorbed through District
                        Node Beta microgrid solar routing.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Local Battery Storage (BESS) Status Indicator */}
            {building.solarStorage?.hasBess ? (
              <div className="p-4 bg-slate-900/70 border border-cyan-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <BatteryCharging className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                      Local Battery Storage (BESS)
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                      simulationResult.solarStorage.bessStatus === 'charging'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : simulationResult.solarStorage.bessStatus === 'discharging'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {simulationResult.solarStorage.bessStatus}
                  </span>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span className="font-sans">State of Charge (SoC):</span>
                      <span className="font-bold text-slate-100">
                        {simulationResult.solarStorage.bessSocPct}% ({Math.round((simulationResult.solarStorage.bessSocPct / 100) * building.solarStorage.bessCapacityKWh)} / {building.solarStorage.bessCapacityKWh} kWh)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all"
                        style={{ width: `${simulationResult.solarStorage.bessSocPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                    <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
                      <span className="text-slate-400 font-sans block text-[10px]">Flow Rate</span>
                      <span className="font-bold text-cyan-300">
                        {Math.abs(simulationResult.solarStorage.bessFlowKW)} kW
                      </span>
                    </div>
                    <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
                      <span className="text-slate-400 font-sans block text-[10px]">Max Inverter Rate</span>
                      <span className="font-bold text-slate-300">
                        {building.solarStorage.maxChargeRateKW} kW
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                <BatteryCharging className="w-4 h-4 text-slate-600" />
                <span>No local BESS installed. Facility relies directly on grid node buffering.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hospital Critical Load Protected Modal */}
      {showCriticalModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/60 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <Lock className="w-6 h-6" />
              <h3 className="text-lg font-bold tracking-wide">PROTECTED LOAD</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This load supports critical hospital operations (ICU, Surgical Suites, and Life Support)
              and <strong className="text-rose-300">cannot be curtailed</strong> or altered under
              any energy conservation scenario.
            </p>
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div>Protected Feed: 160 kW baseline guaranteed</div>
              <div>Dual Grid Substation: Substation Alpha & Beta redundant feeds</div>
            </div>
            <button
              onClick={() => setShowCriticalModal(false)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-all"
            >
              Acknowledge Protection Policy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
