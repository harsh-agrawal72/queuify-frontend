import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api, apiService } from '../../services/api';
import { Link } from 'react-router-dom';
import { format, parseISO, isPast, isValid } from 'date-fns';
import {
    Calendar, Clock, MapPin, XCircle, Search, Ticket, User,
    ArrowRight, Star, Building2, RefreshCw, Zap, MessageCircle, Navigation, AlertCircle, Download, CheckCircle2, QrCode, X, Loader2, Camera, ShieldCheck
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
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
            case 'serving': return { color: 'bg-indigo-50 text-indigo-700 border-indigo-100', dot: 'bg-indigo-500 animate-pulse', label: t('status.serving', 'Serving') };
            case 'completed': return { color: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500', label: t('status.completed', 'Completed') };
            case 'cancelled': return { color: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-500', label: t('status.cancelled', 'Cancelled') };
            case 'no_show': return { color: 'bg-orange-50 text-orange-700 border-orange-100', dot: 'bg-orange-500', label: t('status.no_show', 'No Show') };
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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, delay: idx * 0.03, ease: "easeOut" }}
            className="group relative flex flex-col md:flex-row bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 overflow-hidden"
        >
            <div className={`relative flex flex-row md:flex-col items-center justify-center w-full md:w-28 py-4 md:py-8 flex-shrink-0 border-b md:border-b-0 md:border-r border-dashed border-gray-200 transition-colors duration-500 ${isPendingReassignment ? 'bg-amber-50/40' : 'bg-indigo-50/30'}`}>
                <div className="absolute hidden md:block top-0 right-[-10px] bottom-0 w-[20px] flex-col justify-between py-4 z-10 pointer-events-none">
                     <div className="w-5 h-5 bg-gray-50 rounded-full -ml-2.5 border border-gray-100 shadow-inner"></div>
                     <div className="w-5 h-5 bg-gray-50 rounded-full -ml-2.5 border border-gray-100 shadow-inner mt-auto"></div>
                </div>

                <div className="flex flex-row md:flex-col items-center gap-3 md:gap-1">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400 opacity-80 md:mb-1">
                        {isDateValid ? format(startDate, 'MMM') : '---'}
                    </span>
                    <span className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter leading-none">
                        {isDateValid ? format(startDate, 'dd') : '??'}
                    </span>
                    <span className="text-[11px] font-black text-indigo-600 md:mt-2 uppercase tracking-widest bg-white md:bg-transparent px-2 py-0.5 md:p-0 rounded-full shadow-sm md:shadow-none border border-gray-100 md:border-0">
                        {isDateValid ? format(startDate, 'EEEE') : '---'}
                    </span>
                </div>

                <div className="mt-0 md:mt-6 ml-4 md:ml-0 bg-gray-900 px-3 py-1.5 rounded-2xl shadow-lg border border-gray-800 transform group-hover:scale-110 transition-transform duration-300">
                    <span className="text-[10px] md:text-xs font-black text-indigo-400 font-mono tracking-wider">
                        {appt.start_time ? format(parseISO(appt.start_time), 'hh:mm a') : 'TBD'}
                    </span>
                </div>
            </div>

            <div className="flex-1 min-w-0 p-5 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1 min-w-0 space-y-4">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg md:text-2xl font-black text-gray-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors duration-300">
                                {appt.service_name || t('appointment.title', 'Appointment')}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 group/org">
                            <div className="p-1.5 bg-gray-50 rounded-lg group-hover/org:bg-indigo-50 transition-colors">
                                <Building2 className="h-4 w-4 text-gray-400 group-hover/org:text-indigo-500" />
                            </div>
                            <p className="text-sm font-bold text-gray-500 group-hover/org:text-gray-900 transition-colors">
                                {appt.org_name}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${statusConfig.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
                            {statusConfig.label}
                        </span>

                        {(appt.live_queue_number || appt.queue_number) && !isPendingReassignment && (
                            <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">
                                <Ticket className="h-3.5 w-3.5 text-indigo-400" />
                                <span className="opacity-60 mr-0.5">Token</span>
                                <span className="text-indigo-400">#{appt.live_queue_number || appt.queue_number}</span>
                            </div>
                        )}

                        {appt.resource_name && (
                            <div className="inline-flex items-center gap-2 bg-gray-50 text-gray-600 px-3 py-1 rounded-xl text-[10px] font-bold border border-gray-100">
                                <User className="h-3.5 w-3.5 text-gray-400" />
                                {appt.resource_name}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4 min-w-[280px]">
                    <div className="flex flex-wrap items-center gap-2 justify-end">
                        {filter === 'upcoming' && appt.status !== 'cancelled' && (
                            <>
                                <Link
                                    to={`/queue/${appt.id}`}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 group/live relative overflow-hidden"
                                >
                                    <Zap className="h-4 w-4 fill-white animate-pulse" />
                                    Live Queue
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                </Link>
                                
                                <button
                                    onClick={() => onSetMap(appt)}
                                    className="p-3.5 bg-white border-2 border-gray-100 text-gray-600 rounded-2xl hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-95 shadow-sm"
                                    title="View Location"
                                >
                                    <Navigation className="h-5 w-5" />
                                </button>

                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('openChat', { detail: { orgId: appt.org_id, orgName: appt.org_name } }))}
                                    className="p-3.5 bg-white border-2 border-gray-100 text-indigo-500 rounded-2xl hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-95 shadow-sm"
                                    title="Open Chat"
                                >
                                    <MessageCircle className="h-5 w-5" />
                                </button>
                            </>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-4 mt-auto">
                        {filter === 'upcoming' && appt.status !== 'cancelled' && (
                            <button
                                onClick={() => onCancel(appt.id)}
                                className="text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors tracking-[0.2em]"
                            >
                                Cancel Appointment
                            </button>
                        )}

                        {filter === 'history' && (
                            <div className="flex gap-2 w-full">
                                {appt.status === 'completed' && (
                                    <>
                                        <button
                                            onClick={() => generateInvoice(appt)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-all"
                                        >
                                            <Download className="h-3.5 w-3.5" /> Receipt
                                        </button>
                                        {!appt.review_id && (
                                            <button
                                                onClick={() => onSetReview(appt)}
                                                className="flex-1 py-2.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-amber-100 transition-all"
                                            >
                                                Rate Visit
                                            </button>
                                        )}
                                    </>
                                )}
                                <Link
                                    to="/organizations"
                                    className="flex-1 flex items-center justify-center py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-indigo-100"
                                >
                                    Book Again
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {appt.reschedule_status === 'pending' && (
                <motion.div 
                    initial={{ y: -50 }}
                    animate={{ y: 0 }}
                    className="absolute inset-x-0 top-0 bg-white/90 backdrop-blur-md border-b border-amber-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-20 shadow-xl shadow-amber-900/5"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-500 p-3 rounded-2xl shadow-lg shadow-amber-200">
                            <Clock className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-900 tracking-tight">{t('appointment.reschedule_proposed', 'Reschedule Proposed')}</p>
                            <p className="text-xs text-amber-600 font-bold mt-0.5">
                                {t('appointment.new_time', 'Suggested New Time')}: {appt.proposed_start_time ? format(parseISO(appt.proposed_start_time), 'PPp') : 'TBD'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={(e) => { e.stopPropagation(); onRespond(appt.id, 'accept'); }} className="flex-1 sm:flex-none bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
                            Accept
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onRespond(appt.id, 'decline'); }} className="flex-1 sm:flex-none bg-white text-slate-400 border-2 border-gray-100 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all">
                            Decline
                        </button>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
});

AppointmentItem.displayName = 'AppointmentItem';

export default function MyAppointments() {
    const { t } = useTranslation();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingAction, setLoadingAction] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scannerLoading, setScannerLoading] = useState(false);
    const html5QrCodeRef = useRef(null);

    const stopScanner = useCallback(async () => {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.clear();
                html5QrCodeRef.current = null;
            } catch (err) {
                console.error("Scanner cleanup error:", err);
            }
        }
        setIsScannerOpen(false);
    }, []);

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

    const handleAutoArrive = useCallback(async (orgId) => {
        setLoadingAction(true);
        const relevantAppt = appointments.find(a => 
            a.org_id === orgId && 
            ['confirmed', 'pending', 'serving'].includes(a.status) &&
            a.check_in_method !== 'user_signal'
        );

        if (!relevantAppt) {
            toast.error("No active appointment found for this clinic.");
            setLoadingAction(false);
            return;
        }

        const loadingToast = toast.loading("Checking you in...");
        try {
            await api.post(`/appointments/${relevantAppt.id}/arrive`, { scannedOrgId: orgId });
            toast.success(`Arrived at ${relevantAppt.org_name}! Admin notified.`, { id: loadingToast });
            fetchAppointments();
        } catch (err) {
            toast.error(err.response?.data?.message || "Check-in failed.", { id: loadingToast });
        } finally {
            setLoadingAction(false);
        }
    }, [appointments, fetchAppointments]);

    const onScanSuccess = useCallback(async (decodedText) => {
        if (!decodedText.startsWith('queuify:')) {
            toast.error("Invalid QR Code. Please scan the clinic's check-in QR.");
            return;
        }

        const scannedOrgId = decodedText.split(':')[1];
        await stopScanner();
        handleAutoArrive(scannedOrgId);
    }, [handleAutoArrive, stopScanner]);

    // Use useEffect to initialize scanner when modal opens
    useEffect(() => {
        if (isScannerOpen) {
            const scanner = new Html5QrcodeScanner(
                "qr-reader",
                { 
                    fps: 10, 
                    qrbox: { width: 250, height: 250 },
                    rememberLastUsedCamera: true,
                    aspectRatio: 1.0
                },
                /* verbose= */ false
            );

            scanner.render(onScanSuccess, (err) => {
                // Ignore frequent scan errors (failed to find QR in frame)
            });

            html5QrCodeRef.current = scanner;

            return () => {
                if (html5QrCodeRef.current) {
                    html5QrCodeRef.current.clear().catch(e => console.error(e));
                }
            };
        }
    }, [isScannerOpen, onScanSuccess]);

    const startScanner = () => {
        // --- SECURE CONTEXT CHECK ---
        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
            toast.error("Camera access requires a secure (HTTPS) connection.");
            return;
        }
        setIsScannerOpen(true);
    };

    const [filter, setFilter] = useState('upcoming');
    const [reviewModalAppt, setReviewModalAppt] = useState(null);
    const [reschedulingAppt, setReschedulingAppt] = useState(null);
    const [mapModalAppt, setMapModalAppt] = useState(null);

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
            const { data: preview } = await api.get(`/payments/refund-preview/${id}`);
            const refundAmount = preview.refundAmount || 0;
            const refundPercentage = preview.policy?.percentage || 0;
            const isLate = refundPercentage < 100;

            let confirmMsg = isLate 
                ? t('appointment.cancel_confirm_refund_late', 'Are you sure you want to cancel? Since it is less than 3 hours before the slot, you will receive an 85% refund (₹{{amount}}).', { amount: refundAmount.toFixed(2) })
                : t('appointment.cancel_confirm_refund_full', 'Are you sure you want to cancel? You will receive a 100% full refund (₹{{amount}}).', { amount: refundAmount.toFixed(2) });

            if (!window.confirm(confirmMsg)) return;

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
            await api.post(`/appointments/${id}/reschedule-response`, { action });
            toast.success(t('appointment.response_success', 'Response submitted successfully'));
            fetchAppointments();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to respond');
        }
    }, [fetchAppointments, t]);

    const counts = useMemo(() => {
        return appointments.reduce((acc, appt) => {
            const isHistoryStatus = ['completed', 'no_show'].includes(appt.status);
            const isCancelledStatus = appt.status === 'cancelled';
            if (isCancelledStatus) acc.cancelled++;
            else if (isHistoryStatus) acc.history++;
            else acc.upcoming++;
            return acc;
        }, { upcoming: 0, history: 0, cancelled: 0 });
    }, [appointments]);

    const filteredAppointments = useMemo(() => {
        return appointments.filter(appt => {
            const isHistoryStatus = ['completed', 'no_show'].includes(appt.status);
            const isCancelledStatus = appt.status === 'cancelled';
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
                    <button 
                        onClick={startScanner}
                        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition shadow-lg shadow-slate-200"
                    >
                        <QrCode className="h-4 w-4 text-indigo-400" /> Scan to Arrive
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
                <div className="space-y-6">
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

            {/* 📸 QR Scanner Modal */}
            <AnimatePresence>
                {isScannerOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                            onClick={stopScanner}
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                                        <Camera className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-black text-slate-900 tracking-tight">Scan Clinic QR</h3>
                                </div>
                                <button onClick={stopScanner} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="h-5 w-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="p-8">
                                <div className="relative min-h-[300px] bg-slate-50 rounded-3xl overflow-hidden border-2 border-slate-200">
                                    <div id="qr-reader" className="w-full h-full"></div>
                                </div>

                                <div className="mt-8 space-y-4">
                                     <div className="p-4 bg-indigo-50 rounded-2xl flex items-start gap-3">
                                         <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                                         <p className="text-xs text-indigo-700 font-bold leading-relaxed">
                                             Scanning proves your physical presence at the clinic. Once scanned, the admin can complete your visit without asking for an OTP.
                                         </p>
                                     </div>
                                     <button 
                                        onClick={stopScanner}
                                        className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                                     >
                                         Cancel Scan
                                     </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
