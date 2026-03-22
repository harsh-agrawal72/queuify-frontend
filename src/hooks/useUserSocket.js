import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const rawApiUrl = import.meta.env.VITE_API_URL || '';
const SOCKET_URL = rawApiUrl.replace(/\/v1\/?$/, '');

let socketInstance = null;

export const useUserSocket = (userId) => {
    const [update, setUpdate] = useState(null);

    useEffect(() => {
        if (!userId) return;

        if (!socketInstance) {
            socketInstance = io(SOCKET_URL);
        }

        const socket = socketInstance;

        const onConnect = () => {
            console.log('User socket connected');
            socket.emit('join_user', userId);
        };

        const onUpdate = (data) => {
            console.log('User appointment update received:', data);
            setUpdate(data);
        };

        if (socket.connected) {
            onConnect();
        }

        socket.on('connect', onConnect);
        socket.on('appointment_updated', onUpdate);
        socket.on('queue_update', onUpdate); // Also refresh on general queue updates for the user's orgs

        return () => {
            socket.off('connect', onConnect);
            socket.off('appointment_updated', onUpdate);
            socket.off('queue_update', onUpdate);
        };
    }, [userId]);

    return { update };
};
