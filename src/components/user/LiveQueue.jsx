import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import {
    Users, Clock, Ticket, ArrowLeft, RefreshCw, CheckCircle2, PlayCircle, Info, Brain, Sparkles
} from 'lucide-react';
import { useQueueSocket } from '../../hooks/useQueueSocket';
import { formatWaitTime } from '../../utils/format';
import { isValid, parseISO } from 'date-fns';
import InfoTooltip from '../common/InfoTooltip';
import QueueVisualization from './QueueVisualization';

export default function LiveQueue() {
    const { appointmentId } = useParams();
    const [status, setStatus] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchQueueStatus = async () => {
        try {
            const { data } = await api.get(`/appointments/${appointmentId}/queue`);
            setStatus(data);
            setError(null);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Queue fetch error:', err);
            const msg = err?.response?.data?.message || err?.message || 'Failed to load queue data';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Initial Fetch
    useEffect(() => {
        fetchQueueStatus();
    }, [appointmentId]);

    // WebSocket Integration
    const { queueData } = useQueueSocket(status?.org_id); // Joining by org room as fallback

    useEffect(() => {
        if (queueData) {
            // Check if this update applies to our service/resource
            if (queueData.type === 'queue_advancement' || queueData.type === 'status_change') {
                fetchQueueStatus(); // Re-fetch for full consistency
            }
        }
    }, [queueData]);

    if (loading) return <div className="h-96 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

    if (!status) return (
        <div className="text-center p-12 space-y-2">
            <p className="text-gray-700 font-semibold">Queue data unavailable.</p>
            {error && <p className="text-red-500 text-sm">Error: {error}</p>}
        </div>
    );

    const isCompleted = status.status === 'completed';
    const isCancelled = status.status === 'cancelled';
    const isServing = status.is_serving; // Explicitly set by backend now
    const hasStarted = status.current_serving_number > 0;
    const isWaiting = !isCompleted && !isCancelled && !isServing;

    return (
        <div className="w-full space-y-6">
            <div className="flex items-center justify-between">
                <Link to="/dashboard" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 text-sm font-medium">
                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Link>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <RefreshCw className="h-3 w-3" /> Updated {lastUpdated.toLocaleTimeString()}
                </div>
            </div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 max-w-2xl mx-auto"
            >
                <div className={`${isCompleted ? 'bg-green-600' : isServing ? 'bg-indigo-600' : 'bg-slate-800'} p-10 text-center text-white relative transition-colors duration-500`}>
                    <p className="text-white/60 uppercase tracking-widest text-xs font-bold mb-2">My Ticket Number</p>
                    <h1 className="text-8xl font-black tracking-tighter mb-4">#{status.myRank}</h1>

                    <div className="inline-flex items-center gap-2 bg-white/10 px-6 py-2 rounded-full text-sm font-bold backdrop-blur-md border border-white/20">
                        <span className={`w-2.5 h-2.5 rounded-full ${isServing ? 'bg-green-400 animate-pulse' : !hasStarted ? 'bg-orange-400' : 'bg-blue-400'}`} />
                        {isServing ? 'NOW SERVING' : !hasStarted ? 'QUEUE NOT STARTED' : 'SOON TO BE CALLED'}
                    </div>
                </div>

                <div className="p-10 space-y-8">
                    {isCompleted ? (
                        <div className="text-center py-6">
                            <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4" />
                            <h3 className="text-3xl font-bold text-gray-900">Appointment Completed</h3>
                            <p className="text-gray-500 mt-2">Thank you for using our service!</p>
                        </div>
                    ) : isCancelled ? (
                        <div className="text-center py-6">
                            <h3 className="text-2xl font-bold text-red-600">This Ticket is Cancelled</h3>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <motion.div 
                                    whileHover={{ y: -5 }}
                                    className="bg-indigo-50/50 p-4 rounded-3xl text-center border border-indigo-100"
                                >
                                    <Users className="h-6 w-6 text-indigo-600 mx-auto mb-1" />
                                    <p className="text-3xl font-black text-indigo-900">{status.people_ahead}</p>
                                    <p className="text-[10px] text-indigo-500 uppercase font-bold tracking-wider flex items-center justify-center gap-1">
                                        People Ahead
                                        <InfoTooltip align="start" text="Number of confirmed bookings currently ahead of you in this specific slot." />
                                    </p>
                                </motion.div>
                                
                                <motion.div 
                                    whileHover={{ y: -5 }}
                                    className="bg-blue-50/50 p-4 rounded-3xl text-center border border-blue-100"
                                >
                                    <Clock className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                                    <p className="text-3xl font-black text-blue-900">
                                        {formatWaitTime(status.estimated_wait_time)}
                                    </p>
                                    <p className="text-[10px] text-blue-500 uppercase font-bold tracking-wider flex items-center justify-center gap-1">
                                        Est. Wait
                                        <InfoTooltip text="Estimated time until your turn, calculated by our Smart AI model based on real-time performance." />
                                    </p>
                                    <div className="flex items-center justify-center gap-1 mt-1">
                                        <Sparkles className="h-3 w-3 text-blue-400" />
                                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-tighter">AI Powered</span>
                                    </div>
                                </motion.div>

                                <motion.div 
                                    whileHover={{ y: -5 }}
                                    className="bg-slate-50 p-4 rounded-3xl text-center border border-slate-100"
                                >
                                    <PlayCircle className="h-6 w-6 text-slate-600 mx-auto mb-1" />
                                    <p className="text-xl font-bold text-slate-900">
                                        {(() => {
                                            const d = status.slot_start_time ? parseISO(status.slot_start_time) : null;
                                            return (d && isValid(d)) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
                                        })()}
                                    </p>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center justify-center gap-1">
                                        Slot Time
                                        <InfoTooltip text="The scheduled start time for this resource's availability slot." />
                                    </p>
                                </motion.div>

                                <motion.div 
                                    whileHover={{ y: -5 }}
                                    className="bg-green-50 p-4 rounded-3xl text-center border border-green-100"
                                >
                                    <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-1" />
                                    <p className="text-xl font-bold text-green-900">
                                        {(() => {
                                            const d = status.expected_start_time ? parseISO(status.expected_start_time) : null;
                                            return (d && isValid(d)) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
                                        })()}
                                    </p>
                                    <p className="text-[10px] text-green-500 uppercase font-bold tracking-wider flex items-center justify-center gap-1">
                                        Expected Turn
                                        <InfoTooltip align="end" text="Dynamic estimate of when you will be called, updated in real-time." />
                                    </p>
                                </motion.div>
                            </div>

                            {/* Live Queue Visualization (The Progress Map) */}
                            <QueueVisualization appointment={status} />

                            <div className="bg-slate-50 rounded-2xl p-6 flex items-center justify-between border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white p-3 rounded-xl shadow-sm">
                                        <PlayCircle className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Currently Serving</p>
                                        <p className="text-2xl font-black text-slate-800">
                                            {status.current_serving_number > 0 ? `#${status.current_serving_number}` : 'No one yet'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Status</p>
                                    <p className={`text-sm font-bold ${hasStarted ? 'text-green-600' : 'text-orange-600'}`}>
                                        {hasStarted ? 'Live' : 'Waiting to start'}
                                    </p>
                                </div>
                            </div>

                            {!hasStarted && status.people_ahead === 0 && (
                                <div className="bg-orange-50 rounded-2xl p-4 text-center border border-orange-100">
                                    <p className="text-sm font-medium text-orange-800">
                                        You are first in line! Please wait for the administrator to start the queue.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
