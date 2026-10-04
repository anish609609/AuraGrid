import React from 'react';
import { CitySimulationResult, TariffConfig } from '../types/city';
import { formatINR } from '../engine/costEngine';
import { EducationalTooltip } from './EducationalTooltip';
import { Zap, Activity, ShieldAlert, Cpu, Sparkles, SlidersHorizontal } from 'lucide-react';

interface HeaderProps {
  simulationResult: CitySimulationResult;
  tariff: TariffConfig;
  activeView: 'city' | 'buildings' | 'grid' | 'solar' | 'scenarios' | 'tariff';
  onSelectView: (view: 'city' | 'buildings' | 'grid' | 'solar' | 'scenarios' | 'tariff') => void;
  onOpenOptimizeModal: () => void;
  onOpenFeederDashboard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  simulationResult,
  tariff,
  activeView,
  onSelectView,
  onOpenOptimizeModal,
  onOpenFeederDashboard,
}) => {
  const isGridStressed = simulationResult.cityGridUtilizationPct >= 85;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-slate-950/85 border-b border-slate-800/80 backdrop-blur-xl z-40 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Zone 1: Wordmark & Brand Title (Strictly single text element in display face, no pills) */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white font-sans">
              AuraGrid
            </h1>
            <div className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
              Smart City Digital Twin
            </div>
          </div>
        </div>
      </div>

      {/* Zone 2: City Overview Telemetry & Navigation */}
      <div className="hidden xl:flex items-center gap-6 font-mono text-xs">
        {/* Total Load */}
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-sans">
            Total Load
          </span>
          <span className="font-bold text-cyan-400 mt-0.5">
            {(simulationResult.totalCurrentPowerKW / 1000).toFixed(2)} MW
          </span>
        </div>

        {/* Grid Utilization */}
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-sans">
            <EducationalTooltip term="gridUtilization">
              <span>Grid Util</span>
            </EducationalTooltip>
          </span>
          <span
            className={`font-bold mt-0.5 ${
              isGridStressed
                ? 'text-rose-400'
                : simulationResult.cityGridUtilizationPct >= 70
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {simulationResult.cityGridUtilizationPct}%
          </span>
        </div>

        {/* Today's Energy */}
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-sans">
            Today's Energy
          </span>
          <span className="font-bold text-slate-200 mt-0.5">
            {simulationResult.todayEnergyMWh} MWh
          </span>
        </div>

        {/* Peak Demand */}
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-sans">
            <EducationalTooltip term="peakDemand">
              <span>Peak Demand</span>
            </EducationalTooltip>
          </span>
          <span className="font-bold text-slate-200 mt-0.5">
            {simulationResult.peakDemandMW} MW
          </span>
        </div>

        {/* Solar Generation */}
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-sans">
            Solar PV
          </span>
          <span className="font-bold text-amber-400 mt-0.5">
            {simulationResult.totalSolarGenerationKW} kW
          </span>
        </div>

        {/* Estimated Daily Cost */}
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-sans">
            <EducationalTooltip term="estimatedCost">
              <span>Est. Daily Cost</span>
            </EducationalTooltip>
          </span>
          <span className="font-bold text-emerald-400 mt-0.5">
            {formatINR(simulationResult.estimatedDailyCostINR, { compact: true })}
          </span>
        </div>

        {/* CO2 Emissions */}
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-sans">
            CO₂ Carbon
          </span>
          <span className="font-bold text-slate-300 mt-0.5">
            {simulationResult.co2EmissionsTons} t
          </span>
        </div>

        {/* Clickable 230kV Feeder Substation Telemetry Indicator */}
        {onOpenFeederDashboard && (
          <button
            onClick={onOpenFeederDashboard}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/50 text-amber-300 transition-all text-xs font-mono group shadow-lg shadow-amber-500/10 cursor-pointer active:scale-95"
            title="Open Regional 230kV Feeder Substation Telemetry Dashboard"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse group-hover:scale-125 transition-transform" />
            <div className="flex flex-col text-left">
              <span className="font-sans text-[9px] text-amber-400/80 uppercase font-bold tracking-wider">
                230kV Feeder Yard
              </span>
              <span className="font-bold text-amber-300">
                {(simulationResult.incomingBulkGridKW / 1000).toFixed(2)} MW ↗
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Navigation View Segmented Controls */}
      <nav className="flex items-center gap-1 bg-slate-900/70 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
        <button
          onClick={() => onSelectView('city')}
          className={`px-3 py-1.5 font-medium rounded-lg transition-all whitespace-nowrap ${
            activeView === 'city'
              ? 'bg-slate-800 text-cyan-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          3D City
        </button>

        <button
          onClick={() => onSelectView('buildings')}
          className={`px-3 py-1.5 font-medium rounded-lg transition-all whitespace-nowrap ${
            activeView === 'buildings'
              ? 'bg-slate-800 text-cyan-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Buildings
        </button>

        <button
          onClick={() => onSelectView('grid')}
          className={`px-3 py-1.5 font-medium rounded-lg transition-all whitespace-nowrap ${
            activeView === 'grid'
              ? 'bg-slate-800 text-cyan-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Grid
        </button>

        <button
          onClick={() => onSelectView('solar')}
          className={`px-3 py-1.5 font-medium rounded-lg transition-all whitespace-nowrap ${
            activeView === 'solar'
              ? 'bg-slate-800 text-amber-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Solar & BESS
        </button>

        <button
          onClick={() => onSelectView('scenarios')}
          className={`px-3 py-1.5 font-medium rounded-lg transition-all whitespace-nowrap ${
            activeView === 'scenarios'
              ? 'bg-slate-800 text-cyan-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Scenarios
        </button>

        <button
          onClick={() => onSelectView('tariff')}
          className={`px-3 py-1.5 font-medium rounded-lg transition-all whitespace-nowrap ${
            activeView === 'tariff'
              ? 'bg-slate-800 text-cyan-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Configure Electricity Tariff"
        >
          Tariff
        </button>
      </nav>

      {/* Zone 3: Primary Action (Prominent ⚡ OPTIMIZE CITY Button) */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenOptimizeModal}
          className="relative group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wide rounded-xl shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95 whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4 fill-slate-950" />
          <span>⚡ OPTIMIZE CITY</span>
        </button>
      </div>
    </header>
  );
};
