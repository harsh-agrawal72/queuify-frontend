import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

// Extract the base URL without /v1 for socket connections
const rawApiUrl = import.meta.env.VITE_API_URL || '';
const SOCKET_URL = rawApiUrl.replace(/\/v1\/?$/, '');

let socketInstance = null;

export const useQueueSocket = (orgId, serviceId = null, resourceId = null) => {
    const [queueData, setQueueData] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!orgId) return;

        if (!socketInstance) {
            socketInstance = io(SOCKET_URL);
        }

        const socket = socketInstance;

        const onConnect = () => {
            setConnected(true);
            console.log('Connected to queue socket');

            // Join relevant rooms
            socket.emit('join_org', orgId);
            if (serviceId) socket.emit('join_service', serviceId);
            if (resourceId) socket.emit('join_resource', resourceId);
        };

        const onDisconnect = () => {
            setConnected(false);
            console.log('Disconnected from queue socket');
        };

        const onQueueUpdate = (data) => {
            console.log('Queue update received:', data);
            setQueueData(data);
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('queue_update', onQueueUpdate);

        return () => {
            // Unregister specifically these handlers so we don't kill other components' listeners
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('queue_update', onQueueUpdate);
        };
    }, [orgId, serviceId, resourceId]);

    const emitStatusChange = useCallback((appointmentId, status) => {
        if (socketInstance) {
            socketInstance.emit('status_change', { appointmentId, status, orgId });
        }
    }, [orgId]);

    return { queueData, connected, emitStatusChange };
};
