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
            console.log('--- [FCM] Notification Setup Started ---');
            
            // 1. Request Permission & Token
            console.log('--- [FCM] Requesting token...');
            const token = await requestForToken();
            
            if (token) {
                console.log('✅ [FCM] Token generated successfully:', token);
                
                // 2. Save token to backend
                try {
                    const response = await api.post('/notifications/push-token', { token });
                    console.log('✅ [FCM] Token saved to backend:', response.data);
                } catch (apiErr) {
                    console.error('❌ [FCM] Failed to save token to backend:', apiErr.response?.data || apiErr.message);
                }
            } else {
                console.warn('⚠️ [FCM] No token received. Check permissions (granted?) or VAPID key in firebase.js.');
                const permission = Notification.permission;
                console.log('Current Browser Notification Permission:', permission);
            }

            // 3. Listen for foreground messages (Callback based)
            console.log('--- [FCM] Initializing foreground listener...');
            onMessageListener((payload) => {
                console.log('🔔 [FCM] Foreground message received:', payload);
                const { title, body } = payload.notification;
                
                toast.success(
                    <div className="flex flex-col gap-1">
                        <span className="font-bold">{title}</span>
                        <span className="text-xs">{body}</span>
                    </div>,
                    {
                        duration: 6000,
                        icon: '🔔',
                        position: 'top-right'
                    }
                );
            });
            console.log('✅ [FCM] Foreground listener active.');
        } catch (error) {
            console.error('❌ [FCM] Error in NotificationHandler setup:', error);
        }
    };

    return null; // This component doesn't render anything
};

export default NotificationHandler;
