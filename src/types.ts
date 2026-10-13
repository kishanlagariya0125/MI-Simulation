// Types for Smart Ambulance Traffic Light Controller

export type Direction = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
export type RoadAxis = 'NS' | 'EW';
export type LightColor = 'RED' | 'YELLOW' | 'GREEN';
export type TrafficDensity = 'LOW' | 'MEDIUM' | 'HIGH';
export type OperationMode = 'AUTOMATIC' | 'MANUAL';
export type SimulationStatus = 'STOPPED' | 'RUNNING' | 'PAUSED';

export type SimulationPhase =
  | 'IDLE'
  | 'ALL_RED'
  | 'NS_GREEN'
  | 'NS_YELLOW'
  | 'EW_GREEN'
  | 'EW_YELLOW'
  | 'EMERGENCY_PRIORITY'
  | 'PEDESTRIAN_CROSSING';

export interface IntersectionSignalState {
  nsLight: LightColor;
  ewLight: LightColor;
  allRedSafetyActive: boolean;
  pedestrianWalkActive: boolean;
  emergencyActive: boolean;
  emergencyAxis?: RoadAxis;
  emergencyDirection?: Direction;
}

export interface EmergencyRequest {
  id: string;
  direction: Direction;
  axis: RoadAxis;
  requestedAt: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
}

export interface PedestrianRequest {
  id: string;
  requestedAt: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
}

export interface Vehicle {
  id: string;
  type: 'sedan' | 'suv' | 'truck' | 'sport' | 'ambulance';
  direction: Direction;
  lane: 0 | 1; // 0 = standard lane
  x: number;
  y: number;
  speed: number;
  targetSpeed: number;
  color: string;
  length: number;
  width: number;
  isAmbulance: boolean;
  hasCrossed: boolean;
  stopped: boolean;
}

export interface PedestrianAgent {
  id: string;
  crosswalk: 'NS_TOP' | 'NS_BOTTOM' | 'EW_LEFT' | 'EW_RIGHT';
  progress: number; // 0 to 1
  speed: number;
  direction: 1 | -1;
  color: string;
}

export type EventCategory = 'NORMAL' | 'EMERGENCY' | 'PEDESTRIAN' | 'SYSTEM';

export interface EventLogEntry {
  id: string;
  code: number; // 1=Normal, 2=North, 3=South, 4=East, 5=West, 6=Pedestrian, 0/9=System
  message: string;
  category: EventCategory;
  simTime: number; // in seconds
  realTimestamp: string;
}

export interface SimulationStatistics {
  normalCycles: number;
  northAmbulance: number;
  southAmbulance: number;
  eastAmbulance: number;
  westAmbulance: number;
  totalAmbulance: number;
  pedestrianRequests: number;
  completedCrossings: number;
  phaseTransitions: number;
  vehiclesPassed: number;
  totalSimTime: number; // seconds
  emergencyWaitTimes: number[]; // response time in seconds
  avgEmergencyResponseTime: number;
}

export interface PhaseTimingConfig {
  densityDurations: Record<TrafficDensity, number>;
  yellowDuration: number;
  allRedDuration: number;
  emergencyDuration: number;
  pedestrianDuration: number;
}
