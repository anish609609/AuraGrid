import React from 'react';
import { X, Sparkles, CheckCircle2, TrendingDown, ShieldCheck, Zap } from 'lucide-react';
import { formatINR } from '../engine/costEngine';

interface CityOptimizeModalProps {
  onApply: () => void;
  onClose: () => void;
}

export const CityOptimizeModal: React.FC<CityOptimizeModalProps> = ({ onApply, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-cyan-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Automated City-Wide Grid Optimization
              </h2>
              <div className="text-xs text-slate-400">
                Rule-based algorithmic peak shaving & demand coordination
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
          {/* Headline Results Banner */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-center font-mono">
            <div>
              <div className="text-[10px] uppercase font-sans text-slate-400 tracking-wider">
                Peak Demand
              </div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">↓ 17%</div>
              <div className="text-[10px] text-slate-500 font-sans mt-0.5">-320 kW shaved</div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-sans text-slate-400 tracking-wider">
                Daily Energy
              </div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">↓ 11%</div>
              <div className="text-[10px] text-slate-500 font-sans mt-0.5">-3.6 MWh/day</div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-sans text-slate-400 tracking-wider">
                Estimated Cost
              </div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">↓ 15%</div>
              <div className="text-[10px] text-slate-500 font-sans mt-0.5">~₹40,000 saved/d</div>
            </div>
          </div>

          {/* Targeted Algorithmic Interventions */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Interventions Applied Across Districts:
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">Residential EV Fleet Shifting:</strong>
                  <span className="text-slate-400 block mt-0.5">
                    Moved 100 apartment EV charger bays to off-peak overnight hours (23:00 – 05:00),
                    eliminating evening peak substation stress.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">Commercial IT HVAC Modulation:</strong>
                  <span className="text-slate-400 block mt-0.5">
                    Adjusted chiller setpoint from 24.0°C to 25.0°C (strictly within comfort
                    guidelines), cutting HVAC power by 8% without violating tenant SLAs.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">University Daylight Harvesting:</strong>
                  <span className="text-slate-400 block mt-0.5">
                    Dimmed academic lighting to 75% utilizing ambient solar skylights and placed
                    idle laboratories in low-draw standby.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">Hospital Critical Protection:</strong>
                  <span className="text-slate-400 block mt-0.5">
                    Guaranteed 100% uninterrupted power to ICU, surgery, and cryogenics; only tuned
                    administrative office zones.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">Retail Defrost & Atrium Cooling:</strong>
                  <span className="text-slate-400 block mt-0.5">
                    Pre-cooled mall atrium during early morning and staggered commercial supermarket
                    compressor cycles.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Long-Term Savings Projections */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2 font-mono text-xs">
            <div className="font-semibold text-slate-200 font-sans">
              Financial Savings Projection
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Daily Savings:</span>
              <span className="font-bold text-emerald-400">~₹40,000 / day</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Monthly Projection (30d):</span>
              <span className="font-bold text-emerald-400">~₹12.00 Lakh / month</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Annual Projection (365d):</span>
              <span className="font-bold text-emerald-400">~₹1.46 Crore / year</span>
            </div>
            <div className="text-[10px] text-slate-500 font-sans pt-1 border-t border-slate-800">
              * Simulated estimations based on prototype energy tariff and demand charges.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onApply();
              onClose();
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wide rounded-xl shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Apply Optimization to City</span>
          </button>
        </div>
      </div>
    </div>
  );
};
