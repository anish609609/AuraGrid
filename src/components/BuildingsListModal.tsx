import React from 'react';
import { X, Building2, Zap, ArrowRight, DollarSign, Activity, Users } from 'lucide-react';
import { BuildingData, BuildingId, CitySimulationResult } from '../types/city';
import { formatINR } from '../engine/costEngine';

interface BuildingsListModalProps {
  buildings: BuildingData[];
  simulationResult: CitySimulationResult;
  onSelectBuilding: (id: BuildingId) => void;
  onClose: () => void;
}

export const BuildingsListModal: React.FC<BuildingsListModalProps> = ({
  buildings,
  simulationResult,
  onSelectBuilding,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Smart City Facility Portfolio (5 Buildings)
              </h2>
              <div className="text-xs text-slate-400">
                District facility profiles, live demands, and control parameters
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

        {/* Buildings Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[70vh]">
          {buildings.map((b) => {
            const sim = simulationResult.buildingResults[b.id];

            return (
              <div
                key={b.id}
                onClick={() => {
                  onSelectBuilding(b.id);
                  onClose();
                }}
                className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/60 rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {b.category}
                    </span>
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: b.accentColor }}
                    />
                  </div>

                  <h3 className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                    {b.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {b.tagline}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 font-mono text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">Current Load</span>
                      <span className="font-bold text-cyan-400">{sim?.currentPowerKW || 0} kW</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">Peak Demand</span>
                      <span className="font-bold text-slate-200">{sim?.peakDemandKW || 0} kW</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">Daily Est. Cost</span>
                      <span className="font-bold text-emerald-400">
                        {formatINR(sim?.dailyCostINR || 0)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">Grid Load</span>
                      <span
                        className={`font-bold ${
                          (sim?.gridUtilizationPct || 0) > 80 ? 'text-amber-400' : 'text-slate-300'
                        }`}
                      >
                        {sim?.gridUtilizationPct || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Inspect & Control</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
