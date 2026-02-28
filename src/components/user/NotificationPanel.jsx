import { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, X, Info, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';

const NotificationPanel = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (error) {
            console.error('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Failed to mark notification as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all as read');
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'appointment': return <Clock className="h-4 w-4 text-indigo-500" />;
            case 'payment': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-[60]" onClick={onClose} />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[70] overflow-hidden"
                    >
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
                            <div>
                                <h3 className="font-bold text-gray-900">Notifications</h3>
                                <p className="text-xs text-gray-500">{unreadCount} unread messages</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                                <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[450px] overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">Loading...</p>
                                </div>
                            ) : notifications.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            onClick={() => !notification.is_read && markAsRead(notification.id)}
                                            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative ${!notification.is_read ? 'bg-indigo-50/30' : ''}`}
                                        >
                                            {!notification.is_read && (
                                                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-full" />
                                            )}
                                            <div className="flex gap-4">
                                                <div className={`mt-1 p-2 rounded-xl shrink-0 ${notification.is_read ? 'bg-gray-100' : 'bg-white shadow-sm'}`}>
                                                    {getIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h4 className={`text-sm font-bold ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                                                            {notification.title}
                                                        </h4>
                                                        <span className="text-[10px] text-gray-400 whitespace-nowrap mt-0.5">
                                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                                        {notification.message}
                                                    </p>
                                                    {notification.link && (
                                                        <Link
                                                            to={notification.link}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onClose();
                                                                if (!notification.is_read) markAsRead(notification.id);
                                                            }}
                                                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 mt-2 hover:underline"
                                                        >
                                                            View details <ExternalLink className="h-3 w-3" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Bell className="h-8 w-8 text-gray-200" />
                                    </div>
                                    <h4 className="font-bold text-gray-900">No notifications yet</h4>
                                    <p className="text-sm text-gray-500 mt-1">We'll notify you when something important happens.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NotificationPanel;
