import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isValid, formatDistanceToNow, isPast } from 'date-fns';
import {
    Bell, BellOff, Clock, MapPin, Calendar, X, Loader2,
    CheckCircle2, AlertCircle, Timer, RefreshCw, Building2, ChevronRight, Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

// ─── Helper: safe date parsing ───
const safeDate = (str) => {
    if (!str) return null;
    try {
        const d = parseISO(str);
        return isValid(d) ? d : null;
    } catch { return null; }
};

const safeFormat = (str, fmt, fallback = '--') => {
    const d = safeDate(str);
    return d ? format(d, fmt) : fallback;
};

// ─── Status Badge ───
const StatusBadge = ({ status, notified }) => {
    if (notified || status === 'notified') {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                <CheckCircle2 className="h-3 w-3" />
                Notified
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-wider">
            <Timer className="h-3 w-3 animate-pulse" />
            Waiting for Your Turn
        </span>
    );
};

// ─── Individual Notification Card ───
const NotifyCard = ({ notification, onCancel, cancellingId }) => {
    const {
        id,
        service_name,
        org_name,
        slot_start,
        desired_time,
        current_estimated_time,
        status,
        booked_count,
        max_capacity,
        created_at,
    } = notification;

    const isNotified = status === 'notified';
    const slotStartDate = safeDate(slot_start);
    const desiredDate = safeDate(desired_time);
    const estimatedDate = safeDate(current_estimated_time);
    const isCancelling = cancellingId === id;

    // Calculate how close estimated is to desired
    let timeDiffMinutes = null;
    if (estimatedDate && desiredDate) {
        timeDiffMinutes = Math.round((estimatedDate - desiredDate) / 60000);
    }

    const getTimeDiffLabel = () => {
        if (timeDiffMinutes === null) return null;
        if (Math.abs(timeDiffMinutes) <= 5) return { text: "On time!", color: "text-emerald-600" };
        if (timeDiffMinutes > 5) return { text: `~${timeDiffMinutes}m behind your time`, color: "text-amber-600" };
        return { text: `~${Math.abs(timeDiffMinutes)}m ahead of your time`, color: "text-blue-600" };
    };

    const timeDiffInfo = getTimeDiffLabel();
    const queueFill = max_capacity > 0 ? Math.round((booked_count / max_capacity) * 100) : 0;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={clsx(
                "bg-white rounded-3xl border shadow-sm overflow-hidden transition-all duration-300",
                isNotified
                    ? "border-emerald-100 shadow-emerald-50"
                    : "border-gray-100 hover:shadow-md hover:border-indigo-100"
            )}
        >
            {/* Top color strip */}
            <div className={clsx(
                "h-1.5 w-full",
                isNotified ? "bg-gradient-to-r from-emerald-400 to-teal-400" : "bg-gradient-to-r from-indigo-500 to-purple-500"
            )} />

            <div className="p-6">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className={clsx(
                            "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                            isNotified ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"
                        )}>
                            <Bell className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 text-sm leading-tight">{service_name || 'Service'}</h3>
                            <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                                <Building2 className="h-3 w-3" />
                                {org_name || 'Organization'}
                            </p>
                        </div>
                    </div>
                    <StatusBadge status={status} />
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Slot Time
                        </p>
                        <p className="text-xs font-black text-gray-900">
                            {slotStartDate ? format(slotStartDate, 'MMM d, h:mm a') : '--'}
                        </p>
                    </div>
                    <div className="bg-indigo-50 rounded-2xl p-3 border border-indigo-100">
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Zap className="h-3 w-3" /> Your Desired Time
                        </p>
                        <p className="text-xs font-black text-indigo-700">
                            {desiredDate ? format(desiredDate, 'h:mm a') : '--'}
                        </p>
                    </div>
                </div>

                {/* Estimated Time Section */}
                <div className={clsx(
                    "rounded-2xl p-4 border mb-4",
                    isNotified
                        ? "bg-emerald-50 border-emerald-100"
                        : "bg-gradient-to-r from-slate-50 to-indigo-50/50 border-slate-100"
                )}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Currently Estimated At
                            </p>
                            <p className={clsx(
                                "text-base font-black",
                                isNotified ? "text-emerald-700" : "text-gray-900"
                            )}>
                                {estimatedDate ? format(estimatedDate, 'h:mm a') : 'Calculating...'}
                            </p>
                        </div>
                        {timeDiffInfo && (
                            <span className={clsx("text-[11px] font-black", timeDiffInfo.color)}>
                                {timeDiffInfo.text}
                            </span>
                        )}
                    </div>

                    {/* Queue Fill Bar */}
                    {max_capacity > 0 && (
                        <div className="mt-3">
                            <div className="flex justify-between text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                                <span>Queue Filled</span>
                                <span>{booked_count}/{max_capacity} booked</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={clsx(
                                        "h-full rounded-full transition-all duration-500",
                                        queueFill >= 90 ? "bg-red-400" : queueFill >= 60 ? "bg-amber-400" : "bg-emerald-400"
                                    )}
                                    style={{ width: `${queueFill}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer: Set time ago + Cancel */}
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 font-medium">
                        Alert set {created_at ? formatDistanceToNow(safeDate(created_at), { addSuffix: true }) : ''}
                    </p>
                    {!isNotified && (
                        <button
                            onClick={() => onCancel(id)}
                            disabled={isCancelling}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-black hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCancelling
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <X className="h-3 w-3" />
                            }
                            {isCancelling ? 'Cancelling...' : 'Cancel Alert'}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// ─── Main Component ───
const NotifyMeTracker = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'notified'

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await apiService.getMyNotifications();
            setNotifications(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error('[NotifyMeTracker] Fetch failed:', e);
            toast.error('Could not load your alerts.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Auto-refresh every 60 seconds so estimated times stay fresh
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleCancel = async (id) => {
        setCancellingId(id);
        try {
            await apiService.cancelNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast.success('Alert cancelled successfully.');
        } catch (e) {
            toast.error('Could not cancel alert. Try again.');
        } finally {
            setCancellingId(null);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'pending') return n.status === 'pending';
        if (filter === 'notified') return n.status === 'notified';
        return true;
    });

    const pendingCount = notifications.filter(n => n.status === 'pending').length;
    const notifiedCount = notifications.filter(n => n.status === 'notified').length;

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2].map(i => (
                    <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 animate-pulse">
                        <div className="flex gap-3 mb-4">
                            <div className="h-10 w-10 bg-gray-200 rounded-2xl" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded-lg w-2/3" />
                                <div className="h-3 bg-gray-100 rounded-lg w-1/3" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="h-16 bg-gray-100 rounded-2xl" />
                            <div className="h-16 bg-gray-100 rounded-2xl" />
                        </div>
                        <div className="h-20 bg-gray-100 rounded-2xl" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Bell className="h-6 w-6 text-indigo-500" />
                        My Wait Alerts
                    </h2>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                        Track all your "Notify Me" requests and their current queue status.
                    </p>
                </div>
                <button
                    onClick={() => { setLoading(true); fetchNotifications(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-black hover:bg-gray-200 transition-all"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                </button>
            </div>

            {/* Stats Row */}
            {notifications.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                        <p className="text-2xl font-black text-gray-900">{notifications.length}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-1">Total</p>
                    </div>
                    <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 text-center">
                        <p className="text-2xl font-black text-amber-700">{pendingCount}</p>
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-wider mt-1">Waiting</p>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 text-center">
                        <p className="text-2xl font-black text-emerald-700">{notifiedCount}</p>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider mt-1">Notified</p>
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            {notifications.length > 0 && (
                <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-2xl border border-gray-200 w-fit">
                    {[
                        { key: 'all', label: 'All Alerts' },
                        { key: 'pending', label: '⏳ Waiting' },
                        { key: 'notified', label: '✅ Notified' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={clsx(
                                "px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200",
                                filter === tab.key
                                    ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                                    : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Cards */}
            <AnimatePresence mode="popLayout">
                {filteredNotifications.length > 0 ? (
                    <div className="space-y-4">
                        {filteredNotifications.map(n => (
                            <NotifyCard
                                key={n.id}
                                notification={n}
                                onCancel={handleCancel}
                                cancellingId={cancellingId}
                            />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100"
                    >
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <BellOff className="h-9 w-9 text-gray-200" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">
                            {filter === 'all' ? 'No Wait Alerts Set' : `No ${filter === 'pending' ? 'Waiting' : 'Notified'} Alerts`}
                        </h3>
                        <p className="text-gray-400 font-medium max-w-xs text-sm leading-relaxed">
                            {filter === 'all'
                                ? 'When you click "Notify Me" on a slot, your alerts will appear here so you can track them.'
                                : `You don't have any alerts in this category.`
                            }
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Info Footer */}
            <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <AlertCircle className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                    <strong>How it works:</strong> Estimated times update automatically as the queue moves. 
                    You'll get notified when the queue reaches your desired time. 
                    Alerts auto-refresh every 60 seconds.
                </p>
            </div>
        </div>
    );
};

export default NotifyMeTracker;
