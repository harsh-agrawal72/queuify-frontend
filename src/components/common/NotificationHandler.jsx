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
            console.log('--- Notification Setup Started ---');
            // 1. Request token from Firebase
            const token = await requestForToken();
            
            if (token) {
                console.log('✅ FCM Token generated:', token);
                // 2. Save token to backend
                try {
                    const response = await api.post('/notifications/push-token', { token });
                    console.log('✅ Token saved to backend:', response.data);
                    // toast.success('Notifications active!'); // Optional: confirm to user
                } catch (apiErr) {
                    console.error('❌ Failed to save token to backend:', apiErr.response?.data || apiErr.message);
                }
            } else {
                console.warn('⚠️ No token received. Check notification permissions or VAPID key.');
            }

            // 3. Listen for foreground messages
            onMessageListener()
                .then((payload) => {
                    console.log('🔔 Foreground message received:', payload);
                    toast.success(
                        <div className="flex flex-col gap-1">
                            <span className="font-bold">{payload.notification.title}</span>
                            <span className="text-xs">{payload.notification.body}</span>
                        </div>,
                        {
                            duration: 6000,
                            icon: '🔔',
                            position: 'top-right'
                        }
                    );
                })
                .catch((err) => console.log('❌ Message listener error: ', err));
        } catch (error) {
            console.error('❌ Error in NotificationHandler setup:', error);
        }
    };

    return null; // This component doesn't render anything
};

export default NotificationHandler;
