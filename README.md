# AuraGrid Smart City Digital Twin ⚡🏙️

An interactive 3D digital twin and municipal energy simulation platform for a modern five-building smart city district. AuraGrid models real-time electrical power distribution, high-voltage feeder transmission, subterranean distribution vaults, rooftop solar generation, battery energy storage systems (BESS), dynamic Time-of-Day (ToD) tariffs, indoor thermal comfort (PMV/PPD), and municipal decarbonization analytics.

---

## 🌟 Key Features

### 1. 3D District Digital Twin (Three.js WebGL Engine)
- **High-Performance Procedural City**: Built entirely with procedural Three.js geometries and custom PBR materials—no heavy external 3D assets to load; instant 60 FPS rendering.
- **Dynamic 24-Hour Day/Night Cycle**: Realistic solar azimuth/elevation calculation, celestial hemisphere skylight, directional shadows, street lighting, and window glow that illuminates as dusk approaches.
- **Autonomous Electric Vehicle Fleet**: Animated autonomous electric shuttles, delivery pods, and sedans traveling road networks, turning at intersections, and navigating cleanly over flush street utility manholes.
- **Architectural Lighting & Effects**: Realistic building geometries, rooftop HVAC chillers, rooftop photovoltaic arrays, emergency helipads, and glowing selection rings.

### 2. Subterranean Grid & Infrastructure Architecture
- **Regional 230kV Feeder Substation**:
  - Located in the dedicated perimeter yard behind the IT campus.
  - Features 230kV high-voltage transmission gantry towers, ceramic insulator strings, 3 heavy-duty step-down transformers with radiator cooling banks, high-voltage oil bushings, perimeter security fencing, and a vertical holographic energy beacon.
- **Subterranean Distribution Vaults (Alpha & Beta)**:
  - Relocated completely underground inside reinforced concrete vaults beneath the street surface.
  - Houses subterranean distribution switchgear, step-down transformers, and electromagnetic induction rings.
  - Street-level flush manhole utility plates with luminescent marker rings ensure autonomous electric vehicles drive smoothly across roadway surfaces without above-ground tower obstructions.
- **Underground Conduit Network**:
  - High-voltage trunk conduits routing directly from the Regional Feeder to underground Substation Alpha Vault and Substation Beta Vault.
  - Subterranean distribution conduits running directly to building basement electrical vaults.
  - Glowing animated power flow particles traveling along cable curves, with particle velocity and glow scaling dynamically with real-time electrical load.
- **Underground / X-Ray Mode**:
  - Ground plane and road asphalt transition to high-transparency glass/wireframe shaders (opacity ~0.16).
  - Building superstructures fade into semi-transparent glass shells while subterranean service vaults, conduits, and transformer cores illuminate brightly for subterranean inspection.

### 3. Dedicated Feeder Substation Dashboard & Telemetry
- Access via clicking the **230kV Feeder Yard indicator** in the top navigation or clicking directly on the high-voltage substation yard in the 3D viewport.
- **Active Power Inflow**: Real-time bulk transmission power delivery formatted in MW and kW fed directly into Grid A and Grid B.
- **Grid Load Split**: Interactive visual load breakdown showing delivery percentage and power split between Substation Alpha and Substation Beta.
- **Supply Health & Diagnostics**: Transformer load capacity percentage, operating frequency (50.00 Hz nominal), voltage stability index (p.u.), thermal operating temperature, and phase balance status.
- **Rooftop Solar Absorption**: Real-time tracking of district rooftop solar feed-in absorbed back into the regional transmission network.
- **Direct Substation Camera Focus & X-Ray Mode toggle** buttons embedded right inside the dashboard.

### 4. Comprehensive Building Analytics & Controls
Clicking any building or selecting it from the portfolio list opens an in-depth slide-in drawer with 6 specialized modules:
1. **Overview**: Real-time demand, peak load, daily consumption, building carbon footprint, and operational status.
2. **Load Breakdown**: Live sub-metering across HVAC chiller plants, indoor lighting, IT server loads, plug loads, and EV charging bays.
3. **Controls**:
   - Thermostat setpoint adjustment (°C)
   - EV smart charging throttle (kW)
   - Lighting dimming schedule (%)
   - Battery dispatch mode (Auto Peak-Shaving, Force Charge, Discharge, Standby)
4. **Cost & Tariffs**: Detailed cost breakdown factoring in dynamic Time-of-Day (ToD) tariff slabs, energy consumption charges, peak demand charges, and power factor penalties.
5. **Comfort & Indoor Air Quality**: Predicted Mean Vote (PMV) and Predicted Percentage Dissatisfied (PPD) thermal comfort indices based on ISO 7730 / ASHRAE 55 standards.
6. **Rooftop Solar & Storage (BESS)**: Real-time solar PV generation, inverter efficiency, battery State of Charge (SoC), self-consumption percentage, and grid export feed-in.

### 5. District Optimization & Scenario Lab
- **District AI Optimizer**: One-click intelligent optimization applying coordinated precooling, load shifting during peak tariff hours, EV charge throttling, and automated battery dispatch for immediate cost and carbon reductions.
- **Scenario Lab**: Five preconfigured municipal operational scenarios:
  1. *Heatwave Extreme*: Extreme ambient temperatures driving peak HVAC demand.
  2. *Grid Stress & Peak Demand*: Severe grid capacity constraints requiring aggressive peak shaving.
  3. *Solar Eclipse / Dusk Peak*: Sudden drop in rooftop solar requiring immediate BESS and grid ramp-up.
  4. *Severe Storm / Microgrid Islanding*: Bulk supply interruption requiring critical facility prioritization.
  5. *Eco-Saver District*: Aggressive energy conservation and carbon mitigation mode.

