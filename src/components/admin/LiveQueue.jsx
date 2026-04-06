import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Clock, CheckCircle, SkipForward, Play, 
    Activity, Calendar, RefreshCw, Volume2, User, UserPlus, ArrowRightCircle,
    XCircle, X, Loader2, Info, AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { useQueueSocket } from '../../hooks/useQueueSocket';
import { toast } from 'react-hot-toast';
import OtpVerificationModal from './OtpVerificationModal';
import { ShieldCheck } from 'lucide-react';

const InfoTooltip = ({ text }) => (
    <div className="group relative inline-block">
        <div className="cursor-help text-slate-300 hover:text-indigo-500 transition-colors p-1">
            <Info className="h-3.5 w-3.5" />
        </div>
        <div className="absolute top-full right-0 mt-3 w-72 p-4 bg-slate-900 text-white text-[11px] leading-relaxed rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[9999] shadow-2xl border border-white/10">
            {text}
            <div className="absolute bottom-full right-3 border-8 border-transparent border-b-slate-900"></div>
        </div>
    </div>
);

const formatName = (name) => {
    if (!name) return '';
    let n = name.toLowerCase().trim();
    if (n.startsWith('dr ')) {
        n = 'Dr. ' + n.substring(3);
    } else if (n.startsWith('dr.')) {
        n = 'Dr. ' + n.substring(3).trim();
    }
    return n.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '--:--';
        return new Intl.DateTimeFormat('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    } catch (e) {
        return '--:--';
    }
};

