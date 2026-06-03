import { useState, useEffect, useCallback, useRef } from 'react';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';

export function useWebSocket() {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('🔌 WebSocket Connected');
        setIsConnected(true);
        setError(null);
        
        // Start heartbeat
        ws.pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pong') return; // Ignore heartbeat acks
          
          setMessages((prev) => [...prev, data]);
        } catch (err) {
          console.error('WebSocket message parsing error:', err);
        }
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket Disconnected');
        setIsConnected(false);
        clearInterval(ws.pingInterval);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔌 Attempting WebSocket reconnection...');
          connect();
        }, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError(err);
        ws.close();
      };

      wsRef.current = ws;
    } catch (err) {
      setError(err);
      console.error('Failed to connect to WebSocket:', err);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        clearInterval(wsRef.current.pingInterval);
        wsRef.current.close();
      }
    };
  }, [connect]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return {
    messages,
    isConnected,
    error,
    clearMessages,
  };
}
