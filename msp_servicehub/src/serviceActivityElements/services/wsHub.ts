import type { IncomingMessage, Server } from 'node:http';
import type { Duplex } from 'node:stream';

import { WebSocketServer, WebSocket } from 'ws';

// ---------------------------------------------------------------------------
// UI notification hub — terminates browser WebSocket connections at /ws/v1.
//
// How the connection arrives here:
//   browser → BFF (msp_fes) → this server. Both the Vite dev server proxy
//   (server.proxy with ws:true) and the standalone BFF (server.on('upgrade')
//   + http-proxy) forward the HTTP Upgrade handshake; after the 101 response
//   the TCP socket is spliced end-to-end and frames flow both ways.
//
// Client protocol (JSON messages):
//   → { type: 'subscribe',   topics: ['aws.resources', ...] }
//   → { type: 'unsubscribe', topics: [...] }
//   ← { type: 'welcome', connectionId }
//   ← { type: 'subscribed', topics: [...] }
//   ← { type: 'event', topic, seq, ts, payload }
//
// Topic matching supports a trailing wildcard: subscribing to 'aws.*'
// receives 'aws.resources', 'aws.reconcile', etc.
//
// Scale-out note: this hub holds connection state in-process, which is fine
// for a single servicehub instance. With multiple instances behind a load
// balancer, each instance keeps its own connections and publishes must be
// fanned out via a shared backplane (Redis/NATS pub-sub) so every instance
// forwards the event to its local sockets. publishUiNotification() is the
// single seam where that backplane would slot in.
// ---------------------------------------------------------------------------

export const WS_PATH = '/v1/ws';

const HEARTBEAT_INTERVAL_MS = 30_000;

type HubClient = {
  socket: WebSocket;
  connectionId: string;
  topics: Set<string>;
  isAlive: boolean;
};

const clients = new Set<HubClient>();
let sequence = 0;
let connectionCounter = 0;
let heartbeatTimer: NodeJS.Timeout | undefined;

function topicMatches(subscription: string, topic: string): boolean {
  if (subscription === topic || subscription === '*') return true;
  if (subscription.endsWith('.*')) {
    return topic.startsWith(subscription.slice(0, -1));
  }
  return false;
}

function safeSend(client: HubClient, message: unknown) {
  if (client.socket.readyState !== WebSocket.OPEN) return;
  try {
    client.socket.send(JSON.stringify(message));
  } catch (error) {
    console.error(`ws-hub: send failed for ${client.connectionId}:`, error);
  }
}

function handleClientMessage(client: HubClient, raw: unknown) {
  let message: { type?: string; topics?: unknown };
  try {
    message = JSON.parse(String(raw));
  } catch {
    safeSend(client, { type: 'error', message: 'Messages must be JSON.' });
    return;
  }

  const topics = Array.isArray(message.topics)
    ? message.topics.filter((t): t is string => typeof t === 'string' && t.length > 0)
    : [];

  switch (message.type) {
    case 'subscribe':
      for (const topic of topics) client.topics.add(topic);
      safeSend(client, { type: 'subscribed', topics: [...client.topics] });
      break;
    case 'unsubscribe':
      for (const topic of topics) client.topics.delete(topic);
      safeSend(client, { type: 'subscribed', topics: [...client.topics] });
      break;
    case 'ping':
      safeSend(client, { type: 'pong', ts: new Date().toISOString() });
      break;
    default:
      safeSend(client, { type: 'error', message: `Unknown message type '${message.type}'.` });
  }
}

/**
 * Publish an event to every connected client subscribed to the topic.
 * Returns the number of clients the event was delivered to.
 */
export function publishUiNotification(topic: string, payload: unknown): number {
  sequence += 1;
  const event = {
    type: 'event',
    topic,
    seq: sequence,
    ts: new Date().toISOString(),
    payload,
  };

  let delivered = 0;
  for (const client of clients) {
    if ([...client.topics].some((subscription) => topicMatches(subscription, topic))) {
      safeSend(client, event);
      delivered += 1;
    }
  }
  console.log(`ws-hub: published '${topic}' (seq=${sequence}) to ${delivered} client(s).`);
  return delivered;
}

export function getWsHubStats() {
  return {
    connections: clients.size,
    lastSeq: sequence,
    topics: [...new Set([...clients].flatMap((c) => [...c.topics]))],
  };
}

/**
 * Attach the hub to an HTTP server. Handles the Upgrade handshake for
 * WS_PATH and leaves all other upgrade requests to be destroyed (nothing
 * else on this server speaks WebSocket).
 */
export function attachWsHub(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    const pathname = (request.url ?? '/').split('?')[0];
    if (pathname !== WS_PATH) {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
      return;
    }

    // TODO(auth): browsers cannot set an Authorization header on a WebSocket.
    // Production path is the ticket pattern: the client POSTs its bearer to an
    // authenticated /api/v1 endpoint, receives a short-lived one-time ticket,
    // and presents it here as ?ticket=... to be validated before handleUpgrade.
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (socket: WebSocket) => {
    connectionCounter += 1;
    const client: HubClient = {
      socket,
      connectionId: `ws-${connectionCounter}`,
      topics: new Set(),
      isAlive: true,
    };
    clients.add(client);
    console.log(`ws-hub: ${client.connectionId} connected (${clients.size} total).`);

    socket.on('pong', () => { client.isAlive = true; });
    socket.on('message', (raw) => handleClientMessage(client, raw));
    socket.on('close', () => {
      clients.delete(client);
      console.log(`ws-hub: ${client.connectionId} disconnected (${clients.size} total).`);
    });
    socket.on('error', (error) => {
      console.error(`ws-hub: ${client.connectionId} socket error:`, error);
    });

    safeSend(client, { type: 'welcome', connectionId: client.connectionId });
  });

  // Heartbeat: protocol-level ping/pong so half-open connections (pulled
  // cables, sleeping laptops, silently-dropped NAT/LB entries) are detected
  // and reaped instead of accumulating forever.
  heartbeatTimer = setInterval(() => {
    for (const client of clients) {
      if (!client.isAlive) {
        console.log(`ws-hub: ${client.connectionId} failed heartbeat, terminating.`);
        client.socket.terminate();
        clients.delete(client);
        continue;
      }
      client.isAlive = false;
      client.socket.ping();
    }
  }, HEARTBEAT_INTERVAL_MS);
  heartbeatTimer.unref();

  console.log(`ws-hub: attached at ${WS_PATH}.`);
}
