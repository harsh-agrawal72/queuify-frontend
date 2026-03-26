import { useEffect, useState, useCallback } from 'react';
import { getSocket } from '../services/socketService';

export const useQueueSocket = (orgId, serviceId = null, resourceId = null) => {
    const [queueData, setQueueData] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!orgId) return;

        const socket = getSocket();

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
        const socket = getSocket();
        if (socket) {
            socket.emit('status_change', { appointmentId, status, orgId });
        }
    }, [orgId]);

    return { queueData, connected, emitStatusChange };
};
