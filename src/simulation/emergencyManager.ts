import { Direction, EmergencyRequest, RoadAxis } from '../types';

export class EmergencyManager {
  private queue: EmergencyRequest[] = [];
  private lastRequestTimeByDir: Record<Direction, number> = {
    NORTH: 0,
    SOUTH: 0,
    EAST: 0,
    WEST: 0,
  };

  public static getAxisForDirection(direction: Direction): RoadAxis {
    return direction === 'NORTH' || direction === 'SOUTH' ? 'NS' : 'EW';
  }

  public static getEventCodeForDirection(direction: Direction): number {
    switch (direction) {
      case 'NORTH': return 2; // Assembly: Event code 2
      case 'SOUTH': return 3; // Assembly: Event code 3
      case 'EAST':  return 4; // Assembly: Event code 4
      case 'WEST':  return 5; // Assembly: Event code 5
    }
  }

  /**
   * Enqueues an ambulance request. Prevents accidental double-clicks within 300ms.
   * Returns the new request or null if debounced.
   */
  public enqueueRequest(direction: Direction, currentSimTime: number): EmergencyRequest | null {
    const now = Date.now();
    if (now - this.lastRequestTimeByDir[direction] < 300) {
      return null;
    }
    this.lastRequestTimeByDir[direction] = now;

    const request: EmergencyRequest = {
      id: `amb-${direction.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      direction,
      axis: EmergencyManager.getAxisForDirection(direction),
      requestedAt: currentSimTime,
      status: 'PENDING',
    };

    this.queue.push(request);
    return request;
  }

  public hasPendingRequests(): boolean {
    return this.queue.some((r) => r.status === 'PENDING');
  }

  public getNextPendingRequest(): EmergencyRequest | undefined {
    return this.queue.find((r) => r.status === 'PENDING');
  }

  public getPendingQueue(): EmergencyRequest[] {
    return this.queue.filter((r) => r.status === 'PENDING');
  }

  public markActive(id: string): EmergencyRequest | undefined {
    const req = this.queue.find((r) => r.id === id);
    if (req) {
      req.status = 'ACTIVE';
    }
    return req;
  }

  public markCompleted(id: string): EmergencyRequest | undefined {
    const index = this.queue.findIndex((r) => r.id === id);
    if (index !== -1) {
      const req = this.queue[index];
      req.status = 'COMPLETED';
      this.queue.splice(index, 1);
      return req;
    }
    return undefined;
  }

  public clear(): void {
    this.queue = [];
  }

  public getQueueLength(): number {
    return this.queue.filter((r) => r.status === 'PENDING').length;
  }
}
