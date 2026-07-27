// ---------------------------------------------------------------------------
// PollingTransport — ships now. Adaptive, visibility-aware, backs off on error.
// ---------------------------------------------------------------------------
 

export interface NotificationEnvelope {
  /** Monotonic per-session id from the message cache. Source of ordering truth. */
  id: number;
  /** Topic, mirrors cache keying: e.g. "treaty/9f3c" or "task/run-1182" */
  topic: string;
  /** Event type within the topic, e.g. "updated", "lock-requested", "completed" */
  type: string;
  entityId?: string;
  ts: string;
  payload?: unknown;
}
 
export interface Transport {
  start(ctx: TransportContext): void;
  stop(): void;
  /** Hint from the adapter that a Feature is actively waiting (task pending etc.) */
  setEager(eager: boolean): void;

  send(envelope: NotificationEnvelope): void; 
}
 
export interface TransportContext {
  /** Deliver a batch (possibly length 1). Adapter dedupes/orders by id. */
  deliver(messages: NotificationEnvelope[]): void;
  /** Current high-water mark, for resume/since. Always read live, never cache. */
  getLastSeenId(): number;
  /** Fetch missed messages from the queue. Transports use this to reconcile. */
  fetchSince(since: number): Promise<void>;
}

export interface PollingOptions {
  ambientMs?: number; // default 15s
  eagerMs?: number; // default 2s
  hiddenMs?: number; // when tab hidden, default 60s
  maxBackoffMs?: number; // default 2min
}
 
export class PollingTransport implements Transport {
  private ctx: TransportContext | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private eager = false;
  private failures = 0;
  private stopped = true;
  private readonly opts: Required<PollingOptions>;
  private onVisibility = () => this.reschedule(true);
 
  constructor(opts: PollingOptions = {}) {
    this.opts = {
      ambientMs: opts.ambientMs ?? 15_000,
      eagerMs: opts.eagerMs ?? 2_000,
      hiddenMs: opts.hiddenMs ?? 60_000,
      maxBackoffMs: opts.maxBackoffMs ?? 120_000,
    };
  }
 
  start(ctx: TransportContext): void {
    this.ctx = ctx;
    this.stopped = false;
    this.failures = 0;
    document.addEventListener("visibilitychange", this.onVisibility);
    void this.tick(); // immediate first poll
  }
 
  stop(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.ctx = null;
  }
 
  setEager(eager: boolean): void {
    this.eager = eager;
    this.reschedule(true);
  }

  send(_envelope: NotificationEnvelope): void {
    // Polling transport does not support sending messages to the server.
    // This method is implemented to satisfy the Transport interface.
    console.warn("PollingTransport: send() called, but sending is not supported.");
  }
 
  private interval(): number {
    if (document.visibilityState === "hidden") return this.opts.hiddenMs;
    const base = this.eager ? this.opts.eagerMs : this.opts.ambientMs;
    if (this.failures === 0) return base;
    // exponential backoff with jitter, floored at base
    const backoff = Math.min(base * 2 ** this.failures, this.opts.maxBackoffMs);
    return backoff * (0.75 + Math.random() * 0.5);
  }
 
  private reschedule(immediateIfDue = false): void {
    if (this.stopped) return;
    if (this.timer) clearTimeout(this.timer);
    // On visibility-regain or eagerness change, poll soon rather than waiting out a long timer.
    const delay = immediateIfDue && document.visibilityState === "visible" ? 250 : this.interval();
    this.timer = setTimeout(() => void this.tick(), delay);
  }
 
  private async tick(): Promise<void> {
    if (this.stopped || !this.ctx) return;
    try {
      await this.ctx.fetchSince(this.ctx.getLastSeenId());
      this.failures = 0;
    } catch {
      this.failures++;
    }
    this.reschedule();
  }
}
 
// ---------------------------------------------------------------------------
// WebSocketTransport — the deferred capability. Same seam, drop-in later.
// Queue stays truth: on (re)connect it reconciles via fetchSince before
// trusting live frames, so missed events are never silently lost.
// ---------------------------------------------------------------------------
 
