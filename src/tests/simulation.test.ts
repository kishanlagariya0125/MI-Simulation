import { describe, it, expect, beforeEach } from 'vitest';
import { SimulationEngine } from '../simulation/simulationEngine';
import { validateSignalSafety, getSignalStateForPhase } from '../simulation/trafficRules';
import { DEFAULT_TIMING_CONFIG } from '../config';

describe('Smart Ambulance Traffic Light Controller - Automated Test Suite', () => {
  let engine: SimulationEngine;

  beforeEach(() => {
    engine = new SimulationEngine();
  });

  // TEST A — AUTOMATIC TRAFFIC
  it('TEST A — AUTOMATIC TRAFFIC: completes North/South and East/West cycle', () => {
    engine.start();
    let snap = engine.getSnapshot();
    expect(snap.status).toBe('RUNNING');
    expect(snap.phase).toBe('ALL_RED');

    const sm = engine.getStateMachine();

    // 1. Advance through initial ALL_RED (1s)
    sm.tick(1.1, 1.1);
    snap = engine.getSnapshot();
    expect(snap.phase).toBe('NS_GREEN');
    expect(snap.signals.nsLight).toBe('GREEN');
    expect(snap.signals.ewLight).toBe('RED');
    expect(validateSignalSafety(snap.signals)).toBe(true);

    // 2. Advance through NS_GREEN (Medium density = 8s)
    sm.tick(8.1, 9.2);
    snap = engine.getSnapshot();
    expect(snap.phase).toBe('NS_YELLOW');
    expect(snap.signals.nsLight).toBe('YELLOW');
    expect(snap.signals.ewLight).toBe('RED');
    expect(validateSignalSafety(snap.signals)).toBe(true);

    // 3. Advance through NS_YELLOW (2s)
    sm.tick(2.1, 11.3);
    snap = engine.getSnapshot();
    expect(snap.phase).toBe('ALL_RED');
    expect(snap.signals.nsLight).toBe('RED');
    expect(snap.signals.ewLight).toBe('RED');

    // 4. Advance through ALL_RED (1s)
    sm.tick(1.1, 12.4);
    snap = engine.getSnapshot();
    expect(snap.phase).toBe('EW_GREEN');
    expect(snap.signals.nsLight).toBe('RED');
    expect(snap.signals.ewLight).toBe('GREEN');
    expect(validateSignalSafety(snap.signals)).toBe(true);

    // 5. Advance through EW_GREEN (8s)
    sm.tick(8.1, 20.5);
    snap = engine.getSnapshot();
    expect(snap.phase).toBe('EW_YELLOW');
    expect(snap.signals.nsLight).toBe('RED');
    expect(snap.signals.ewLight).toBe('YELLOW');

    // 6. Advance through EW_YELLOW (2s)
    sm.tick(2.1, 22.6);
    snap = engine.getSnapshot();
    expect(snap.phase).toBe('ALL_RED');

    // 7. Advance through ALL_RED (1s) -> Completes cycle, starts NS_GREEN
    sm.tick(1.1, 23.7);
    snap = engine.getSnapshot();
    expect(snap.phase).toBe('NS_GREEN');
    expect(snap.statistics.normalCycles).toBe(1);
  });

  // TEST B — TRAFFIC DENSITY
  it('TEST B — TRAFFIC DENSITY: configures correct green durations for Low, Med, High', () => {
    engine.start();
    const sm = engine.getStateMachine();

    // Test Low Density (5s)
    engine.setDensity('LOW');
    sm.transitionTo('NS_GREEN', DEFAULT_TIMING_CONFIG.densityDurations.LOW, 1.0);
    expect(engine.getSnapshot().phaseTotalDuration).toBe(5);

    // Test Medium Density (8s)
    engine.setDensity('MEDIUM');
    sm.transitionTo('NS_GREEN', DEFAULT_TIMING_CONFIG.densityDurations.MEDIUM, 2.0);
    expect(engine.getSnapshot().phaseTotalDuration).toBe(8);

    // Test High Density (12s)
    engine.setDensity('HIGH');
    sm.transitionTo('NS_GREEN', DEFAULT_TIMING_CONFIG.densityDurations.HIGH, 3.0);
    expect(engine.getSnapshot().phaseTotalDuration).toBe(12);
  });

  // TEST C — MANUAL MODE
  it('TEST C — MANUAL MODE: allows safe manual road selection without conflicting greens', () => {
    engine.start();
    engine.setMode('MANUAL');
    const sm = engine.getStateMachine();

    // Request North/South
    engine.triggerManualRoad('NS');
    sm.tick(1.5, 2.0); // pass initial all-red if needed
    let snap = engine.getSnapshot();
    expect(snap.signals.nsLight).toBe('GREEN');
    expect(snap.signals.ewLight).toBe('RED');

    // Request East/West while NS is GREEN -> Must safely transition NS to YELLOW first!
    engine.triggerManualRoad('EW');
    snap = engine.getSnapshot();
    expect(snap.phase).toBe('NS_YELLOW');
    expect(snap.signals.nsLight).toBe('YELLOW');
    expect(snap.signals.ewLight).toBe('RED');
    expect(validateSignalSafety(snap.signals)).toBe(true);

    // Pass yellow (2s) -> ALL_RED (1s) -> EW_GREEN
    sm.tick(2.1, 4.2);
    expect(engine.getSnapshot().phase).toBe('ALL_RED');

    sm.tick(1.1, 5.3);
    snap = engine.getSnapshot();
    expect(snap.signals.ewLight).toBe('GREEN');
    expect(snap.signals.nsLight).toBe('RED');
    expect(validateSignalSafety(snap.signals)).toBe(true);
  });

  // TEST D — AMBULANCE FROM EACH DIRECTION
  it('TEST D — AMBULANCE FROM EACH DIRECTION: tests all 4 directions individually', () => {
    engine.start();

    // 1. North Ambulance
    engine.requestAmbulance('NORTH');
    let snap = engine.getSnapshot();
    expect(snap.statistics.northAmbulance).toBe(1);
    expect(snap.statistics.totalAmbulance).toBe(1);

    // 2. South Ambulance
    engine.requestAmbulance('SOUTH');
    snap = engine.getSnapshot();
    expect(snap.statistics.southAmbulance).toBe(1);
    expect(snap.statistics.totalAmbulance).toBe(2);

    // 3. East Ambulance
    engine.requestAmbulance('EAST');
    snap = engine.getSnapshot();
    expect(snap.statistics.eastAmbulance).toBe(1);
    expect(snap.statistics.totalAmbulance).toBe(3);

    // 4. West Ambulance
    engine.requestAmbulance('WEST');
    snap = engine.getSnapshot();
    expect(snap.statistics.westAmbulance).toBe(1);
    expect(snap.statistics.totalAmbulance).toBe(4);
  });

  // TEST E — MULTIPLE AMBULANCES
  it('TEST E — MULTIPLE AMBULANCES: queues and processes multiple emergency requests', () => {
    engine.start();
    const sm = engine.getStateMachine();

    engine.requestAmbulance('NORTH');
    engine.requestAmbulance('EAST');
    engine.requestAmbulance('SOUTH');

    let snap = engine.getSnapshot();
    expect(snap.pendingAmbulances.length).toBe(3);

    // Advance to process North ambulance
    sm.tick(1.5, 2.0); // safety all-red
    snap = engine.getSnapshot();
    expect(snap.phase).toBe('EMERGENCY_PRIORITY');
    expect(snap.signals.emergencyDirection).toBe('NORTH');
    expect(snap.signals.nsLight).toBe('GREEN');
    expect(snap.signals.ewLight).toBe('RED');

    // Advance North priority duration (5s)
    sm.tick(5.1, 7.1);
    snap = engine.getSnapshot();
    expect(snap.phase).toBe('ALL_RED'); // safety state between emergencies

    // Advance 1s all-red -> Next emergency (EAST) is granted!
    sm.tick(1.1, 8.2);
    snap = engine.getSnapshot();
    expect(snap.phase).toBe('EMERGENCY_PRIORITY');
    expect(snap.signals.emergencyDirection).toBe('EAST');
    expect(snap.signals.ewLight).toBe('GREEN');
    expect(snap.signals.nsLight).toBe('RED');
  });

  // TEST F — PEDESTRIAN CROSSING
  it('TEST F — PEDESTRIAN CROSSING: halts conflicting vehicles and activates walk phase', () => {
    engine.start();
    const sm = engine.getStateMachine();

    engine.requestPedestrian();
    expect(engine.getSnapshot().pendingPedestriansCount).toBe(1);

    // Finish initial all-red (1s) to enter pedestrian crossing
    sm.tick(1.1, 1.2);
    const snap = engine.getSnapshot();
    expect(snap.phase).toBe('PEDESTRIAN_CROSSING');
    expect(snap.signals.pedestrianWalkActive).toBe(true);
    expect(snap.signals.nsLight).toBe('RED');
    expect(snap.signals.ewLight).toBe('RED');
    expect(validateSignalSafety(snap.signals)).toBe(true);

    // Complete 5s walk phase
    sm.tick(5.1, 6.3);
    expect(engine.getSnapshot().phase).toBe('ALL_RED');
    expect(engine.getSnapshot().statistics.completedCrossings).toBe(1);
  });

  // TEST G — EMERGENCY DURING NORMAL TRAFFIC
  it('TEST G — EMERGENCY DURING NORMAL TRAFFIC: safely cuts conflicting green to yellow then all-red', () => {
    engine.start();
    const sm = engine.getStateMachine();

    // Put into EW_GREEN
    sm.transitionTo('EW_GREEN', 8.0, 10.0);
    expect(engine.getSnapshot().signals.ewLight).toBe('GREEN');

    // North ambulance arrives (conflicting movement)
    engine.requestAmbulance('NORTH');

    // EW_GREEN must be shortened to EW_YELLOW immediately!
    const snap = engine.getSnapshot();
    expect(snap.phase).toBe('EW_YELLOW');
    expect(snap.signals.ewLight).toBe('YELLOW');
    expect(snap.signals.nsLight).toBe('RED');
  });

  // TEST H — PAUSE AND RESUME
  it('TEST H — PAUSE AND RESUME: freezes time on pause and resumes on resume', () => {
    engine.start();
    const sm = engine.getStateMachine();
    sm.transitionTo('NS_GREEN', 8.0, 1.0);

    engine.pause();
    expect(engine.getSnapshot().status).toBe('PAUSED');

    // Advance ticks while paused
    sm.tick(2.0, 3.0);
    // Time remaining should NOT decrease
    expect(engine.getSnapshot().phaseRemainingTime).toBe(8.0);

    engine.resume();
    expect(engine.getSnapshot().status).toBe('RUNNING');
    sm.tick(2.0, 5.0);
    expect(engine.getSnapshot().phaseRemainingTime).toBe(6.0);
  });

  // TEST I — RESET
  it('TEST I — RESET: cleanly resets timers, requests, and state to initial', () => {
    engine.start();
    engine.requestAmbulance('NORTH');
    engine.requestPedestrian();
    engine.reset();

    const snap = engine.getSnapshot();
    expect(snap.status).toBe('STOPPED');
    expect(snap.phase).toBe('IDLE');
    expect(snap.pendingAmbulances.length).toBe(0);
    expect(snap.pendingPedestriansCount).toBe(0);
    expect(snap.signals.nsLight).toBe('RED');
    expect(snap.signals.ewLight).toBe('RED');
  });

  // TEST J — STATISTICS
  it('TEST J — STATISTICS: verifies total ambulance equals sum of directional counts', () => {
    engine.start();
    engine.requestAmbulance('NORTH');
    engine.requestAmbulance('SOUTH');
    engine.requestAmbulance('EAST');
    engine.requestAmbulance('WEST');
    engine.getStatsTracker().recordAmbulanceRequest('NORTH');

    const stats = engine.getSnapshot().statistics;
    expect(stats.totalAmbulance).toBe(
      stats.northAmbulance + stats.southAmbulance + stats.eastAmbulance + stats.westAmbulance
    );
    expect(stats.totalAmbulance).toBe(5);
    expect(stats.northAmbulance).toBe(2);
    expect(stats.southAmbulance).toBe(1);
    expect(stats.eastAmbulance).toBe(1);
    expect(stats.westAmbulance).toBe(1);
  });

  // TEST K — WORKFLOW
  it('TEST K — WORKFLOW: planned next phase reflects accurate state transitions', () => {
    engine.start();
    const sm = engine.getStateMachine();

    sm.transitionTo('NS_GREEN', 8.0, 1.0);
    expect(engine.getSnapshot().nextPlannedPhase).toBe('NS_YELLOW');

    sm.transitionTo('NS_YELLOW', 2.0, 9.0);
    expect(engine.getSnapshot().nextPlannedPhase).toBe('ALL_RED');
  });

  // TEST L — INVALID INPUTS AND DEBOUNCING
  it('TEST L — INVALID INPUTS: debounces double clicks within threshold', () => {
    engine.start();
    // Simulate instantaneous double clicks for same direction
    const firstReq = engine.getEmergencyManager().enqueueRequest('NORTH', 1.0);
    expect(firstReq).not.toBeNull();

    const secondImmediateReq = engine.getEmergencyManager().enqueueRequest('NORTH', 1.0);
    // Should be debounced within 300ms
    expect(secondImmediateReq).toBeNull();
  });

  // TEST M — STOP
  it('TEST M — STOP: sets all directions to RED while preserving event log and stats', () => {
    engine.start();
    engine.requestAmbulance('SOUTH');
    engine.stop();

    const snap = engine.getSnapshot();
    expect(snap.status).toBe('STOPPED');
    expect(snap.signals.nsLight).toBe('RED');
    expect(snap.signals.ewLight).toBe('RED');
    expect(snap.statistics.totalAmbulance).toBe(1);
    expect(snap.eventLog.length).toBeGreaterThan(0);
  });
});
