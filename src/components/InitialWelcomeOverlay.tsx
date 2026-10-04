import React from 'react';
import { ArrowRight, Compass, Zap } from 'lucide-react';
import { CitySimulationResult } from '../types/city';

interface InitialWelcomeOverlayProps {
  simulationResult: CitySimulationResult;
  onExplore: () => void;
}

export const InitialWelcomeOverlay: React.FC<InitialWelcomeOverlayProps> = ({
  simulationResult,
  onExplore,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center p-4">
      <div className="max-w-lg w-full p-8 bg-slate-950/85 border border-slate-700/60 rounded-3xl shadow-2xl backdrop-blur-2xl text-center space-y-6 pointer-events-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10">
          <Zap className="w-8 h-8 fill-current" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-sans">
            SMART CITY DIGITAL TWIN
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto font-sans">
            Interactive 3D energy, electrical grid, and electricity cost analytics prototype for a
            five-building urban district.
          </p>
        </div>

        {/* Highlighted stats line */}
        <div className="py-2.5 px-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-center gap-3 font-mono text-xs text-slate-300">
          <span className="font-semibold text-slate-100">5 BUILDINGS</span>
          <span className="text-slate-600">·</span>
          <span className="font-semibold text-cyan-400">3.0 MW CAPACITY</span>
          <span className="text-slate-600">·</span>
          <span className="font-semibold text-emerald-400">
            {simulationResult.cityGridUtilizationPct}% GRID UTILIZATION
          </span>
        </div>

        <div className="pt-2">
          <button
            onClick={onExplore}
            className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wide rounded-xl shadow-xl shadow-cyan-500/25 transition-all transform hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2"
          >
            <span>EXPLORE CITY</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500 font-sans">
          "Don't just monitor the city. Experiment with it."
        </p>
      </div>
    </div>
  );
};
