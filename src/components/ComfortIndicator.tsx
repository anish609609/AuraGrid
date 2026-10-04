import React from 'react';
import { AlertTriangle, Smile, Meh, Frown } from 'lucide-react';

interface ComfortIndicatorProps {
  score: number; // 0 to 100
  indoorTemp: number; // in °C
  minTemp?: number;
  maxTemp?: number;
  warning?: string;
  energyChangePct: number; // e.g. -12
  costChangePct: number; // e.g. -13
}

export const ComfortIndicator: React.FC<ComfortIndicatorProps> = ({
  score,
  indoorTemp,
  minTemp = 23.5,
  maxTemp = 25.0,
  warning,
  energyChangePct,
  costChangePct,
}) => {
  const getIcon = () => {
    if (score >= 90) return <Smile className="w-4 h-4 text-emerald-400" />;
    if (score >= 75) return <Meh className="w-4 h-4 text-amber-400" />;
    return <Frown className="w-4 h-4 text-rose-400" />;
  };

  const getScoreColor = () => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 75) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-xs font-semibold text-slate-200">Occupant Thermal Comfort</span>
        </div>
        <div className={`font-mono text-sm font-bold ${getScoreColor()}`}>{score}%</div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            score >= 90 ? 'bg-emerald-500' : score >= 75 ? 'bg-amber-500' : 'bg-rose-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Temp metrics */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
        <span>Indoor: <strong className="text-slate-200 font-semibold">{indoorTemp}°C</strong></span>
        <span>Recommended: {minTemp}°C – {maxTemp}°C</span>
      </div>

      {/* Comfort Warning Banner if applicable */}
      {warning && (
        <div className="flex items-start gap-2 p-2.5 bg-amber-950/30 border border-amber-600/40 rounded-lg text-amber-300 text-[11px]">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <div className="leading-tight">
            <span className="font-semibold block mb-0.5">Comfort Advisory</span>
            {warning}
          </div>
        </div>
      )}

      {/* Trade-off pill summary */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
        <span className="text-slate-400">Optimization Trade-Off:</span>
        <div className="flex items-center gap-2">
          <span className={energyChangePct <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            Energy {energyChangePct > 0 ? `+${energyChangePct}%` : `${energyChangePct}%`}
          </span>
          <span className="text-slate-600">·</span>
          <span className={costChangePct <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            Cost {costChangePct > 0 ? `+${costChangePct}%` : `${costChangePct}%`}
          </span>
        </div>
      </div>
    </div>
  );
};
