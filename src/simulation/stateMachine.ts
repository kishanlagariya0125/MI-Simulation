import {
  Direction,
  EventLogEntry,
  OperationMode,
  PhaseTimingConfig,
  RoadAxis,
  SimulationPhase,
  SimulationStatus,
  TrafficDensity,
} from '../types';
import { EmergencyManager } from './emergencyManager';
import { PedestrianManager } from './pedestrianManager';
import { StatisticsTracker } from './statistics';
import { getSignalStateForPhase, validateSignalSafety } from './trafficRules';
import { soundEffects } from './soundEffects';

export interface StateMachineContext {
  phase: SimulationPhase;
  previousPhase: SimulationPhase;
  phaseRemainingTime: number; // in seconds
  phaseTotalDuration: number;
  mode: OperationMode;
  density: TrafficDensity;
  status: SimulationStatus;
  manualSelectedAxis: RoadAxis;
  activeEmergencyId: string | null;
  activeEmergencyDirection: Direction | null;
  activeEmergencyAxis: RoadAxis | null;
  activePedestrianId: string | null;
  preemptedPhaseResume: SimulationPhase | null;
  nextPlannedPhase: SimulationPhase | null;
}

export class TrafficStateMachine {
  private context: StateMachineContext;
  private timingConfig: PhaseTimingConfig;
  private emergencyManager: EmergencyManager;
  private pedestrianManager: PedestrianManager;
  private statsTracker: StatisticsTracker;
  private eventLog: EventLogEntry[] = [];
  private onStateChangeCallback?: (ctx: StateMachineContext) => void;
  private onEventLogCallback?: (entry: EventLogEntry) => void;

  constructor(
    timingConfig: PhaseTimingConfig,
    emergencyManager: EmergencyManager,
    pedestrianManager: PedestrianManager,
    statsTracker: StatisticsTracker
  ) {
    this.timingConfig = timingConfig;
    this.emergencyManager = emergencyManager;
    this.pedestrianManager = pedestrianManager;
    this.statsTracker = statsTracker;

    this.context = {
      phase: 'IDLE',
      previousPhase: 'IDLE',
      phaseRemainingTime: 0,
      phaseTotalDuration: 0,
      mode: 'AUTOMATIC',
      density: 'MEDIUM',
      status: 'STOPPED',
      manualSelectedAxis: 'NS',
      activeEmergencyId: null,
      activeEmergencyDirection: null,
      activeEmergencyAxis: null,
      activePedestrianId: null,
      preemptedPhaseResume: null,
      nextPlannedPhase: 'ALL_RED',
    };
  }

  public getContext(): Readonly<StateMachineContext> {
    return { ...this.context };
  }

  public getEventLog(): ReadonlyArray<EventLogEntry> {
    return [...this.eventLog];
  }

  public setCallbacks(
    onStateChange: (ctx: StateMachineContext) => void,
    onEventLog: (entry: EventLogEntry) => void
  ) {
    this.onStateChangeCallback = onStateChange;
    this.onEventLogCallback = onEventLog;
  }

