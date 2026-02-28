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

        socket.on('connect', () => {
            setConnected(true);
            console.log('Connected to queue socket');

            // Join relevant rooms
            socket.emit('join_org', orgId);
            if (serviceId) socket.emit('join_service', serviceId);
            if (resourceId) socket.emit('join_resource', resourceId);
        });

        socket.on('disconnect', () => {
            setConnected(false);
            console.log('Disconnected from queue socket');
        });

        socket.on('queue_update', (data) => {
            console.log('Queue update received:', data);
            setQueueData(data);
        });

        return () => {
            // We don't necessarily want to disconnect the singleton, 
            // but we might want to leave rooms if needed.
            // For now, simple cleanup is enough.
            socket.off('connect');
            socket.off('disconnect');
            socket.off('queue_update');
        };
    }, [orgId, serviceId, resourceId]);

    const emitStatusChange = useCallback((appointmentId, status) => {
        if (socketInstance) {
            socketInstance.emit('status_change', { appointmentId, status, orgId });
        }
    }, [orgId]);

    return { queueData, connected, emitStatusChange };
};
