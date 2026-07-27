import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useUiEventPublisher } from './UiEventContext.js';
import { NotificationEnvelope, Transport, WebSocketTransport } from '../transports.js';
import { UiNotificationEvent } from '../events/uiNotificationTypes.js';
import { useUserSession } from '../hooks/index.js';
import { useUserSessionContext } from './UserSessionContext.js';

export type NotificationHandler = (e: NotificationEnvelope) => void;

export type NotificationsContextType = {
  sendNotification: (notification: NotificationEnvelope) => void;
};

export const NotificationsContext = createContext<NotificationsContextType>({
  sendNotification: () => { },
});

/**
 * Subsystem provider for notifications.
 *
 * Behaviours dispatch here via useNotifications().sendNotification(...).
 * This provider owns the HTTP call and publishes notification-related
 * UIEvents on completion — it does NOT subscribe to the UIEvent bus.
 */
export function NotificationsProvider({
  children,
}: { children: ReactNode }) {

  const { raiseUiEvent } = useUiEventPublisher<UiNotificationEvent>();
  const { getToken } = useUserSessionContext()

  useUserSession({ onLoggedIn,onLoggedOut });

  const notifications = new NotificationAdapter("", (n: NotificationEnvelope) => {
    raiseUiEvent({
      messageType: "NOTIFICATION",
      payload: {
        notification: n,
      },
      timestamp: Date.parse(n.ts)
    });
  });

  function onLoggedIn(_sessionInfo: any) {
    notifications.start(new WebSocketTransport({
      url: `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/v1/ws`,
      getToken
    }))
  }

  function onLoggedOut(_sessionInfo: any) {
    notifications.stop();
  }

  notifications.start(new WebSocketTransport({
    url: `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/v1/ws`,
    getToken: async () => {
      // Implement your token retrieval logic here
      return "";
    },
  }));

  const sendNotification = useCallback(
    async (n: NotificationEnvelope) => {
      notifications.send(n);
    },
    [raiseUiEvent],
  );

  return (
    <NotificationsContext.Provider value={{ sendNotification }}>
      {children}
    </NotificationsContext.Provider>
  );
}

/**
 * Used exclusively by Behaviours (via BehaviourDispatchProvider) to
 * dispatch activity calls. Not for use in leaf UI components.
 */
export function useNotifications(): NotificationsContextType {
  return useContext(NotificationsContext);
}

export class NotificationAdapter {
  private lastSeenId = 0;
  
  private eagerHolds = new Set<symbol>();
  private transport: Transport | null = null;
  private started = false;
  private seen = new Set<number>(); // small dedupe window
  private seenOrder: number[] = [];

  constructor(
    private readonly baseUrl: string, // e.g. "" (same origin) — SW/BFF handles the rest
    private readonly callBack: (n: NotificationEnvelope) => void,
  ) { }

  // -- lifecycle ------------------------------------------------------------

  start(transport: Transport): void {
    if (this.started) this.stop();
    this.transport = transport;
    this.started = true;
    transport.start({
      deliver: (msgs) => this.deliver(msgs),
      getLastSeenId: () => this.lastSeenId,
      fetchSince: (since) => this.fetchSince(since),
    });
  }

  stop(): void {
    this.transport?.stop();
    this.transport = null;
    this.started = false;
  }

  /**
   * Swap transports live (e.g. polling -> websocket when a Feature that needs
   * it loads). Queue semantics make this safe: the new transport resumes from
   * lastSeenId and nothing is lost or duplicated.
   */
  swapTransport(next: Transport): void {
    this.start(next);
  }

  // -- Feature-facing API ----------------------------------------------------

  /**
   * A Feature declares it is actively waiting on something (job pending,
   * lock requested). While any hold is open the transport may go eager
   * (fast polling / whatever the transport does with it). Returns a release.
   */
  requestEagerness(): () => void {
    const key = Symbol("eager");
    this.eagerHolds.add(key);
    this.transport?.setEager(true);
    return () => {
      this.eagerHolds.delete(key);
      if (this.eagerHolds.size === 0) this.transport?.setEager(false);
    };
  }

  send(n: NotificationEnvelope): void {
    this.transport?.send(n);
  }

  // -- internals --------------------------------------------------------------

  private deliver(messages: NotificationEnvelope[]): void {
    // Order by id, drop anything at/below high-water or already seen.
    const fresh = messages
      .filter((m) => m.id > this.lastSeenId || !this.seen.has(m.id))
      .filter((m) => !this.seen.has(m.id))
      .sort((a, b) => a.id - b.id);

    for (const m of fresh) {
      this.markSeen(m.id);
      if (m.id > this.lastSeenId) this.lastSeenId = m.id;
      this.dispatch(m);
    }
  }

  private markSeen(id: number): void {
    this.seen.add(id);
    this.seenOrder.push(id);
    while (this.seenOrder.length > 512) {
      this.seen.delete(this.seenOrder.shift()!);
    }
  }

  private dispatch(m: NotificationEnvelope): void {
    try {
      this.callBack(m);
    } catch (err) {
      // A misbehaving Feature must not break delivery to others.
      console.error("[notifications] subscriber error", err);
    }
  }

  private async fetchSince(since: number): Promise<void> {
    const res = await fetch(`${this.baseUrl}/push/messages?since=${since}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`poll failed: ${res.status}`);
    const body = (await res.json()) as { messages: NotificationEnvelope[] };
    if (body.messages?.length) this.deliver(body.messages);
  }
}

/** Segment-wise topic match: "treaty/*" matches "treaty/9f3c"; "*" matches one segment. */
export function topicMatches(pattern: string, topic: string): boolean {
  if (pattern === topic) return true;
  const p = pattern.split("/");
  const t = topic.split("/");
  if (p.length !== t.length && p[p.length - 1] !== "**") return false;
  for (let i = 0; i < p.length; i++) {
    if (p[i] === "**") return true; // rest-of-topic wildcard
    if (p[i] === "*") continue;
    if (p[i] !== t[i]) return false;
  }
  return p.length === t.length;
}