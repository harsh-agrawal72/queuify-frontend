import { io } from 'socket.io-client';

const rawApiUrl = import.meta.env.VITE_API_URL || '';
const SOCKET_URL = rawApiUrl.replace(/\/v1\/?$/, '');

let socketInstance = null;

export const getSocket = () => {
    if (!socketInstance) {
        socketInstance = io(SOCKET_URL, {
            transports: ['websocket'], // Skip polling — websocket-first for lower latency
            reconnectionAttempts: 50,
            reconnectionDelay: 1000,  // Reduced from 2s to 1s
            timeout: 20000,
            upgrade: false,           // Don't upgrade (we're already on WS)
        });

        socketInstance.on('connect_error', (error) => {
            console.warn('Socket connection error:', error.message);
        });
    }
    return socketInstance;
};

export const disconnectSocket = () => {
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }
};

export default { getSocket, disconnectSocket };
