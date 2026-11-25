import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { authApi } from '@/services/auth-api';
import { useAuthStore } from '@/stores/auth-store';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

type SocketListener<T = unknown> = (data: T) => void;

interface AnalyticsSocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  subscribe: <T = unknown>(event: string, callback: SocketListener<T>) => () => void;
  unsubscribe: (event: string, callback?: SocketListener<unknown>) => void;
  emit: (event: string, data?: unknown) => void;
}

const AnalyticsSocketContext = createContext<AnalyticsSocketContextValue>({
  socket: null,
  isConnected: false,
  subscribe: () => () => {},
  unsubscribe: () => {},
  emit: () => {},
});

export function AnalyticsSocketProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated, isDemoMode } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const listenersRef = useRef<Map<string, Set<SocketListener<unknown>>>>(new Map());
  const dispatchersRef = useRef<Map<string, (data: unknown) => void>>(new Map());
  const socketRef = useRef<Socket | null>(null);

  const attachEventDispatcher = useCallback((instance: Socket, event: string) => {
    if (dispatchersRef.current.has(event)) {
      return;
    }
    const dispatcher = (data: unknown) => {
      const handlers = listenersRef.current.get(event);
      if (!handlers) return;
      handlers.forEach((handler) => handler(data));
    };
    dispatchersRef.current.set(event, dispatcher);
    instance.on(event, dispatcher);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token || isDemoMode) {
      setSocket(null);
      setIsConnected(false);
      return undefined;
    }

    const socketInstance = io(`${WS_URL}/analytics`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on('connect', () => setIsConnected(true));
    socketInstance.on('disconnect', () => setIsConnected(false));
    socketInstance.on('connect_error', (err) => {
      setIsConnected(false);
      if (/unauthorized|revoked|expired/i.test(err?.message || '')) {
        void authApi.logout();
      }
    });

    for (const event of listenersRef.current.keys()) {
      attachEventDispatcher(socketInstance, event);
    }

    return () => {
      dispatchersRef.current.clear();
      socketInstance.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, isAuthenticated, isDemoMode, attachEventDispatcher]);

  const unsubscribe = useCallback(
    (event: string, callback?: SocketListener<unknown>) => {
      const existing = listenersRef.current.get(event);
      if (!existing) return;

      if (callback) {
        existing.delete(callback);
      } else {
        existing.clear();
      }

      if (existing.size === 0) {
        listenersRef.current.delete(event);
        const dispatcher = dispatchersRef.current.get(event);
        if (dispatcher && socketRef.current) {
          socketRef.current.off(event, dispatcher);
        }
        dispatchersRef.current.delete(event);
      }
    },
    [],
  );

  const subscribe = useCallback(
    function <T = unknown>(event: string, callback: SocketListener<T>) {
      let eventSet = listenersRef.current.get(event);
      if (!eventSet) {
        eventSet = new Set();
        listenersRef.current.set(event, eventSet);
      }
      const typedCallback = callback as SocketListener<unknown>;
      eventSet.add(typedCallback);

      if (socketRef.current) {
        attachEventDispatcher(socketRef.current, event);
      }

      return () => {
        unsubscribe(event, typedCallback);
      };
    },
    [attachEventDispatcher, unsubscribe],
  );

  const emit = useCallback(
    (event: string, data?: unknown) => {
      if (!socketRef.current || !isConnected) {
        return;
      }
      socketRef.current.emit(event, data);
    },
    [isConnected],
  );

  const contextValue = useMemo(
    () => ({ socket, isConnected, subscribe, unsubscribe, emit }),
    [socket, isConnected, subscribe, unsubscribe, emit],
  );

  return (
    <AnalyticsSocketContext.Provider value={contextValue}>
      {children}
    </AnalyticsSocketContext.Provider>
  );
}

export function useAnalyticsSocketContext() {
  return useContext(AnalyticsSocketContext);
}
