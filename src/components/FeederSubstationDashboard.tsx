import React from 'react';
import {
  X,
  Zap,
  Activity,
  ShieldCheck,
  Thermometer,
  Gauge,
  Sun,
  ArrowRight,
  TrendingDown,
  Camera,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { CitySimulationResult, BuildingData, BuildingId } from '../types/city';
import { formatINR } from '../engine/costEngine';

interface FeederSubstationDashboardProps {
  simulationResult: CitySimulationResult;
  buildings: BuildingData[];
  onFocusSubstation?: () => void;
  onToggleUndergroundMode?: () => void;
  onSelectBuilding: (id: BuildingId) => void;
  onClose: () => void;
}

export const FeederSubstationDashboard: React.FC<FeederSubstationDashboardProps> = ({
  simulationResult,
  buildings,
  onFocusSubstation,
  onToggleUndergroundMode,
  onSelectBuilding,
  onClose,
}) => {
  const feeder = simulationResult.gridNodeStates['external-feeder'] || {
    nodeId: 'external-feeder',
    currentLoadKW: 2420,
    capacityKW: 5000,
    utilizationPct: 48,
    status: 'normal',
  };

  const nodeA = simulationResult.gridNodeStates['node-a'] || {
    nodeId: 'node-a',
    currentLoadKW: 1250,
    capacityKW: 1600,
    utilizationPct: 78,
    status: 'moderate',
  };

  const nodeB = simulationResult.gridNodeStates['node-b'] || {
    nodeId: 'node-b',
    currentLoadKW: 1170,
    capacityKW: 1400,
    utilizationPct: 83,
    status: 'moderate',
  };

  const totalDeliveredKW = nodeA.currentLoadKW + nodeB.currentLoadKW;
  const shareA = totalDeliveredKW > 0 ? Math.round((nodeA.currentLoadKW / totalDeliveredKW) * 100) : 50;
  const shareB = 100 - shareA;

  const solarAbsorptionKW = simulationResult.solarAbsorptionKW || 0;
  const solarPctOfCity = simulationResult.totalCurrentPowerKW > 0
    ? Math.round((simulationResult.totalSolarGenerationKW / simulationResult.totalCurrentPowerKW) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-slate-950 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 font-sans">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <Zap className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Regional 230kV Feeder Substation Dashboard
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  BULK TRANSMISSION SUPPLY
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Main High-Voltage Transmission Yard · Perimeter North Interconnection (Step-down 230kV → 33kV)
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
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold">Substation Status:</span>
              <span className="font-mono text-emerald-300 font-bold">ONLINE · NORMAL CONTINUOUS FEED</span>
            </div>
            <div className="flex items-center gap-2">
              {onFocusSubstation && (
                <button
                  onClick={onFocusSubstation}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all text-xs font-medium"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Inspect Yard in 3D</span>
                </button>
              )}
              {onToggleUndergroundMode && (
                <button
                  onClick={onToggleUndergroundMode}
                  className="px-3 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition-all text-xs font-medium"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>View Underground Trunks</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 1: Active Power Inflow KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
            <div className="p-4 bg-slate-900/70 border border-amber-500/30 rounded-xl space-y-1">
              <span className="text-[10px] font-sans text-slate-400 uppercase tracking-wider block">
                Active Bulk Inflow
              </span>
              <div className="text-2xl font-bold text-amber-300">
                {(simulationResult.incomingBulkGridKW / 1000).toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-400">MW</span>
              </div>
              <span className="text-[11px] text-slate-400 font-sans block">
                {simulationResult.incomingBulkGridKW.toLocaleString()} kW bulk draw
              </span>
            </div>

            <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] font-sans text-slate-400 uppercase tracking-wider block">
                Trunk Feed A (North)
              </span>
              <div className="text-2xl font-bold text-cyan-300">
                {(nodeA.currentLoadKW / 1000).toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-400">MW</span>
              </div>
              <span className="text-[11px] text-slate-400 font-sans block">
                {shareA}% share to Grid A
              </span>
            </div>

            <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] font-sans text-slate-400 uppercase tracking-wider block">
                Trunk Feed B (South)
              </span>
              <div className="text-2xl font-bold text-emerald-300">
                {(nodeB.currentLoadKW / 1000).toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-400">MW</span>
              </div>
              <span className="text-[11px] text-slate-400 font-sans block">
                {shareB}% share to Grid B
              </span>
            </div>

            <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] font-sans text-slate-400 uppercase tracking-wider block">
                Transformer Utilization
              </span>
              <div
                className={`text-2xl font-bold ${
                  feeder.utilizationPct > 85
                    ? 'text-rose-400'
                    : feeder.utilizationPct > 70
                    ? 'text-amber-300'
                    : 'text-emerald-300'
                }`}
              >
                {feeder.utilizationPct}%
              </div>
              <span className="text-[11px] text-slate-400 font-sans block">
                5,000 kW (5.0 MW) capacity
              </span>
            </div>
          </div>

          {/* Section 2: Visual Grid Load Split (Grid A vs Grid B) */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-200">
                  Bulk Power Delivery Load Split: Grid A vs. Grid B
                </span>
              </div>
              <span className="font-mono text-slate-400">
                Total City Delivery: {(totalDeliveredKW / 1000).toFixed(2)} MW
              </span>
            </div>

            {/* Split Bar */}
            <div className="space-y-1">
              <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all flex items-center justify-center text-[10px] font-mono font-bold text-slate-950"
                  style={{ width: `${shareA}%` }}
                >
                  {shareA > 15 ? `Grid A ${shareA}%` : ''}
                </div>
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all flex items-center justify-center text-[10px] font-mono font-bold text-slate-950"
                  style={{ width: `${shareB}%` }}
                >
                  {shareB > 15 ? `Grid B ${shareB}%` : ''}
                </div>
              </div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400 px-1">
                <span className="text-cyan-400 font-semibold">
                  Substation Alpha: {nodeA.currentLoadKW.toLocaleString()} kW ({shareA}%)
                </span>
                <span className="text-emerald-400 font-semibold">
                  Substation Beta: {nodeB.currentLoadKW.toLocaleString()} kW ({shareB}%)
                </span>
              </div>
            </div>

            {/* Trunk Cards Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300">Underground Trunk A Feed</span>
                  <span className="font-mono text-[11px] text-slate-300 font-bold">
                    {(nodeA.currentLoadKW / 1000).toFixed(2)} MW ({nodeA.utilizationPct}% Cap)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Feeds underground distribution node for North District:
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['it-tower', 'education', 'hospital'].map((id) => {
                    const b = buildings.find((x) => x.id === id);
                    if (!b) return null;
                    return (
                      <button
                        key={b.id}
                        onClick={() => {
                          onSelectBuilding(b.id);
                          onClose();
                        }}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center gap-1.5 text-[11px] transition-all"
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: b.accentColor }} />
                        <span>{b.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300">Underground Trunk B Feed</span>
                  <span className="font-mono text-[11px] text-slate-300 font-bold">
                    {(nodeB.currentLoadKW / 1000).toFixed(2)} MW ({nodeB.utilizationPct}% Cap)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Feeds underground distribution node for South District:
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['hospital', 'residential', 'retail'].map((id) => {
                    const b = buildings.find((x) => x.id === id);
                    if (!b) return null;
                    return (
                      <button
                        key={b.id}
                        onClick={() => {
                          onSelectBuilding(b.id);
                          onClose();
                        }}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center gap-1.5 text-[11px] transition-all"
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: b.accentColor }} />
                        <span>{b.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Supply Health & Engineering Telemetry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Electrical Telemetry */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-slate-200 font-sans">
                    Grid Stability & Transmission Telemetry
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30">
                  STABLE NOMINAL
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Voltage Stability Index:</span>
                  <span className="text-emerald-300 font-bold">
                    {simulationResult.voltageStabilityIndex} p.u. (Nominal 33.05 kV)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">System Frequency:</span>
                  <span className="text-slate-200 font-bold">50.02 Hz (±0.05 Hz)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Power Factor:</span>
                  <span className="text-slate-200 font-bold">{simulationResult.powerFactor} lag</span>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-sans text-slate-400 uppercase tracking-wider block mb-1">
                    3-Phase Inflow Balance:
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="p-1.5 bg-slate-950/80 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9px]">PHASE A</span>
                      <span className="text-cyan-300 font-bold">{simulationResult.phaseBalance.phaseA}%</span>
                    </div>
                    <div className="p-1.5 bg-slate-950/80 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9px]">PHASE B</span>
                      <span className="text-cyan-300 font-bold">{simulationResult.phaseBalance.phaseB}%</span>
                    </div>
                    <div className="p-1.5 bg-slate-950/80 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9px]">PHASE C</span>
                      <span className="text-cyan-300 font-bold">{simulationResult.phaseBalance.phaseC}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Thermal & Physical Yard Health */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-slate-200 font-sans">
                    Transformer Thermal & Yard Diagnostics
                  </span>
                </div>
                <span className="text-[10px] text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30">
                  ONAF COOLING ACTIVE
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Transformer Winding Temp:</span>
                  <span className="text-slate-200 font-bold">51.8°C (Limit: 85°C)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Transformer Oil Temp:</span>
                  <span className="text-slate-200 font-bold">46.4°C (Limit: 75°C)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">SF6 Gas Insulation:</span>
                  <span className="text-emerald-300 font-bold">0.55 MPa (Normal)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Main Breakers:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 33kV Trunks Engaged
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Surge Arresters:</span>
                  <span className="text-slate-300 font-bold">Metal Oxide (Armed)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Net Export & Rooftop Solar Absorption */}
          <div className="p-4 bg-gradient-to-r from-emerald-950/20 via-slate-900/60 to-slate-950 border border-emerald-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-slate-100">
                  Net Solar Generation Absorption & Grid Offsetting
                </span>
              </div>
              <span className="font-mono text-emerald-400 font-semibold">
                {solarPctOfCity}% of City Load Offset by Solar
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[10px] font-sans text-slate-400 block">Solar Feed-In Absorbed</span>
                <span className="text-lg font-bold text-emerald-300">
                  {(solarAbsorptionKW / 1000).toFixed(2)} MW
                </span>
                <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
                  {solarAbsorptionKW.toLocaleString()} kW clean power
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[10px] font-sans text-slate-400 block">Avoided Bulk Grid Purchase</span>
                <span className="text-lg font-bold text-cyan-300">
                  {formatINR(simulationResult.totalSolarSavingsINR)}/day
                </span>
                <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
                  Direct peak shaving savings
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[10px] font-sans text-slate-400 block">Reverse Power Flow Risk</span>
                <span className="text-lg font-bold text-emerald-300">0.0 kW (Nil)</span>
                <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
                  100% self-consumed within city
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-1 leading-relaxed">
              District rooftop solar arrays (especially Apex University's high-density PV system) reduce
              peak transmission loading on the 230kV Feeder Substation by up to 250 kW, protecting transformer
              oil temperatures and maintaining voltage stability during hot afternoon peak cooling hours.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
