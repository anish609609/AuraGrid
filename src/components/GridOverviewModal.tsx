import React from 'react';
import {
  X,
  Cpu,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowDownRight,
  ArrowDownLeft,
  Sun,
  ShieldCheck,
  Gauge,
} from 'lucide-react';
import { GridNodeState, GridNodeId, BuildingData, BuildingId, CitySimulationResult } from '../types/city';
import { EducationalTooltip } from './EducationalTooltip';

interface GridOverviewModalProps {
  gridNodeStates: Record<GridNodeId, GridNodeState>;
  buildings: BuildingData[];
  simulationResult?: CitySimulationResult;
  onSelectBuilding: (id: BuildingId) => void;
  onClose: () => void;
}

export const GridOverviewModal: React.FC<GridOverviewModalProps> = ({
  gridNodeStates,
  buildings,
  simulationResult,
  onSelectBuilding,
  onClose,
}) => {
  const feeder = gridNodeStates['external-feeder'] || {
    nodeId: 'external-feeder',
    currentLoadKW: 1840,
    capacityKW: 5000,
    utilizationPct: 37,
    status: 'normal',
  };
  const nodeA = gridNodeStates['node-a'];
  const nodeB = gridNodeStates['node-b'];

  const totalCityPowerKW = simulationResult ? simulationResult.totalCurrentPowerKW : feeder.currentLoadKW;
  const incomingGridKW = simulationResult ? simulationResult.incomingBulkGridKW : feeder.currentLoadKW;
  const solarAbsorptionKW = simulationResult ? simulationResult.solarAbsorptionKW : 0;
  const voltageStability = simulationResult ? simulationResult.voltageStabilityIndex : 0.998;
  const phaseBalance = simulationResult?.phaseBalance || { phaseA: 99.8, phaseB: 100.1, phaseC: 99.9 };

  const getStatusBadge = (status: 'normal' | 'moderate' | 'stressed') => {
    switch (status) {
      case 'stressed':
        return (
          <span className="flex items-center gap-1 text-rose-400 font-bold">
            <AlertTriangle className="w-3.5 h-3.5" /> STRESSED HIGH LOAD
          </span>
        );
      case 'moderate':
        return (
          <span className="flex items-center gap-1 text-amber-400 font-bold">
            <Activity className="w-3.5 h-3.5" /> MODERATE LOAD
          </span>
        );
      case 'normal':
        return (
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> OPTIMAL NORMAL
          </span>
        );
    }
  };

  const getNodeColor = (utilPct: number) => {
    if (utilPct >= 90) return 'bg-rose-500';
    if (utilPct >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Electrical Grid & Substation Telemetry
              </h2>
              <div className="text-xs text-slate-400">
                External 230kV bulk transmission feed, underground trunk conduits & distribution nodes
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* External Regional 230kV Grid Supply Substation Card */}
          <div className="p-4 bg-gradient-to-r from-amber-950/30 to-slate-900/80 border border-amber-500/40 rounded-xl space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <div>
                  <div className="font-bold text-sm text-amber-300 font-sans">
                    Regional 230kV Grid Supply Substation
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans">
                    External Bulk Transmission Yard (Regional Step-down 230kV → 33kV)
                  </div>
                </div>
              </div>
              <div className="text-xs font-sans text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30">
                BULK GRID INFLOW & SOLAR BALANCE
              </div>
            </div>

            {/* 1. Bulk Power Generated & Supplied to City */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-sans block text-[10px]">Total City Power Demand</span>
                <span className="text-amber-300 font-bold text-base">
                  {(totalCityPowerKW / 1000).toFixed(2)} MW
                </span>
                <span className="text-[10px] text-slate-500 block">({totalCityPowerKW.toLocaleString()} kW)</span>
              </div>

              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-sans block text-[10px]">Incoming Grid Supply</span>
                <span className="text-cyan-300 font-bold text-base">
                  {(incomingGridKW / 1000).toFixed(2)} MW
                </span>
                <span className="text-[10px] text-slate-500 block">({incomingGridKW.toLocaleString()} kW)</span>
              </div>

              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-sans block text-[10px]">City Solar Feed Absorption</span>
                <span className="text-emerald-300 font-bold text-base">
                  {(solarAbsorptionKW / 1000).toFixed(2)} MW
                </span>
                <span className="text-[10px] text-slate-500 block">({solarAbsorptionKW.toLocaleString()} kW clean)</span>
              </div>

              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-sans block text-[10px]">Transformer Capacity</span>
                <span className="text-slate-200 font-bold text-base">
                  {feeder.utilizationPct}%
                </span>
                <span className="text-[10px] text-slate-500 block">of {(feeder.capacityKW / 1000).toFixed(1)} MW rating</span>
              </div>
            </div>

            {/* 2. Grid Quality & Phase Balance Telemetry */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-800/80 text-xs">
              <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 font-sans text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" /> 3-Phase Transmission Balance
                  </span>
                  <span className="text-emerald-400 font-mono font-semibold">99.9% Symmetric</span>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px] pt-1">
                  <div className="bg-slate-900/80 p-1.5 rounded text-center">
                    <span className="text-slate-500 block text-[9px]">PHASE A</span>
                    <span className="text-cyan-300 font-bold">{phaseBalance.phaseA}%</span>
                  </div>
                  <div className="bg-slate-900/80 p-1.5 rounded text-center">
                    <span className="text-slate-500 block text-[9px]">PHASE B</span>
                    <span className="text-cyan-300 font-bold">{phaseBalance.phaseB}%</span>
                  </div>
                  <div className="bg-slate-900/80 p-1.5 rounded text-center">
                    <span className="text-slate-500 block text-[9px]">PHASE C</span>
                    <span className="text-cyan-300 font-bold">{phaseBalance.phaseC}%</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 font-sans text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <Gauge className="w-3.5 h-3.5 text-emerald-400" /> Voltage & Frequency Stability
                  </span>
                  <span className="text-emerald-400 font-mono font-semibold">Nominal Stable</span>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                  <div className="bg-slate-900/80 p-1.5 rounded text-center">
                    <span className="text-slate-500 block text-[9px]">VOLTAGE INDEX</span>
                    <span className="text-emerald-300 font-bold">{voltageStability} p.u.</span>
                  </div>
                  <div className="bg-slate-900/80 p-1.5 rounded text-center">
                    <span className="text-slate-500 block text-[9px]">POWER FACTOR</span>
                    <span className="text-slate-200 font-bold">{simulationResult?.powerFactor || 0.98} lag</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] font-sans text-slate-300">
              <span className="flex items-center gap-1 text-cyan-300">
                <ArrowDownLeft className="w-3.5 h-3.5" /> High-Voltage Trunk A → Substation Alpha
              </span>
              <span className="flex items-center gap-1 text-emerald-300">
                <ArrowDownRight className="w-3.5 h-3.5" /> High-Voltage Trunk B → Substation Beta
              </span>
            </div>
          </div>

          {/* Substation Nodes Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Substation Alpha */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <div className="font-bold text-sm text-cyan-300 font-sans">
                    Substation Alpha
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans">
                    North Commercial & Tech Feed
                  </div>
                </div>
                <div className="text-xs">{getStatusBadge(nodeA.status)}</div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Active Load:</span>
                  <span className="text-slate-100 font-bold">
                    {(nodeA.currentLoadKW / 1000).toFixed(2)} MW
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Rated Capacity:</span>
                  <span className="text-slate-400">
                    {(nodeA.capacityKW / 1000).toFixed(2)} MW
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Utilization:</span>
                  <span className="font-bold text-cyan-400">{nodeA.utilizationPct}%</span>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full ${getNodeColor(nodeA.utilizationPct)} rounded-full transition-all`}
                    style={{ width: `${Math.min(100, nodeA.utilizationPct)}%` }}
                  />
                </div>
              </div>

              {/* Connected buildings */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] uppercase font-sans text-slate-400 tracking-wider block mb-1">
                  Underground Feeds:
                </span>
                <div className="flex flex-wrap gap-1.5 font-sans">
                  {['it-tower', 'education', 'hospital'].map((bId) => {
                    const b = buildings.find((x) => x.id === bId);
                    if (!b) return null;
                    return (
                      <button
                        key={b.id}
                        onClick={() => {
                          onSelectBuilding(b.id);
                          onClose();
                        }}
                        className="px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: b.accentColor }}
                        />
                        <span>{b.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Substation Beta */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <div className="font-bold text-sm text-emerald-300 font-sans">
                    Substation Beta
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans">
                    South Residential & Commercial
                  </div>
                </div>
                <div className="text-xs">{getStatusBadge(nodeB.status)}</div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Active Load:</span>
                  <span className="text-slate-100 font-bold">
                    {(nodeB.currentLoadKW / 1000).toFixed(2)} MW
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Rated Capacity:</span>
                  <span className="text-slate-400">
                    {(nodeB.capacityKW / 1000).toFixed(2)} MW
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Utilization:</span>
                  <span className="font-bold text-emerald-400">{nodeB.utilizationPct}%</span>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full ${getNodeColor(nodeB.utilizationPct)} rounded-full transition-all`}
                    style={{ width: `${Math.min(100, nodeB.utilizationPct)}%` }}
                  />
                </div>
              </div>

              {/* Connected buildings */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] uppercase font-sans text-slate-400 tracking-wider block mb-1">
                  Underground Feeds:
                </span>
                <div className="flex flex-wrap gap-1.5 font-sans">
                  {['hospital', 'residential', 'retail'].map((bId) => {
                    const b = buildings.find((x) => x.id === bId);
                    if (!b) return null;
                    return (
                      <button
                        key={b.id}
                        onClick={() => {
                          onSelectBuilding(b.id);
                          onClose();
                        }}
                        className="px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: b.accentColor }}
                        />
                        <span>{b.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Subterranean Architecture & Infrastructure Notes */}
          <div className="p-3.5 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300">
            <span className="font-semibold text-slate-200 block">
              Subterranean High-Voltage Conduit Architecture
            </span>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Bulk power is drawn from the regional 230kV transmission grid into the External Feeder
              Substation, stepped down to 33kV, and routed underground through reinforced concrete
              duct banks directly to Substation Alpha and Beta. All district distribution lines
              run at subsurface levels (-2.0m depth), eliminating above-ground cable clutter and
              protecting the smart city grid against extreme tropical weather.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