### 6. Floating Draggable 24-Hour Timeline Dock
- Draggable bottom control dock that can be freely repositioned anywhere within the viewport.
- Play/pause simulation, step forward/backward by 1 hour, continuous simulation speed selector, and reset dock position button.
- Clean integration with the 24-hour simulation engine with instant updates to building loads, solar irradiance, ambient temperature, and electrical flows.

---

## 🏢 City District Portfolio

| Building | Primary Type | Peak Load | Floor Area | Rooftop Solar | Key Systems |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Apex Horizon IT Park** | Commercial High-Tech | 2,400 kW | 45,000 m² | 280 kWp | Chiller plant, Server floor, EV chargers, 500 kWh BESS |
| **Knowledge Hub Institute** | Education & Research | 950 kW | 24,000 m² | — | Smart ventilation, Lecture hall HVAC, EV chargers |
| **CityCare Medical Center** | Healthcare Critical | 1,450 kW | 32,000 m² | — | 24/7 Redundant HVAC, Critical life-support backup, Priority feed |
| **Serena Residential Towers** | High-Density Residential | 1,100 kW | 38,000 m² | — | Domestic heat pumps, Residential EV smart charging bays |
| **Metro Square Galleria** | Retail & Entertainment | 1,600 kW | 28,000 m² | 180 kWp | Central atriums, Commercial rooftop PV, 300 kWh BESS |

---

## 🛠️ Technology Stack

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Tooling**: [Vite](https://vitejs.dev/)
- **3D Graphics Engine**: [Three.js](https://threejs.org/) (r160+) with `OrbitControls`
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Hooks (`useState`, `useEffect`, `useRef`, `useCallback`)
- **Procedural Assets**: 100% code-driven geometric construction and shader materials (no external GLTF/OBJ assets required).

---

## 📂 Project Architecture

```
/
├── index.html                     # HTML5 entry point with OpenGraph & font links
├── metadata.json                  # AI Studio applet configuration & capabilities
├── package.json                   # Dependencies and npm scripts
├── tsconfig.json                  # Strict TypeScript configuration
├── vite.config.ts                 # Vite bundler configuration
└── src/
    ├── main.tsx                   # React root hydration
    ├── App.tsx                    # Main layout coordinator, modal managers, view state
    ├── index.css                  # Global styles & Tailwind CSS imports
    ├── types/
    │   └── city.ts                # TypeScript schemas for buildings, grid, tariffs, simulation
    ├── data/
    │   └── initialCity.ts         # Baseline configuration for 5 district buildings & nodes
    ├── engine/
    │   ├── simulationEngine.ts    # 24-hr physics load models, solar curves, grid balance
    │   ├── costEngine.ts          # Multi-slab ToD electricity tariff & INR formatting
    │   └── optimizationEngine.ts  # City-wide automated peak shaving & BESS dispatch
    ├── three/
    │   ├── CityCanvas.tsx         # React wrapper, Three.js renderer lifecycle, resize handlers
    │   └── CityScene.ts           # 3D city scene, buildings, underground vaults, conduit particles
    └── components/
        ├── Header.tsx             # Fixed top navbar, 3-zone telemetry, view switcher
        ├── FeederSubstationDashboard.tsx # 230kV Feeder Substation high-voltage analytics modal
        ├── GridOverviewModal.tsx  # Distribution network telemetry & phase balance
        ├── SolarAnalyticsModal.tsx# District rooftop solar & BESS storage analytics
        ├── BuildingPanel.tsx      # Building inspection drawer (6 analytical tabs)
        ├── BuildingsListModal.tsx # Building portfolio selector modal
        ├── ScenarioManager.tsx    # Municipal stress test scenario lab
        ├── TariffSettingsModal.tsx# Time-of-Day tariff slab & rate configuration modal
        ├── CityOptimizeModal.tsx  # District AI optimization proposal & apply modal
        ├── DraggableTimeSliderDock.tsx # Repositionable 24-hour timeline control dock
        ├── TimeSlider.tsx         # Play/pause, step controls, time slider bar
        ├── ComfortIndicator.tsx   # PMV / PPD thermal comfort badge
        ├── EducationalTooltip.tsx # Explanatory engineering definitions
        └── InitialWelcomeOverlay.tsx # District exploration introductory guide
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (version 18 or later recommended)
- npm or bun

### Installation
Clone or download the repository, then install project dependencies:

```bash
npm install
```

### Running Locally
Start the development server on port 3000:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000` to interact with the digital twin.

### Production Build
Compile and verify the TypeScript codebase:

```bash
npm run build
```

---

## 🎮 Navigation & Keyboard Controls

- **Orbit / Rotate**: Click and drag with the Left Mouse Button.
- **Pan Viewport**: Click and drag with the Right Mouse Button (or `Shift` + Left Mouse Button).
- **Zoom In / Out**: Scroll mouse wheel or pinch trackpad.
- **Select Building**: Click directly on any building superstructure or selection marker in the 3D viewport.
- **Select Substation Yard**: Click directly on the high-voltage transmission substation perimeter yard to open the Feeder Substation Dashboard.
- **Underground Mode**: Toggle in the bottom toolbar or Feeder Substation Dashboard to engage transparent X-Ray view.
- **Timeline Dock**: Drag the top grip handle on the timeline bar to reposition it anywhere on your screen.

---

## 📊 Code Quality & Modularity Standard

Every file in the codebase is organized into cleanly partitioned, single-responsibility modules:
- Zero monolithic files exceeding code limits (maximum file length is under 1,600 lines).
- Type-safe domain models in `src/types/city.ts`.
- Pure mathematical calculation engines separated from 3D rendering and React UI state.
- Strictly validated with `npm run build` with zero compiler warnings or errors.

---

## 📄 License
This project is open-source and available under the standard MIT License.
