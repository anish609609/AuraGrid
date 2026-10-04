import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, FastForward, Sun, Moon, CloudSun } from 'lucide-react';
import { EnvironmentState } from '../types/city';

interface TimeSliderProps {
  currentHour: number;
  environment: EnvironmentState;
  onChangeHour: (hour: number) => void;
}

export const TimeSlider: React.FC<TimeSliderProps> = ({
  currentHour,
  environment,
  onChangeHour,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 2 | 5>(1);

  // Simulation timer loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      onChangeHour((currentHour + 0.15 * speedMultiplier) % 24);
    }, 150);

    return () => clearInterval(interval);
  }, [isPlaying, currentHour, speedMultiplier, onChangeHour]);

  // Format hour into HH:MM
  const formatTime = (h: number) => {
    const hours = Math.floor(h);
    const minutes = Math.floor((h - hours) * 60);
    const paddedH = hours.toString().padStart(2, '0');
    const paddedM = minutes.toString().padStart(2, '0');
    return `${paddedH}:${paddedM}`;
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-3 px-2 sm:px-3 py-1 bg-transparent">
      {/* Play/Pause & Step Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`p-2 rounded-xl transition-all min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center active:scale-95 ${
            isPlaying
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30'
          }`}
          title={isPlaying ? 'Pause Simulation' : 'Play 24-Hour Simulation'}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <button
          onClick={() => {
            setIsPlaying(false);
            onChangeHour(12.0); // Reset to peak noon
          }}
          className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-900 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
          title="Reset to 12:00 PM"
          aria-label="Reset Time"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Speed toggle */}
        <button
          onClick={() => {
            const next = speedMultiplier === 1 ? 2 : speedMultiplier === 2 ? 5 : 1;
            setSpeedMultiplier(next);
          }}
          className="px-2 py-1 text-[10px] font-mono font-bold text-slate-300 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700/60 min-h-[32px] flex items-center justify-center active:scale-95"
          title="Simulation Speed"
        >
          {speedMultiplier}x
        </button>
      </div>

      {/* Clock display */}
      <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-800 font-mono">
        <div className="text-xs sm:text-sm font-bold text-slate-100 min-w-[44px] sm:min-w-[50px]">
          {formatTime(currentHour)}
        </div>
        <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-0.5 sm:gap-1">
          {environment.isDaytime ? (
            <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          )}
          <span className="hidden xs:inline sm:inline">{environment.isDaytime ? 'Day' : 'Night'}</span>
        </div>
      </div>

      {/* Scrubber slider */}
      <div className="flex-1 min-w-[80px] xs:min-w-[110px] sm:min-w-[160px] max-w-[240px] sm:max-w-[280px]">
        <input
          type="range"
          min="0"
          max="24"
          step="0.25"
          value={currentHour}
          onChange={(e) => {
            onChangeHour(parseFloat(e.target.value));
          }}
          className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer touch-none"
          aria-label="Simulation Hour"
        />
      </div>

      {/* Real-time Weather Telemetry (Desktop only) */}
      <div className="hidden lg:flex items-center gap-3 pl-3 border-l border-slate-800 text-[11px] font-mono text-slate-300">
        <div>
          <span className="text-slate-500 font-sans mr-1">Temp:</span>
          <span className="text-amber-300 font-semibold">{environment.outdoorTempC}°C</span>
        </div>
        <div>
          <span className="text-slate-500 font-sans mr-1">Solar:</span>
          <span className="text-cyan-300">{environment.solarRadiationWm2} W/m²</span>
        </div>
      </div>
    </div>
  );
};