  public logEvent(
    code: number,
    message: string,
    category: EventLogEntry['category'],
    simTime: number
  ): EventLogEntry {
    const entry: EventLogEntry = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      code,
      message,
      category,
      simTime,
      realTimestamp: new Date().toLocaleTimeString(),
    };
    this.eventLog.unshift(entry); // newest first
    if (this.eventLog.length > 200) {
      this.eventLog.pop();
    }
    this.onEventLogCallback?.(entry);
    return entry;
  }

  public clearEventLog(): void {
    this.eventLog = [];
  }

  /**
   * Start simulation
   */
  public start(simTime: number): void {
    if (this.context.status === 'RUNNING') return;

    this.context.status = 'RUNNING';
    this.logEvent(0, 'Simulation started', 'SYSTEM', simTime);

    // Initial safety state: ALL_RED
    this.transitionTo('ALL_RED', this.timingConfig.allRedDuration, simTime);
  }

  /**
   * Pause simulation
   */
  public pause(simTime: number): void {
    if (this.context.status !== 'RUNNING') return;
    this.context.status = 'PAUSED';
    soundEffects.stopSiren();
    this.logEvent(0, 'Simulation paused', 'SYSTEM', simTime);
    this.notifyChange();
  }

  /**
   * Resume simulation
   */
  public resume(simTime: number): void {
    if (this.context.status !== 'PAUSED') return;
    this.context.status = 'RUNNING';
    if (this.context.phase === 'EMERGENCY_PRIORITY') {
      soundEffects.startSiren();
    }
    this.logEvent(0, 'Simulation resumed', 'SYSTEM', simTime);
    this.notifyChange();
  }

  /**
   * Stop simulation safely - Both directions to RED
   */
  public stop(simTime: number): void {
    soundEffects.stopSiren();
    this.context.status = 'STOPPED';
    this.context.phase = 'IDLE';
    this.context.phaseRemainingTime = 0;
    this.context.phaseTotalDuration = 0;
    this.context.activeEmergencyId = null;
    this.context.activeEmergencyDirection = null;
    this.context.activeEmergencyAxis = null;
    this.context.activePedestrianId = null;
    this.logEvent(0, 'Simulation stopped (All signals RED)', 'SYSTEM', simTime);
    this.notifyChange();
  }

  /**
   * Reset simulation
   */
  public reset(simTime: number): void {
    soundEffects.stopSiren();
    this.emergencyManager.clear();
    this.pedestrianManager.clear();
    this.context = {
      phase: 'IDLE',
      previousPhase: 'IDLE',
      phaseRemainingTime: 0,
      phaseTotalDuration: 0,
      mode: 'AUTOMATIC',
      density: 'MEDIUM',
      status: 'STOPPED',
      manualSelectedAxis: 'NS',
      activeEmergencyId: null,
      activeEmergencyDirection: null,
      activeEmergencyAxis: null,
      activePedestrianId: null,
      preemptedPhaseResume: null,
      nextPlannedPhase: 'ALL_RED',
    };
    this.logEvent(0, 'Simulation reset to initial state', 'SYSTEM', simTime);
    this.notifyChange();
  }

  /**
   * Set operating mode (AUTOMATIC / MANUAL)
   */
  public setMode(mode: OperationMode, simTime: number): void {
    if (this.context.mode === mode) return;
    this.context.mode = mode;
    this.logEvent(
      0,
      mode === 'AUTOMATIC' ? 'Operating mode: AUTOMATIC' : 'Operating mode: MANUAL',
      'SYSTEM',
      simTime
    );
    this.notifyChange();
  }

  /**
   * Set traffic density (LOW, MEDIUM, HIGH)
   */
  public setDensity(density: TrafficDensity, simTime: number): void {
    if (this.context.density === density) return;
    this.context.density = density;
    this.logEvent(
      0,
      `Traffic density set to ${density} (${this.timingConfig.densityDurations[density]}s green)`,
      'SYSTEM',
      simTime
    );
    this.notifyChange();
  }

  /**
   * Manual road selection (NS or EW)
   */
  public triggerManualRoad(axis: RoadAxis, simTime: number): void {
    if (this.context.mode !== 'MANUAL') {
      return;
    }
    if (this.context.status !== 'RUNNING') {
      return;
    }

    this.context.manualSelectedAxis = axis;
    this.logEvent(
      0,
      `Manual selection: ${axis === 'NS' ? 'North/South' : 'East/West'} road requested`,
      'NORMAL',
      simTime
    );

    // If currently already on that axis green, keep it running
    if (
      (axis === 'NS' && this.context.phase === 'NS_GREEN') ||
      (axis === 'EW' && this.context.phase === 'EW_GREEN')
    ) {
      return;
    }

    // If opposing road is currently GREEN, safely transition through YELLOW first!
    if (this.context.phase === 'NS_GREEN') {
      this.transitionTo('NS_YELLOW', this.timingConfig.yellowDuration, simTime);
      return;
    }
    if (this.context.phase === 'EW_GREEN') {
      this.transitionTo('EW_YELLOW', this.timingConfig.yellowDuration, simTime);
      return;
    }

    // If currently in ALL_RED or IDLE, can safely go to selected green
    if (this.context.phase === 'ALL_RED' || this.context.phase === 'IDLE') {
      const greenDuration = this.timingConfig.densityDurations[this.context.density];
      const targetPhase = axis === 'NS' ? 'NS_GREEN' : 'EW_GREEN';
      this.transitionTo(targetPhase, greenDuration, simTime);
    }
  }

  /**
   * Handle emergency request dispatch
   */
  public handleEmergencyRequest(direction: Direction, simTime: number): boolean {
    const req = this.emergencyManager.enqueueRequest(direction, simTime);
    if (!req) return false; // debounced

    // Increment stats and log matching Assembly source code
    this.statsTracker.recordAmbulanceRequest(direction);
    const eventCode = EmergencyManager.getEventCodeForDirection(direction);
    this.logEvent(eventCode, `Ambulance requested from ${direction}`, 'EMERGENCY', simTime);

    // Check if we should immediately preempt active phase
    this.checkPreemption(simTime);
    this.notifyChange();
    return true;
  }

  /**
   * Handle pedestrian request dispatch
   */
  public handlePedestrianRequest(simTime: number): boolean {
    const req = this.pedestrianManager.enqueueRequest(simTime);
    if (!req) return false;

    this.statsTracker.recordPedestrianRequest();
    this.logEvent(6, 'Pedestrian crossing requested', 'PEDESTRIAN', simTime);

    this.checkPreemption(simTime);
    this.notifyChange();
    return true;
  }

  /**
   * Checks if higher priority events (Ambulance, Pedestrian) should preempt current state
   */
  private checkPreemption(simTime: number): void {
    if (this.context.status !== 'RUNNING') return;

    // Emergency has highest priority
    if (this.emergencyManager.hasPendingRequests()) {
      const nextEmergency = this.emergencyManager.getNextPendingRequest();
      if (!nextEmergency) return;

      const emergencyAxis = nextEmergency.axis;

      // If conflicting direction is GREEN, safely cut to YELLOW immediately!
      if (emergencyAxis === 'NS' && this.context.phase === 'EW_GREEN') {
        this.logEvent(0, 'Conflicting EW Green shortened for emergency priority', 'EMERGENCY', simTime);
        this.transitionTo('EW_YELLOW', this.timingConfig.yellowDuration, simTime);
      } else if (emergencyAxis === 'EW' && this.context.phase === 'NS_GREEN') {
        this.logEvent(0, 'Conflicting NS Green shortened for emergency priority', 'EMERGENCY', simTime);
        this.transitionTo('NS_YELLOW', this.timingConfig.yellowDuration, simTime);
      }
      // If we are in ALL_RED, on next step it will pick up the emergency immediately!
    }
  }

  /**
   * Main simulation tick: advances phase countdown
   */
  public tick(deltaSimSeconds: number, simTime: number): void {
    if (this.context.status !== 'RUNNING') return;

    this.context.phaseRemainingTime -= deltaSimSeconds;

    if (this.context.phaseRemainingTime <= 0) {
      this.advanceToNextPhase(simTime);
    } else {
      this.notifyChange();
    }
  }

  /**
   * Advance to next phase according to finite state machine rules
   */
  private advanceToNextPhase(simTime: number): void {
    const current = this.context.phase;
    const densityGreenDuration = this.timingConfig.densityDurations[this.context.density];

    // 1. Check if EMERGENCY is pending
    if (this.emergencyManager.hasPendingRequests()) {
      const emergency = this.emergencyManager.getNextPendingRequest()!;
      const emergencyAxis = emergency.axis;

      // Safety check: Before granting emergency green, both conflicting movements MUST be red!
      if (current === 'EW_GREEN' && emergencyAxis === 'NS') {
        this.transitionTo('EW_YELLOW', this.timingConfig.yellowDuration, simTime);
        return;
      }
      if (current === 'NS_GREEN' && emergencyAxis === 'EW') {
        this.transitionTo('NS_YELLOW', this.timingConfig.yellowDuration, simTime);
        return;
      }
      if (current === 'NS_YELLOW' || current === 'EW_YELLOW') {
        this.transitionTo('ALL_RED', this.timingConfig.allRedDuration, simTime);
        return;
      }

      // If we are in ALL_RED (safety interval) or same corridor green, we grant EMERGENCY_PRIORITY!
      if (
        current === 'ALL_RED' ||
        current === 'IDLE' ||
        (current === 'NS_GREEN' && emergencyAxis === 'NS') ||
        (current === 'EW_GREEN' && emergencyAxis === 'EW')
      ) {
        this.emergencyManager.markActive(emergency.id);
        this.context.activeEmergencyId = emergency.id;
        this.context.activeEmergencyDirection = emergency.direction;
        this.context.activeEmergencyAxis = emergencyAxis;

        soundEffects.startSiren();
        const waitTime = Number((simTime - emergency.requestedAt).toFixed(1));
        this.statsTracker.recordEmergencyResponseTime(Math.max(0, waitTime));

        this.logEvent(
          0,
          `*** EMERGENCY PRIORITY: ${emergencyAxis === 'NS' ? 'NORTH/SOUTH' : 'EAST/WEST'} ***`,
          'EMERGENCY',
          simTime
        );

        this.transitionTo('EMERGENCY_PRIORITY', this.timingConfig.emergencyDuration, simTime);
        return;
      }
    }

    // 2. If we just finished EMERGENCY_PRIORITY
    if (current === 'EMERGENCY_PRIORITY') {
      soundEffects.stopSiren();
      this.logEvent(0, '*** AMBULANCE PASSING *** (Emergency cleared)', 'EMERGENCY', simTime);

      if (this.context.activeEmergencyId) {
        this.emergencyManager.markCompleted(this.context.activeEmergencyId);
        this.context.activeEmergencyId = null;
        this.context.activeEmergencyDirection = null;
        this.context.activeEmergencyAxis = null;
      }

      // Check if another emergency is queued
      if (this.emergencyManager.hasPendingRequests()) {
        this.transitionTo('ALL_RED', this.timingConfig.allRedDuration, simTime);
        return;
      }

      // Return to ALL_RED safety before resuming normal or pedestrian
      this.transitionTo('ALL_RED', this.timingConfig.allRedDuration, simTime);
      return;
    }

    // 3. Check if PEDESTRIAN CROSSING is pending and we are in safe state (ALL_RED)
    if (this.pedestrianManager.hasPendingRequest()) {
      if (current === 'NS_GREEN') {
        this.transitionTo('NS_YELLOW', this.timingConfig.yellowDuration, simTime);
        return;
      }
      if (current === 'EW_GREEN') {
        this.transitionTo('EW_YELLOW', this.timingConfig.yellowDuration, simTime);
        return;
      }
      if (current === 'NS_YELLOW' || current === 'EW_YELLOW') {
        this.transitionTo('ALL_RED', this.timingConfig.allRedDuration, simTime);
        return;
      }
      if (current === 'ALL_RED' || current === 'IDLE') {
        const pedReq = this.pedestrianManager.getNextPendingRequest()!;
        this.pedestrianManager.markActive(pedReq.id);
        this.context.activePedestrianId = pedReq.id;

        this.logEvent(6, '*** PEDESTRIAN CROSSING ACTIVE (Walk) ***', 'PEDESTRIAN', simTime);
        this.transitionTo('PEDESTRIAN_CROSSING', this.timingConfig.pedestrianDuration, simTime);
        return;
      }
    }

    // 4. If we just finished PEDESTRIAN_CROSSING
    if (current === 'PEDESTRIAN_CROSSING') {
      if (this.context.activePedestrianId) {
        this.pedestrianManager.markCompleted(this.context.activePedestrianId);
        this.context.activePedestrianId = null;
      }
      this.statsTracker.recordPedestrianCrossingCompleted();
      this.logEvent(0, 'Pedestrian crossing ended safely', 'PEDESTRIAN', simTime);
      this.transitionTo('ALL_RED', this.timingConfig.allRedDuration, simTime);
      return;
    }

    // 5. NORMAL AUTOMATIC MODE CYCLE
    if (this.context.mode === 'AUTOMATIC') {
      switch (current) {
        case 'ALL_RED':
        case 'IDLE':
          // Decide whether NS or EW should go next
          if (this.context.previousPhase === 'NS_YELLOW' || this.context.previousPhase === 'NS_GREEN') {
            this.transitionTo('EW_GREEN', densityGreenDuration, simTime);
          } else {
            if (this.context.previousPhase === 'EW_YELLOW' || this.context.previousPhase === 'EW_GREEN') {
              this.statsTracker.recordNormalCycle();
              this.logEvent(1, 'Traffic cycle completed. Starting NS_GREEN', 'NORMAL', simTime);
            }
            this.transitionTo('NS_GREEN', densityGreenDuration, simTime);
          }
          break;

        case 'NS_GREEN':
          this.transitionTo('NS_YELLOW', this.timingConfig.yellowDuration, simTime);
          break;

        case 'NS_YELLOW':
          this.transitionTo('ALL_RED', this.timingConfig.allRedDuration, simTime);
          break;

        case 'EW_GREEN':
          this.transitionTo('EW_YELLOW', this.timingConfig.yellowDuration, simTime);
          break;

        case 'EW_YELLOW':
          this.transitionTo('ALL_RED', this.timingConfig.allRedDuration, simTime);
          break;
      }
      return;
    }

    // 6. MANUAL MODE CYCLE
    if (this.context.mode === 'MANUAL') {
      switch (current) {
        case 'ALL_RED':
        case 'IDLE':
          const targetPhase = this.context.manualSelectedAxis === 'NS' ? 'NS_GREEN' : 'EW_GREEN';
          // If we transitioned to ALL_RED to switch to the target road:
          if (
            (this.context.previousPhase === 'NS_YELLOW' && this.context.manualSelectedAxis === 'EW') ||
            (this.context.previousPhase === 'EW_YELLOW' && this.context.manualSelectedAxis === 'NS')
          ) {
            this.transitionTo(targetPhase, densityGreenDuration, simTime);
          } else if (this.context.previousPhase === 'NS_YELLOW' || this.context.previousPhase === 'EW_YELLOW') {
            // Finished a manual run, wait in safe state
            this.notifyChange();
          } else {
            this.transitionTo(targetPhase, densityGreenDuration, simTime);
          }
          break;

        case 'NS_GREEN':
          this.transitionTo('NS_YELLOW', this.timingConfig.yellowDuration, simTime);
          break;

        case 'NS_YELLOW':
          this.transitionTo('ALL_RED', this.timingConfig.allRedDuration, simTime);
          break;

        case 'EW_GREEN':
          this.transitionTo('EW_YELLOW', this.timingConfig.yellowDuration, simTime);
          break;

        case 'EW_YELLOW':
          this.transitionTo('ALL_RED', this.timingConfig.allRedDuration, simTime);
          break;
      }
    }
  }

  /**
   * Helper to perform phase transition and validate safety
   */
  public transitionTo(phase: SimulationPhase, duration: number, simTime: number): void {
    this.context.previousPhase = this.context.phase;
    this.context.phase = phase;
    this.context.phaseTotalDuration = duration;
    this.context.phaseRemainingTime = duration;

    // Predict next planned phase for workflow visualization
    this.context.nextPlannedPhase = this.calculateNextPlannedPhase(phase);

    this.statsTracker.recordPhaseTransition();

    // Verify critical safety invariant
    const signalState = getSignalStateForPhase(
      phase,
      this.context.activeEmergencyAxis ?? undefined,
      this.context.activeEmergencyDirection ?? undefined
    );
    if (!validateSignalSafety(signalState)) {
      console.error('FATAL SAFETY VIOLATION PREVENTED: Conflicting greens detected!', signalState);
      this.context.phase = 'ALL_RED';
    }

    if (phase === 'NS_GREEN') {
      this.logEvent(1, `North/South signal changed to GREEN (${duration}s)`, 'NORMAL', simTime);
    } else if (phase === 'NS_YELLOW') {
      this.logEvent(0, 'North/South signal changed to YELLOW (2s)', 'NORMAL', simTime);
    } else if (phase === 'EW_GREEN') {
      this.logEvent(1, `East/West signal changed to GREEN (${duration}s)`, 'NORMAL', simTime);
    } else if (phase === 'EW_YELLOW') {
      this.logEvent(0, 'East/West signal changed to YELLOW (2s)', 'NORMAL', simTime);
    } else if (phase === 'ALL_RED') {
      this.logEvent(0, 'SAFETY STATE: All signals RED (1s)', 'SYSTEM', simTime);
    }

    this.notifyChange();
  }

  private calculateNextPlannedPhase(current: SimulationPhase): SimulationPhase {
    if (this.emergencyManager.hasPendingRequests()) {
      return 'EMERGENCY_PRIORITY';
    }
    if (this.pedestrianManager.hasPendingRequest()) {
      return 'PEDESTRIAN_CROSSING';
    }

    switch (current) {
      case 'IDLE':
        return 'ALL_RED';
      case 'ALL_RED':
        return (this.context.previousPhase === 'NS_YELLOW' || this.context.previousPhase === 'NS_GREEN') ? 'EW_GREEN' : 'NS_GREEN';
      case 'NS_GREEN':
        return 'NS_YELLOW';
      case 'NS_YELLOW':
        return 'ALL_RED';
      case 'EW_GREEN':
        return 'EW_YELLOW';
      case 'EW_YELLOW':
        return 'ALL_RED';
      case 'EMERGENCY_PRIORITY':
        return 'ALL_RED';
      case 'PEDESTRIAN_CROSSING':
        return 'ALL_RED';
      default:
        return 'ALL_RED';
    }
  }

  private notifyChange(): void {
    this.onStateChangeCallback?.({ ...this.context });
  }
}
