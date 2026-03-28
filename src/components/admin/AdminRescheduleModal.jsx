import { useState, useEffect } from 'react';
import { api, apiService } from '../../services/api';
import {
    Calendar, Clock, X, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO, addDays, startOfDay } from 'date-fns';
import { motion } from 'framer-motion';

const AdminRescheduleModal = ({ appointment, onClose, onSuccess }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [resources, setResources] = useState([]);
    const [selectedResourceId, setSelectedResourceId] = useState('ANY');
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlotId, setSelectedSlotId] = useState(null);
    const [rescheduling, setRescheduling] = useState(false);
    const [reason, setReason] = useState('');

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

    const handlePropose = async () => {
        if (!selectedSlotId || !reason) {
            toast.error('Please select a slot and provide a reason');
            return;
        }
        setRescheduling(true);
        const loadingToast = toast.loading('Sending reschedule proposal...');
        try {
            await apiService.proposeReschedule(appointment.id, {
                newSlotId: selectedSlotId,
                reason: reason
            });
            toast.success('Proposal sent to user!', { id: loadingToast });
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to send proposal', { id: loadingToast });
        } finally {
            setRescheduling(false);
        }
    };

    const handleForceMove = async () => {
        if (!selectedSlotId) {
            toast.error('Please select a slot');
            return;
        }
        
        if (!window.confirm('This will immediately move the user to the new slot without their approval. Continue?')) {
            return;
        }

        setRescheduling(true);
        const loadingToast = toast.loading('Executing direct move...');
        try {
            await apiService.adminUpdateAppointment(appointment.id, {
                slotId: selectedSlotId
            });
            toast.success('Appointment moved successfully!', { id: loadingToast });
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to move appointment', { id: loadingToast });
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
                className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                            <Clock className="h-5 w-5 text-indigo-600" />
                            Propose Reschedule
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Suggest a new time for <span className="font-semibold text-gray-700">{appointment.user_name}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Current Appointment Summary */}
                    <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-orange-500 uppercase tracking-wide mb-1">Current Slot</p>
                            <p className="text-sm font-bold text-gray-800">
                                {appointment.start_time ? (
                                    <>
                                        {format(parseISO(appointment.start_time), 'EEE, MMM d')} @ {format(parseISO(appointment.start_time), 'h:mm a')}
                                    </>
                                ) : (
                                    <span className="text-orange-600 italic">Waitlisted / Not Scheduled</span>
                                )}
                            </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-orange-300" />
                        <div className="text-right">
                            <p className="text-[11px] font-bold text-orange-500 uppercase tracking-wide mb-1">New Selection</p>
                            <p className="text-sm font-bold text-indigo-600">
                                {(() => {
                                    const selectedSlot = slots.find(s => s.id === selectedSlotId);
                                    if (selectedSlotId && selectedSlot?.start_time) {
                                        return (
                                            <>
                                                {format(selectedDate, 'MMM d')} @ {format(parseISO(selectedSlot.start_time), 'h:mm a')}
                                            </>
                                        );
                                    }
                                    return 'Not selected';
                                })()}
                            </p>
                        </div>
                    </div>

                    {/* Date Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> Date
                        </label>
                        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
                            {dateOptions.map((date) => {
                                const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                                return (
                                    <button
                                        key={date.toISOString()}
                                        onClick={() => setSelectedDate(date)}
                                        className={`flex-shrink-0 w-16 py-3 rounded-xl flex flex-col items-center border transition-all ${
                                            isSelected
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                                                : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300 hover:bg-indigo-50'
                                        }`}
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-wider mb-1">{format(date, 'EEE')}</span>
                                        <span className="text-lg font-bold leading-none">{format(date, 'd')}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Resource Filter */}
                    {resources.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Resource</label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedResourceId('ANY')}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                                        selectedResourceId === 'ANY' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    Any Resource
                                </button>
                                {resources.map(res => (
                                    <button
                                        key={res.id}
                                        onClick={() => setSelectedResourceId(res.id)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                                            selectedResourceId === res.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {res.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Time Slots */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Available Slots
                        </label>
                        {loadingSlots ? (
                            <div className="flex justify-center py-6">
                                <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            </div>
                        ) : slots.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                                <p className="text-gray-500 text-sm">No available slots for this date.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 relative">
                                {slots.map(slot => (
                                    <button
                                        key={slot.id}
                                        onClick={() => setSelectedSlotId(slot.id)}
                                        className={`py-3 px-2 rounded-xl text-sm font-bold transition-all border ${
                                            selectedSlotId === slot.id
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                                        }`}
                                    >
                                        {format(parseISO(slot.start_time), 'h:mm a')}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Reason Field */}
                    {selectedSlotId && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Reason for proposal (Shown to user)</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Example: Unexpected maintenance, Staff emergency..."
                                className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all min-h-[80px]"
                            />
                            <p className="text-[10px] text-amber-600 font-medium italic">* Accepting this will grant the user Priority #1 and reset their reschedule limit.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 rounded-b-[2.5rem]">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                        disabled={rescheduling}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePropose}
                        disabled={!selectedSlotId || !reason || rescheduling}
                        className="px-6 py-2.5 bg-orange-100 text-orange-700 rounded-xl text-sm font-bold hover:bg-orange-200 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {rescheduling ? '...' : 'Send Proposal'}
                    </button>
                    <button
                        onClick={handleForceMove}
                        disabled={!selectedSlotId || rescheduling}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 disabled:opacity-50 flex items-center gap-2"
                    >
                        {rescheduling ? 'Moving...' : 'Force Move'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminRescheduleModal;
