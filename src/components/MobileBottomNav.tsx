import React, { useState } from 'react';
import {
  Compass,
  Building2,
  Zap,
  Sun,
  Menu,
  X,
  Layers,
  Eye,
  Sliders,
  Sparkles,
  DollarSign,
  Cpu,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeView: 'city' | 'buildings' | 'grid' | 'solar' | 'scenarios' | 'tariff';
  onSelectView: (view: 'city' | 'buildings' | 'grid' | 'solar' | 'scenarios' | 'tariff') => void;
  onOpenFeederDashboard: () => void;
  onOpenOptimizeModal: () => void;
  isUndergroundMode?: boolean;
  onToggleUndergroundMode?: () => void;
  showLabels?: boolean;
  onToggleLabels?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onSelectView,
  onOpenFeederDashboard,
  onOpenOptimizeModal,
  isUndergroundMode = false,
  onToggleUndergroundMode,
  showLabels = true,
  onToggleLabels,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <>
      {/* Mobile More / Tools Drawer Sheet */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="w-full bg-slate-950 border-t border-slate-800 rounded-t-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab handle */}
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto -mt-1 mb-2" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100 tracking-wide">
                  District Tools & Views
                </h3>
                <p className="text-xs text-slate-400">
                  Advanced simulation, tariff & 3D display options
                </p>
              </div>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800"
                aria-label="Close tools menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid of Tools */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Grid Telemetry */}
              <button
                onClick={() => {
                  onSelectView('grid');
                  setShowMoreMenu(false);
                }}
                className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all min-h-[52px] ${
                  activeView === 'grid'
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Grid Telemetry</div>
                  <div className="text-[10px] text-slate-400">Substation & Nodes</div>
                </div>
              </button>

              {/* Scenario Lab */}
              <button
                onClick={() => {
                  onSelectView('scenarios');
                  setShowMoreMenu(false);
                }}
                className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all min-h-[52px] ${
                  activeView === 'scenarios'
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Scenario Lab</div>
                  <div className="text-[10px] text-slate-400">Stress Test City</div>
                </div>
              </button>

              {/* Tariff Parameters */}
              <button
                onClick={() => {
                  onSelectView('tariff');
                  setShowMoreMenu(false);
                }}
                className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all min-h-[52px] ${
                  activeView === 'tariff'
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Tariff Settings</div>
                  <div className="text-[10px] text-slate-400">ToD Rates & Slabs</div>
                </div>
              </button>

              {/* City AI Optimizer */}
              <button
                onClick={() => {
                  onOpenOptimizeModal();
                  setShowMoreMenu(false);
                }}
                className="p-3 rounded-xl border bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border-cyan-500/50 flex items-center gap-3 text-left transition-all min-h-[52px]"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-cyan-300">AI Optimize</div>
                  <div className="text-[10px] text-cyan-400/80">Peak Shaving</div>
                </div>
              </button>
            </div>

            {/* 3D Viewport Controls Section */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
              {onToggleUndergroundMode && (
                <button
                  onClick={() => {
                    onToggleUndergroundMode();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium min-h-[44px] transition-all ${
                    isUndergroundMode
                      ? 'bg-amber-950/40 text-amber-300 border-amber-500/70 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>{isUndergroundMode ? 'Surface View' : 'Underground X-Ray'}</span>
                </button>
              )}

              {onToggleLabels && (
                <button
                  onClick={() => {
                    onToggleLabels();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium min-h-[44px] transition-all ${
                    showLabels
                      ? 'bg-cyan-950/40 text-cyan-300 border-cyan-600/70'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>{showLabels ? 'Hide Labels' : 'Show Labels'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pinned Bottom Mobile Tab Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-2xl md:hidden px-2 pt-1 pb-safe flex items-center justify-around"
      >
        {/* 1. 3D City View */}
        <button
          onClick={() => {
            onSelectView('city');
            setShowMoreMenu(false);
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all min-h-[48px] min-w-[56px] ${
            activeView === 'city'
              ? 'text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">3D City</span>
        </button>

        {/* 2. Buildings List */}
        <button
          onClick={() => {
            onSelectView('buildings');
            setShowMoreMenu(false);
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all min-h-[48px] min-w-[56px] ${
            activeView === 'buildings'
              ? 'text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">Buildings</span>
        </button>

        {/* 3. Feeder Substation Quick Launcher (Highlight Center Action) */}
        <button
          onClick={() => {
            onOpenFeederDashboard();
            setShowMoreMenu(false);
          }}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-amber-300 hover:text-amber-200 transition-all min-h-[48px] min-w-[56px] group"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shadow-md shadow-amber-500/10 group-active:scale-95 transition-transform">
            <Zap className="w-4 h-4 fill-amber-400" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-semibold text-amber-300">
            Substation
          </span>
        </button>

        {/* 4. Solar & Storage (BESS) */}
        <button
          onClick={() => {
            onSelectView('solar');
            setShowMoreMenu(false);
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all min-h-[48px] min-w-[56px] ${
            activeView === 'solar'
              ? 'text-amber-300 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sun className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">Solar</span>
        </button>

        {/* 5. More Tools Drawer Toggle */}
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all min-h-[48px] min-w-[56px] ${
            showMoreMenu || ['grid', 'scenarios', 'tariff'].includes(activeView)
              ? 'text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-expanded={showMoreMenu}
          aria-label="Open more tools"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">More</span>
        </button>
      </nav>
    </>
  );
};
