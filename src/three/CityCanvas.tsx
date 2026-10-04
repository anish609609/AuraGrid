import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { BuildingData, BuildingId, CitySimulationResult, EnvironmentState } from '../types/city';
import { CityScene } from './CityScene';
import { Compass, RotateCcw, Eye, Layers } from 'lucide-react';

export interface CityCanvasHandle {
  setSelectedBuilding: (id: BuildingId | null) => void;
  resetCameraOverview: () => void;
  focusFeederSubstation: () => void;
  setUndergroundMode: (enabled: boolean) => void;
}

interface CityCanvasProps {
  buildings: BuildingData[];
  simulationResult: CitySimulationResult;
  environment: EnvironmentState;
  selectedBuildingId: BuildingId | null;
  onBuildingSelect: (id: BuildingId) => void;
  onFeederSubstationSelect?: () => void;
}

export const CityCanvas = forwardRef<CityCanvasHandle, CityCanvasProps>(
  ({ buildings, simulationResult, environment, selectedBuildingId, onBuildingSelect, onFeederSubstationSelect }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<CityScene | null>(null);

    const [hoveredBuildingId, setHoveredBuildingId] = useState<BuildingId | null>(null);
    const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
    // Building labels are hidden by default as requested
    const [showLabels, setShowLabels] = useState(false);
    // Underground infrastructure (X-ray) mode
    const [isUndergroundMode, setIsUndergroundMode] = useState(false);

    useImperativeHandle(ref, () => ({
      setSelectedBuilding: (id: BuildingId | null) => {
        sceneRef.current?.setSelectedBuilding(id);
      },
      resetCameraOverview: () => {
        sceneRef.current?.resetCameraOverview();
      },
      focusFeederSubstation: () => {
        sceneRef.current?.focusFeederSubstation();
      },
      setUndergroundMode: (enabled: boolean) => {
        setIsUndergroundMode(enabled);
        sceneRef.current?.setUndergroundMode(enabled);
      },
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      const scene = new CityScene(containerRef.current, buildings, {
        onBuildingSelect: (id) => onBuildingSelect(id),
        onBuildingHover: (id, pos) => {
          setHoveredBuildingId(id);
          if (pos) setHoverPos(pos);
        },
        onFeederSubstationSelect: () => {
          onFeederSubstationSelect?.();
        },
      });

      sceneRef.current = scene;

      return () => {
        scene.destroy();
        sceneRef.current = null;
      };
    }, []);

    // Sync environment lighting
    useEffect(() => {
      sceneRef.current?.updateEnvironment(environment);
    }, [environment]);

    // Sync selected building highlight in 3D
    useEffect(() => {
      sceneRef.current?.setSelectedBuilding(selectedBuildingId);
    }, [selectedBuildingId]);

    // Sync power flows
    useEffect(() => {
      const powers: Record<BuildingId, number> = {} as any;
      buildings.forEach((b) => {
        powers[b.id] = simulationResult.buildingResults[b.id]?.currentPowerKW || 0;
      });
      sceneRef.current?.updatePowerFlows(powers);
    }, [simulationResult, buildings]);

    // Sync underground infrastructure mode
    useEffect(() => {
      sceneRef.current?.setUndergroundMode(isUndergroundMode);
    }, [isUndergroundMode]);

    const hoveredBuilding = buildings.find((b) => b.id === hoveredBuildingId);
    const hoveredSim = hoveredBuildingId ? simulationResult.buildingResults[hoveredBuildingId] : null;

    return (
      <div className="relative w-full h-full overflow-hidden select-none bg-slate-950">
        {/* 3D WebGL Canvas */}
        <div ref={containerRef} className="w-full h-full" />

        {/* Floating Building HUD Badges (Visible when toggled or when building is selected) */}
        {(showLabels || selectedBuildingId !== null) && (
          <div className="absolute inset-0 pointer-events-none">
            {/* External Regional 230kV Feeder Substation Label */}
            {showLabels && (
              <div
                className="absolute top-[4%] left-1/2 -translate-x-1/2 pointer-events-auto cursor-pointer transform hover:scale-105 transition-all"
                onClick={() => {
                  sceneRef.current?.focusFeederSubstation();
                  onFeederSubstationSelect?.();
                }}
                title="Click to open Regional Feeder Substation Dashboard"
              >
                <div className="px-3.5 py-1.5 rounded-lg border border-amber-500/70 bg-slate-950/90 hover:bg-slate-900 backdrop-blur-md shadow-lg shadow-amber-500/10 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider font-mono">
                    Regional 230kV Feeder Substation · {(simulationResult.incomingBulkGridKW / 1000).toFixed(2)} MW Inflow
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-sans border-l border-amber-500/40 pl-2">
                    Inspect ↗
                  </span>
                </div>
              </div>
            )}

            {buildings.map((b) => {
              const sim = simulationResult.buildingResults[b.id];
              const isSelected = selectedBuildingId === b.id;

              // Only render this badge if labels toggle is ON or this specific building is selected
              if (!showLabels && !isSelected) return null;

              // Normalized 2D projected anchor placement coordinates
              let posClass = '';
              if (b.id === 'it-tower') posClass = 'top-[12%] left-[50%] -translate-x-1/2';
              else if (b.id === 'education') posClass = 'top-[35%] left-[25%] -translate-x-1/2';
              else if (b.id === 'hospital') posClass = 'top-[35%] right-[25%] translate-x-1/2';
              else if (b.id === 'residential') posClass = 'bottom-[25%] left-[26%] -translate-x-1/2';
              else if (b.id === 'retail') posClass = 'bottom-[25%] right-[26%] translate-x-1/2';

              return (
                <div
                  key={b.id}
                  className={`absolute ${posClass} pointer-events-auto cursor-pointer transition-all duration-300 transform hover:scale-105`}
                  onClick={() => onBuildingSelect(b.id)}
                >
                  <div
                    className={`px-2.5 py-1.5 rounded-lg border backdrop-blur-md shadow-lg transition-all ${
                      isSelected
                        ? 'bg-slate-900/90 border-cyan-400 ring-2 ring-cyan-400/40 shadow-cyan-500/20'
                        : 'bg-slate-950/75 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: b.accentColor }}
                      />
                      <span className="text-[11px] font-semibold tracking-wider text-slate-200 uppercase">
                        {b.name.split(' ')[0]} {b.name.split(' ')[1] || ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 font-mono text-[10px] text-slate-400">
                      <span className="text-slate-100 font-medium">
                        {sim ? `${sim.currentPowerKW} kW` : '---'}
                      </span>
                      <span>·</span>
                      <span
                        className={
                          (sim?.gridUtilizationPct || 0) > 85
                            ? 'text-rose-400 font-medium'
                            : (sim?.gridUtilizationPct || 0) > 70
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }
                      >
                        {sim ? `${sim.gridUtilizationPct}% Grid` : '---'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Hover Tooltip HUD */}
        {hoveredBuilding && hoverPos && !selectedBuildingId && (
          <div
            className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full -mt-3 transition-opacity duration-150"
            style={{ left: hoverPos.x, top: hoverPos.y }}
          >
            <div className="p-3 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md w-60">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="font-semibold text-xs text-slate-100 tracking-wide">
                  {hoveredBuilding.name}
                </div>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: hoveredBuilding.accentColor }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px]">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-sans">
                    Current Load
                  </div>
                  <div className="text-cyan-400 font-semibold mt-0.5">
                    {hoveredSim?.currentPowerKW} kW
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-sans">
                    Occupancy
                  </div>
                  <div className="text-slate-200 mt-0.5">
                    {hoveredBuilding.currentControls.occupancy}%
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-sans">
                    Est. Cost
                  </div>
                  <div className="text-emerald-400 mt-0.5">
                    ₹{hoveredSim?.dailyCostINR.toLocaleString()}/day
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-sans">
                    Grid Load
                  </div>
                  <div
                    className={
                      (hoveredSim?.gridUtilizationPct || 0) > 85
                        ? 'text-rose-400'
                        : 'text-amber-300'
                    }
                  >
                    {hoveredSim?.gridUtilizationPct}%
                  </div>
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 text-center font-sans">
                Click to inspect & control
              </div>
            </div>
          </div>
        )}

        {/* View Controls Toolbar (Bottom Left) */}
        <div className="absolute bottom-6 left-6 flex items-center gap-2 z-20 pointer-events-auto">
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-lg backdrop-blur-md transition-all shadow-lg active:scale-95 ${
              showLabels
                ? 'bg-cyan-950/40 text-cyan-300 border-cyan-700/60'
                : 'bg-slate-900/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
            title="Toggle 3D Building Labels"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Labels</span>
          </button>

          <button
            onClick={() => setIsUndergroundMode(!isUndergroundMode)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-lg backdrop-blur-md transition-all shadow-lg active:scale-95 ${
              isUndergroundMode
                ? 'bg-amber-950/40 text-amber-300 border-amber-500/70 shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
            title="Toggle Underground Infrastructure Mode (Subsurface X-Ray)"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Underground Grid</span>
          </button>
        </div>

        {/* 3D Interaction Hint (Bottom Right) */}
        <div className="hidden lg:flex absolute bottom-6 right-6 items-center gap-3 px-3 py-1.5 bg-slate-950/70 border border-slate-800/80 rounded-full text-[11px] text-slate-400 backdrop-blur-sm pointer-events-none z-10">
          <span className="flex items-center gap-1">
            <Compass className="w-3 h-3 text-cyan-400" /> Left-drag rotate
          </span>
          <span className="text-slate-600">·</span>
          <span>Right-drag pan</span>
          <span className="text-slate-600">·</span>
          <span>Scroll zoom</span>
        </div>
      </div>
    );
  }
);
