import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
    Loader2,
    User,
    Clock,
    Play,
    CheckCircle,
    XCircle,
    RefreshCw,
    Volume2,
    Users,
    Activity,
    Calendar,
    ArrowRightCircle,
    SkipForward
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueueSocket } from '../../hooks/useQueueSocket';

const AdminLiveQueue = () => {
    const [queues, setQueues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [refreshing, setRefreshing] = useState(false);
    const [transitioningQueue, setTransitioningQueue] = useState(null); // { queueId, currentAppt, nextAppt }

    const fetchQueue = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const res = await api.get(`/admin/live-queue?date=${selectedDate}`);
            setQueues(res.data);
        } catch (error) {
            console.error("Queue fetch failed");
            toast.error("Failed to fetch live queue");
        } finally {
            if (!isBackground) setLoading(false);
            setRefreshing(false);
        }
    };

    // Initial Fetch
    useEffect(() => {
        fetchQueue();
    }, [selectedDate]);

    // WebSocket Integration
    const user = JSON.parse(localStorage.getItem('user'));
    const { queueData, emitStatusChange } = useQueueSocket(user?.organizationId);

    useEffect(() => {
        if (queueData) {
            fetchQueue(true); // Always refresh on socket update for consistency
        }
    }, [queueData]);

    const formatTime = (isoString) => {
        if (!isoString) return '';
        return new Intl.DateTimeFormat('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(new Date(isoString));
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchQueue(true);
    };

    const updateStatus = async (id, status, silent = false) => {
        try {
            await api.patch(`/admin/appointments/${id}`, { status });
            if (!silent) toast.success(`Updated status to ${status.replace('_', ' ')}`);

            // Emit via socket for real-time propagation
            emitStatusChange(id, status);

            if (!silent) fetchQueue(true);
        } catch (error) {
            if (!silent) toast.error(error.response?.data?.message || "Action failed");
            throw error;
        }
    };

    const callPatient = (token) => {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-indigo-600 shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 text-white overflow-hidden`}>
                <div className="flex-1 w-0 p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-white/20 p-3 rounded-full">
                            <Volume2 className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-medium text-white/80 uppercase tracking-widest text-[10px]">Calling Now</p>
                            <p className="mt-1 text-2xl font-bold text-white">Ticket #{token}</p>
                        </div>
                    </div>
                </div>
            </div>
        ), { duration: 5000 });

        // In real app, this would trigger an announcement system
    };

    const handleCallNext = async (queue) => {
        const currentlyServing = queue.appointments.find(a => a.status === 'serving');
        const nextInLine = queue.appointments.find(a => a.status === 'confirmed' || a.status === 'pending');

        if (!nextInLine) {
            toast("No one waiting in this queue");
            return;
        }

        if (currentlyServing) {
            // Need to transition the current one first
            setTransitioningQueue({
                queueId: queue.id,
                currentAppt: currentlyServing,
                nextAppt: nextInLine
            });
        } else {
            // Just call the next one
            await updateStatus(nextInLine.id, 'serving');
            callPatient(nextInLine.token_number);
        }
    };

    const completeTransition = async (status) => {
        if (!transitioningQueue) return;
        const { currentAppt, nextAppt } = transitioningQueue;
        const loadingToast = toast.loading("Advancing queue...");

        try {
            // 1. Update current
            await updateStatus(currentAppt.id, status, true);

            // 2. Call next
            await updateStatus(nextAppt.id, 'serving', true);
            callPatient(nextAppt.token_number);

            toast.success(`Queue advanced! Ticket #${nextAppt.token_number} is now serving.`, { id: loadingToast });
            setTransitioningQueue(null);
            fetchQueue(true);
        } catch (error) {
            toast.error("Transition failed", { id: loadingToast });
        }
    };

    // Stats
    const totalPending = queues.reduce((acc, q) => acc + q.appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length, 0);
    const totalServing = queues.reduce((acc, q) => acc + q.appointments.filter(a => a.status === 'serving').length, 0);

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 border-b border-gray-100 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <span className="relative flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                        </span>
                        Real-time Queue Dashboard
                    </h1>
                    <p className="text-gray-500 mt-2 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-indigo-500" />
                        Managing {queues.length} active service queues
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white p-1.5 pl-4 rounded-2xl border border-gray-200 shadow-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer p-0 pr-4"
                    />
                    <div className="w-px h-6 bg-gray-200"></div>
                    <button
                        onClick={handleRefresh}
                        className={`p-2 rounded-xl hover:bg-gray-50 transition-all text-gray-500 ${refreshing ? 'animate-spin text-indigo-600' : ''}`}
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Waiting Now</p>
                    <p className="text-3xl font-black text-orange-600 mt-1">{totalPending}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Currently Serving</p>
                    <p className="text-3xl font-black text-indigo-600 mt-1">{totalServing}</p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <Loader2 className="animate-spin text-indigo-600 h-10 w-10 mb-4" />
                    <p className="text-gray-500 font-medium font-mono text-xs uppercase tracking-widest">Hydrating Live Stream...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <AnimatePresence mode="popLayout">
                        {queues.length === 0 ? (
                            <div className="col-span-full py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-center">
                                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900">No Activity Today</h3>
                                <p className="text-gray-500 mt-1">Queues will appear here as soon as customers join.</p>
                            </div>
                        ) : queues.map(queue => (
                            <motion.div
                                key={queue.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px]"
                            >
                                {/* Queue Header */}
                                <div className="p-6 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                            {queue.name}
                                            {queue.slot_start && (
                                                <span className="ml-2 text-sm font-normal text-gray-500">
                                                    ({formatTime(queue.slot_start)} - {formatTime(queue.slot_end)})
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                                            <User className="h-3 w-3" /> {queue.resource_name}
                                        </p>
                                    </div>
                                    <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 text-center min-w-[80px]">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Waiting</p>
                                        <p className="text-xl font-black text-slate-800">{queue.appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length}</p>
                                    </div>
                                </div>

                                {/* Queue Body */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    {queue.appointments.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-sm">Empty Queue</div>
                                    ) : (
                                        queue.appointments.map((appt, i) => {
                                            const isServing = appt.status === 'serving';
                                            const isNext = !isServing && (appt.status === 'pending' || appt.status === 'confirmed') &&
                                                !queue.appointments.some((a, idx) => idx < i && (a.status === 'pending' || a.status === 'confirmed'));
                                            const isCompleted = appt.status === 'completed' || appt.status === 'no_show';

                                            return (
                                                <motion.div
                                                    key={appt.id}
                                                    layout
                                                    className={`
                                                        p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4
                                                        ${isServing ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100 scale-[1.02] z-10' :
                                                            isNext ? 'bg-indigo-50 border-indigo-200' :
                                                                isCompleted ? 'bg-gray-50 opacity-50 border-gray-100' : 'bg-white border-gray-100'}
                                                    `}
                                                >
                                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black text-lg ${isServing ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
                                                        #{appt.queue_number}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className={`font-bold truncate ${isServing ? 'text-white' : 'text-slate-900'}`}>{appt.user_name}</h4>
                                                            {isServing && <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full animate-pulse">SERVING</span>}
                                                            {isNext && <span className="text-[10px] font-black bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full">NEXT</span>}
                                                        </div>
                                                        <p className={`text-xs ${isServing ? 'text-indigo-100' : 'text-slate-400'} flex items-center gap-1 mt-0.5`}>
                                                            Ticket: {appt.token_number}
                                                        </p>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {isServing ? (
                                                            <>
                                                                <button
                                                                    onClick={() => updateStatus(appt.id, 'completed')}
                                                                    className="p-2.5 bg-white text-indigo-600 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-sm"
                                                                    title="Mark Done"
                                                                >
                                                                    <CheckCircle className="h-5 w-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => updateStatus(appt.id, 'no_show')}
                                                                    className="p-2.5 bg-white/10 text-white rounded-xl hover:bg-red-500 transition-all"
                                                                    title="No Show / Skip"
                                                                >
                                                                    <SkipForward className="h-5 w-5" />
                                                                </button>
                                                            </>
                                                        ) : (appt.status === 'confirmed' || appt.status === 'pending') ? (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        updateStatus(appt.id, 'serving');
                                                                        callPatient(appt.token_number);
                                                                    }}
                                                                    className="p-2.5 bg-white border border-slate-200 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                                                                    title="Start Serving"
                                                                >
                                                                    <Play className="h-4 w-4 fill-current" />
                                                                </button>
                                                            </>
                                                        ) : isCompleted && (
                                                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${appt.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                {appt.status.replace('_', ' ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Queue Footer Action */}
                                <div className="p-4 bg-white border-t border-gray-100">
                                    <button
                                        className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors"
                                        onClick={() => handleCallNext(queue)}
                                    >
                                        <ArrowRightCircle className="h-5 w-5" />
                                        Call Next Customer
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Transition Modal */}
            <AnimatePresence>
                {transitioningQueue && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setTransitioningQueue(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white rounded-[2.5rem] p-8 shadow-2xl max-w-md w-full overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>

                            <div className="text-center space-y-4">
                                <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6">
                                    <ArrowRightCircle className="h-10 w-10 text-indigo-600" />
                                </div>

                                <h3 className="text-2xl font-black text-slate-900">Queue Transition</h3>
                                <p className="text-slate-500 leading-relaxed">
                                    Customer <span className="font-bold text-slate-800">#{transitioningQueue.currentAppt.queue_number}</span> is still marked as serving. How was their session ended?
                                </p>

                                <div className="grid grid-cols-1 gap-3 pt-6">
                                    <button
                                        onClick={() => completeTransition('completed')}
                                        className="w-full py-4 bg-emerald-50 text-emerald-700 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-100 transition-all border border-emerald-100"
                                    >
                                        <CheckCircle className="h-5 w-5" />
                                        Completed Successfully
                                    </button>
                                    <button
                                        onClick={() => completeTransition('no_show')}
                                        className="w-full py-4 bg-rose-50 text-rose-700 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-rose-100 transition-all border border-rose-100"
                                    >
                                        <SkipForward className="h-5 w-5" />
                                        No Show / Cancelled
                                    </button>
                                    <button
                                        onClick={() => setTransitioningQueue(null)}
                                        className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-all"
                                    >
                                        Wait, don't advance yet
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminLiveQueue;
