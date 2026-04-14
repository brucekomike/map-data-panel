import { useEffect, useRef, useCallback } from 'react';

type MessageHandler = (data: unknown) => void;

export function useWebSocket(mapId: number | null, onMessage: MessageHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!mapId) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws/${mapId}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      // reconnect after 2s
      setTimeout(() => connect(), 2000);
    };

    return ws;
  }, [mapId]);

  useEffect(() => {
    const ws = connect();
    return () => {
      ws?.close();
      wsRef.current = null;
    };
  }, [connect]);
}
