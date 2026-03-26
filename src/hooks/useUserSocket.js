import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const rawApiUrl = import.meta.env.VITE_API_URL || '';
const SOCKET_URL = rawApiUrl.replace(/\/v1\/?$/, '');

let socketInstance = null;

export const useUserSocket = (userId) => {
    const [connected, setConnected] = useState(false);
    const [update, setUpdate] = useState(null);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (!userId) return;

        if (!socketInstance) {
            socketInstance = io(SOCKET_URL);
        }

        const socket = socketInstance;

        const onConnect = () => {
            console.log('User socket connected');
            setConnected(true);
            socket.emit('join_user', userId);
        };

        const onUpdate = (data) => {
            console.log('User appointment update received:', data);
            setUpdate(data);
        };

        const onNewNotification = (data) => {
            console.log('New personal notification received:', data);
            setNotification(data);
        };

        if (socket.connected) {
            onConnect();
        }

        socket.on('connect', onConnect);
        socket.on('appointment_updated', onUpdate);
        socket.on('queue_update', onUpdate); // Also refresh on general queue updates for the user's orgs
        socket.on('new_notification', onNewNotification);

        return () => {
            socket.off('connect', onConnect);
            socket.off('appointment_updated', onUpdate);
            socket.off('queue_update', onUpdate);
            socket.off('new_notification', onNewNotification);
            setConnected(false);
        };
    }, [userId]);

    return { connected, update, notification };
};
