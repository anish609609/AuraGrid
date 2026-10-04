import { BuildingData, GridNode, TariffConfig } from '../types/city';

export const DEFAULT_TARIFF: TariffConfig = {
  energyRate: 8.0, // ₹8.00 / kWh
  demandCharge: 300.0, // ₹300 / kW of peak demand
  billingPeriodDays: 30,
  currencySymbol: '₹',
};

export const GRID_NODES: GridNode[] = [
  {
    id: 'external-feeder',
    name: 'Regional 230kV Grid Supply Substation',
    description: 'Bulk transmission interconnection stepping down 230kV regional grid power to 33kV urban trunk feeders',
    position3D: [0, 0, -56],
    capacityKW: 5000, // 5.0 MW bulk capacity
    connectedBuildingIds: ['it-tower', 'education', 'hospital', 'residential', 'retail'],
  },
  {
    id: 'node-a',
    name: 'Grid Substation Alpha',
    description: 'High-voltage node serving IT Tower, Education Campus & Medical Center',
    position3D: [-4, 0, -21],
    capacityKW: 1600, // 1.60 MW
    connectedBuildingIds: ['it-tower', 'education', 'hospital'],
  },
  {
    id: 'node-b',
    name: 'Grid Substation Beta',
    description: 'Distribution node serving Medical Center, Residential & Retail Complex',
    position3D: [4, 0, 21],
    capacityKW: 1400, // 1.40 MW
    connectedBuildingIds: ['hospital', 'residential', 'retail'],
  },
];

