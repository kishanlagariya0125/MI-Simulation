import { PedestrianAgent, PedestrianRequest } from '../types';

export class PedestrianManager {
  private queue: PedestrianRequest[] = [];
  private lastRequestTime = 0;
  private activeAgents: PedestrianAgent[] = [];

  public enqueueRequest(currentSimTime: number): PedestrianRequest | null {
    const now = Date.now();
    if (now - this.lastRequestTime < 400) {
      return null;
    }
    this.lastRequestTime = now;

    const request: PedestrianRequest = {
      id: `ped-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      requestedAt: currentSimTime,
      status: 'PENDING',
    };

    this.queue.push(request);
    return request;
  }

  public hasPendingRequest(): boolean {
    return this.queue.some((r) => r.status === 'PENDING');
  }

  public getNextPendingRequest(): PedestrianRequest | undefined {
    return this.queue.find((r) => r.status === 'PENDING');
  }

  public markActive(id: string): PedestrianRequest | undefined {
    const req = this.queue.find((r) => r.id === id);
    if (req) {
      req.status = 'ACTIVE';
      this.spawnCrossingPedestrians();
    }
    return req;
  }

  public markCompleted(id: string): PedestrianRequest | undefined {
    const idx = this.queue.findIndex((r) => r.id === id);
    if (idx !== -1) {
      const req = this.queue[idx];
      req.status = 'COMPLETED';
      this.queue.splice(idx, 1);
      this.activeAgents = [];
      return req;
    }
    return undefined;
  }

  public clear(): void {
    this.queue = [];
    this.activeAgents = [];
  }

  public getPendingCount(): number {
    return this.queue.filter((r) => r.status === 'PENDING').length;
  }

  public getActiveAgents(): PedestrianAgent[] {
    return this.activeAgents;
  }

  public updateAgents(deltaSimSeconds: number): void {
    for (const agent of this.activeAgents) {
      agent.progress += agent.speed * deltaSimSeconds * agent.direction;
      if (agent.progress > 1) agent.progress = 1;
      if (agent.progress < 0) agent.progress = 0;
    }
  }

  private spawnCrossingPedestrians(): void {
    // Spawn 4-6 crossing pedestrians across different crosswalks
    const crosswalks: Array<'NS_TOP' | 'NS_BOTTOM' | 'EW_LEFT' | 'EW_RIGHT'> = [
      'NS_TOP', 'NS_BOTTOM', 'EW_LEFT', 'EW_RIGHT',
    ];
    const colors = ['#38bdf8', '#fbbf24', '#f43f5e', '#a78bfa', '#34d399', '#f97316'];

    this.activeAgents = crosswalks.flatMap((crosswalk, idx) => {
      return [
        {
          id: `agent-${idx}-1`,
          crosswalk,
          progress: 0.05,
          speed: 0.18 + Math.random() * 0.06,
          direction: 1 as const,
          color: colors[idx % colors.length],
        },
        {
          id: `agent-${idx}-2`,
          crosswalk,
          progress: 0.95,
          speed: 0.18 + Math.random() * 0.06,
          direction: -1 as const,
          color: colors[(idx + 2) % colors.length],
        },
      ];
    });
  }
}
