import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { api, apiService } from '../../services/api';
import { Link } from 'react-router-dom';
import { format, parseISO, isPast, isValid } from 'date-fns';
import {
    Calendar, Clock, MapPin, XCircle, Search, Ticket,
    ArrowRight, Star, Building2, Filter, ChevronRight, RefreshCw, Zap, MessageCircle, Navigation, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ReviewModal from './ReviewModal';
import RescheduleModal from './RescheduleModal';
import MapModal from './MapModal';

// ─── Memoized Appointment Item ───
const AppointmentItem = memo(({ appt, idx, filter, t, onCancel, onRespond, onSetReschedule, onSetReview, onSetMap }) => {
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

    const statusConfig = getStatusConfig(appt.status);
    const startDate = appt.start_time ? parseISO(appt.start_time) : (appt.preferred_date ? parseISO(appt.preferred_date) : null);
    const isDateValid = startDate && isValid(startDate);
    const isPendingReassignment = appt.status === 'pending' && !appt.slot_id;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, delay: idx * 0.03 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group relative"
        >
            <div className="flex flex-col md:flex-row">
                {/* Date Block */}
                <div className={`flex md:flex-col items-center justify-center w-full md:w-28 py-3 md:py-6 gap-2 md:gap-0 flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-100 ${isPendingReassignment ? 'bg-gradient-to-br from-amber-50 to-orange-50' : 'bg-gradient-to-br from-indigo-50 to-purple-50'}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isPendingReassignment ? 'text-amber-500' : 'text-indigo-500'}`}>
                        {isDateValid ? format(startDate, 'EEE') : '---'}
                    </span>
                    <span className="text-3xl font-black text-gray-900">
                        {isDateValid ? format(startDate, 'd') : '??'}
                    </span>
                    <span className={`text-xs font-bold ${isPendingReassignment ? 'text-amber-600' : 'text-indigo-600'}`}>
                        {isDateValid ? format(startDate, 'MMM yyyy') : t('common.date_tbd', 'Date TBD')}
                    </span>
                    <div className="hidden md:block mt-2 bg-white/80 px-2.5 py-1 rounded-lg">
                        <span className="text-[11px] font-bold text-gray-700">
                            {appt.start_time ? format(parseISO(appt.start_time), 'h:mm a') : (isPendingReassignment ? 'Slot Pending' : t('common.no_time', 'No Time'))}
                        </span>
                    </div>
                </div>

                {/* Proposal Banner */}
                {appt.reschedule_status === 'pending' && (
                    <div className="absolute top-0 right-0 left-0 bg-amber-50 border-b border-amber-100 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 z-10 animate-in slide-in-from-top duration-300">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-100 p-2 rounded-lg">
                                <Clock className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-amber-900">Reschedule Proposed by Business</p>
                                <p className="text-[10px] text-amber-700 font-medium">
                                    New Time: <span className="font-bold">{appt.proposed_start_time ? format(parseISO(appt.proposed_start_time), 'PPp') : 'TBD'}</span>
                                </p>
                                {appt.reschedule_reason && (
                                    <p className="text-[10px] text-amber-600 italic mt-0.5">"{appt.reschedule_reason}"</p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); onRespond(appt.id, 'accept'); }}
                                className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-700 transition-all flex items-center gap-1.5 shadow-sm"
                            >
                                <Star className="h-3 w-3 fill-white" /> Accept & Get Priority #1
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onRespond(appt.id, 'decline'); }}
                                className="bg-white text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-50 transition-all"
                            >
                                Keep Original
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 p-5 flex flex-col md:flex-row gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-3">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg leading-tight">{appt.service_name || t('appointment.title', 'Appointment')}</h3>
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
                                    ? (appt.cancelled_by === 'admin' ? t('appointment.cancelled_by_admin') : t('appointment.cancelled_by_you'))
                                    : t(`status.${appt.status}`, appt.status)}
                            </span>

                            {/* Queue Number */}
                            {(appt.live_queue_number || appt.queue_number) && !isPendingReassignment && (
                                <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-gray-100">
                                    <Ticket className="h-3 w-3" />
                                    {t('appointment.token_label', 'Queue #')}{(appt.live_queue_number && appt.live_queue_number > 0) ? appt.live_queue_number : appt.queue_number}
                                </span>
                            )}

                            {isPendingReassignment && (
                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-amber-100 animate-pulse">
                                    <RefreshCw className="h-3 w-3" />
                                    Waiting for New Slot
                                </span>
                            )}

                            {/* Time (mobile) */}
                            <span className="md:hidden inline-flex items-center gap-1 text-gray-400 text-[11px] font-medium">
                                <Clock className="h-3 w-3" />
                                {isDateValid ? format(startDate, 'h:mm a') : t('common.tbd', 'TBD')}
                            </span>

                            {/* Resource */}
                            {appt.resource_name && (
                                <span className="inline-flex items-center gap-1 text-gray-400 text-[11px] font-medium">
                                    <MapPin className="h-3 w-3" />
                                    {appt.resource_name}
                                </span>
                            )}
                        </div>

                        {/* Cancellation Reason Description */}
                        {appt.status === 'cancelled' && appt.cancellation_reason && (
                            <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl relative overflow-hidden group/reason">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/reason:opacity-20 transition-opacity">
                                    <AlertCircle className="h-12 w-12 text-rose-500 -rotate-12" />
                                </div>
                                <p className="text-[10px] font-bold text-rose-800 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                    <XCircle className="h-3 w-3" /> {t('appointment.cancellation_reason', 'Cancellation Reason')}
                                </p>
                                <p className="text-sm text-rose-700 font-medium leading-relaxed italic">
                                    "{appt.cancellation_reason}"
                                </p>
                                {appt.cancelled_by && (
                                    <div className="mt-2 text-[9px] font-bold text-rose-400 uppercase tracking-tighter">
                                        {appt.cancelled_by === 'admin' ? t('appointment.cancelled_by_admin', 'Cancelled by Provider') : t('appointment.cancelled_by_you', 'Cancelled by You')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 md:flex md:flex-col gap-2 justify-end items-stretch flex-shrink-0 md:min-w-[150px]">
                        {filter === 'upcoming' && appt.status !== 'cancelled' && (
                            <>
                                <Link
                                    to={`/queue/${appt.id}`}
                                    className="col-span-2 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm hover:shadow-lg hover:shadow-indigo-200"
                                >
                                    <Zap className="h-4 w-4" /> {t('appointment.live_queue')}
                                </Link>
                                <button
                                    onClick={() => onCancel(appt.id)}
                                    className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-500 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                                >
                                    <XCircle className="h-4 w-4" /> {t('appointment.cancel')}
                                </button>
                                {(!appt.reschedule_count || appt.reschedule_count < 1) && (
                                    <button
                                        onClick={() => onSetReschedule(appt)}
                                        className="flex items-center justify-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all shadow-sm"
                                    >
                                        <Calendar className="h-4 w-4" /> {t('appointment.reschedule')}
                                    </button>
                                )}
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('openChat', { detail: { orgId: appt.org_id, orgName: appt.org_name, orgAvatar: null } }))}
                                    className="flex items-center justify-center gap-2 bg-violet-50 text-violet-700 border border-violet-100 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-violet-100 transition-all shadow-sm"
                                >
                                    <MessageCircle className="h-4 w-4" /> {t('appointment.chat')}
                                </button>
                                {appt.org_address && (
                                    <button
                                        onClick={() => onSetMap(appt)}
                                        className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all shadow-sm"
                                    >
                                        <Navigation className="h-4 w-4" /> {t('appointment.view_map')}
                                    </button>
                                )}
                            </>
                        )}

                        {filter === 'history' && (
                            <>
                                {appt.status === 'completed' && !appt.review_id && (
                                    <button
                                        onClick={() => onSetReview(appt)}
                                        className="flex items-center justify-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-100 transition-all"
                                    >
                                        <Star className="h-4 w-4" /> {t('appointment.rate', 'Rate')}
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
                                    <ArrowRight className="h-4 w-4" /> {t('appointment.book_again', 'Book Again')}
                                </Link>
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('openChat', { detail: { orgId: appt.org_id } }))}
                                    className="flex items-center justify-center gap-2 bg-violet-50 text-violet-700 border border-violet-100 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-violet-100 transition-all shadow-sm"
                                >
                                    <MessageCircle className="h-4 w-4" /> {t('appointment.message', 'Message')}
                                </button>
                                {appt.org_address && (
                                    <button
                                        onClick={() => onSetMap(appt)}
                                        className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all shadow-sm"
                                    >
                                        <Navigation className="h-4 w-4" /> {t('appointment.view_map')}
                                    </button>
                                )}
                            </>
                        )}

                        {filter === 'cancelled' && (
                            <Link
                                to="/organizations"
                                className="flex items-center justify-center gap-2 text-indigo-600 bg-indigo-50 border border-indigo-100 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all"
                            >
                                <ArrowRight className="h-4 w-4" /> {t('appointment.rebook', 'Rebook')}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
});
AppointmentItem.displayName = 'AppointmentItem';

export default function MyAppointments() {
    const { t } = useTranslation();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming');
    const [reviewModalAppt, setReviewModalAppt] = useState(null);
    const [reschedulingAppt, setReschedulingAppt] = useState(null);
    const [mapModalAppt, setMapModalAppt] = useState(null);

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

    const handleCancel = useCallback(async (id) => {
        const confirmMsg = t('appointment.cancel_confirm', 'Are you sure you want to cancel this appointment?');
        if (!window.confirm(confirmMsg)) return;
        
        const reason = window.prompt(t('appointment.enter_cancel_reason', 'Please enter a reason for cancellation:'));
        if (reason === null) return; // User cancelled prompt
        if (!reason.trim()) {
            toast.error(t('appointment.reason_required', 'Cancellation reason is required'));
            return;
        }

        // Optimistic UI Update
        const previousAppointments = [...appointments];
        setAppointments(prev => prev.map(appt => 
            appt.id === id ? { ...appt, status: 'cancelled', cancelled_by: 'user', cancellation_reason: reason } : appt
        ));

        try {
            await api.post(`/appointments/${id}/cancel`, { reason });
            toast.success('Appointment cancelled');
        } catch (err) {
            console.error(err);
            // Revert on error
            setAppointments(previousAppointments);
            toast.error(err.response?.data?.message || 'Failed to cancel');
        }
    }, [t, appointments]);

    const handleRespond = useCallback(async (id, action) => {
        try {
            await apiService.respondToReschedule(id, { action });
            toast.success(`Proposal ${action}ed`);
            fetchAppointments();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to respond');
        }
    }, [fetchAppointments]);

    // ─── Memoized Filtering ───
    const counts = useMemo(() => {
        return appointments.reduce((acc, appt) => {
            const isHistoryStatus = ['completed', 'no_show'].includes(appt.status);
            const isCancelledStatus = appt.status === 'cancelled';
            
            const endDate = appt.end_time ? parseISO(appt.end_time) : null;
            const past = (endDate && isValid(endDate)) ? isPast(endDate) : false;

            if (isCancelledStatus) {
                acc.cancelled++;
            } else if (isHistoryStatus || (past && ['confirmed', 'pending'].includes(appt.status))) {
                acc.history++;
            } else {
                acc.upcoming++;
            }
            return acc;
        }, { upcoming: 0, history: 0, cancelled: 0 });
    }, [appointments]);

    const filteredAppointments = useMemo(() => {
        return appointments.filter(appt => {
            const isHistoryStatus = ['completed', 'no_show'].includes(appt.status);
            const isCancelledStatus = appt.status === 'cancelled';
            
            const endDate = appt.end_time ? parseISO(appt.end_time) : null;
            const past = (endDate && isValid(endDate)) ? isPast(endDate) : false;

            if (filter === 'upcoming') {
                return !isCancelledStatus && !isHistoryStatus && !past;
            }
            if (filter === 'history') {
                return !isCancelledStatus && (isHistoryStatus || past);
            }
            if (filter === 'cancelled') {
                return isCancelledStatus;
            }
            return true;
        });
    }, [appointments, filter]);

    const tabs = useMemo(() => [
        { key: 'upcoming', label: t('appointment.upcoming'), count: counts.upcoming, icon: Calendar, activeColor: 'bg-indigo-600' },
        { key: 'history', label: t('appointment.history'), count: counts.history, icon: Clock, activeColor: 'bg-emerald-600' },
        { key: 'cancelled', label: t('appointment.cancelled'), count: counts.cancelled, icon: XCircle, activeColor: 'bg-red-500' },
    ], [t, counts]);


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('navigation.my_appointments')}</h1>
                    <p className="text-gray-500 mt-1 text-sm">{t('appointment.appointments')}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchAppointments}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition text-sm"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        {t('common.refresh')}
                    </button>
                    <Link
                        to="/organizations"
                        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 text-sm"
                    >
                        <Search className="h-4 w-4" /> {t('appointment.book_new', 'Book New')}
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
                        {filteredAppointments.length} {t(`appointment.filter_${filter}`, filter)} {t('appointment.appointments_count', { count: filteredAppointments.length })}
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
                        {filteredAppointments.map((appt, idx) => (
                            <AppointmentItem
                                key={appt.id}
                                appt={appt}
                                idx={idx}
                                filter={filter}
                                t={t}
                                onCancel={handleCancel}
                                onRespond={handleRespond}
                                onSetReschedule={setReschedulingAppt}
                                onSetReview={setReviewModalAppt}
                                onSetMap={setMapModalAppt}
                            />
                        ))}
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
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{t('appointment.no_filter_appointments', 'No {{filter}} appointments', { filter: t(`appointment.filter_${filter}`, filter) })}</h3>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                        {filter === 'upcoming'
                            ? t('appointment.no_upcoming_hint', "You don't have any upcoming appointments. Browse organizations to book one!")
                            : filter === 'history'
                                ? t('appointment.no_history_hint', "No completed appointments yet. Your history will appear here.")
                                : t('appointment.no_cancelled_hint', "No cancelled appointments. That's a good thing!")}
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

            {reschedulingAppt && (
                <RescheduleModal
                    appointment={reschedulingAppt}
                    onClose={() => setReschedulingAppt(null)}
                    onSuccess={() => {
                        setReschedulingAppt(null);
                        fetchAppointments();
                    }}
                />
            )}

            <MapModal
                isOpen={!!mapModalAppt}
                onClose={() => setMapModalAppt(null)}
                address={mapModalAppt?.org_address}
                orgName={mapModalAppt?.org_name}
            />
        </div>
    );
}
