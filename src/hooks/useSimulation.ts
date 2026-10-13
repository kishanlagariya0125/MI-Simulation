import { useEffect, useState, useMemo, useCallback } from 'react';
import { SimulationEngine, EngineSnapshot } from '../simulation/simulationEngine';
import { Direction, OperationMode, RoadAxis, TrafficDensity } from '../types';
import { soundEffects } from '../simulation/soundEffects';

let globalEngineInstance: SimulationEngine | null = null;

export function getEngineInstance(): SimulationEngine {
  if (!globalEngineInstance) {
    globalEngineInstance = new SimulationEngine();
  }
  return globalEngineInstance;
}

export function useSimulation() {
  const engine = useMemo(() => getEngineInstance(), []);
  const [snapshot, setSnapshot] = useState<EngineSnapshot>(() => engine.getSnapshot());
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEffects.getMuted());

  useEffect(() => {
    const unsubscribe = engine.subscribe((newSnapshot) => {
      setSnapshot(newSnapshot);
    });
    return () => {
      unsubscribe();
    };
  }, [engine]);

  const toggleSound = useCallback(() => {
    const newState = soundEffects.toggleMute();
    setIsMuted(newState);
  }, []);

  const start = useCallback(() => engine.start(), [engine]);
  const pause = useCallback(() => engine.pause(), [engine]);
  const resume = useCallback(() => engine.resume(), [engine]);
  const stop = useCallback(() => engine.stop(), [engine]);
  const reset = useCallback(() => engine.reset(), [engine]);
  const resetStats = useCallback(() => engine.resetStatsOnly(), [engine]);
  const clearLog = useCallback(() => engine.clearLog(), [engine]);
  const setMode = useCallback((m: OperationMode) => engine.setMode(m), [engine]);
  const setDensity = useCallback((d: TrafficDensity) => engine.setDensity(d), [engine]);
  const setSpeed = useCallback((s: number) => engine.setSpeed(s), [engine]);
  const triggerManualRoad = useCallback((axis: RoadAxis) => engine.triggerManualRoad(axis), [engine]);
  const requestAmbulance = useCallback((dir: Direction) => engine.requestAmbulance(dir), [engine]);
  const requestPedestrian = useCallback(() => engine.requestPedestrian(), [engine]);

  return {
    ...snapshot,
    isMuted,
    toggleSound,
    start,
    pause,
    resume,
    stop,
    reset,
    resetStats,
    clearLog,
    setMode,
    setDensity,
    setSpeed,
    triggerManualRoad,
    requestAmbulance,
    requestPedestrian,
  };
}
