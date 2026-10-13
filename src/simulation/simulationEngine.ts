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
    this.stopLoop();
    this.notify();
  }

  public resume(): void {
    this.stateMachine.resume(this.simTime);
    if (typeof performance !== 'undefined') {
      this.lastFrameTimestamp = performance.now();
    }
    this.ensureLoopRunning();
    this.notify();
  }

  public stop(): void {
    this.stateMachine.stop(this.simTime);
    this.stopLoop();
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

    if (ctx.status === 'RUNNING') {
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

    // Cap total active vehicles for performance and visual clarity
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
    switch (dir) {
      case 'NORTH':
        x = 260;
        y = -length - 15;
        break;
      case 'SOUTH':
        x = 340;
        y = 600 + length + 15;
        break;
      case 'WEST':
        x = -length - 15;
        y = 340;
        break;
      case 'EAST':
        x = 600 + length + 15;
        y = 260;
        break;
    }

    this.vehicles.push({
      id: `v-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      type,
      direction: dir,
      lane: 0,
      x,
      y,
      speed: maxSpeed * 0.75,
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
    const length = 44;
    const width = 20;
    const maxSpeed = 185; // High speed emergency vehicle

    // Place ambulance behind any existing vehicles in that corridor
    const inLane = this.vehicles.filter((v) => v.direction === dir);
    let x = 0;
    let y = 0;

    switch (dir) {
      case 'NORTH': {
        x = 260;
        const minY = inLane.reduce((min, v) => Math.min(min, v.y - v.length / 2), 0);
        y = Math.min(-length - 20, minY - length - 25);
        break;
      }
      case 'SOUTH': {
        x = 340;
        const maxY = inLane.reduce((max, v) => Math.max(max, v.y + v.length / 2), 600);
        y = Math.max(600 + length + 20, maxY + length + 25);
        break;
      }
      case 'WEST': {
        y = 340;
        const minX = inLane.reduce((min, v) => Math.min(min, v.x - v.length / 2), 0);
        x = Math.min(-length - 20, minX - length - 25);
        break;
      }
      case 'EAST': {
        y = 260;
        const maxX = inLane.reduce((max, v) => Math.max(max, v.x + v.length / 2), 600);
        x = Math.max(600 + length + 20, maxX + length + 25);
        break;
      }
    }

    this.vehicles.push({
      id: `amb-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      type: 'ambulance',
      direction: dir,
      lane: 0,
      x,
      y,
      speed: maxSpeed * 0.75,
      targetSpeed: maxSpeed,
      color: '#FFFFFF',
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

    // Stop lines (where front bumper must stop before entering intersection)
    const STOP_LINES = {
      NORTH: 210, // Driving South (+y)
      SOUTH: 390, // Driving North (-y)
      WEST: 210,  // Driving East (+x)
      EAST: 390,  // Driving West (-x)
    };

    const TARGET_STOP_MARGIN = 6; // px before stop line
    const MIN_GAP = 18;           // Minimum bumper-to-bumper buffer (px)
    const COMFORT_ACCEL = 140;    // px/s^2 smooth acceleration
    const COMFORT_DECEL = 220;    // px/s^2 smooth deceleration
    const HARD_DECEL = 380;       // px/s^2 urgent braking when close to obstacle

    // Group vehicles by travel direction
    const byDir: Record<Direction, Vehicle[]> = {
      NORTH: [],
      SOUTH: [],
      EAST: [],
      WEST: [],
    };

    for (const v of this.vehicles) {
      byDir[v.direction].push(v);
    }

    // Sort queues so index 0 is always the leading vehicle furthest along the road
    byDir.NORTH.sort((a, b) => b.y - a.y);
    byDir.SOUTH.sort((a, b) => a.y - b.y);
    byDir.WEST.sort((a, b) => b.x - a.x);
    byDir.EAST.sort((a, b) => a.x - b.x);

    const getFrontBumper = (v: Vehicle): number => {
      switch (v.direction) {
        case 'NORTH': return v.y + v.length / 2;
        case 'SOUTH': return v.y - v.length / 2;
        case 'WEST':  return v.x + v.length / 2;
        case 'EAST':  return v.x - v.length / 2;
      }
    };

    const getRearBumper = (v: Vehicle): number => {
      switch (v.direction) {
        case 'NORTH': return v.y - v.length / 2;
        case 'SOUTH': return v.y + v.length / 2;
        case 'WEST':  return v.x - v.length / 2;
        case 'EAST':  return v.x + v.length / 2;
      }
    };

    const getDistToStopLine = (v: Vehicle): number => {
      const front = getFrontBumper(v);
      switch (v.direction) {
        case 'NORTH': return (STOP_LINES.NORTH - TARGET_STOP_MARGIN) - front;
        case 'SOUTH': return front - (STOP_LINES.SOUTH + TARGET_STOP_MARGIN);
        case 'WEST':  return (STOP_LINES.WEST - TARGET_STOP_MARGIN) - front;
        case 'EAST':  return front - (STOP_LINES.EAST + TARGET_STOP_MARGIN);
      }
    };

    const getBumperGap = (lead: Vehicle, follower: Vehicle): number => {
      const leadRear = getRearBumper(lead);
      const followerFront = getFrontBumper(follower);
      switch (follower.direction) {
        case 'NORTH': return leadRear - followerFront;
        case 'SOUTH': return followerFront - leadRear;
        case 'WEST':  return leadRear - followerFront;
        case 'EAST':  return followerFront - leadRear;
      }
    };

    const clampBehindLead = (follower: Vehicle, lead: Vehicle) => {
      const leadRear = getRearBumper(lead);
      const halfL = follower.length / 2;
      switch (follower.direction) {
        case 'NORTH':
          if (follower.y + halfL > leadRear - MIN_GAP) {
            follower.y = leadRear - MIN_GAP - halfL;
          }
          break;
        case 'SOUTH':
          if (follower.y - halfL < leadRear + MIN_GAP) {
            follower.y = leadRear + MIN_GAP + halfL;
          }
          break;
        case 'WEST':
          if (follower.x + halfL > leadRear - MIN_GAP) {
            follower.x = leadRear - MIN_GAP - halfL;
          }
          break;
        case 'EAST':
          if (follower.x - halfL < leadRear + MIN_GAP) {
            follower.x = leadRear + MIN_GAP + halfL;
          }
          break;
      }
    };

    const clampAtStopLine = (v: Vehicle) => {
      const halfL = v.length / 2;
      switch (v.direction) {
        case 'NORTH':
          if (v.y + halfL > STOP_LINES.NORTH - TARGET_STOP_MARGIN) {
            v.y = STOP_LINES.NORTH - TARGET_STOP_MARGIN - halfL;
          }
          break;
        case 'SOUTH':
          if (v.y - halfL < STOP_LINES.SOUTH + TARGET_STOP_MARGIN) {
            v.y = STOP_LINES.SOUTH + TARGET_STOP_MARGIN + halfL;
          }
          break;
        case 'WEST':
          if (v.x + halfL > STOP_LINES.WEST - TARGET_STOP_MARGIN) {
            v.x = STOP_LINES.WEST - TARGET_STOP_MARGIN - halfL;
          }
          break;
        case 'EAST':
          if (v.x - halfL < STOP_LINES.EAST + TARGET_STOP_MARGIN) {
            v.x = STOP_LINES.EAST + TARGET_STOP_MARGIN + halfL;
          }
          break;
      }
    };

    const remainingVehicles: Vehicle[] = [];
    const directions: Direction[] = ['NORTH', 'SOUTH', 'EAST', 'WEST'];

    for (const dir of directions) {
      const queue = byDir[dir];
      const light: LightColor = (dir === 'NORTH' || dir === 'SOUTH') ? signals.nsLight : signals.ewLight;

      for (let i = 0; i < queue.length; i++) {
        const v = queue[i];
        const distToStop = getDistToStopLine(v);
        let desiredSpeed = v.targetSpeed;
        let isEmergencyBraking = false;

        // 1. CAR-FOLLOWING MODEL (Behind lead vehicle in same lane)
        let gapToLead = Infinity;
        if (i > 0) {
          const lead = queue[i - 1];
          gapToLead = getBumperGap(lead, v);

          if (gapToLead <= MIN_GAP + 2) {
            desiredSpeed = 0;
            isEmergencyBraking = true;
          } else if (gapToLead < MIN_GAP + 90) {
            const gapRatio = Math.max(0, (gapToLead - MIN_GAP) / 90);
            const followSpeed = Math.min(lead.speed, desiredSpeed) * gapRatio;
            desiredSpeed = Math.min(desiredSpeed, followSpeed);
          }
        }

        // 2. TRAFFIC SIGNAL LOGIC
        if (!v.hasCrossed) {
          if (light === 'GREEN') {
            // Signal green: proceed normally. Front bumper passing stop line enters intersection
            if (distToStop <= 0) {
              v.hasCrossed = true;
            }
          } else if (light === 'YELLOW') {
            // Yellow clearance interval: clear if close, else decelerate smoothly
            if (distToStop < 40 && v.speed > 50) {
              if (distToStop <= 0) {
                v.hasCrossed = true;
              }
            } else {
              if (distToStop <= 0) {
                desiredSpeed = 0;
                isEmergencyBraking = true;
              } else if (distToStop < 110) {
                desiredSpeed = Math.min(desiredSpeed, v.targetSpeed * Math.max(0, distToStop / 110));
              }
            }
          } else {
            // Red light: stop safely before stop line
            if (distToStop <= 0) {
              desiredSpeed = 0;
              isEmergencyBraking = true;
            } else if (distToStop < 120) {
              desiredSpeed = Math.min(desiredSpeed, v.targetSpeed * Math.max(0, distToStop / 120));
            }
          }
        }

        // 3. CONTINUOUS DELTA-TIME ACCELERATION / DECELERATION
        if (v.speed < desiredSpeed) {
          v.speed = Math.min(desiredSpeed, v.speed + COMFORT_ACCEL * deltaSimSeconds);
        } else if (v.speed > desiredSpeed) {
          const decel = isEmergencyBraking ? HARD_DECEL : COMFORT_DECEL;
          v.speed = Math.max(desiredSpeed, v.speed - decel * deltaSimSeconds);
        }

        // Stopped indicator
        if (v.speed < 1.0 && desiredSpeed === 0) {
          v.speed = 0;
          v.stopped = true;
        } else {
          v.stopped = false;
        }

        // 4. POSITION INTERPOLATION (Delta-time based)
        const moveDist = v.speed * deltaSimSeconds;
        switch (v.direction) {
          case 'NORTH': v.y += moveDist; break;
          case 'SOUTH': v.y -= moveDist; break;
          case 'WEST':  v.x += moveDist; break;
          case 'EAST':  v.x -= moveDist; break;
        }

        // 5. HARD RESTRAINT CLAMPS (Zero overlap / zero red light creeping)
        if (!v.hasCrossed && light !== 'GREEN' && getDistToStopLine(v) <= 0) {
          clampAtStopLine(v);
          v.speed = 0;
          v.stopped = true;
        }

        if (i > 0) {
          const lead = queue[i - 1];
          if (getBumperGap(lead, v) < MIN_GAP) {
            clampBehindLead(v, lead);
            v.speed = 0;
            v.stopped = true;
          }
        }

        // 6. SCREEN BOUNDARY & EXIT CHECK
        let hasExited = false;
        switch (v.direction) {
          case 'NORTH': hasExited = (v.y - v.length / 2) > 630; break;
          case 'SOUTH': hasExited = (v.y + v.length / 2) < -30; break;
          case 'WEST':  hasExited = (v.x - v.length / 2) > 630; break;
          case 'EAST':  hasExited = (v.x + v.length / 2) < -30; break;
        }

        if (hasExited) {
          if (!v.isAmbulance) {
            this.statsTracker.recordVehiclePassed();
          }
        } else {
          remainingVehicles.push(v);
        }
      }
    }

    this.vehicles = remainingVehicles;
  }
}
