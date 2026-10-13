import { Direction, SimulationStatistics } from '../types';

export class StatisticsTracker {
  private stats: SimulationStatistics = {
    normalCycles: 0,
    northAmbulance: 0,
    southAmbulance: 0,
    eastAmbulance: 0,
    westAmbulance: 0,
    totalAmbulance: 0,
    pedestrianRequests: 0,
    completedCrossings: 0,
    phaseTransitions: 0,
    vehiclesPassed: 0,
    totalSimTime: 0,
    emergencyWaitTimes: [],
    avgEmergencyResponseTime: 0,
  };

  public getStats(): SimulationStatistics {
    return { ...this.stats, emergencyWaitTimes: [...this.stats.emergencyWaitTimes] };
  }

  public recordNormalCycle(): void {
    this.stats.normalCycles += 1;
  }

  public recordAmbulanceRequest(direction: Direction): void {
    switch (direction) {
      case 'NORTH':
        this.stats.northAmbulance += 1;
        break;
      case 'SOUTH':
        this.stats.southAmbulance += 1;
        break;
      case 'EAST':
        this.stats.eastAmbulance += 1;
        break;
      case 'WEST':
        this.stats.westAmbulance += 1;
        break;
    }
    // As per Assembly: total_ambulance = north + south + east + west
    this.stats.totalAmbulance =
      this.stats.northAmbulance +
      this.stats.southAmbulance +
      this.stats.eastAmbulance +
      this.stats.westAmbulance;
  }

  public recordEmergencyResponseTime(seconds: number): void {
    this.stats.emergencyWaitTimes.push(seconds);
    const sum = this.stats.emergencyWaitTimes.reduce((a, b) => a + b, 0);
    this.stats.avgEmergencyResponseTime = Number((sum / this.stats.emergencyWaitTimes.length).toFixed(1));
  }

  public recordPedestrianRequest(): void {
    this.stats.pedestrianRequests += 1;
  }

  public recordPedestrianCrossingCompleted(): void {
    this.stats.completedCrossings += 1;
  }

  public recordPhaseTransition(): void {
    this.stats.phaseTransitions += 1;
  }

  public recordVehiclePassed(): void {
    this.stats.vehiclesPassed += 1;
  }

  public addSimTime(deltaSeconds: number): void {
    this.stats.totalSimTime += deltaSeconds;
  }

  public reset(): void {
    this.stats = {
      normalCycles: 0,
      northAmbulance: 0,
      southAmbulance: 0,
      eastAmbulance: 0,
      westAmbulance: 0,
      totalAmbulance: 0,
      pedestrianRequests: 0,
      completedCrossings: 0,
      phaseTransitions: 0,
      vehiclesPassed: 0,
      totalSimTime: 0,
      emergencyWaitTimes: [],
      avgEmergencyResponseTime: 0,
    };
  }
}
