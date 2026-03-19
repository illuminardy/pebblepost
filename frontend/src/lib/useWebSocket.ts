import { useEffect, useRef, useCallback } from 'react';

export interface WsClickRecordedEvent {
  event: 'click:recorded';
  linkId: string;
  totalClicks: number;
}

export interface WsAnalyticsUpdatedEvent {
  event: 'analytics:updated';
  linkId: string;
  data: {
    totalClicks: number;
    dailyClicks: Array<{ date: string; count: number }>;
    browserBreakdown: Array<{ name: string; count: number }>;
    osBreakdown: Array<{ name: string; count: number }>;
    deviceBreakdown: Array<{ name: string; count: number }>;
  };
}

type WsEvent = WsClickRecordedEvent | WsAnalyticsUpdatedEvent;
type WsEventHandler = (event: WsEvent) => void;

const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
const RECONNECT_INTERVAL_MS = 3000;

let sharedSocket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<WsEventHandler>();

function connect() {
  if (sharedSocket?.readyState === WebSocket.OPEN || sharedSocket?.readyState === WebSocket.CONNECTING) {
    return;
  }

  sharedSocket = new WebSocket(WS_URL);

  sharedSocket.onmessage = (msg) => {
    try {
      const parsed = JSON.parse(msg.data) as WsEvent;
      for (const handler of listeners) {
        handler(parsed);
      }
    } catch {
      // Ignore malformed messages
    }
  };

  sharedSocket.onclose = () => {
    if (listeners.size > 0 && !reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, RECONNECT_INTERVAL_MS);
    }
  };
}

function sendJson(payload: object) {
  if (sharedSocket?.readyState === WebSocket.OPEN) {
    sharedSocket.send(JSON.stringify(payload));
  }
}

/**
 * Hook to listen for WebSocket events. Manages a shared connection
 * across components with automatic reconnection.
 */
export function useWebSocket(handler: WsEventHandler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const wrappedHandler: WsEventHandler = (evt) => handlerRef.current(evt);
    listeners.add(wrappedHandler);
    connect();

    return () => {
      listeners.delete(wrappedHandler);
      if (listeners.size === 0) {
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        sharedSocket?.close();
        sharedSocket = null;
      }
    };
  }, []);

  const subscribe = useCallback((linkId: string) => {
    sendJson({ type: 'subscribe', linkId });
  }, []);

  const unsubscribe = useCallback((linkId: string) => {
    sendJson({ type: 'unsubscribe', linkId });
  }, []);

  return { subscribe, unsubscribe };
}
