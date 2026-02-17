import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

interface UseAnalyticsSocketReturn {
    socket: Socket | null;
    isConnected: boolean;
    subscribe: (event: string, callback: (data: any) => void) => void;
    unsubscribe: (event: string) => void;
    emit: (event: string, data: any) => void;
}

export function useAnalyticsSocket(): UseAnalyticsSocketReturn {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { token } = useAuthStore();
    const listenersRef = useRef<Map<string, (data: any) => void>>(new Map());

    useEffect(() => {
        if (!token) return;

        const socketInstance = io(`${WS_URL}/analytics`, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        socketInstance.on('connect', () => {
            setIsConnected(true);
        });

        socketInstance.on('disconnect', (reason) => {
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('❌ Connection error:', error);
            setIsConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [token]);

    const subscribe = useCallback(
        (event: string, callback: (data: any) => void) => {
            if (!socket) return;

            if (listenersRef.current.has(event)) {
                socket.off(event);
            }

            socket.on(event, callback);
            listenersRef.current.set(event, callback);
        },
        [socket]
    );

    const unsubscribe = useCallback(
        (event: string) => {
            if (!socket) return;

            socket.off(event);
            listenersRef.current.delete(event);
        },
        [socket]
    );

    const emit = useCallback(
        (event: string, data: any) => {
            if (!socket || !isConnected) {
                console.warn('Cannot emit: socket not connected');
                return;
            }

            socket.emit(event, data);
        },
        [socket, isConnected]
    );

    return {
        socket,
        isConnected,
        subscribe,
        unsubscribe,
        emit,
    };
}
