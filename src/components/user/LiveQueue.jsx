import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import {
    Users, Clock, Ticket, ArrowLeft, RefreshCw, CheckCircle2, PlayCircle
} from 'lucide-react';
import { useQueueSocket } from '../../hooks/useQueueSocket';

export default function LiveQueue() {
    const { appointmentId } = useParams();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchQueueStatus = async () => {
        try {
            const { data } = await api.get(`/appointments/${appointmentId}/queue`);
            setStatus(data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error(err);
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

    if (!status) return <div className="text-center p-12">Queue data unavailable.</div>;

    const isCompleted = status.status === 'completed';
    const isCancelled = status.status === 'cancelled';
    const isServing = status.status === 'serving' || (status.current_serving_number === status.myRank && !isCompleted && !isCancelled);

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
                        <span className={`w-2.5 h-2.5 rounded-full ${isServing ? 'bg-green-400 animate-pulse' : 'bg-blue-400'}`} />
                        {isServing ? 'NOW SERVING' : status.status.toUpperCase()}
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
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-indigo-50/50 p-6 rounded-3xl text-center border border-indigo-100">
                                    <Users className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                                    <p className="text-4xl font-black text-indigo-900">{status.people_ahead}</p>
                                    <p className="text-[10px] text-indigo-500 uppercase font-bold tracking-wider mt-1">People Ahead</p>
                                </div>
                                <div className="bg-blue-50/50 p-6 rounded-3xl text-center border border-blue-100">
                                    <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                    <p className="text-4xl font-black text-blue-900">{status.estimated_wait_time}<span className="text-sm font-bold text-blue-400 ml-1">min</span></p>
                                    <p className="text-[10px] text-blue-500 uppercase font-bold tracking-wider mt-1">Est. Wait</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6 flex items-center justify-between border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white p-3 rounded-xl shadow-sm">
                                        <PlayCircle className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Currently Serving</p>
                                        <p className="text-2xl font-black text-slate-800">#{status.current_serving_number}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mode</p>
                                    <p className="text-sm font-bold text-slate-600">Real-time Tracking</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
