import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { api, apiService } from '../../services/api';
import { Link } from 'react-router-dom';
import { format, parseISO, isPast, isValid } from 'date-fns';
import {
    Calendar, Clock, MapPin, XCircle, Search, Ticket, User,
    ArrowRight, Star, Building2, RefreshCw, Zap, MessageCircle, Navigation, AlertCircle, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ReviewModal from './ReviewModal';
import RescheduleModal from './RescheduleModal';
import MapModal from './MapModal';
import { generateInvoice } from '../../utils/pdfGenerator';

const AppointmentItem = memo(({ appt, idx, filter, t, onCancel, onRespond, onSetReschedule, onSetReview, onSetMap }) => {
    const getStatusConfig = (status) => {
        switch (status) {
            case 'confirmed': return { color: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500', label: t('status.confirmed', 'Confirmed') };
            case 'pending': return { color: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500', label: t('status.pending', 'Pending') };
            case 'serving': return { color: 'bg-purple-50 text-purple-700 border-purple-100', dot: 'bg-purple-500 animate-pulse', label: t('status.serving', 'Serving') };
            case 'completed': return { color: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500', label: t('status.completed', 'Completed') };
            case 'cancelled': return { color: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-500', label: t('status.cancelled', 'Cancelled') };
            default: return { color: 'bg-gray-50 text-gray-600 border-gray-100', dot: 'bg-gray-400', label: status };
        }
    };

    const statusConfig = getStatusConfig(appt.status);
    const startDate = appt.start_time ? parseISO(appt.start_time) : (appt.preferred_date ? parseISO(appt.preferred_date) : null);
    const isDateValid = startDate && isValid(startDate);
    const isPendingReassignment = appt.status === 'pending' && !appt.slot_id;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, delay: idx * 0.02 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group relative flex"
        >
            {/* 🎟️ Ticket Sidebar (Compact) */}
            <div className={`relative flex flex-col items-center justify-center w-16 md:w-20 py-4 flex-shrink-0 border-r border-dashed border-gray-200 ${isPendingReassignment ? 'bg-amber-50/50' : 'bg-indigo-50/30'}`}>
                <div className="absolute top-0 right-[-1px] bottom-0 w-[1px] border-r-2 border-dashed border-gray-200"></div>
                <div className="absolute top-[-8px] right-[-8px] w-4 h-4 bg-gray-50 rounded-full border border-gray-100"></div>
                <div className="absolute bottom-[-8px] right-[-8px] w-4 h-4 bg-gray-50 rounded-full border border-gray-100"></div>
                
                <span className="text-[10px] font-black uppercase tracking-tighter text-gray-400 mb-1">
                    {isDateValid ? format(startDate, 'MMM') : '---'}
                </span>
                <span className="text-2xl font-black text-gray-900 leading-none">
                    {isDateValid ? format(startDate, 'd') : '??'}
                </span>
                <span className="text-[10px] font-bold text-indigo-500 mt-1 uppercase">
                    {isDateValid ? format(startDate, 'EEE') : '---'}
                </span>
                <div className="mt-3 bg-white px-1.5 py-0.5 rounded-md border border-gray-100 shadow-sm">
                    <span className="text-[9px] font-black text-gray-700 whitespace-nowrap">
                        {appt.start_time ? format(parseISO(appt.start_time), 'h:mm a') : 'TBD'}
                    </span>
                </div>
            </div>

            {/* 📋 Main Info Section */}
            <div className="flex-1 min-w-0 p-4 md:p-5 flex flex-col md:flex-row gap-4 relative">
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="mb-2">
                        <h3 className="font-bold text-gray-900 text-sm md:text-base truncate group-hover:text-indigo-600 transition-colors">
                            {appt.service_name || t('appointment.title', 'Appointment')}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                <Building2 className="h-3 w-3" /> {appt.org_name}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusConfig.color}`}>
                            <span className={`w-1 h-1 rounded-full ${statusConfig.dot}`}></span>
                            {statusConfig.label}
                        </span>

                        {(appt.live_queue_number || appt.queue_number) && !isPendingReassignment && (
                            <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-500 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-gray-100">
                                <Ticket className="h-3 w-3" /> #{appt.live_queue_number || appt.queue_number}
                            </span>
                        )}

                        {appt.resource_name && (
                            <span className="inline-flex items-center gap-1 text-gray-400 text-[10px] font-bold">
                                <User className="h-3 w-3" /> {appt.resource_name}
                            </span>
                        )}
                    </div>
                    
                    {appt.status === 'cancelled' && appt.cancellation_reason && (
                        <div className="mt-3 text-[11px] text-rose-500 font-medium italic border-l-2 border-rose-200 pl-2 py-0.5 line-clamp-1">
                            “{appt.cancellation_reason}”
                        </div>
                    )}
                </div>

                {/* ⚡ Action Controls */}
                <div className="flex flex-wrap md:flex-nowrap items-center md:items-end justify-between md:justify-end gap-3 flex-shrink-0">
                    {appt.otp_code && ['confirmed', 'pending', 'serving'].includes(appt.status) && (
                        <div className="bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-800 shadow-lg flex flex-col items-center justify-center min-w-[70px]">
                            <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Check-in</span>
                            <span className="text-sm font-black text-indigo-400 tracking-widest leading-none">{appt.otp_code}</span>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                        {filter === 'upcoming' && appt.status !== 'cancelled' && (
                            <>
                                <Link
                                    to={`/queue/${appt.id}`}
                                    className="relative flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 group/btn overflow-hidden"
                                >
                                    {/* 💥 Pulse Effect for Live Button */}
                                    <span className="absolute inset-0 bg-white/20 animate-pulse-slow"></span>
                                    <Zap className="h-4 w-4 relative z-10" />
                                    <span className="text-xs font-black uppercase tracking-wider relative z-10">Live Queue</span>
                                </Link>
                                <button
                                    onClick={() => onSetMap(appt)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-100 text-gray-600 rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-95 shadow-sm"
                                >
                                    <Navigation className="h-4 w-4" />
                                    <span className="text-xs font-black uppercase tracking-wider">View Map</span>
                                </button>
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('openChat', { detail: { orgId: appt.org_id, orgName: appt.org_name } }))}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-100 text-indigo-500 rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-95 shadow-sm"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    <span className="text-xs font-black uppercase tracking-wider">Chat</span>
                                </button>
                                <button
                                    onClick={() => onCancel(appt.id)}
                                    className="px-4 py-2.5 text-xs font-black uppercase text-gray-400 hover:text-rose-500 transition-colors tracking-widest ml-auto md:ml-2"
                                >
                                    Cancel Appt
                                </button>
                            </>
                        )}

                        {filter === 'history' && (
                            <div className="flex gap-2">
                                {appt.status === 'completed' && (
                                    <>
                                        <button
                                            onClick={() => generateInvoice(appt)}
                                            className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all flex items-center gap-2"
                                            title="Download Receipt"
                                        >
                                            <Download className="h-4 w-4" />
                                            {t('appointment.receipt', 'Receipt')}
                                        </button>
                                        {!appt.review_id && (
                                            <button
                                                onClick={() => onSetReview(appt)}
                                                className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all"
                                            >
                                                {t('appointment.rate', 'Rate')}
                                            </button>
                                        )}
                                    </>
                                )}
                                <Link
                                    to="/organizations"
                                    className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
                                >
                                    {t('appointment.book_again', 'Book Again')}
                                </Link>
                            </div>
                        )}
                        
                        {filter === 'cancelled' && (
                             <Link
                                to="/organizations"
                                className="px-4 py-2 bg-gray-50 text-gray-700 border border-gray-100 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all"
                            >
                                {t('appointment.rebook', 'Rebook')}
                            </Link>
                        )}
                    </div>
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
                            <p className="text-xs font-bold text-amber-900">{t('appointment.reschedule_proposed', 'Reschedule Proposed by Business')}</p>
                            <p className="text-[10px] text-amber-700 font-medium whitespace-nowrap">
                            {t('appointment.new_time', 'New Time')}: <span className="font-semibold">{appt.proposed_start_time ? format(parseISO(appt.proposed_start_time), 'PPp') : 'TBD'}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); onRespond(appt.id, 'accept'); }} className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-700">
                            {t('appointment.accept', 'Accept')}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onRespond(appt.id, 'decline'); }} className="bg-white text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-50">
                            {t('appointment.decline', 'Decline')}
                        </button>
                    </div>
                </div>
            )}
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

    const fetchAppointments = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleCancel = useCallback(async (id) => {
        const reason = window.prompt(t('appointment.enter_cancel_reason', 'Please enter a reason for cancellation:'));
        if (reason === null) return;
        if (!reason.trim()) {
            toast.error(t('appointment.reason_required', 'Cancellation reason is required'));
            return;
        }

        try {
            // First, get a refund preview from the backend
            const { data: preview } = await api.get(`/payments/refund-preview/${id}`);
            
            const refundAmount = preview.refundAmount || 0;
            const refundPercentage = preview.policy?.percentage || 0;
            const isLate = refundPercentage < 100;

            let confirmMsg = "";
            if (isLate) {
                confirmMsg = t('appointment.cancel_confirm_refund_late', 
                    'Are you sure you want to cancel? Since it is less than 3 hours before the slot, you will receive an 85% refund (₹{{amount}}).', 
                    { amount: refundAmount.toFixed(2) }
                );
            } else {
                confirmMsg = t('appointment.cancel_confirm_refund_full', 
                    'Are you sure you want to cancel? You will receive a 100% full refund (₹{{amount}}).', 
                    { amount: refundAmount.toFixed(2) }
                );
            }

            if (!window.confirm(confirmMsg)) return;

            // Proceed with cancellation
            await api.post(`/appointments/${id}/cancel`, { reason });
            toast.success(t('appointment.cancel_success', 'Appointment cancelled successfully'));
            fetchAppointments();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to cancel appointment');
        }
    }, [fetchAppointments, t]);

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

    const counts = useMemo(() => {
        return appointments.reduce((acc, appt) => {
            const isHistoryStatus = ['completed', 'no_show'].includes(appt.status);
            const isCancelledStatus = appt.status === 'cancelled';
            const endDate = appt.end_time ? parseISO(appt.end_time) : null;
            const past = (endDate && isValid(endDate)) ? isPast(endDate) : false;

            if (isCancelledStatus) {
                acc.cancelled++;
            } else if (isHistoryStatus) {
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

            if (filter === 'upcoming') return !isCancelledStatus && !isHistoryStatus;
            if (filter === 'history') return isHistoryStatus;
            if (filter === 'cancelled') return isCancelledStatus;
            return true;
        });
    }, [appointments, filter]);

    const tabs = useMemo(() => [
        { key: 'upcoming', label: t('appointment.upcoming'), count: counts.upcoming, icon: Calendar },
        { key: 'history', label: t('appointment.history'), count: counts.history, icon: Clock },
        { key: 'cancelled', label: t('appointment.cancelled'), count: counts.cancelled, icon: XCircle },
    ], [t, counts]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('navigation.my_appointments')}</h1>
                    <p className="text-gray-500 mt-1 text-sm">{t('appointment.appointments')}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchAppointments} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition text-sm">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        {t('common.refresh')}
                    </button>
                    <Link to="/organizations" className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 text-sm">
                        <Search className="h-4 w-4" /> {t('appointment.book_new', 'Book New')}
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`p-4 rounded-2xl border transition-all text-left ${filter === tab.key ? 'bg-white border-indigo-200 shadow-lg shadow-indigo-100 ring-2 ring-indigo-100' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <tab.icon className={`h-5 w-5 ${filter === tab.key ? 'text-indigo-600' : 'text-gray-400'}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${filter === tab.key ? 'text-indigo-600' : 'text-gray-400'}`}>{tab.label}</span>
                        </div>
                        <p className={`text-2xl font-black ${filter === tab.key ? 'text-gray-900' : 'text-gray-600'}`}>{tab.count}</p>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-24" />
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
                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">{t('appointment.no_filter_appointments', 'No appointments found')}</h3>
                    <p className="text-gray-500 text-sm mt-2">{t('appointment.try_changing_filter', 'Try changing the filter or book a new appointment.')}</p>
                </div>
            )}

            {reviewModalAppt && <ReviewModal appointment={reviewModalAppt} onClose={() => setReviewModalAppt(null)} onSuccess={() => { setReviewModalAppt(null); fetchAppointments(); }} />}
            {reschedulingAppt && <RescheduleModal appointment={reschedulingAppt} onClose={() => setReschedulingAppt(null)} onSuccess={() => { setReschedulingAppt(null); fetchAppointments(); }} />}
            {mapModalAppt && <MapModal isOpen={!!mapModalAppt} onClose={() => setMapModalAppt(null)} address={mapModalAppt?.org_address} orgName={mapModalAppt?.org_name} />}
        </div>
    );
}
