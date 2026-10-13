import {
  Direction,
  EventLogEntry,
  IntersectionSignalState,
  LightColor,
  OperationMode,
  PhaseTimingConfig,
  RoadAxis,
  SimulationPhase,
  SimulationStatistics,
  SimulationStatus,
  TrafficDensity,
  Vehicle,
} from '../types';
import {
  DEFAULT_TIMING_CONFIG,
  DENSITY_SPAWN_INTERVALS,
  INTERSECTION_CONFIG,
} from '../config';
import { EmergencyManager } from './emergencyManager';
import { PedestrianManager } from './pedestrianManager';
import { StatisticsTracker } from './statistics';
import { TrafficStateMachine, StateMachineContext } from './stateMachine';
import { getSignalStateForPhase } from './trafficRules';
import { soundEffects } from './soundEffects';

export interface EngineSnapshot {
  status: SimulationStatus;
  mode: OperationMode;
  density: TrafficDensity;
  phase: SimulationPhase;
  phaseRemainingTime: number;
  phaseTotalDuration: number;
  signals: IntersectionSignalState;
  vehicles: Vehicle[];
  pedestrians: ReturnType<PedestrianManager['getActiveAgents']>;
  pendingAmbulances: ReturnType<EmergencyManager['getPendingQueue']>;
  pendingPedestriansCount: number;
  statistics: SimulationStatistics;
  eventLog: ReadonlyArray<EventLogEntry>;
  simTime: number;
  speedMultiplier: number;
  nextPlannedPhase: SimulationPhase | null;
  activeEmergencyDirection: Direction | null;
  manualSelectedAxis: RoadAxis;
}

export class SimulationEngine {
  private timingConfig: PhaseTimingConfig;
  private emergencyManager: EmergencyManager;
  private pedestrianManager: PedestrianManager;
  private statsTracker: StatisticsTracker;
  private stateMachine: TrafficStateMachine;

  private vehicles: Vehicle[] = [];
  private simTime: number = 0; // seconds
  private speedMultiplier: number = 1.0;
  private lastFrameTimestamp: number = 0;
  private animFrameId: number | null = null;
  private spawnTimers: Record<Direction, number> = {
    NORTH: 1.0,
    SOUTH: 2.0,
    EAST: 1.5,
    WEST: 2.5,
  };
  private ambulanceSpawnedForId: string | null = null;

  private listeners: Set<(snapshot: EngineSnapshot) => void> = new Set();

  constructor(timingConfig: PhaseTimingConfig = DEFAULT_TIMING_CONFIG) {
    this.timingConfig = timingConfig;
    this.emergencyManager = new EmergencyManager();
    this.pedestrianManager = new PedestrianManager();
    this.statsTracker = new StatisticsTracker();
    this.stateMachine = new TrafficStateMachine(
      this.timingConfig,
      this.emergencyManager,
      this.pedestrianManager,
      this.statsTracker
    );
  }

