import { useEffect } from 'react';
import { requestForToken, onMessageListener } from '../../firebase';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const NotificationHandler = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            setupNotifications();
        }
    }, [user]);

    const setupNotifications = async () => {
        try {
            // 1. Request token from Firebase
            const token = await requestForToken();
            
            if (token) {
                console.log('FCM Token generated:', token);
                // 2. Save token to backend
                await api.post('/notifications/push-token', { token });
            }

            // 3. Listen for foreground messages
            onMessageListener()
                .then((payload) => {
                    console.log('Foreground message received:', payload);
                    toast.success(
                        <div className="flex flex-col gap-1">
                            <span className="font-bold">{payload.notification.title}</span>
                            <span className="text-xs">{payload.notification.body}</span>
                        </div>,
                        {
                            duration: 5000,
                            icon: '🔔'
                        }
                    );
                })
                .catch((err) => console.log('failed: ', err));
        } catch (error) {
            console.error('Error setting up notifications:', error);
        }
    };

    return null; // This component doesn't render anything
};

export default NotificationHandler;
