export interface EngineEvents {
}

export class DefaultEngineEvents implements EngineEvents {
  constructor() {
    this.events = new Map<string, Function>();
  }

  events: Map<string, Function>;

  subscribe(subscriberId: string, callback: Function) {
    if (!this.events.has(subscriberId)) {
      this.events.set(subscriberId, callback);
    }
  }

  unsubscribe(subscriberId: string) {
    const eventSubscribers = this.events.get(subscriberId);
    if (eventSubscribers) {
      this.events.delete(subscriberId);
    }
  }

  publish(data: any) {
    this.events.forEach((callback) => {
      callback(data);
    });
  }
}