  public subscribe(listener: (snapshot: EngineSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const snap = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snap);
    }
  }

  public getSnapshot(): EngineSnapshot {
    const ctx = this.stateMachine.getContext();
    const signals = getSignalStateForPhase(
      ctx.phase,
      ctx.activeEmergencyAxis ?? undefined,
      ctx.activeEmergencyDirection ?? undefined
    );

    return {
      status: ctx.status,
      mode: ctx.mode,
      density: ctx.density,
      phase: ctx.phase,
      phaseRemainingTime: Math.max(0, Number(ctx.phaseRemainingTime.toFixed(1))),
      phaseTotalDuration: ctx.phaseTotalDuration,
      signals,
      vehicles: [...this.vehicles],
      pedestrians: this.pedestrianManager.getActiveAgents(),
      pendingAmbulances: this.emergencyManager.getPendingQueue(),
      pendingPedestriansCount: this.pedestrianManager.getPendingCount(),
      statistics: this.statsTracker.getStats(),
      eventLog: this.stateMachine.getEventLog(),
      simTime: Number(this.simTime.toFixed(1)),
      speedMultiplier: this.speedMultiplier,
      nextPlannedPhase: ctx.nextPlannedPhase,
      activeEmergencyDirection: ctx.activeEmergencyDirection,
      manualSelectedAxis: ctx.manualSelectedAxis,
    };
  }

  public getStateMachine(): TrafficStateMachine {
    return this.stateMachine;
  }

  public getStatsTracker(): StatisticsTracker {
    return this.statsTracker;
  }

  public getEmergencyManager(): EmergencyManager {
    return this.emergencyManager;
  }

  public getPedestrianManager(): PedestrianManager {
    return this.pedestrianManager;
  }

  // ================= CONTROLS =================

  public start(): void {
    this.stateMachine.start(this.simTime);
    this.ensureLoopRunning();
    this.notify();
  }

  public pause(): void {
    this.stateMachine.pause(this.simTime);
    this.notify();
  }

  public resume(): void {
    this.stateMachine.resume(this.simTime);
    this.ensureLoopRunning();
    this.notify();
  }

  public stop(): void {
    this.stateMachine.stop(this.simTime);
    this.notify();
  }

  public reset(): void {
    this.stopLoop();
    this.vehicles = [];
    this.simTime = 0;
    this.ambulanceSpawnedForId = null;
    this.stateMachine.reset(0);
    this.statsTracker.reset();
    this.notify();
  }

  public resetStatsOnly(): void {
    this.statsTracker.reset();
    this.stateMachine.logEvent(0, 'Statistics counters reset by user', 'SYSTEM', this.simTime);
    this.notify();
  }

  public clearLog(): void {
    this.stateMachine.clearEventLog();
    this.notify();
  }

  public setSpeed(multiplier: number): void {
    this.speedMultiplier = multiplier;
    this.stateMachine.logEvent(0, `Simulation speed set to ${multiplier}x`, 'SYSTEM', this.simTime);
    this.notify();
  }

  public setMode(mode: OperationMode): void {
    this.stateMachine.setMode(mode, this.simTime);
    this.notify();
  }

  public setDensity(density: TrafficDensity): void {
    this.stateMachine.setDensity(density, this.simTime);
    this.notify();
  }

  public triggerManualRoad(axis: RoadAxis): void {
    this.stateMachine.triggerManualRoad(axis, this.simTime);
    this.notify();
  }

  public requestAmbulance(direction: Direction): boolean {
    const result = this.stateMachine.handleEmergencyRequest(direction, this.simTime);
    this.notify();
    return result;
  }

  public requestPedestrian(): boolean {
    const result = this.stateMachine.handlePedestrianRequest(this.simTime);
    this.notify();
    return result;
  }

  // ================= MAIN LOOP =================

  private ensureLoopRunning(): void {
    if (typeof requestAnimationFrame === 'undefined') return;
    if (!this.animFrameId) {
      this.lastFrameTimestamp = performance.now();
      this.animFrameId = requestAnimationFrame(this.loop.bind(this));
    }
  }

  private stopLoop(): void {
    if (typeof cancelAnimationFrame === 'undefined') return;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private loop(now: number): void {
    const rawDeltaMs = now - this.lastFrameTimestamp;
    this.lastFrameTimestamp = now;

    // Guard against huge step when tab backgrounded (cap at 100ms)
    const cappedDeltaMs = Math.min(rawDeltaMs, 100);
    const deltaSimSeconds = (cappedDeltaMs / 1000) * this.speedMultiplier;

    const ctx = this.stateMachine.getContext();

    if (ctx.status === 'RUNNING') {
      this.simTime += deltaSimSeconds;
      this.statsTracker.addSimTime(deltaSimSeconds);

      // Advance State Machine Countdown
      this.stateMachine.tick(deltaSimSeconds, this.simTime);

      // Update Pedestrian agents
      this.pedestrianManager.updateAgents(deltaSimSeconds);

      // Update Vehicle Spawning and Physics
      this.updateVehicleSpawning(deltaSimSeconds);
      this.updateVehiclesPhysics(deltaSimSeconds);
    }

    this.notify();

    // Keep loop running if active or paused (for animations/rendering)
    if (ctx.status !== 'STOPPED') {
      this.animFrameId = requestAnimationFrame(this.loop.bind(this));
    } else {
      this.animFrameId = null;
    }
  }

  // ================= VEHICLE MANAGEMENT =================

  private updateVehicleSpawning(deltaSimSeconds: number): void {
    const ctx = this.stateMachine.getContext();
    const intervals = DENSITY_SPAWN_INTERVALS[ctx.density];
    const directions: Direction[] = ['NORTH', 'SOUTH', 'EAST', 'WEST'];

    // 1. Check if ambulance needs to spawn for active emergency
    if (ctx.phase === 'EMERGENCY_PRIORITY' && ctx.activeEmergencyDirection && ctx.activeEmergencyId) {
      if (this.ambulanceSpawnedForId !== ctx.activeEmergencyId) {
        this.spawnAmbulance(ctx.activeEmergencyDirection);
        this.ambulanceSpawnedForId = ctx.activeEmergencyId;
      }
    }

    // 2. Normal vehicle spawning
    for (const dir of directions) {
      this.spawnTimers[dir] -= deltaSimSeconds;
      if (this.spawnTimers[dir] <= 0) {
        // Reset timer
        const nextInterval = intervals.min + Math.random() * (intervals.max - intervals.min);
        this.spawnTimers[dir] = nextInterval;

        // Try spawning a regular vehicle
        this.spawnRegularVehicle(dir);
      }
    }
  }

  private spawnRegularVehicle(dir: Direction): void {
    // Only spawn if lane entrance has room
    const entranceClear = !this.vehicles.some((v) => {
      if (v.direction !== dir) return false;
      if (dir === 'NORTH') return v.y < 70;
      if (dir === 'SOUTH') return v.y > 530;
      if (dir === 'WEST') return v.x < 70;
      if (dir === 'EAST') return v.x > 530;
      return false;
    });

    if (!entranceClear) return;

    // Cap total active vehicles for performance and clarity
    if (this.vehicles.length >= 24) return;

    const types: Array<'sedan' | 'suv' | 'truck' | 'sport'> = ['sedan', 'suv', 'truck', 'sport'];
    const type = types[Math.floor(Math.random() * types.length)];
    const color = INTERSECTION_CONFIG.vehicleColors[Math.floor(Math.random() * INTERSECTION_CONFIG.vehicleColors.length)];

    let x = 0;
    let y = 0;
    let length = 32;
    let width = 18;
    const maxSpeed = type === 'truck' ? 95 : type === 'sport' ? 140 : 115;

    if (type === 'truck') {
      length = 44;
      width = 20;
    } else if (type === 'suv') {
      length = 36;
      width = 19;
    }

    // Coordinates for approaching lanes (right-hand drive):
    // Center is 300. Road width 160. Approaching lanes are at 260 or 340.
    switch (dir) {
      case 'NORTH':
        x = 260;
        y = -length - 10;
        break;
      case 'SOUTH':
        x = 340;
        y = 600 + length + 10;
        break;
      case 'WEST':
        x = -length - 10;
        y = 340;
        break;
      case 'EAST':
        x = 600 + length + 10;
        y = 260;
        break;
    }

    this.vehicles.push({
      id: `v-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      type,
      direction: dir,
      lane: 0,
      x,
      y,
      speed: maxSpeed * 0.8,
      targetSpeed: maxSpeed,
      color,
      length,
      width,
      isAmbulance: false,
      hasCrossed: false,
      stopped: false,
    });
  }

  private spawnAmbulance(dir: Direction): void {
    let x = 0;
    let y = 0;
    const length = 42;
    const width = 20;
    const maxSpeed = 190; // High speed emergency vehicle

    switch (dir) {
      case 'NORTH':
        x = 260;
        y = -length - 20;
        break;
      case 'SOUTH':
        x = 340;
        y = 600 + length + 20;
        break;
      case 'WEST':
        x = -length - 20;
        y = 340;
        break;
      case 'EAST':
        x = 600 + length + 20;
        y = 260;
        break;
    }

    // Unshift to process ambulance first
    this.vehicles.unshift({
      id: `amb-vehicle-${Date.now()}`,
      type: 'ambulance',
      direction: dir,
      lane: 0,
      x,
      y,
      speed: maxSpeed,
      targetSpeed: maxSpeed,
      color: '#ffffff',
      length,
      width,
      isAmbulance: true,
      hasCrossed: false,
      stopped: false,
    });
  }

  private updateVehiclesPhysics(deltaSimSeconds: number): void {
    const ctx = this.stateMachine.getContext();
    const signals = getSignalStateForPhase(
      ctx.phase,
      ctx.activeEmergencyAxis ?? undefined,
      ctx.activeEmergencyDirection ?? undefined
    );

    // Stop lines (where front of vehicle must wait before entering intersection)
    const stopLines = {
      NORTH: 210, // y coordinate (driving South)
      SOUTH: 390, // y coordinate (driving North)
      WEST: 210,  // x coordinate (driving East)
      EAST: 390,  // x coordinate (driving West)
    };

    const remainingVehicles: Vehicle[] = [];

    // Sort vehicles in each direction by progress so leading cars are processed first
    const sortedVehicles = [...this.vehicles].sort((a, b) => {
      if (a.direction !== b.direction) return 0;
      switch (a.direction) {
        case 'NORTH': return b.y - a.y; // larger y is further ahead
        case 'SOUTH': return a.y - b.y; // smaller y is further ahead
        case 'WEST':  return b.x - a.x; // larger x is further ahead
        case 'EAST':  return a.x - b.x; // smaller x is further ahead
      }
    });

    for (let i = 0; i < sortedVehicles.length; i++) {
      const v = sortedVehicles[i];

      // Signal for this vehicle
      const light: LightColor =
        v.direction === 'NORTH' || v.direction === 'SOUTH' ? signals.nsLight : signals.ewLight;

      // Check distance to preceding car in same direction
      let distToCarAhead = Infinity;
      for (let j = 0; j < i; j++) {
        const lead = sortedVehicles[j];
        if (lead.direction === v.direction) {
          switch (v.direction) {
            case 'NORTH':
              distToCarAhead = lead.y - lead.length / 2 - (v.y + v.length / 2);
              break;
            case 'SOUTH':
              distToCarAhead = (v.y - v.length / 2) - (lead.y + lead.length / 2);
              break;
            case 'WEST':
              distToCarAhead = lead.x - lead.length / 2 - (v.x + v.length / 2);
              break;
            case 'EAST':
              distToCarAhead = (v.x - v.length / 2) - (lead.x + lead.length / 2);
              break;
          }
          break; // closest leading car found
        }
      }

      // Check distance to stop line
      let distToStopLine = Infinity;
      switch (v.direction) {
        case 'NORTH':
          distToStopLine = stopLines.NORTH - (v.y + v.length / 2);
          break;
        case 'SOUTH':
          distToStopLine = (v.y - v.length / 2) - stopLines.SOUTH;
          break;
        case 'WEST':
          distToStopLine = stopLines.WEST - (v.x + v.length / 2);
          break;
        case 'EAST':
          distToStopLine = (v.x - v.length / 2) - stopLines.EAST;
          break;
      }

      // Determine if vehicle must stop
      let shouldStop = false;

      // 1. If too close to leading car (safe buffer: 18px)
      if (distToCarAhead < 20) {
        shouldStop = true;
      }

      // 2. Traffic signal check (if not yet past stop line)
      if (!v.hasCrossed && distToStopLine >= -5) {
        if (v.isAmbulance) {
          // Ambulance can proceed if its direction is granted priority
          if (light !== 'GREEN') {
            shouldStop = false; // Emergency vehicle bypasses if needed, but in our state machine light is GREEN for ambulance
          }
        } else {
          // Regular vehicle
          if (light === 'RED') {
            if (distToStopLine < 45) {
              shouldStop = true;
            }
          } else if (light === 'YELLOW') {
            // Stop if far enough from stop line, otherwise clear through
            if (distToStopLine > 25) {
              shouldStop = true;
            }
          }
        }
      }

      // Smooth acceleration / deceleration
      const accel = 180; // px/s^2
      const decel = 240; // px/s^2

      if (shouldStop) {
        v.stopped = true;
        v.speed = Math.max(0, v.speed - decel * deltaSimSeconds);
      } else {
        v.stopped = false;
        v.speed = Math.min(v.targetSpeed, v.speed + accel * deltaSimSeconds);
      }

      // Move vehicle according to speed
      const moveDist = v.speed * deltaSimSeconds;
      switch (v.direction) {
        case 'NORTH':
          v.y += moveDist;
          if (v.y > stopLines.NORTH + 30) v.hasCrossed = true;
          break;
        case 'SOUTH':
          v.y -= moveDist;
          if (v.y < stopLines.SOUTH - 30) v.hasCrossed = true;
          break;
        case 'WEST':
          v.x += moveDist;
          if (v.x > stopLines.WEST + 30) v.hasCrossed = true;
          break;
        case 'EAST':
          v.x -= moveDist;
          if (v.x < stopLines.EAST - 30) v.hasCrossed = true;
          break;
      }

      // Check if vehicle has exited the screen boundaries
      let hasExited = false;
      switch (v.direction) {
        case 'NORTH':
          hasExited = v.y > 600 + v.length + 30;
          break;
        case 'SOUTH':
          hasExited = v.y < -v.length - 30;
          break;
        case 'WEST':
          hasExited = v.x > 600 + v.length + 30;
          break;
        case 'EAST':
          hasExited = v.x < -v.length - 30;
          break;
      }

      if (hasExited) {
        if (!v.isAmbulance) {
          this.statsTracker.recordVehiclePassed();
        }
      } else {
        remainingVehicles.push(v);
      }
    }

    this.vehicles = remainingVehicles;
  }
}
