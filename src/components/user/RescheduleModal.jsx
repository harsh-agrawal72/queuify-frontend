import { useState, useEffect } from 'react';
import { api } from '../../services/api';
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
    const [selectedSlotId, setSelectedSlotId] = useState(null);
    const [rescheduling, setRescheduling] = useState(false);

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
                const resourceParam = selectedResourceId === 'ANY' ? '' : `&resourceId=${selectedResourceId}`;
                const { data } = await api.get(`/slots?serviceId=${appointment.service_id}&date=${dateStr}${resourceParam}`);
                // Filter out the current slot if it's on the same day
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

    const handleReschedule = async () => {
        if (!selectedSlotId) return;
        setRescheduling(true);
        const loadingToast = toast.loading('Rescheduling appointment...');
        try {
            await api.patch(`/appointments/${appointment.id}/reschedule`, {
                newSlotId: selectedSlotId
            });
            toast.success('Appointment rescheduled successfully!', { id: loadingToast });
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Rescheduling failed', { id: loadingToast });
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
                        <p className="text-gray-500 text-sm mt-1">Select a new available time for {appointment.service_name}</p>
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
                                        onClick={() => setSelectedSlotId(slot.id)}
                                        className={`py-3 rounded-2xl text-sm font-bold transition-all border flex flex-col items-center ${
                                            selectedSlotId === slot.id
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                                                : 'bg-gray-50 border-transparent text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
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
                </div>

                {/* Footer */}
                <div className="p-8 bg-gray-50 border-t border-gray-100">
                    <button
                        disabled={!selectedSlotId || rescheduling}
                        onClick={handleReschedule}
                        className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all flex items-center justify-center gap-3 ${
                            selectedSlotId && !rescheduling
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
                                Confirm New Time
                                <CheckCircle2 className="h-5 w-5" />
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default RescheduleModal;
