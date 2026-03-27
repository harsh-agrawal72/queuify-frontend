import { useState, useEffect } from 'react';
import { api, apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    Calendar, Clock, X, CheckCircle2, ChevronRight, 
    ChevronLeft, Loader2, AlertCircle, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO, isValid, addDays, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const RescheduleModal = ({ appointment, onClose, onSuccess }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [resources, setResources] = useState([]);
    const [selectedResourceId, setSelectedResourceId] = useState('ANY');
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [rescheduling, setRescheduling] = useState(false);
    const [notificationTime, setNotificationTime] = useState('');
    const [autoBook, setAutoBook] = useState(false);
    const [requestingNotification, setRequestingNotification] = useState(false);

    // Helper to generate time intervals between slot boundaries
    const getTimeOptions = (slot) => {
        if (!slot?.start_time || !slot?.end_time) return [];
        const start = parseISO(slot.start_time);
        const end = parseISO(slot.end_time);
        const options = [];
        let curr = new Date(start);
        
        while (curr <= end) {
            options.push({
                value: format(curr, 'HH:mm'),
                label: format(curr, 'h:mm a'),
                date: new Date(curr)
            });
            curr = new Date(curr.getTime() + 15 * 60000);
        }
        
        const lastVal = format(end, 'HH:mm');
        if (options.length === 0 || options[options.length-1].value !== lastVal) {
            options.push({ value: lastVal, label: format(end, 'h:mm a'), date: new Date(end) });
        }
        return options;
    };
    const [selectedSlotId, setSelectedSlotId] = useState(null);
    const [reason, setReason] = useState('');
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    // Fetch resources for this service to allow filtering
    useEffect(() => {
        const fetchResources = async () => {
            try {
                const { data } = await api.get(`/organizations/${appointment.org_id}/services/${appointment.service_id}/resources`);
                setResources(data);
            } catch (error) {
                console.error('Failed to load resources', error);
            }
        };
        fetchResources();
    }, [appointment]);

    // Fetch slots when date or resource changes
    useEffect(() => {
        const fetchSlots = async () => {
            setLoadingSlots(true);
            try {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                const params = new URLSearchParams({ serviceId: appointment.service_id, date: dateStr });
                if (selectedResourceId !== 'ANY') params.set('resourceId', selectedResourceId);

                // Use the user-facing endpoint which scopes by orgId in the URL (not req.user.org_id)
                const { data } = await api.get(`/slots/available/${appointment.org_id}?${params.toString()}`);
                // Filter out the current slot and fully-booked ones
                setSlots(data.filter(s => s.id !== appointment.slot_id && s.booked_count < s.max_capacity));
            } catch (error) {
                console.error('Failed to load slots', error);
                toast.error('Failed to load available times');
            } finally {
                setLoadingSlots(false);
            }
        };
        fetchSlots();
    }, [selectedDate, selectedResourceId, appointment]);

    const handleAction = async () => {
        if (!selectedSlotId) return;
        if (isAdmin && !reason) return toast.error("Please provide a reason for the proposal");

        setRescheduling(true);
        const loadingToast = toast.loading(isAdmin ? 'Proposing reschedule...' : 'Rescheduling appointment...');
        try {
            if (isAdmin) {
                await apiService.proposeReschedule(appointment.id, { 
                    newSlotId: selectedSlotId,
                    reason 
                });
                toast.success('Reschedule proposal sent to user!', { id: loadingToast });
            } else {
                await api.patch(`/appointments/${appointment.id}/reschedule`, {
                    newSlotId: selectedSlotId
                });
                toast.success('Appointment rescheduled successfully!', { id: loadingToast });
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Action failed', { id: loadingToast });
        } finally {
            setRescheduling(false);
        }
    };

    const dateOptions = Array.from({ length: 14 }).map((_, i) => addDays(startOfDay(new Date()), i));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            />
            
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <Clock className="h-6 w-6 text-indigo-600" />
                            Reschedule Appointment
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            {isAdmin ? `Suggest a better time for ${appointment.user_name || 'Customer'}` : `Select a new available time for ${appointment.service_name}`}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-6 w-6 text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Current Appointment Summary */}
                    <div className="bg-indigo-50/50 rounded-3xl p-5 border border-indigo-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Current Booking</p>
                            <p className="text-sm font-bold text-slate-700">
                                {format(parseISO(appointment.start_time), 'EEE, MMM d')} @ {format(parseISO(appointment.start_time), 'h:mm a')}
                            </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-indigo-300" />
                        <div className="text-right">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">New Selection</p>
                            <p className="text-sm font-bold text-indigo-600">
                                {selectedSlotId ? (
                                    <>
                                        {format(selectedDate, 'MMM d')} @ {format(parseISO(slots.find(s => s.id === selectedSlotId)?.start_time), 'h:mm a')}
                                    </>
                                ) : 'Not selected'}
                            </p>
                        </div>
                    </div>

                    {/* Date Selection */}
                    <div className="space-y-4">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Calendar className="h-3 w-3" /> Select New Date
                        </label>
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1">
                            {dateOptions.map((date) => {
                                const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                                return (
                                    <button
                                        key={date.toISOString()}
                                        onClick={() => setSelectedDate(date)}
                                        className={`flex-shrink-0 w-20 py-4 rounded-2xl flex flex-col items-center border transition-all ${
                                            isSelected
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105'
                                                : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200 hover:bg-indigo-50/30'
                                        }`}
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest mb-1">{format(date, 'EEE')}</span>
                                        <span className="text-xl font-black">{format(date, 'd')}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Resource Filter */}
                    <div className="space-y-4">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Preferred Professional (Optional)</label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedResourceId('ANY')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                    selectedResourceId === 'ANY'
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                        : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                Any Resource
                            </button>
                            {resources.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => setSelectedResourceId(r.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                        selectedResourceId === r.id
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                            : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    {r.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Slot Selection */}
                    <div className="space-y-4">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Clock className="h-3 w-3" /> Available Slots
                        </label>
                        
                        {loadingSlots ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <p className="text-xs font-bold">Finding available times...</p>
                            </div>
                        ) : slots.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {slots.map(slot => (
                                    <button
                                        key={slot.id}
                                        onClick={() => {
                                            setSelectedSlotId(slot.id);
                                            setNotificationTime('');
                                        }}
                                        className={`py-3 rounded-2xl text-sm font-bold transition-all border flex flex-col items-center shadow-sm ${
                                            selectedSlotId === slot.id
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-200'
                                                : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-200 hover:text-indigo-600'
                                        }`}
                                    >
                                        {format(parseISO(slot.start_time), 'h:mm a')}
                                        <span className={`text-[9px] font-black uppercase mt-0.5 ${selectedSlotId === slot.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                                            {slot.resource_name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-3xl py-12 px-6 text-center border border-dashed border-gray-200">
                                <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm font-bold text-gray-500">No available slots for this date</p>
                                <p className="text-xs text-gray-400 mt-1">Try selecting a different date or resource</p>
                            </div>
                        )}
                    </div>

                    {/* Dynamic Time Estimation & Notification */}
                    {selectedSlotId && slots.find(s => s.id === selectedSlotId) && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-5 bg-indigo-50 rounded-3xl border border-indigo-100 space-y-4"
                        >
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                                <div className="space-y-3">
                                    <p className="text-sm text-indigo-900 leading-relaxed font-medium">
                                        {slots.find(s => s.id === selectedSlotId).descriptive_message?.split('**').map((part, i) => 
                                            i % 2 === 1 ? <strong key={i} className="text-indigo-700 font-extrabold">{part}</strong> : part
                                        )}
                                    </p>
                                    
                                    <div className="pt-2 border-t border-indigo-100">
                                        <p className="text-[11px] text-indigo-500 font-bold uppercase tracking-wider mb-2">Not free at this time?</p>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-[10px] text-indigo-400 font-bold uppercase ml-1 mb-0.5">Desired Time</span>
                                                    <select
                                                        value={notificationTime}
                                                        onChange={(e) => setNotificationTime(e.target.value)}
                                                        className="text-sm border-gray-200 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                                    >
                                                        <option value="">Select Time...</option>
                                                        {getTimeOptions(slots.find(s => s.id === selectedSlotId)).map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        if (!notificationTime) return toast.error("Please pick a time");
                                                        setRequestingNotification(true);
                                                        try {
                                                            const slot = slots.find(s => s.id === selectedSlotId);
                                                            const desiredOption = getTimeOptions(slot).find(o => o.value === notificationTime);
                                                            const desiredDate = desiredOption ? desiredOption.date : null;
                                                            if (!desiredDate) return toast.error("Invalid time selected");

                                                            await apiService.requestSlotNotification(selectedSlotId, {
                                                                desiredTime: desiredDate.toISOString(),
                                                                serviceId: appointment.service_id,
                                                                resourceId: slot.resource_id,
                                                                autoBook,
                                                                customerPhone: null
                                                            });
                                                            const modeMsg = autoBook ? "We'll auto-book your reschedule" : "We'll notify you";
                                                            toast.success(`${modeMsg} when it reaches your time!`);
                                                            setNotificationTime('');
                                                            onClose();
                                                        } catch (e) {
                                                            toast.error(e.response?.data?.message || "Failed to set notification");
                                                        } finally {
                                                            setRequestingNotification(false);
                                                        }
                                                    }}
                                                    disabled={requestingNotification}
                                                    className="mt-4 text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-sm"
                                                >
                                                    {requestingNotification ? <Loader2 className="h-3 w-3 animate-spin"/> : (autoBook ? 'Auto-Book' : 'Notify Me')}
                                                </button>
                                            </div>

                                            {/* Auto-Book Toggle */}
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <input 
                                                    type="checkbox" 
                                                    checked={autoBook}
                                                    onChange={(e) => setAutoBook(e.target.checked)}
                                                    className="rounded text-indigo-600 h-4 w-4"
                                                />
                                                <div>
                                                    <p className="text-[11px] font-black text-indigo-700 uppercase tracking-tight">Auto-Book for me</p>
                                                    <p className="text-[9px] text-indigo-400">Wins you the spot automatically.</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Admin Reason Field */}
                    {isAdmin && selectedSlotId && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-3"
                        >
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                                Why are you proposing this change? (Required)
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Example: Doctor emergency, Staff unavailable, etc."
                                className="w-full p-4 rounded-3xl bg-amber-50 border border-amber-100 placeholder-amber-200 text-amber-900 text-sm focus:ring-amber-500 focus:border-amber-500 transition-all min-h-[100px]"
                            />
                            <p className="text-[10px] text-amber-500 font-medium italic">
                                * The user will be rewarded with Priority #1 if they accept this change.
                            </p>
                        </motion.div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 bg-gray-50 border-t border-gray-100">
                    <button
                        disabled={!selectedSlotId || rescheduling || (notificationTime && !isAdmin)}
                        onClick={handleAction}
                        className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all flex items-center justify-center gap-3 ${
                            selectedSlotId && !rescheduling && (!isAdmin || reason) && !(notificationTime && !isAdmin)
                                ? 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0'
                                : 'bg-gray-300 cursor-not-allowed'
                        }`}
                    >
                        {rescheduling ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                {isAdmin ? 'Send Reschedule Proposal' : 'Confirm New Time'}
                                <ArrowRight className="h-5 w-5" />
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default RescheduleModal;
