import React, { useState, useMemo, useRef } from 'react';
import { INITIAL_BUILDINGS, DEFAULT_TARIFF } from './data/initialCity';
import { BuildingData, BuildingId, BuildingControls, TariffConfig } from './types/city';
import { runCitySimulation, getEnvironmentForHour } from './engine/simulationEngine';
import { optimizeCityBuildings } from './engine/optimizationEngine';
import { CityCanvas, CityCanvasHandle } from './three/CityCanvas';
import { Header } from './components/Header';
import { DraggableTimeSliderDock } from './components/DraggableTimeSliderDock';
import { BuildingPanel } from './components/BuildingPanel';
import { InitialWelcomeOverlay } from './components/InitialWelcomeOverlay';
import { CityOptimizeModal } from './components/CityOptimizeModal';
import { GridOverviewModal } from './components/GridOverviewModal';
import { SolarAnalyticsModal } from './components/SolarAnalyticsModal';
import { FeederSubstationDashboard } from './components/FeederSubstationDashboard';
import { ScenarioManager } from './components/ScenarioManager';
import { TariffSettingsModal } from './components/TariffSettingsModal';
import { BuildingsListModal } from './components/BuildingsListModal';

export default function App() {
  const [buildings, setBuildings] = useState<BuildingData[]>(INITIAL_BUILDINGS);
  const [tariff, setTariff] = useState<TariffConfig>(DEFAULT_TARIFF);
  const [currentHour, setCurrentHour] = useState<number>(14.0); // 2:00 PM peak afternoon
  const [selectedBuildingId, setSelectedBuildingId] = useState<BuildingId | null>(null);
  const [activeView, setActiveView] = useState<'city' | 'buildings' | 'grid' | 'solar' | 'scenarios' | 'tariff'>('city');
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [showOptimizeModal, setShowOptimizeModal] = useState<boolean>(false);
  const [showFeederDashboard, setShowFeederDashboard] = useState<boolean>(false);

  const canvasRef = useRef<CityCanvasHandle>(null);

  // Real-time environmental calculations (outdoor temp, humidity, solar radiation)
  const environment = useMemo(() => {
    return getEnvironmentForHour(currentHour);
  }, [currentHour]);

  // Master deterministic city simulation
  const simulationResult = useMemo(() => {
    return runCitySimulation(buildings, currentHour, tariff);
  }, [buildings, currentHour, tariff]);

  // Handlers for building controls
  const handleBuildingSelect = (id: BuildingId) => {
    setShowWelcome(false);
    setSelectedBuildingId(id);
    setActiveView('city');
  };

  const handleCloseBuildingPanel = () => {
    setSelectedBuildingId(null);
    canvasRef.current?.resetCameraOverview();
  };

  const handleUpdateBuildingControls = (buildingId: BuildingId, newControls: BuildingControls) => {
    setBuildings((prev) =>
      prev.map((b) => (b.id === buildingId ? { ...b, currentControls: newControls } : b))
    );
  };

  const handleResetBuildingControls = (buildingId: BuildingId) => {
    setBuildings((prev) =>
      prev.map((b) =>
        b.id === buildingId ? { ...b, currentControls: { ...b.baselineControls } } : b
      )
    );
  };

  const handleResetAllToBaseline = () => {
    setBuildings((prev) =>
      prev.map((b) => ({ ...b, currentControls: { ...b.baselineControls } }))
    );
  };

  // Automated city optimization handler
  const handleApplyOptimization = () => {
    const { updatedBuildings } = optimizeCityBuildings(buildings);
    setBuildings(updatedBuildings);
    setShowOptimizeModal(false);
  };

  // Scenario manager apply controls
  const handleApplyScenarioControls = (controlsMap: Record<BuildingId, BuildingControls>) => {
    setBuildings((prev) =>
      prev.map((b) => {
        if (controlsMap[b.id]) {
          return {
            ...b,
            currentControls: { ...controlsMap[b.id] },
          };
        }
        return b;
      })
    );
  };

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);
  const selectedBuildingSim = selectedBuildingId
    ? simulationResult.buildingResults[selectedBuildingId]
    : null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">
      {/* 1. Header (Fixed top bar with city metrics & 3-zone contract) */}
      <Header
        simulationResult={simulationResult}
        tariff={tariff}
        activeView={activeView}
        onSelectView={(view) => {
          if (view === 'city') {
            setActiveView('city');
          } else {
            setActiveView(view);
          }
        }}
        onOpenOptimizeModal={() => setShowOptimizeModal(true)}
        onOpenFeederDashboard={() => setShowFeederDashboard(true)}
      />

      {/* 2. Interactive 3D City Viewport */}
      <main className="w-full h-full pt-16">
        <CityCanvas
          ref={canvasRef}
          buildings={buildings}
          simulationResult={simulationResult}
          environment={environment}
          selectedBuildingId={selectedBuildingId}
          onBuildingSelect={handleBuildingSelect}
          onFeederSubstationSelect={() => setShowFeederDashboard(true)}
        />
      </main>

      {/* 3. Draggable Floating 24-Hour Timeline Control Dock */}
      <DraggableTimeSliderDock
        currentHour={currentHour}
        environment={environment}
        onChangeHour={setCurrentHour}
      />

      {/* 4. Building Analytics & Controls Slide-in Panel */}
      {selectedBuilding && selectedBuildingSim && (
        <BuildingPanel
          building={selectedBuilding}
          simulationResult={selectedBuildingSim}
          environment={environment}
          tariff={tariff}
          onUpdateControls={(c) => handleUpdateBuildingControls(selectedBuilding.id, c)}
          onResetControls={() => handleResetBuildingControls(selectedBuilding.id)}
          onClose={handleCloseBuildingPanel}
        />
      )}

      {/* 5. Initial Welcome Screen (Explore City Prompt) */}
      {showWelcome && (
        <InitialWelcomeOverlay
          simulationResult={simulationResult}
          onExplore={() => setShowWelcome(false)}
        />
      )}

      {/* 6. City Optimization Modal */}
      {showOptimizeModal && (
        <CityOptimizeModal
          onApply={handleApplyOptimization}
          onClose={() => setShowOptimizeModal(false)}
        />
      )}

      {/* 7. Grid Telemetry Modal */}
      {activeView === 'grid' && (
        <GridOverviewModal
          gridNodeStates={simulationResult.gridNodeStates}
          buildings={buildings}
          simulationResult={simulationResult}
          onSelectBuilding={handleBuildingSelect}
          onClose={() => setActiveView('city')}
        />
      )}

      {/* 8. Solar & Battery Storage Analytics Modal */}
      {activeView === 'solar' && (
        <SolarAnalyticsModal
          simulationResult={simulationResult}
          buildings={buildings}
          environment={environment}
          onSelectBuilding={handleBuildingSelect}
          onClose={() => setActiveView('city')}
        />
      )}

      {/* 8b. Dedicated Regional 230kV Feeder Substation Dashboard */}
      {showFeederDashboard && (
        <FeederSubstationDashboard
          simulationResult={simulationResult}
          buildings={buildings}
          onFocusSubstation={() => {
            canvasRef.current?.focusFeederSubstation();
          }}
          onToggleUndergroundMode={() => {
            canvasRef.current?.setUndergroundMode(true);
            setShowFeederDashboard(false);
          }}
          onSelectBuilding={handleBuildingSelect}
          onClose={() => setShowFeederDashboard(false)}
        />
      )}

      {/* 8. Buildings Portfolio Modal */}
      {activeView === 'buildings' && (
        <BuildingsListModal
          buildings={buildings}
          simulationResult={simulationResult}
          onSelectBuilding={handleBuildingSelect}
          onClose={() => setActiveView('city')}
        />
      )}

      {/* 9. Scenario Lab Modal */}
      {activeView === 'scenarios' && (
        <ScenarioManager
          buildings={buildings}
          tariff={tariff}
          onApplyScenarioControls={handleApplyScenarioControls}
          onClose={() => setActiveView('city')}
        />
      )}

      {/* 10. Tariff Configuration Modal */}
      {activeView === 'tariff' && (
        <TariffSettingsModal
          tariff={tariff}
          onSave={setTariff}
          onClose={() => setActiveView('city')}
        />
      )}
    </div>
  );
}
