import { IntersectionSignalState, SimulationPhase, RoadAxis, Direction } from '../types';

/**
 * Returns the exact signal state for each road axis given the current simulation phase.
 * Guarantees that conflicting directions (NS and EW) can NEVER both be GREEN.
 */
export function getSignalStateForPhase(
  phase: SimulationPhase,
  emergencyAxis?: RoadAxis,
  emergencyDirection?: Direction
): IntersectionSignalState {
  switch (phase) {
    case 'NS_GREEN':
      return {
        nsLight: 'GREEN',
        ewLight: 'RED',
        allRedSafetyActive: false,
        pedestrianWalkActive: false,
        emergencyActive: false,
      };

    case 'NS_YELLOW':
      return {
        nsLight: 'YELLOW',
        ewLight: 'RED',
        allRedSafetyActive: false,
        pedestrianWalkActive: false,
        emergencyActive: false,
      };

    case 'EW_GREEN':
      return {
        nsLight: 'RED',
        ewLight: 'GREEN',
        allRedSafetyActive: false,
        pedestrianWalkActive: false,
        emergencyActive: false,
      };

    case 'EW_YELLOW':
      return {
        nsLight: 'RED',
        ewLight: 'YELLOW',
        allRedSafetyActive: false,
        pedestrianWalkActive: false,
        emergencyActive: false,
      };

    case 'EMERGENCY_PRIORITY':
      return {
        nsLight: emergencyAxis === 'NS' ? 'GREEN' : 'RED',
        ewLight: emergencyAxis === 'EW' ? 'GREEN' : 'RED',
        allRedSafetyActive: false,
        pedestrianWalkActive: false,
        emergencyActive: true,
        emergencyAxis,
        emergencyDirection,
      };

    case 'PEDESTRIAN_CROSSING':
      return {
        nsLight: 'RED',
        ewLight: 'RED',
        allRedSafetyActive: true,
        pedestrianWalkActive: true,
        emergencyActive: false,
      };

    case 'ALL_RED':
    case 'IDLE':
    default:
      return {
        nsLight: 'RED',
        ewLight: 'RED',
        allRedSafetyActive: true,
        pedestrianWalkActive: false,
        emergencyActive: false,
      };
  }
}

/**
 * Safety validator: Asserts that conflicting movements are never simultaneously Green or Yellow.
 */
export function validateSignalSafety(state: IntersectionSignalState): boolean {
  if (state.nsLight === 'GREEN' && state.ewLight === 'GREEN') return false;
  if (state.nsLight === 'GREEN' && state.ewLight === 'YELLOW') return false;
  if (state.nsLight === 'YELLOW' && state.ewLight === 'GREEN') return false;
  if (state.pedestrianWalkActive && (state.nsLight !== 'RED' || state.ewLight !== 'RED')) return false;
  return true;
}