export interface WebSocketOptions {
  url: string; // e.g. `wss://${location.host}/push`
  getToken: () => Promise<string> | string; // first-message auth
  heartbeatMs?: number; // default 25s (under ALB's 60s idle)
  maxBackoffMs?: number; // default 30s
}
 
type WsFrame =
  | { kind: "auth"; token: string }
  | { kind: "auth-ok" }
  | { kind: "auth-fail"; reason?: string }
  | { kind: "resume"; since: number }
  | { kind: "event"; envelope: NotificationEnvelope }
  | { kind: "heartbeat" };
 
export class WebSocketTransport implements Transport {
  private ctx: TransportContext | null = null;
  private ws: WebSocket | null = null;
  private stopped = true;
  private attempts = 0;
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly opts: Required<WebSocketOptions>;
 
  constructor(opts: WebSocketOptions) {
    this.opts = {
      heartbeatMs: 25_000,
      maxBackoffMs: 30_000,
      ...opts,
    };
  }
 
  start(ctx: TransportContext): void {
    this.ctx = ctx;
    this.stopped = false;
    this.attempts = 0;
    void this.connect();
  }
 
  stop(): void {
    this.stopped = true;
    this.teardown();
    this.ctx = null;
  }
 
  /** Eagerness is meaningless for a live socket; interface satisfied, no-op. */
  setEager(_: boolean): void {}

  send(envelope: NotificationEnvelope): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendFrame({ kind: "event", envelope });
    } else {
      console.warn("WebSocketTransport: send() called, but socket is not open.");
    }
  }
 
  private async connect(): Promise<void> {
    if (this.stopped || !this.ctx) return;
    this.teardown();
 
    const ws = new WebSocket(this.opts.url);
    this.ws = ws;
 
    ws.onopen = async () => {
      const token = await this.opts.getToken();
      this.sendFrame({ kind: "auth", token });
    };
 
    ws.onmessage = async (evt) => {
      let frame: WsFrame;
      try {
        frame = JSON.parse(evt.data as string) as WsFrame;
      } catch {
        return; // ignore junk
      }
      switch (frame.kind) {
        case "auth-ok": {
          this.attempts = 0;
          // Reconcile from the queue FIRST — the socket only supplements it.
          const since = this.ctx!.getLastSeenId();
          try {
            await this.ctx!.fetchSince(since);
          } catch {
            /* live frames + next reconnect will cover us */
          }
          this.sendFrame({ kind: "resume", since: this.ctx!.getLastSeenId() });
          this.startHeartbeat();
          break;
        }
        case "auth-fail":
          // Token problem, not network problem: back off harder, retry with fresh token.
          this.scheduleReconnect(true);
          break;
        case "event":
          this.ctx?.deliver([frame.envelope]);
          break;
        case "heartbeat":
          break; // server keeping the pipe warm
        default:
          break;
      }
    };
 
    ws.onclose = () => this.scheduleReconnect();
    ws.onerror = () => {
      /* onclose follows; avoid double-scheduling */
    };
  }
 
  private sendFrame(frame: WsFrame): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(frame));
  }
 
  private startHeartbeat(): void {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = setInterval(() => this.sendFrame({ kind: "heartbeat" }), this.opts.heartbeatMs);
  }
 
  private scheduleReconnect(authFailure = false): void {
    if (this.stopped) return;
    this.teardown();
    this.attempts++;
    const base = Math.min(1000 * 2 ** this.attempts, this.opts.maxBackoffMs);
    const delay = (authFailure ? base * 2 : base) * (0.75 + Math.random() * 0.5); // jitter: smear the herd
    this.reconnectTimer = setTimeout(() => void this.connect(), delay);
  }
 
  private teardown(): void {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = null;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    if (this.ws) {
      this.ws.onopen = this.ws.onmessage = this.ws.onclose = this.ws.onerror = null;
      try {
        this.ws.close();
      } catch {
        /* already dead */
      }
      this.ws = null;
    }
  }
}