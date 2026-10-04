import React, { useState } from 'react';
import { X, BookmarkPlus, Play, CheckCircle2, TrendingDown, ArrowRight, Layers } from 'lucide-react';
import { BuildingData, BuildingControls, BuildingId, SavedScenario, TariffConfig } from '../types/city';
import { formatINR } from '../engine/costEngine';

interface ScenarioManagerProps {
  buildings: BuildingData[];
  tariff: TariffConfig;
  onApplyScenarioControls: (controlsMap: Record<BuildingId, BuildingControls>) => void;
  onClose: () => void;
}

const PRESET_SCENARIOS: SavedScenario[] = [
  {
    id: 'eco-peak-shave',
    name: 'Smart Peak Shaving & EV Night Shift',
    description: 'Shifts residential EV charging to 23:00 - 05:00, modulates IT HVAC by +1°C, and dims campus lighting.',
    timestamp: 'Engineered Preset',
    estimatedDailySavingsINR: 40000,
    peakReductionKW: 320,
    energySavingsPct: 11.5,
    buildingControls: {
      'it-tower': { occupancy: 85, hvacSetpoint: 25.0, lightingLevel: 80, flexibleLoad: 65, evCharging: true, evOffPeakShift: true },
      education: { occupancy: 75, hvacSetpoint: 25.0, lightingLevel: 75, flexibleLoad: 55, evCharging: false, evOffPeakShift: false },
      hospital: { occupancy: 80, hvacSetpoint: 23.8, lightingLevel: 95, flexibleLoad: 45, evCharging: true, evOffPeakShift: true },
      residential: { occupancy: 70, hvacSetpoint: 24.5, lightingLevel: 75, flexibleLoad: 60, evCharging: true, evOffPeakShift: true },
      retail: { occupancy: 75, hvacSetpoint: 24.5, lightingLevel: 80, flexibleLoad: 50, evCharging: true, evOffPeakShift: true },
    },
  },
  {
    id: 'weekend-eco',
    name: 'Weekend District Low-Power Mode',
    description: 'Reduced office and educational occupancy, deep standby on campus chillers and retail food court lighting.',
    timestamp: 'Engineered Preset',
    estimatedDailySavingsINR: 68500,
    peakReductionKW: 480,
    energySavingsPct: 22.0,
    buildingControls: {
      'it-tower': { occupancy: 20, hvacSetpoint: 26.0, lightingLevel: 40, flexibleLoad: 40, evCharging: false, evOffPeakShift: false },
      education: { occupancy: 10, hvacSetpoint: 26.5, lightingLevel: 30, flexibleLoad: 30, evCharging: false, evOffPeakShift: false },
      hospital: { occupancy: 75, hvacSetpoint: 23.5, lightingLevel: 90, flexibleLoad: 50, evCharging: true, evOffPeakShift: true },
      residential: { occupancy: 90, hvacSetpoint: 24.0, lightingLevel: 85, flexibleLoad: 80, evCharging: true, evOffPeakShift: true },
      retail: { occupancy: 85, hvacSetpoint: 24.0, lightingLevel: 90, flexibleLoad: 70, evCharging: true, evOffPeakShift: false },
    },
  },
  {
    id: 'heatwave-resilience',
    name: 'Severe Heatwave Grid Resilience',
    description: 'Extreme grid defense during 39°C external thermal surge. Curtails all non-critical auxiliary loads to avoid brownout.',
    timestamp: 'Engineered Preset',
    estimatedDailySavingsINR: 28000,
    peakReductionKW: 260,
    energySavingsPct: 8.5,
    buildingControls: {
      'it-tower': { occupancy: 80, hvacSetpoint: 25.0, lightingLevel: 70, flexibleLoad: 50, evCharging: false, evOffPeakShift: true },
      education: { occupancy: 70, hvacSetpoint: 25.5, lightingLevel: 65, flexibleLoad: 40, evCharging: false, evOffPeakShift: false },
      hospital: { occupancy: 85, hvacSetpoint: 23.5, lightingLevel: 95, flexibleLoad: 45, evCharging: false, evOffPeakShift: true },
      residential: { occupancy: 70, hvacSetpoint: 25.0, lightingLevel: 65, flexibleLoad: 50, evCharging: false, evOffPeakShift: true },
      retail: { occupancy: 70, hvacSetpoint: 25.0, lightingLevel: 70, flexibleLoad: 45, evCharging: false, evOffPeakShift: true },
    },
  },
];

