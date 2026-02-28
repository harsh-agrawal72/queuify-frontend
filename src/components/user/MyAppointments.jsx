import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import { format, parseISO, isPast } from 'date-fns';
import {
    Calendar, Clock, MapPin, XCircle, Search, Ticket,
    ArrowRight, Star, Building2, Filter, ChevronRight, RefreshCw, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ReviewModal from './ReviewModal';

export default function MyAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming');
    const [reviewModalAppt, setReviewModalAppt] = useState(null);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/appointments');
            setAppointments(data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
        try {
            await api.post(`/appointments/${id}/cancel`);
            toast.success('Appointment cancelled');
            fetchAppointments();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to cancel');
        }
    };

    // Count appointments per category
    const counts = appointments.reduce((acc, appt) => {
        const past = new Date(appt.end_time) < new Date();
        const cancelled = appt.status === 'cancelled';
        if (cancelled) acc.cancelled++;
        else if (past) acc.history++;
        else acc.upcoming++;
        return acc;
    }, { upcoming: 0, history: 0, cancelled: 0 });

    const filteredAppointments = appointments.filter(appt => {
        const past = new Date(appt.end_time) < new Date();
        const cancelled = appt.status === 'cancelled';
        if (filter === 'upcoming') return !past && !cancelled;
        if (filter === 'history') return past && !cancelled;
        if (filter === 'cancelled') return cancelled;
        return true;
    });

    const getStatusConfig = (status) => {
        switch (status) {
            case 'confirmed': return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
            case 'pending': return { color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
            case 'serving': return { color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500 animate-pulse' };
            case 'completed': return { color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
            case 'cancelled': return { color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' };
            case 'no_show': return { color: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
            default: return { color: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
        }
    };

    const tabs = [
        { key: 'upcoming', label: 'Upcoming', count: counts.upcoming, icon: Calendar, activeColor: 'bg-indigo-600' },
        { key: 'history', label: 'Completed', count: counts.history, icon: Clock, activeColor: 'bg-emerald-600' },
        { key: 'cancelled', label: 'Cancelled', count: counts.cancelled, icon: XCircle, activeColor: 'bg-red-500' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
                    <p className="text-gray-500 mt-1 text-sm">Track, manage, and review all your bookings in one place.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchAppointments}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition text-sm"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <Link
                        to="/organizations"
                        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 text-sm"
                    >
                        <Search className="h-4 w-4" /> Book New
                    </Link>
                </div>
            </div>

            {/* Stat Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`p-4 rounded-2xl border transition-all text-left ${filter === tab.key
                            ? 'bg-white border-indigo-200 shadow-lg shadow-indigo-100 ring-2 ring-indigo-100'
                            : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <tab.icon className={`h-5 w-5 ${filter === tab.key ? 'text-indigo-600' : 'text-gray-400'}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${filter === tab.key ? 'text-indigo-600' : 'text-gray-400'
                                }`}>
                                {tab.label}
                            </span>
                        </div>
                        <p className={`text-2xl font-black ${filter === tab.key ? 'text-gray-900' : 'text-gray-600'}`}>
                            {tab.count}
                        </p>
                    </button>
                ))}
            </div>

            {/* Results Header */}
            {!loading && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        {filteredAppointments.length} {filter} appointment{filteredAppointments.length !== 1 ? 's' : ''}
                    </p>
                </div>
            )}

            {/* Appointment List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
                            <div className="flex gap-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-xl animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 w-1/3 bg-gray-100 rounded-lg animate-pulse" />
                                    <div className="h-4 w-1/2 bg-gray-50 rounded-lg animate-pulse" />
                                    <div className="h-3 w-1/4 bg-gray-50 rounded-lg animate-pulse" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredAppointments.length > 0 ? (
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {filteredAppointments.map((appt, idx) => {
                            const statusConfig = getStatusConfig(appt.status);
                            const startDate = parseISO(appt.start_time);

                            return (
                                <motion.div
                                    key={appt.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.25, delay: idx * 0.03 }}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                                >
                                    <div className="flex flex-col md:flex-row">
                                        {/* Date Block */}
                                        <div className="flex md:flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 w-full md:w-28 py-3 md:py-6 gap-2 md:gap-0 flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-100">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">{format(startDate, 'EEE')}</span>
                                            <span className="text-3xl font-black text-gray-900">{format(startDate, 'd')}</span>
                                            <span className="text-xs font-bold text-indigo-600">{format(startDate, 'MMM yyyy')}</span>
                                            <div className="hidden md:block mt-2 bg-white/80 px-2.5 py-1 rounded-lg">
                                                <span className="text-[11px] font-bold text-gray-700">{format(startDate, 'h:mm a')}</span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 p-5 flex flex-col md:flex-row gap-4">
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{appt.service_name || 'Appointment'}</h3>
                                                        {appt.org_name && (
                                                            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                                                                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                                                                {appt.org_name}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    {/* Status Badge */}
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border ${statusConfig.color}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
                                                        {appt.status === 'cancelled' && appt.cancelled_by
                                                            ? (appt.cancelled_by === 'admin' ? 'Cancelled by Admin' : 'Cancelled by You')
                                                            : appt.status}
                                                    </span>

                                                    {/* Queue Number */}
                                                    {appt.queue_number && (
                                                        <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-gray-100">
                                                            <Ticket className="h-3 w-3" />
                                                            Queue #{appt.queue_number}
                                                        </span>
                                                    )}

                                                    {/* Time (mobile) */}
                                                    <span className="md:hidden inline-flex items-center gap-1 text-gray-400 text-[11px] font-medium">
                                                        <Clock className="h-3 w-3" />
                                                        {format(startDate, 'h:mm a')}
                                                    </span>

                                                    {/* Resource */}
                                                    {appt.resource_name && (
                                                        <span className="inline-flex items-center gap-1 text-gray-400 text-[11px] font-medium">
                                                            <MapPin className="h-3 w-3" />
                                                            {appt.resource_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex md:flex-col gap-2 justify-end items-stretch flex-shrink-0 md:min-w-[150px]">
                                                {filter === 'upcoming' && appt.status !== 'cancelled' && (
                                                    <>
                                                        <Link
                                                            to={`/queue/${appt.id}`}
                                                            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm hover:shadow-lg hover:shadow-indigo-200"
                                                        >
                                                            <Zap className="h-4 w-4" /> Live Queue
                                                        </Link>
                                                        <button
                                                            onClick={() => handleCancel(appt.id)}
                                                            className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-500 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                                                        >
                                                            <XCircle className="h-4 w-4" /> Cancel
                                                        </button>
                                                    </>
                                                )}

                                                {filter === 'history' && (
                                                    <>
                                                        {appt.status === 'completed' && !appt.review_id && (
                                                            <button
                                                                onClick={() => setReviewModalAppt(appt)}
                                                                className="flex items-center justify-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-100 transition-all"
                                                            >
                                                                <Star className="h-4 w-4" /> Rate
                                                            </button>
                                                        )}
                                                        {appt.status === 'completed' && appt.review_id && (
                                                            <div className="flex items-center justify-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2.5 rounded-xl text-sm font-bold">
                                                                <Star className="h-4 w-4 fill-amber-400" /> {appt.review_rating}/5
                                                            </div>
                                                        )}
                                                        <Link
                                                            to="/organizations"
                                                            className="flex items-center justify-center gap-2 text-indigo-600 bg-indigo-50 border border-indigo-100 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all"
                                                        >
                                                            <ArrowRight className="h-4 w-4" /> Book Again
                                                        </Link>
                                                    </>
                                                )}

                                                {filter === 'cancelled' && (
                                                    <Link
                                                        to="/organizations"
                                                        className="flex items-center justify-center gap-2 text-indigo-600 bg-indigo-50 border border-indigo-100 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all"
                                                    >
                                                        <ArrowRight className="h-4 w-4" /> Rebook
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20 bg-gradient-to-b from-gray-50 to-white rounded-3xl border border-dashed border-gray-200"
                >
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                        <Calendar className="h-10 w-10 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No {filter} appointments</h3>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                        {filter === 'upcoming'
                            ? "You don't have any upcoming appointments. Browse organizations to book one!"
                            : filter === 'history'
                                ? "No completed appointments yet. Your history will appear here."
                                : "No cancelled appointments. That's a good thing!"}
                    </p>
                    {filter === 'upcoming' && (
                        <Link
                            to="/organizations"
                            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                        >
                            <Search className="h-4 w-4" /> Find & Book Appointment
                        </Link>
                    )}
                </motion.div>
            )}

            {reviewModalAppt && (
                <ReviewModal
                    appointment={reviewModalAppt}
                    onClose={() => setReviewModalAppt(null)}
                    onSuccess={() => {
                        setReviewModalAppt(null);
                        fetchAppointments();
                    }}
                />
            )}
        </div>
    );
}
