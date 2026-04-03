import { useEffect, useState } from 'react';
import { getSocket } from '../services/socketService';
import { useAuth } from '../context/AuthContext';

export const useUserSocket = (userId) => {
    const [connected, setConnected] = useState(false);
    const [update, setUpdate] = useState(null);
    const [notification, setNotification] = useState(null);
    const [broadcast, setBroadcast] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!userId || !user?.role) return;

        const socket = getSocket();

        const onConnect = () => {
            console.log('User socket connected');
            setConnected(true);
            socket.emit('join_user', { userId, role: user.role });
        };

        const onUpdate = (data) => {
            console.log('User appointment update received:', data);
            setUpdate(data);
        };

        const onNewNotification = (data) => {
            console.log('New personal notification received:', data);
            setNotification(data);
        };

        const onBroadcast = (data) => {
            console.log('Global broadcast received:', data);
            setBroadcast(data);
        };

        if (socket.connected) {
            onConnect();
        }

        socket.on('connect', onConnect);
        socket.on('appointment_updated', onUpdate);
        socket.on('queue_update', onUpdate); // Also refresh on general queue updates for the user's orgs
        socket.on('new_notification', onNewNotification);
        socket.on('broadcast_received', onBroadcast);

        return () => {
            socket.off('connect', onConnect);
            socket.off('appointment_updated', onUpdate);
            socket.off('queue_update', onUpdate);
            socket.off('new_notification', onNewNotification);
            socket.off('broadcast_received', onBroadcast);
            setConnected(false);
        };
    }, [userId]);

    return { connected, update, notification, broadcast };
};
