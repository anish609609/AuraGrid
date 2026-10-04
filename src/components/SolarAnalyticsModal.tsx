import React from 'react';
import {
  X,
  Sun,
  BatteryCharging,
  Zap,
  Leaf,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { CitySimulationResult, BuildingData, BuildingId, EnvironmentState } from '../types/city';
import { formatINR } from '../engine/costEngine';

interface SolarAnalyticsModalProps {
  simulationResult: CitySimulationResult;
  buildings: BuildingData[];
  environment: EnvironmentState;
  onSelectBuilding: (id: BuildingId) => void;
  onClose: () => void;
}

export const SolarAnalyticsModal: React.FC<SolarAnalyticsModalProps> = ({
  simulationResult,
  buildings,
  environment,
  onSelectBuilding,
  onClose,
}) => {
  const solarGenKW = simulationResult.totalSolarGenerationKW;
  const totalLoadKW = simulationResult.totalCurrentPowerKW;
  const solarPct = totalLoadKW > 0 ? Math.min(100, Math.round((solarGenKW / totalLoadKW) * 100)) : 0;
  const gridInflowKW = simulationResult.incomingBulkGridKW;
  const bessSoc = simulationResult.cityBessTotalSocPct;
  const avoidedCo2Kg = Math.round(simulationResult.totalAvoidedCo2Tons * 1000);

  // Hourly curve generation for visual bar chart
  const solarHourlyCurve = [
    { hour: '06:00', genKW: 0, loadKW: 1250 },
    { hour: '08:00', genKW: 45, loadKW: 1650 },
    { hour: '10:00', genKW: 145, loadKW: 2100 },
    { hour: '12:00', genKW: 245, loadKW: 2380 },
    { hour: '14:00', genKW: 220, loadKW: 2420 },
    { hour: '16:00', genKW: 120, loadKW: 2150 },
    { hour: '18:00', genKW: 15, loadKW: 1980 },
    { hour: '20:00', genKW: 0, loadKW: 1720 },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="max-w-4xl w-full bg-slate-950 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Solar & Battery Storage Analytics (BESS)
                </h2>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                  {environment.isDaytime ? 'ACTIVE PV' : 'NIGHT STANDBY'}
                </span>
              </div>
              <div className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[260px] sm:max-w-none">
                District rooftop PV arrays, localized battery storage and microgrid self-consumption
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors active:scale-95"
            aria-label="Close solar analytics"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1 font-sans">
          {/* Top 4 Real-time Telemetry KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            {/* 1. Real-time PV Generation */}
            <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Real-time PV Output</span>
                <Sun className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-300">
                {solarGenKW} <span className="text-xs font-normal text-slate-400">kW</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Daily: <span className="font-mono text-slate-200 font-semibold">{simulationResult.todaySolarEnergyMWh} MWh</span>
              </div>
            </div>

            {/* 2. Self-Consumption & Grid Offset */}
            <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Solar Self-Consumption</span>
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-300">
                {solarPct}% <span className="text-xs font-normal text-slate-400">of load</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Grid Inflow: <span className="font-mono text-slate-200">{(gridInflowKW / 1000).toFixed(2)} MW</span>
              </div>
            </div>

            {/* 3. Avoided Carbon Footprint */}
            <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Avoided CO₂ Today</span>
                <Leaf className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-300">
                {avoidedCo2Kg.toLocaleString()} <span className="text-xs font-normal text-slate-400">kg</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Offset: <span className="font-mono text-slate-200">{simulationResult.totalAvoidedCo2Tons} Tons CO₂</span>
              </div>
            </div>

            {/* 4. Net Energy Bill Savings */}
            <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Solar Bill Savings</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-300">
                {formatINR(simulationResult.totalSolarSavingsINR, { compact: true })}
              </div>
              <div className="text-[11px] text-slate-400">
                Monthly: <span className="font-mono text-slate-200">{formatINR(simulationResult.totalSolarSavingsINR * 30, { compact: true })}</span>
              </div>
            </div>
          </div>

          {/* District BESS Battery Storage Status Card */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BatteryCharging className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-slate-100">
                  District Battery Energy Storage Systems (BESS)
                </span>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-semibold">
                Combined Storage: 580 kWh Total Capacity
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Combined State of Charge (SoC):</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all"
                      style={{ width: `${bessSoc}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold text-slate-100">{bessSoc}%</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Operational Mode:</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {environment.solarRadiationWm2 > 400
                    ? 'Solar Peak Charging (BESS Inflow)'
                    : environment.timeHours >= 18 && environment.timeHours <= 22
                    ? 'Peak Shaving Discharge'
                    : 'Grid Standby & Resilience Reserve'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Solar Irradiance:</span>
                <span className="font-mono text-amber-300 font-semibold">
                  {environment.solarRadiationWm2} W/m² (Chennai Ambient)
                </span>
              </div>
            </div>
          </div>

          {/* Facility-by-Facility Solar & Storage Deployment Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Facility Rooftop PV & BESS Asset Inventory
              </h3>
              <span className="text-[11px] text-slate-400">
                Click any facility to inspect telemetry & controls
              </span>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-medium">
                  <tr>
                    <th className="py-2.5 px-4">Facility</th>
                    <th className="py-2.5 px-3">Rooftop PV System</th>
                    <th className="py-2.5 px-3 font-mono">Current Output</th>
                    <th className="py-2.5 px-3">Battery (BESS)</th>
                    <th className="py-2.5 px-3 font-mono">BESS SoC</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {buildings.map((b) => {
                    const sim = simulationResult.buildingResults[b.id];
                    const solar = sim?.solarStorage;
                    const hasPV = b.solarStorage?.hasSolar;

                    return (
                      <tr
                        key={b.id}
                        onClick={() => {
                          onSelectBuilding(b.id);
                          onClose();
                        }}
                        className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-sans font-semibold text-slate-200 flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: b.accentColor }}
                          />
                          <span>{b.name}</span>
                        </td>
                        <td className="py-3 px-3">
                          {hasPV ? (
                            <span className="text-amber-300 font-semibold">
                              {b.solarStorage?.pvCapacityKWp} kWp Array
                            </span>
                          ) : (
                            <span className="text-slate-500 font-sans text-[11px]">
                              {b.id === 'hospital'
                                ? 'Heliport Priority (No PV)'
                                : 'Amenity Sky Deck (No PV)'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-amber-400 font-bold">
                          {solar?.currentPvGenerationKW || 0} kW
                        </td>
                        <td className="py-3 px-3 font-sans">
                          {b.solarStorage?.hasBess ? (
                            <span className="text-cyan-300">
                              {b.solarStorage.bessCapacityKWh} kWh ({b.solarStorage.maxChargeRateKW} kW rate)
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">No BESS</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {b.solarStorage?.hasBess ? (
                            <span className="text-slate-200">
                              {solar?.bessSocPct || 50}%
                            </span>
                          ) : (
                            <span className="text-slate-500">---</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-sans">
                          {b.id === 'education' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Max Coverage (High Density)
                            </span>
                          ) : b.id === 'hospital' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              ICU Emergency BESS
                            </span>
                          ) : hasPV ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              Commercial PV Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                              Zero Obstruction
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Diurnal Solar Profile vs District Load (24-Hour Comparison) */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">
                Diurnal Solar Output vs District Demand Profile
              </span>
              <div className="flex items-center gap-4 text-[11px] font-sans">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Solar PV Output (kW)
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/40 inline-block" /> Total Load Demand (kW)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-8 gap-2 pt-3 h-28 items-end border-b border-slate-800 pb-2">
              {solarHourlyCurve.map((pt, i) => {
                const solarH = (pt.genKW / 250) * 100;
                const loadH = (pt.loadKW / 2500) * 100;

                return (
                  <div key={i} className="flex flex-col items-center gap-1 h-full justify-end">
                    <div className="w-full flex items-end justify-center gap-1 h-20">
                      {/* Solar bar */}
                      <div
                        className="w-3 bg-amber-400 rounded-t transition-all hover:bg-amber-300"
                        style={{ height: `${Math.max(4, solarH)}%` }}
                        title={`${pt.hour}: ${pt.genKW} kW Solar`}
                      />
                      {/* Load bar */}
                      <div
                        className="w-3 bg-cyan-600/40 rounded-t transition-all hover:bg-cyan-500"
                        style={{ height: `${Math.max(4, loadH)}%` }}
                        title={`${pt.hour}: ${pt.loadKW} kW Total Load`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{pt.hour}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-[11px] text-slate-400 text-center pt-1">
              Apex University provides peak 160 kW generation during mid-day solar hours, offsetting up to 35% of educational and district tech campus loads.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