// ─── Memoized Appointment Card ───
const AppointmentCard = memo(({ appt, i, queue, isNext, isServing, isCompleted, onUpdateStatus, onCallPatient, t, predictiveInsights, onVerifyCheckin }) => {
    const isPastDue = appt.is_past && !isCompleted && !isServing;

    return (
        <motion.div
            layout
            className={`
                p-5 rounded-[1.5rem] border transition-all duration-300 flex items-center gap-5 group
                ${isServing ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100 scale-[1.02] z-10' :
                    isPastDue ? 'bg-amber-50 border-amber-200 shadow-sm ring-1 ring-amber-100' :
                    isNext ? 'bg-indigo-50/50 border-indigo-100 shadow-sm' :
                        isCompleted ? 'bg-slate-50/50 opacity-60 border-slate-100' : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-sm'}
            `}
        >
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm transition-all duration-300 ${isServing ? 'bg-white/20 scale-110' : 'bg-white border border-slate-100 text-slate-400 group-hover:border-indigo-200 group-hover:text-indigo-500'}`}>
                {appt.queue_number}
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                    <h4 className={`text-lg font-bold truncate tracking-tight ${isServing ? 'text-white' : 'text-slate-900'}`}>{formatName(appt.user_name)}</h4>
                    
                    {appt.check_in_method === 'user_signal' && (
                        <span className="flex items-center gap-1.5 text-[9px] font-black bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full tracking-widest uppercase border border-emerald-200 animate-pulse">
                             <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></div> {t('status.arrived', 'ARRIVED')}
                        </span>
                    )}

                    {appt.check_in_method === 'user_delayed' && (
                        <span className="flex items-center gap-1.5 text-[9px] font-black bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full tracking-widest uppercase border border-amber-200">
                             <Clock className="h-2.5 w-2.5" /> {t('status.delayed', 'DELAYED')}
                        </span>
                    )}

                    {isServing && (
                        <span className="flex items-center gap-1 text-[9px] font-black bg-white/20 px-2.5 py-1 rounded-full animate-pulse tracking-widest border border-white/10">
                            <div className="h-1 w-1 bg-white rounded-full"></div> {t('status.serving', 'SERVING')}
                        </span>
                    )}
                    {isNext && (
                        <span className="text-[9px] font-black bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-2.5 py-1 rounded-full tracking-widest uppercase shadow-sm shadow-indigo-200">{t('status.next', 'UP NEXT')}</span>
                    )}
                    {isPastDue && (
                        <span className="flex items-center gap-1 text-[9px] font-black bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full tracking-widest uppercase border border-amber-200">
                             <AlertCircle className="h-2.5 w-2.5" /> {t('status.past_due', 'Past Due')}
                        </span>
                    )}
                </div>
               
                <div className="flex items-center gap-3 flex-wrap">
                    {appt.user_phone && (
                        <span className={`text-[11px] font-bold flex items-center gap-1.5 ${isServing ? 'text-white/80' : 'text-slate-500'}`}>
                            <Users className="h-3 w-3 opacity-60" /> {appt.user_phone}
                        </span>
                    )}
                     <span className={`text-[11px] font-bold flex items-center gap-1.5 ${isServing ? 'text-white/80' : 'text-slate-500'}`}>
                         <Clock className="h-3 w-3 opacity-60" /> {appt.slot_start ? formatTime(appt.slot_start) : <span className="text-[10px] uppercase tracking-tighter opacity-70">{t('queue.no_slot', 'No Slot')}</span>}
                     </span>
                     {appt.service_name && (
                         <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${isServing ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700 border border-indigo-100/50'}`}>
                             {appt.service_name}
                         </span>
                     )}
                     {!isServing && !isCompleted && (
                         <span className={`text-[11px] font-black flex items-center gap-1.5 transition-colors ${isNext ? 'text-indigo-600' : 'text-slate-400 opacity-80'}`}>
                             <div className={`h-1.5 w-1.5 rounded-full ${isNext ? 'bg-indigo-500 animate-pulse' : 'bg-current opacity-30'}`}></div>
                             {t('queue.wait_label', 'Wait')}: {(() => {
                                 const ahead = queue.appointments.filter((a, idx) => 
                                     idx < i && (a.status === 'confirmed' || a.status === 'pending' || a.status === 'serving' || a.status === 'waitlisted_urgent')
                                 ).length;
                                 const avg = predictiveInsights?.averageDurations?.find(d => d.resource === appt.resource_name)?.minutes || 15;
                                 return ahead * avg;
                             })()}m
                         </span>
                     )}
                     <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg border transition-all ${isServing ? 'bg-white/10 text-white border-white/20' : 'bg-slate-50 text-slate-400 border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100/50'}`}>
                         {appt.token_number}
                     </span>
                </div>
            </div>

            <div className="flex gap-2">
                {isServing ? (
                    <>
                        <button
                            onClick={() => onVerifyCheckin(appt)}
                            className="h-11 w-11 bg-white text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-indigo-700/20 active:scale-95"
                            title={t('appointment.verify_complete', 'Verify & Complete')}
                        >
                            <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => onUpdateStatus(appt.id, 'no_show')}
                            disabled={appt.check_in_method === 'user_signal'}
                            className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${appt.check_in_method === 'user_signal' ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-white/10 text-white hover:bg-rose-500'}`}
                            title={appt.check_in_method === 'user_signal' ? t('status.no_show_disabled', 'Cannot mark Arrived user as No Show') : t('status.no_show', 'No Show / Skip')}
                        >
                            <SkipForward className="h-5 w-5" />
                        </button>
                    </>
                ) : (appt.status === 'confirmed' || appt.status === 'pending') ? (
                    <button
                        onClick={() => {
                            onUpdateStatus(appt.id, 'serving');
                            onCallPatient(appt.token_number);
                        }}
                        className="h-11 w-11 bg-white border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm active:scale-95 md:opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title={t('common.start_serving', 'Start Serving')}
                    >
                        <Play className="h-4 w-4 fill-current" />
                    </button>
                ) : isCompleted && (
                    <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${appt.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                        {t(`status.${appt.status}`, appt.status.replace('_', ' '))}
                    </div>
                )}
            </div>
        </motion.div>
    );
});
AppointmentCard.displayName = 'AppointmentCard';