export const INITIAL_BUILDINGS: BuildingData[] = [
  {
    id: 'it-tower',
    name: 'CyberTech IT Tower',
    category: 'Commercial',
    tagline: 'High-density commercial office with enterprise server floors',
    areaSqFt: 100000,
    capacityPeople: 1000,
    floors: 10,
    gridNodeId: 'node-a',
    position3D: [0, 0, -32],
    dimensions3D: [10, 24, 10],
    accentColor: '#38bdf8', // Cyan/sky blue
    glowColor: 'rgba(56, 189, 248, 0.4)',
    baselinePeakDemand: 650,
    baselineDailyEnergy: 8450,
    baselineControls: {
      occupancy: 85,
      hvacSetpoint: 24.0,
      lightingLevel: 100,
      flexibleLoad: 80,
      evCharging: true,
      evOffPeakShift: false,
    },
    currentControls: {
      occupancy: 85,
      hvacSetpoint: 24.0,
      lightingLevel: 100,
      flexibleLoad: 80,
      evCharging: true,
      evOffPeakShift: false,
    },
    constraints: {
      minTemperature: 23.5,
      maxTemperature: 25.0,
      criticalLoads: ['Server Room Cooling', 'Enterprise Data Center & IT Core', 'Emergency Elevators'],
      maxDemandCap: 750,
    },
    solarStorage: {
      hasSolar: true,
      pvCapacityKWp: 50,
      hasBess: true,
      bessCapacityKWh: 100,
      maxChargeRateKW: 25,
    },
  },
  {
    id: 'education',
    name: 'Apex University Campus',
    category: 'Institutional',
    tagline: 'Academic institution with lecture halls, science labs & student centers',
    areaSqFt: 50000,
    capacityPeople: 680,
    floors: 4,
    gridNodeId: 'node-a',
    position3D: [-16, 0, -11],
    dimensions3D: [12, 10, 10],
    accentColor: '#fbbf24', // Amber/gold
    glowColor: 'rgba(251, 191, 36, 0.4)',
    baselinePeakDemand: 300,
    baselineDailyEnergy: 3420,
    baselineControls: {
      occupancy: 75,
      hvacSetpoint: 24.0,
      lightingLevel: 90,
      flexibleLoad: 70,
      evCharging: false,
      evOffPeakShift: false,
    },
    currentControls: {
      occupancy: 75,
      hvacSetpoint: 24.0,
      lightingLevel: 90,
      flexibleLoad: 70,
      evCharging: false,
      evOffPeakShift: false,
    },
    constraints: {
      minTemperature: 22.0,
      maxTemperature: 26.5,
      criticalLoads: ['Research Cryo Storage', 'Server Racks', 'Campus Safety Network'],
      maxDemandCap: 350,
    },
    solarStorage: {
      hasSolar: true,
      pvCapacityKWp: 160, // Maximum high-density campus rooftop solar
      hasBess: true,
      bessCapacityKWh: 250,
      maxChargeRateKW: 60,
    },
  },
  {
    id: 'hospital',
    name: 'CityCare Medical Center',
    category: 'Healthcare',
    tagline: 'Critical healthcare hospital with 24/7 ICU & surgical suites',
    areaSqFt: 45000,
    capacityPeople: 150, // 150 beds + staff
    floors: 6,
    gridNodeId: 'both',
    position3D: [16, 0, -11],
    dimensions3D: [11, 14, 11],
    accentColor: '#f43f5e', // Rose/red
    glowColor: 'rgba(244, 63, 94, 0.4)',
    baselinePeakDemand: 500,
    baselineDailyEnergy: 8900,
    baselineControls: {
      occupancy: 80,
      hvacSetpoint: 23.0,
      lightingLevel: 100,
      flexibleLoad: 50,
      evCharging: true,
      evOffPeakShift: false,
    },
    currentControls: {
      occupancy: 80,
      hvacSetpoint: 23.0,
      lightingLevel: 100,
      flexibleLoad: 50,
      evCharging: true,
      evOffPeakShift: false,
    },
    constraints: {
      minTemperature: 21.0,
      maxTemperature: 24.0,
      criticalLoads: ['Intensive Care Unit (ICU)', 'Operating Theatres & Surgical Suites', 'Life Support & Emergency Oxygen', 'Blood Bank Cryogenics'],
      maxDemandCap: 600,
    },
    solarStorage: {
      hasSolar: false, // Removed completely for unobstructed heliport
      pvCapacityKWp: 0,
      hasBess: true, // Hospital life-support emergency BESS
      bessCapacityKWh: 150,
      maxChargeRateKW: 40,
    },
  },
  {
    id: 'residential',
    name: 'Serena Residential Towers',
    category: 'Residential',
    tagline: '100 residential apartment suites with residential heat pumps & EV bays',
    areaSqFt: 85000,
    capacityPeople: 350,
    floors: 8,
    gridNodeId: 'node-b',
    position3D: [-16, 0, 11],
    dimensions3D: [10, 17, 9],
    accentColor: '#10b981', // Emerald
    glowColor: 'rgba(16, 185, 129, 0.4)',
    baselinePeakDemand: 350,
    baselineDailyEnergy: 4300,
    baselineControls: {
      occupancy: 70,
      hvacSetpoint: 24.0,
      lightingLevel: 80,
      flexibleLoad: 75,
      evCharging: true,
      evOffPeakShift: false,
    },
    currentControls: {
      occupancy: 70,
      hvacSetpoint: 24.0,
      lightingLevel: 80,
      flexibleLoad: 75,
      evCharging: true,
      evOffPeakShift: false,
    },
    constraints: {
      minTemperature: 22.0,
      maxTemperature: 27.0,
      criticalLoads: ['Elevators', 'Emergency Stairwell Lighting', 'Basement Water Pumps'],
      maxDemandCap: 420,
    },
    solarStorage: {
      hasSolar: false, // Removed completely as requested
      pvCapacityKWp: 0,
      hasBess: false,
      bessCapacityKWh: 0,
      maxChargeRateKW: 0,
    },
  },
  {
    id: 'retail',
    name: 'Metro Square Commercial Atrium',
    category: 'Retail',
    tagline: 'Commercial retail center with food court, anchor shops & entertainment',
    areaSqFt: 35000,
    capacityPeople: 500,
    floors: 3,
    gridNodeId: 'node-b',
    position3D: [16, 0, 11],
    dimensions3D: [13, 8, 12],
    accentColor: '#a855f7', // Purple/Violet
    glowColor: 'rgba(168, 85, 247, 0.4)',
    baselinePeakDemand: 300,
    baselineDailyEnergy: 3950,
    baselineControls: {
      occupancy: 75,
      hvacSetpoint: 23.5,
      lightingLevel: 95,
      flexibleLoad: 60,
      evCharging: true,
      evOffPeakShift: false,
    },
    currentControls: {
      occupancy: 75,
      hvacSetpoint: 23.5,
      lightingLevel: 95,
      flexibleLoad: 60,
      evCharging: true,
      evOffPeakShift: false,
    },
    constraints: {
      minTemperature: 22.5,
      maxTemperature: 26.0,
      criticalLoads: ['Supermarket Cold Storage', 'Atrium Smoke Evacuation Fans', 'Security & Access Gates'],
      maxDemandCap: 380,
    },
    solarStorage: {
      hasSolar: true,
      pvCapacityKWp: 40,
      hasBess: true,
      bessCapacityKWh: 80,
      maxChargeRateKW: 20,
    },
  },
];
