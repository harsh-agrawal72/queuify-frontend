import { io } from 'socket.io-client';

const rawApiUrl = import.meta.env.VITE_API_URL || '';
const SOCKET_URL = rawApiUrl.replace(/\/v1\/?$/, '');

let socketInstance = null;

export const getSocket = () => {
    if (!socketInstance) {
        console.log('Initializing global socket connection to:', SOCKET_URL);
        socketInstance = io(SOCKET_URL, {
            transports: ['websocket', 'polling'], 
            reconnectionAttempts: 50, // High number to survive cold starts
            reconnectionDelay: 2000, 
            timeout: 20000,
        });

        socketInstance.on('connect', () => {
            console.log('Global socket connected:', socketInstance.id);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
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
