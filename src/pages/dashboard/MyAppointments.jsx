import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, XCircle, ChevronRight, Building, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import QueueVisualization from '../../components/user/QueueVisualization';
import { getSocket } from '../../services/socketService';

const MyAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAppointments = async () => {
        try {
            const res = await api.get('/appointments');
            setAppointments(res.data);
        } catch (err) {
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();

        const socket = getSocket();
        
        const handleUpdate = (data) => {
            console.log('Real-time update received:', data);
            fetchAppointments();
        };

        socket.on('queue_update', handleUpdate);
        socket.on('appointment_update', handleUpdate);

        return () => {
            socket.off('queue_update', handleUpdate);
            socket.off('appointment_update', handleUpdate);
        };
    }, []);

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
        try {
            const loadingToast = toast.loading('Cancelling...');
            await api.post(`/appointments/${id}/cancel`);
            toast.dismiss(loadingToast);
            toast.success('Appointment cancelled');
            fetchAppointments(); // Refresh list
        } catch (err) {
            toast.error(err.response?.data?.message || 'Cancellation failed');
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            confirmed: 'bg-green-50 text-green-700 border-green-100',
            cancelled: 'bg-red-50 text-red-700 border-red-100',
            completed: 'bg-blue-50 text-blue-700 border-blue-100',
            pending: 'bg-yellow-50 text-yellow-700 border-yellow-100'
        };

        return (
            <span className={clsx(
                "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border",
                styles[status] || styles.pending
            )}>
                {status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="animate-spin text-indigo-600 h-8 w-8" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
                    <p className="text-gray-500 text-sm">Manage your upcoming and past bookings</p>
                </div>
                <button
                    onClick={fetchAppointments}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Refresh List"
                >
                    <RefreshCw className="h-5 w-5" />
                </button>
            </div>

            <div className="space-y-4">
                <AnimatePresence>
                    {appointments.length > 0 ? (
                        appointments.map((appt, index) => (
                            <motion.div
                                key={appt.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
                            >
                                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                                <Building className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-bold text-gray-900 text-lg">{appt.org_name}</h3>
                                                    <StatusBadge status={appt.status} />
                                                </div>

                                                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        {format(new Date(appt.start_time), 'EEEE, MMMM d, yyyy')}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <Clock className="h-4 w-4 text-gray-400" />
                                                        <span>{format(new Date(appt.start_time), 'h:mm a')} - {format(new Date(appt.end_time), 'h:mm a')}</span>
                                                        {appt.time_drift_minutes >= 10 && (
                                                            <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-black rounded-full uppercase tracking-tighter animate-pulse text-center">
                                                                AI Predicted Delay: {Math.floor(appt.time_drift_minutes/5)*5}m
                                                            </span>
                                                        )}
                                                        {appt.time_drift_minutes <= -7 && (
                                                            <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-tighter animate-pulse text-center">
                                                                AI: Moving Faster ({Math.abs(Math.floor(appt.time_drift_minutes/5)*5)}m ahead)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                                            <div className="flex items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0">
                                                <button
                                                    onClick={() => handleCancel(appt.id)}
                                                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                    Cancel Booking
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Queue Visualization for Active/Confirmed Appointments */}
                                    {['confirmed', 'pending', 'serving'].includes(appt.status) && (
                                        <QueueVisualization appointment={appt} />
                                    )}
                            </motion.div>
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200"
                        >
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <Calendar className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No appointments found</h3>
                            <p className="text-gray-500 mb-6">You haven't booked any slots yet.</p>
                            <Link
                                to="/organizations"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
                            >
                                Book Your First Appointment
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MyAppointments;
