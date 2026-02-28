import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import io from 'socket.io-client';
import api from '../../services/api';

const QueueStatus = () => {
    // Ideally this component should take orgId as prop or fetch user's active appointment's org
    // For simplicity, let's assume we show queue for the user's latest active appointment.
    const [activeAppt, setActiveAppt] = useState(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Fetch active appointment
        const fetchActive = async () => {
            try {
                const res = await api.get('/appointments');
                // Find first confirmed appointment
                const found = res.data.find(a => a.status === 'confirmed');
                setActiveAppt(found);
            } catch (e) {
                console.error(e);
            }
        };
        fetchActive();
    }, []);

    useEffect(() => {
        if (!activeAppt) return;

        // Connect Socket
        const rawApiUrl = import.meta.env.VITE_API_URL || '';
        const SOCKET_URL = rawApiUrl.replace(/\/v1\/?$/, '');

        const newSocket = io(SOCKET_URL || window.location.origin);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('join_org', activeAppt.org_id);
        });

        newSocket.on('queue_update', (data) => {
            // Need to logic to update queue position?
            // Currently backend only emits event, doesn't send "current serving token".
            // We would need an endpoint to get "current serving" or calculate it.
            // For now, we can just toast or refresh.
            console.log('Queue Update:', data);
            // Refresh appointment status?
            // fetchActive(); // Re-fetch to see if status changed
        });

        return () => newSocket.disconnect();
    }, [activeAppt]);

    if (!activeAppt) return <div className="text-gray-500">No active appointment found in queue.</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Live Queue Status</h3>
            <div className="text-4xl font-bold text-primary-600 mb-2">
                #{activeAppt.id.slice(0, 4)} {/* Mock token number */}
            </div>
            <p className="text-gray-600">Your Appointment ID</p>
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <p className="text-yellow-800 text-sm font-medium">
                    Status: <span className="uppercase">{activeAppt.status}</span>
                </p>
                <p className="text-xs text-yellow-600 mt-1">Updates will appear here in real-time.</p>
            </div>
        </div>
    );
};

export default QueueStatus;
