import { PhaseTimingConfig, TrafficDensity } from './types';

export const DEFAULT_TIMING_CONFIG: PhaseTimingConfig = {
  densityDurations: {
    LOW: 5,     // Assembly: set_low -> 5 seconds
    MEDIUM: 8,  // Assembly: set_medium -> 8 seconds
    HIGH: 12,   // Assembly: set_high -> 12 seconds
  },
  yellowDuration: 2,     // Assembly: Countdown(2)
  allRedDuration: 1,     // Assembly safety interval between states
  emergencyDuration: 5,  // Assembly: Countdown(5) in emergency_ns/ew
  pedestrianDuration: 5, // Assembly: Countdown(5) in pedestrian_crossing
};

export const SIMULATION_SPEEDS = [0.5, 1.0, 2.0, 4.0] as const;

export const DENSITY_SPAWN_INTERVALS: Record<TrafficDensity, { min: number; max: number }> = {
  LOW: { min: 3.5, max: 6.0 },     // slow spawn rate
  MEDIUM: { min: 2.0, max: 4.0 },  // moderate spawn rate
  HIGH: { min: 1.0, max: 2.2 },    // high spawn rate
};

export const INTERSECTION_CONFIG = {
  size: 600,            // 600x600 px virtual canvas
  roadWidth: 160,       // road width in px
  laneWidth: 40,        // single lane width
  stopLineOffset: 95,   // distance from center to stop line
  intersectionCenter: 300,
  vehicleColors: [
    '#D1D5DB', // Silver Metallic
    '#F3F4F6', // Crisp White
    '#374151', // Charcoal Metallic
    '#4B5563', // Slate Gray
    '#1E3A5F', // Deep Navy Blue
    '#6B7280', // Medium Gray
    '#2E3842', // Dark Graphite
  ],
};
