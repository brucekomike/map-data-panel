import { useEffect, useRef } from 'react';

type MessageHandler = (data: unknown) => void;

export function useWebSocket(mapId: number | null, onMessage: MessageHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let cancelled = false;

    function doConnect() {
      if (cancelled || !mapId) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}/ws/${mapId}`;
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
        if (!cancelled) setTimeout(doConnect, 2000);
      };
    }

    doConnect();
    return () => {
      cancelled = true;
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [mapId]);
}