export const ScenarioManager: React.FC<ScenarioManagerProps> = ({
  buildings,
  tariff,
  onApplyScenarioControls,
  onClose,
}) => {
  const [scenarios, setScenarios] = useState<SavedScenario[]>(PRESET_SCENARIOS);
  const [selectedScenario, setSelectedScenario] = useState<SavedScenario>(PRESET_SCENARIOS[0]);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [newScenarioDesc, setNewScenarioDesc] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const handleSaveCurrentScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScenarioName.trim()) return;

    const currentMap: Record<BuildingId, BuildingControls> = {} as any;
    buildings.forEach((b) => {
      currentMap[b.id] = { ...b.currentControls };
    });

    const newScen: SavedScenario = {
      id: `custom-${Date.now()}`,
      name: newScenarioName.trim(),
      description: newScenarioDesc.trim() || 'Custom user engineered operational scenario.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      buildingControls: currentMap,
      estimatedDailySavingsINR: 32000,
      peakReductionKW: 240,
      energySavingsPct: 9.8,
    };

    setScenarios([newScen, ...scenarios]);
    setSelectedScenario(newScen);
    setNewScenarioName('');
    setNewScenarioDesc('');
    setShowSaveForm(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Scenario Lab & Energy Comparison
              </h2>
              <div className="text-xs text-slate-400">
                Compare multi-building operating conditions and test savings strategies
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

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto max-h-[70vh]">
          {/* Left Column: Scenarios List */}
          <div className="space-y-3 md:border-r md:border-slate-800 md:pr-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Scenarios
              </span>
              <button
                onClick={() => setShowSaveForm(!showSaveForm)}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                <BookmarkPlus className="w-3.5 h-3.5" /> Save Current
              </button>
            </div>

            {/* Save current form */}
            {showSaveForm && (
              <form onSubmit={handleSaveCurrentScenario} className="p-3 bg-slate-900 rounded-xl border border-slate-700 space-y-2">
                <input
                  type="text"
                  placeholder="Scenario Name (e.g. Eco Night)"
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  placeholder="Short description..."
                  value={newScenarioDesc}
                  onChange={(e) => setNewScenarioDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-400"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSaveForm(false)}
                    className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[11px] rounded"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {scenarios.map((s) => {
                const isSelected = selectedScenario.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedScenario(s)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500/80 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-200">{s.name}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                      {s.description}
                    </div>
                    <div className="flex items-center justify-between font-mono text-[10px] mt-2 pt-1.5 border-t border-slate-800/60">
                      <span className="text-emerald-400 font-bold">
                        ↓ {s.energySavingsPct}% Energy
                      </span>
                      <span className="text-slate-500">{s.timestamp}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 2 Columns: Scenario Detail & Comparison Table */}
          <div className="md:col-span-2 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white">{selectedScenario.name}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {selectedScenario.description}
              </p>
            </div>

            {/* Impact Headline Card */}
            <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl font-mono text-center">
              <div>
                <div className="text-[10px] uppercase font-sans text-slate-400">Peak Shaving</div>
                <div className="text-base font-bold text-cyan-400 mt-0.5">
                  ↓ {selectedScenario.peakReductionKW} kW
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-sans text-slate-400">Energy Savings</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  ↓ {selectedScenario.energySavingsPct}%
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-sans text-slate-400">Daily Savings</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  {formatINR(selectedScenario.estimatedDailySavingsINR)}
                </div>
              </div>
            </div>

            {/* Side-by-Side Comparison Table (Section 20 requirement) */}
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
              <div className="font-semibold text-slate-200 font-sans">
                Baseline vs. Scenario Financial Comparison
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-800 text-[11px] text-slate-400 font-sans">
                  <span>METRIC</span>
                  <div className="flex gap-8">
                    <span className="w-20 text-right">BASELINE</span>
                    <span className="w-20 text-right text-cyan-400">SCENARIO</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-sans">Daily Energy:</span>
                  <div className="flex gap-8 text-slate-200">
                    <span className="w-20 text-right">31.4 MWh</span>
                    <span className="w-20 text-right text-emerald-400">
                      {(31.4 * (1 - selectedScenario.energySavingsPct / 100)).toFixed(1)} MWh
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-sans">Daily Cost:</span>
                  <div className="flex gap-8 text-slate-200">
                    <span className="w-20 text-right">₹2,61,000</span>
                    <span className="w-20 text-right text-emerald-400">
                      {formatINR(261000 - selectedScenario.estimatedDailySavingsINR)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-sans">Monthly Cost (30d):</span>
                  <div className="flex gap-8 text-slate-200">
                    <span className="w-20 text-right">₹78.3 L</span>
                    <span className="w-20 text-right text-emerald-400">
                      {formatINR((261000 - selectedScenario.estimatedDailySavingsINR) * 30, {
                        compact: true,
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-sans">Annual Cost (365d):</span>
                  <div className="flex gap-8 text-slate-200">
                    <span className="w-20 text-right">₹9.52 Cr</span>
                    <span className="w-20 text-right text-emerald-400">
                      {formatINR((261000 - selectedScenario.estimatedDailySavingsINR) * 365, {
                        compact: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  onApplyScenarioControls(selectedScenario.buildingControls);
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wide rounded-xl shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Load Scenario Into Digital Twin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