const AdminLiveQueue = () => {
    const { t } = useTranslation();
    const [queues, setQueues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [refreshing, setRefreshing] = useState(false);
    const [transitioningQueue, setTransitioningQueue] = useState(null);
    const [predictiveInsights, setPredictiveInsights] = useState(null);
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [activeQueueForManual, setActiveQueueForManual] = useState(null);
    const [manualEntryData, setManualEntryData] = useState({ customer_name: '', customer_phone: '', resourceId: '', slotId: '', serviceId: '' });
    const [availableSlotsForManual, setAvailableSlotsForManual] = useState([]);
    const [availableServicesForManual, setAvailableServicesForManual] = useState([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isLoadingServices, setIsLoadingServices] = useState(false);
    const [otpModal, setOtpModal] = useState({ isOpen: false, appointment: null });

    const fetchQueue = useCallback(async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/admin/live-queue?date=${selectedDate}`);
            setQueues(res.data);
        } catch (error) {
            console.error('Queue fetch failed:', error?.response?.data || error);
            const errMsg = error?.response?.data?.message || error?.message || t('common.unknown_error', 'Unknown error');
            setError(errMsg);
            if (!isBackground) toast.error(t('queue.load_error', `Queue Error: {{error}}`, { error: errMsg }));
        } finally {
            if (!isBackground) setLoading(false);
            setRefreshing(false);
        }
    }, [selectedDate, t]);

    const fetchPredictiveInsights = async () => {
        try {
            const res = await api.get('/admin/predictive-insights');
            setPredictiveInsights(res.data);
        } catch (error) {
            console.error('Failed to fetch predictions', error);
        }
    };

    const fetchServicesForResource = async (resourceId) => {
        if (!resourceId) return;
        setIsLoadingServices(true);
        try {
            const res = await api.get(`/admin/resources/${resourceId}/services`);
            setAvailableServicesForManual(res.data);
            if (res.data.length === 1) {
                setManualEntryData(prev => ({ ...prev, serviceId: res.data[0].id }));
            }
        } catch (error) {
            console.error('Failed to fetch services', error);
            toast.error("Failed to load available services");
        } finally {
            setIsLoadingServices(false);
        }
    };

    const fetchSlotsForResource = async (resourceId) => {
        if (!resourceId) return;
        setIsLoadingSlots(true);
        try {
            const res = await api.get(`/admin/slots?resourceId=${resourceId}&date=${selectedDate}`);
            setAvailableSlotsForManual(res.data);
        } catch (error) {
            console.error('Failed to fetch slots', error);
            toast.error("Failed to load available slots for this date");
        } finally {
            setIsLoadingSlots(false);
        }
    };

    useEffect(() => {
        if (manualEntryData.resourceId && isManualModalOpen) {
            fetchSlotsForResource(manualEntryData.resourceId);
            fetchServicesForResource(manualEntryData.resourceId);
        }
    }, [manualEntryData.resourceId, isManualModalOpen]);

    useEffect(() => {
        fetchQueue();
        fetchPredictiveInsights();
    }, [selectedDate]);

    const user = JSON.parse(localStorage.getItem('user'));
    const { queueData, emitStatusChange } = useQueueSocket(user?.org_id);

    useEffect(() => {
        if (queueData) {
            fetchQueue(true);
        }
    }, [queueData]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchQueue(true);
    };

    const updateStatus = useCallback(async (id, status, silent = false) => {
        try {
            await api.patch(`/admin/appointments/${id}`, { status });
            if (!silent) toast.success(t('appointment.status_updated_generic', `Updated status to {{status}}`, { status: t(`status.${status}`, status.replace('_', ' ')) }));

            emitStatusChange(id, status);

            if (!silent) fetchQueue(true);
        } catch (error) {
            if (!silent) toast.error(error.response?.data?.message || t('common.action_failed', "Action failed"));
            throw error;
        }
    }, [t, emitStatusChange, fetchQueue]);

    const callPatient = useCallback((token) => {
        toast.custom((toastObj) => (
            <div className={`${toastObj.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-indigo-600 shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 text-white overflow-hidden`}>
                <div className="flex-1 w-0 p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-white/20 p-3 rounded-full">
                            <Volume2 className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-medium text-white/80 uppercase tracking-widest text-[10px]">{t('queue.calling_now', 'Calling Now')}</p>
                            <p className="mt-1 text-2xl font-bold text-white">{t('queue.ticket', 'Ticket')} #{token}</p>
                        </div>
                    </div>
                </div>
            </div>
        ), { duration: 5000 });
    }, [t]);

    const handleCallNext = async (queue) => {
        const currentlyServing = queue.appointments.find(a => a.status === 'serving');
        const nextInLine = queue.appointments.find(a => a.status === 'confirmed' || a.status === 'pending');

        if (!nextInLine) {
            toast(t('queue.no_one_waiting', "No one waiting in this queue"));
            return;
        }

        if (currentlyServing) {
            setTransitioningQueue({
                queueId: queue?.id,
                currentAppt: currentlyServing,
                nextAppt: nextInLine
            });
        } else {
            await updateStatus(nextInLine.id, 'serving');
            callPatient(nextInLine.token_number || '---');
        }
    };

    const completeTransition = async (status) => {
        if (!transitioningQueue) return;
        const { currentAppt, nextAppt } = transitioningQueue;
        const loadingToast = toast.loading(t('queue.advancing', "Advancing queue..."));

        try {
            await updateStatus(currentAppt.id, status, true);
            await updateStatus(nextAppt.id, 'serving', true);
            callPatient(nextAppt.token_number || '---');

            toast.success(t('queue.advanced_success', `Queue advanced! Ticket #{{token}} is now serving.`, { token: nextAppt.token_number || '---' }), { id: loadingToast });
            setTransitioningQueue(null);
            fetchQueue(true);
        } catch (error) {
            toast.error(t('queue.transition_failed', "Transition failed"), { id: loadingToast });
        }
    };

    const handleRebalance = async (resourceId, resourceName) => {
        const loadingToast = toast.loading(t('queue.rebalancing_status', `Rebalancing {{resource}}'s schedule...`, { resource: resourceName }));
        try {
            const response = await api.post(`/admin/rebalance/${resourceId}?date=${selectedDate}`);
            const moved = response.data.movedCount || 0;
            toast.success(t('queue.rebalanced_success', "Schedule rebalanced! {{count}} appointments moved.", { count: moved }), { id: loadingToast });
            fetchQueue(true);
        } catch (error) {
            console.error('Rebalance failed:', error);
            toast.error(error.response?.data?.message || t('queue.rebalance_failed', "Rebalance failed"), { id: loadingToast });
        }
    };

    const handleAddWalkIn = (queue) => {
        setActiveQueueForManual(queue);
        setManualEntryData({ 
            customer_name: '', 
            customer_phone: '', 
            resourceId: queue?.resource_id || '',
            slotId: '',
            serviceId: ''
        });
        setAvailableServicesForManual([]);
        setAvailableSlotsForManual([]);
        if (queue?.resource_id) {
            fetchSlotsForResource(queue.resource_id);
            fetchServicesForResource(queue.resource_id);
        }
        setIsManualModalOpen(true);
    };

    const submitManualEntry = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading(t('queue.adding_walkin', "Adding walk-in..."));
        
        if (!manualEntryData.serviceId) {
            toast.error("Please select a service", { id: loadingToast });
            return;
        }

        try {
            await api.post('/admin/appointments', {
                ...manualEntryData,
                serviceId: manualEntryData.serviceId,
                resourceId: manualEntryData.resourceId,
                slotId: manualEntryData.slotId,
                status: 'confirmed'
            });
            toast.success(t('queue.walkin_added', "Walk-in added!"), { id: loadingToast });
            setIsManualModalOpen(false);
            fetchQueue(true);
        } catch (error) {
            toast.error(error.response?.data?.message || t('queue.walkin_failed', "Failed to add walk-in"), { id: loadingToast });
        }
    };

    const totalPending = useMemo(() => queues.reduce((acc, q) => acc + q.appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length, 0), [queues]);
    const totalServing = useMemo(() => queues.reduce((acc, q) => acc + q.appointments.filter(a => a.status === 'serving').length, 0), [queues]);

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-4">
                        <div className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </div>
                        {t('queue.dashboard_title', 'Live Queue Hub')}
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
                        <Activity className="h-4 w-4 text-indigo-500" />
                        {t('queue.managing_active', 'Monitoring {{count}} active service streams', { count: queues.length })}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-white p-2 pl-4 rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer p-0 pr-4"
                        />
                    </div>
                    
                    <button
                        onClick={handleRefresh}
                        className={`p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 transition-all text-slate-500 group ${refreshing ? 'cursor-not-allowed' : 'active:scale-95'}`}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin text-indigo-600' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-orange-50 rounded-xl group-hover:scale-110 transition-transform">
                            <Users className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('queue.waiting_now', 'In Queue')}</p>
                            <p className="text-2xl font-black text-slate-900 leading-none">{totalPending}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-indigo-50 rounded-xl group-hover:scale-110 transition-transform">
                            <Activity className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('queue.currently_serving', 'Now Serving')}</p>
                            <p className="text-2xl font-black text-slate-900 leading-none">{totalServing}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow hidden md:block group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-emerald-50 rounded-xl group-hover:scale-110 transition-transform">
                            <Activity className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Working Queues</p>
                            <p className="text-2xl font-black text-slate-900 leading-none">
                                {queues.length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <Loader2 className="animate-spin text-indigo-600 h-10 w-10 mb-4" />
                    <p className="text-gray-500 font-medium font-mono text-xs uppercase tracking-widest">{t('queue.hydrating', 'Hydrating Live Stream...')}</p>
                </div>
            ) : error ? (
                <div className="col-span-full py-16 bg-red-50 rounded-3xl border-2 border-dashed border-red-200 text-center px-8">
                    <XCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-red-800">{t('queue.load_fail_title', 'Failed to Load Queue')}</h3>
                    <p className="text-red-600 mt-1 text-sm font-mono bg-red-100 rounded-lg px-4 py-2 inline-block mt-3">{error}</p>
                    <div className="mt-4">
                        <button onClick={handleRefresh} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
                            {t('common.retry', 'Retry')}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <AnimatePresence mode="popLayout">
                        {queues.length === 0 ? (
                            <div className="col-span-full py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-center">
                                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900">{t('queue.no_activity', 'No Activity Today')}</h3>
                                <p className="text-gray-500 mt-1">{t('queue.check_back', 'Queues will appear here as soon as customers join.')}</p>
                            </div>
                        ) : queues.map(queue => (
                            <motion.div
                                key={queue.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[400px]"
                            >
                                 <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-y-4 gap-x-4 flex-wrap">
                                         <div className="flex items-center gap-5 min-w-0">
                                              <div className="h-14 w-14 bg-gradient-to-br from-white to-slate-50 shadow-md border border-slate-200/60 rounded-2xl flex-shrink-0 flex items-center justify-center text-indigo-600 transform -rotate-3 hover:rotate-0 transition-all duration-300 group-hover:shadow-indigo-100">
                                                 <User className="h-7 w-7" />
                                             </div>
                                             <div className="flex flex-col">
                                                <h3 className="text-sm font-black text-slate-900 tracking-tight leading-none mb-1">{queue.resource_name || queue.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tighter">
                                                        <Activity className="h-2.5 w-2.5" />
                                                        {queue.scope === 'PER_RESOURCE' ? t('resource.professional', 'Professional') : t('service.central_queue', 'Central')}
                                                    </span>
                                                </div>
                                            </div>
                                         </div>
                                         
                                          <div className="flex items-center gap-3 ml-auto sm:ml-0 lg:ml-auto self-stretch sm:self-auto min-w-0 flex-wrap sm:flex-nowrap">
                                              <div className="flex items-center gap-1.5 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50 shadow-inner">
                                                  <button
                                                      onClick={() => handleRebalance(queue.resource_id, queue.resource_name)}
                                                      className="p-2 bg-white text-slate-600 rounded-xl hover:bg-slate-50 border border-slate-100 shadow-sm transition-all h-9 w-9 flex items-center justify-center group/btn relative"
                                                  >
                                                      <RefreshCw className="h-4 w-4 group-hover/btn:rotate-180 transition-transform duration-500" />
                                                      <div className="absolute -top-1.5 -right-1.5 scale-75 origin-bottom-left">
                                                          <InfoTooltip text={t('queue.rebalance_tooltip', "Optimally redistribute pending appointments across available time slots.")} />
                                                      </div>
                                                  </button>
 
                                                  <div className="w-px h-6 bg-slate-200 mx-0.5"></div>
 
                                                  <button
                                                      onClick={() => handleAddWalkIn(queue)}
                                                      className="p-2 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 border border-slate-100 shadow-sm transition-all h-9 w-9 flex items-center justify-center group/btn relative"
                                                  >
                                                      <UserPlus className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                                                      <div className="absolute -top-1.5 -right-1.5 scale-75 origin-bottom-left">
                                                          <InfoTooltip text={t('queue.walkin_tooltip', "Quickly add a walk-in customer who has arrived without a prior appointment.")} />
                                                      </div>
                                                  </button>
                                              </div>
 
                                              <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
 
                                              <div className="flex gap-2 min-w-0">
                                                  <div className="min-w-[70px] bg-white px-3 py-2 rounded-2xl shadow-sm border border-slate-200 text-center flex-shrink-0">
                                                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mb-1">{t('queue.waiting_status', 'Wait')}</p>
                                                      <p className="text-base font-black text-slate-900 leading-none">{queue.appointments.filter(a => a.status === 'confirmed' || a.status === 'pending' || a.status === 'waitlisted_urgent').length}</p>
                                                  </div>
                                                  <div className="min-w-[90px] bg-indigo-600 px-4 py-2 rounded-2xl shadow-md shadow-indigo-100 text-center flex-shrink-0 border border-indigo-500">
                                                      <p className="text-[10px] text-indigo-100 font-black uppercase tracking-tighter mb-1">Avg. Time</p>
                                                      <p className="text-base font-black text-white leading-none whitespace-nowrap">
                                                          {queue.scope === 'PER_RESOURCE' 
                                                              ? (predictiveInsights?.resourceAverages?.find(d => d.resourceId === queue.resource_id || d.resourceName === queue.resource_name)?.minutes || 15)
                                                              : (predictiveInsights?.averageDurations?.find(d => d.service === queue.name)?.minutes || 15)
                                                          }<span className="text-[10px] ml-0.5 text-indigo-200 uppercase font-black">m</span>
                                                      </p>
                                                  </div>
                                              </div>
                                          </div>
                                     </div>
                                 </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    {queue.appointments.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-sm">{t('queue.empty_queue', 'Empty Queue')}</div>
                                    ) : (
                                        queue.appointments.map((appt, i) => {
                                            const isServing = appt.status === 'serving';
                                            const isNext = !isServing && (appt.status === 'pending' || appt.status === 'confirmed') &&
                                                !queue.appointments.some((a, idx) => idx < i && (a.status === 'pending' || a.status === 'confirmed'));
                                            const isCompleted = appt.status === 'completed' || appt.status === 'no_show';

                                            const showSeparator = i > 0 && queue.appointments[i - 1].slot_start !== appt.slot_start;

                                            return (
                                                <div key={appt.id}>
                                                    {showSeparator && (
                                                        <div className="flex items-center gap-4 my-8">
                                                            <div className="h-px bg-slate-200 flex-1"></div>
                                                            <div className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 shadow-sm rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                                                <Clock className="h-3 w-3 text-indigo-500" />
                                                                {formatTime(appt.slot_start) || t('queue.next_available', 'Next Available')}
                                                            </div>
                                                            <div className="h-px bg-slate-200 flex-1"></div>
                                                        </div>
                                                    )}
                                                    <AppointmentCard
                                                        appt={appt}
                                                        i={i}
                                                        queue={queue}
                                                        isNext={isNext}
                                                        isServing={isServing}
                                                        isCompleted={isCompleted}
                                                        onUpdateStatus={updateStatus}
                                                        onCallPatient={callPatient}
                                                        t={t}
                                                        predictiveInsights={predictiveInsights}
                                                        onVerifyCheckin={(appt) => {
                                                            setOtpModal({ isOpen: true, appointment: appt });
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="p-6 bg-white border-t border-slate-100">
                                    <button
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-indigo-600 shadow-lg shadow-slate-200 hover:shadow-indigo-200 transition-all active:scale-[0.98]"
                                        onClick={() => handleCallNext(queue)}
                                    >
                                        <ArrowRightCircle className="h-5 w-5" />
                                        {t('queue.call_next', 'Call Next Customer')}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <AnimatePresence>
                {transitioningQueue && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                            onClick={() => setTransitioningQueue(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative bg-white rounded-[3rem] p-10 shadow-2xl max-w-md w-full overflow-hidden border border-slate-100"
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>

                            <div className="text-center">
                                <div className="mx-auto w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-3">
                                    <ArrowRightCircle className="h-12 w-12 text-indigo-600 -rotate-3" />
                                </div>

                                <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-3">{t('queue.transition_title', 'Next in Line')}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed px-4">
                                    {t('queue.transition_message', `Session for #{{number}} is ending. How should we record this?`, { number: transitioningQueue.currentAppt.queue_number })}
                                </p>

                                <div className="grid grid-cols-1 gap-4 pt-10">
                                    <button
                                        onClick={() => {
                                            setOtpModal({ isOpen: true, appointment: transitioningQueue.currentAppt });
                                            setTransitioningQueue(null);
                                        }}
                                        className="w-full py-5 bg-emerald-50 text-emerald-700 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-100 shadow-sm active:scale-95"
                                    >
                                        <CheckCircle className="h-5 w-5" />
                                        {t('queue.completed_successfully', 'Completed Successfully')}
                                    </button>
                                    <button
                                        onClick={() => completeTransition('no_show')}
                                        className="w-full py-5 bg-rose-50 text-rose-700 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-rose-500 hover:text-white transition-all border border-rose-100 shadow-sm active:scale-95"
                                    >
                                        <SkipForward className="h-5 w-5" />
                                        {t('status.no_show', 'Mark as No-Show')}
                                    </button>
                                    <button
                                        onClick={() => setTransitioningQueue(null)}
                                        className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-all text-sm mt-2"
                                    >
                                        {t('common.wait_cancel', "Cancel & Go Back")}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isManualModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                            onClick={() => setIsManualModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative bg-white rounded-[2.5rem] p-10 shadow-2xl max-w-md w-full overflow-hidden border border-slate-100"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
                                        {t('queue.add_walkin', 'Manual Entry')}
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('queue.direct_addition', 'Direct Queue Addition')}</p>
                                </div>
                                <button onClick={() => setIsManualModalOpen(false)} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors border border-slate-100 text-slate-400">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-3xl mb-8 border border-slate-100">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">{t('queue.target_queue', 'Target Stream')}</p>
                                <p className="text-lg font-black text-indigo-600 leading-none">{activeQueueForManual?.resource_name || activeQueueForManual?.name}</p>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{activeQueueForManual?.name}</p>
                            </div>

                            <form onSubmit={submitManualEntry} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.professional', 'Professional')}</label>
                                    <select
                                        required
                                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-bold text-slate-700"
                                        value={manualEntryData.resourceId}
                                        onChange={e => {
                                            const newId = e.target.value;
                                            setManualEntryData({ ...manualEntryData, resourceId: newId, slotId: '', serviceId: '' });
                                            if (newId) {
                                                fetchSlotsForResource(newId);
                                                fetchServicesForResource(newId);
                                            }
                                        }}
                                    >
                                        <option value="">{t('queue.select_professional', 'Select professional')}</option>
                                        {queues.map(q => (
                                            <option key={q.resource_id || q.id} value={q.resource_id || q.id}>{q.resource_name || q.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.service', 'Service')}</label>
                                    <div className="relative">
                                        <select
                                            required
                                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-bold text-slate-700 disabled:opacity-50 disabled:bg-slate-50 appearance-none"
                                            value={manualEntryData.serviceId}
                                            onChange={e => setManualEntryData({ ...manualEntryData, serviceId: e.target.value })}
                                            disabled={!manualEntryData.resourceId || isLoadingServices}
                                        >
                                            <option value="">
                                                {isLoadingServices ? t('common.loading', 'Loading...') : t('queue.select_service', 'Select service')}
                                            </option>
                                            {availableServicesForManual && availableServicesForManual.length > 0 ? (
                                                availableServicesForManual.map(svc => (
                                                    <option key={svc.id} value={svc.id}>
                                                        {svc.name} - ₹{svc.price} ({svc.estimated_service_time}m)
                                                    </option>
                                                ))
                                            ) : (
                                                !isLoadingServices && manualEntryData.resourceId && (
                                                    <option value="" disabled>-- No services linked to this professional --</option>
                                                )
                                            )}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <div className="h-2 w-2 border-r-2 border-b-2 border-slate-400 rotate-45 transform" />
                                        </div>
                                    </div>
                                    {manualEntryData.resourceId && !isLoadingServices && availableServicesForManual.length === 0 && (
                                        <p className="text-[10px] text-rose-500 font-bold ml-1">{t('queue.no_services_found', 'No services linked to this professional')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.time_slot', 'Time Slot')}</label>
                                    <div className="relative">
                                        <select
                                            required
                                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-bold text-slate-700 disabled:opacity-50 disabled:bg-slate-50 appearance-none"
                                            value={manualEntryData.slotId}
                                            onChange={e => setManualEntryData({ ...manualEntryData, slotId: e.target.value })}
                                            disabled={!manualEntryData.resourceId || isLoadingSlots}
                                        >
                                            <option value="">
                                                {isLoadingSlots ? t('common.loading', 'Loading...') : t('queue.select_slot', 'Select time slot')}
                                            </option>
                                            {availableSlotsForManual && availableSlotsForManual.length > 0 ? (
                                                availableSlotsForManual.map(slot => (
                                                    <option key={slot.id} value={slot.id}>
                                                        {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </option>
                                                ))
                                            ) : (
                                                !isLoadingSlots && manualEntryData.resourceId && (
                                                    <option value="" disabled>-- No slots available for today --</option>
                                                )
                                            )}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <div className="h-2 w-2 border-r-2 border-b-2 border-slate-400 rotate-45 transform" />
                                        </div>
                                    </div>
                                    {manualEntryData.resourceId && !isLoadingSlots && availableSlotsForManual.length === 0 && (
                                        <p className="text-[10px] text-rose-500 font-bold ml-1">{t('queue.no_slots_today', 'No slots available for today')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.customer_name', 'Customer Name')}</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder={t('common.full_name', 'Enter full name')}
                                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                        value={manualEntryData.customer_name}
                                        onChange={e => setManualEntryData({ ...manualEntryData, customer_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.phone_number', 'Mobile Contact')} <span className="opacity-50 text-[9px]">({t('common.optional', 'Optional')})</span></label>
                                    <input
                                        type="tel"
                                        placeholder="+91"
                                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                        value={manualEntryData.customer_phone}
                                        onChange={e => setManualEntryData({ ...manualEntryData, customer_phone: e.target.value })}
                                    />
                                </div>

                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        <span>{t('queue.add_to_queue', 'Confirm & Add')}</span>
                                        <ArrowRightCircle className="h-6 w-6" />
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <OtpVerificationModal 
                isOpen={otpModal.isOpen}
                onClose={() => setOtpModal({ isOpen: false, appointment: null })}
                appointment={otpModal.appointment}
                onVerified={(id) => {
                    setOtpModal({ isOpen: false, appointment: null });
                    fetchQueue(true);
                }}
            />
        </div>
    );
};

export default AdminLiveQueue;
