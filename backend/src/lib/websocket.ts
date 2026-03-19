import type { Server as HttpServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';

interface ClientState {
  subscribedLinkIds: Set<string>;
}

let wss: WebSocketServer | null = null;
const clients = new Map<WebSocket, ClientState>();

/** WS event names sent to clients. */
export const WS_EVENTS = {
  CLICK_RECORDED: 'click:recorded',
  ANALYTICS_UPDATED: 'analytics:updated',
} as const;

/**
 * Initializes the WebSocket server on the given HTTP server instance.
 * Handles client subscriptions for per-link analytics updates.
 */
export function initWebSocketServer(server: HttpServer): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    clients.set(ws, { subscribedLinkIds: new Set() });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        const state = clients.get(ws);
        if (!state) return;

        if (msg.type === 'subscribe' && typeof msg.linkId === 'string') {
          state.subscribedLinkIds.add(msg.linkId);
        } else if (msg.type === 'unsubscribe' && typeof msg.linkId === 'string') {
          state.subscribedLinkIds.delete(msg.linkId);
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  return wss;
}

/** Sends an event to all connected clients. */
export function broadcastAll(event: string, payload: object): void {
  if (!wss) return;

  const message = JSON.stringify({ event, ...payload });

  for (const [ws] of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

/** Sends an event only to clients subscribed to a specific linkId. */
export function broadcastToSubscribers(event: string, linkId: string, payload: object): void {
  if (!wss) return;

  const message = JSON.stringify({ event, linkId, ...payload });

  for (const [ws, state] of clients) {
    if (ws.readyState === WebSocket.OPEN && state.subscribedLinkIds.has(linkId)) {
      ws.send(message);
    }
  }
}
