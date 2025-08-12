type Subscriber = {
  id: string;
  teamId?: string | null;
  userId?: string | null;
  send: (event: any) => void;
};

class RealtimeBus {
  private subscribers = new Map<string, Subscriber>();

  add(sub: Subscriber) {
    this.subscribers.set(sub.id, sub);
  }

  remove(id: string) {
    this.subscribers.delete(id);
  }

  broadcast(event: { type: string; teamId?: string | null; userId?: string | null; payload?: any }) {
    for (const [, sub] of this.subscribers) {
      if (event.teamId && sub.teamId && event.teamId !== sub.teamId) continue;
      if (event.userId && sub.userId && event.userId !== sub.userId) continue;
      try { sub.send(event); } catch {}
    }
  }
}

// Global singleton (safe enough for a single server instance)
const globalBus = (globalThis as any).__uploraRealtimeBus || new RealtimeBus();
(globalThis as any).__uploraRealtimeBus = globalBus;

export function addSubscriber(sub: Subscriber) {
  globalBus.add(sub);
}

export function removeSubscriber(id: string) {
  globalBus.remove(id);
}

export function broadcast(event: { type: string; teamId?: string | null; userId?: string | null; payload?: any }) {
  globalBus.broadcast(event);
}


