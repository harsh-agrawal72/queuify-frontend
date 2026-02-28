import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    Clock,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    CreditCard,
    Loader2,
    User,
    Briefcase,
    AlertCircle,
    X,
    CalendarCheck,
    LayoutDashboard,
    ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const BookingWizard = ({ orgId, service, onClose }) => {
    const navigate = useNavigate();
    // If service provided, start at step 2 (Resource), else step 1 (Service)
    const [step, setStep] = useState(service ? 2 : 1);
    const [loading, setLoading] = useState(false);

    // Data
    const [services, setServices] = useState([]);
    const [resources, setResources] = useState([]);

    // Selection
    const [selectedService, setSelectedService] = useState(service || null);
    const [selectedResource, setSelectedResource] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Booking State
    const [pendingAppointment, setPendingAppointment] = useState(null);
    const [bookingResult, setBookingResult] = useState(null);
    const [loadingCreation, setLoadingCreation] = useState(false);

    // Derived State
    const showTimeStep = true;
    const totalSteps = 4;
    const confirmationStep = 4;

    // ──────────────────────────────────────────────
    // Step 1: Fetch Services (Only if not provided)
    // ──────────────────────────────────────────────
    useEffect(() => {
        if (service) return; // Skip if service already selected
        const fetchServices = async () => {
            setLoading(true);
            try {
                const res = await apiService.getOrgServices(orgId);
                setServices(res.data);
            } catch (error) {
                console.error('[BookingWizard] Failed to load services', error);
                toast.error("Failed to load services");
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, [orgId, service]);

    // ──────────────────────────────────────────────
    // Step 2: Fetch Resources for selected Service
    // ──────────────────────────────────────────────
    useEffect(() => {
        if (!selectedService) return;

        const fetchResources = async () => {
            setLoading(true);
            try {
                const res = await apiService.getResourcesForService(orgId, selectedService.id);
                setResources(res.data);
                if (res.data.length === 1) {
                    setSelectedResource(res.data[0]);
                }
            } catch (error) {
                console.error('[BookingWizard] Failed to load resources', error);
                toast.error("Failed to load resources for this service");
            } finally {
                setLoading(false);
            }
        };
        fetchResources();
    }, [selectedService, orgId]);

    // ──────────────────────────────────────────────
    // Step 3: Fetch Slots for selected Resource
    // ──────────────────────────────────────────────
    useEffect(() => {
        if (!selectedResource) return;

        const fetchSlots = async () => {
            setLoadingSlots(true);
            try {
                const res = await apiService.getSlotsForResource(orgId, selectedResource.id);
                setAvailableSlots(res.data);
            } catch (error) {
                console.error('[BookingWizard] Failed to load slots', error);
                toast.error("Failed to load available slots");
            } finally {
                setLoadingSlots(false);
            }
        };
        fetchSlots();
    }, [selectedResource, orgId]);

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => {
        if (service && step === 2) {
            onClose();
            return;
        }
        setStep(prev => prev - 1);
        if (step === 2) { setSelectedResource(null); setSelectedSlot(null); }
        if (step === 3) { setSelectedSlot(null); }
    };

    // ──────────────────────────────────────────────
    // Finalize Booking
    // ──────────────────────────────────────────────
    const handleBookingCreation = async () => {
        setLoadingCreation(true);
        try {
            const res = await apiService.bookAppointment({
                serviceId: selectedService.id,
                resourceId: selectedResource?.id,
                slotId: selectedSlot?.id,
                orgId: orgId
            });

            const apptData = {
                id: res.data.appointmentId,
                queueNumber: res.data.queueNumber,
                ...res.data
            };

            setPendingAppointment(apptData);

            setBookingResult({
                success: true,
                queueNumber: res.data.queueNumber,
                appointmentId: res.data.appointmentId
            });
            setStep(confirmationStep + 1);

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Booking failed");
        } finally {
            setLoadingCreation(false);
        }
    };

    const handleClose = () => {
        onClose();
    };

    const handleBookAnother = () => {
        setBookingResult(null);
        setPendingAppointment(null);
        if (service) {
            setStep(2);
            setSelectedResource(null);
        } else {
            setStep(1);
            setSelectedService(null);
            setSelectedResource(null);
        }
    };

    const handleGoToAppointments = () => {
        navigate('/dashboard');
    };

    // ──── RENDER STEPS ────

    const renderServiceSelection = () => (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select a Service</h2>
            <div className="grid grid-cols-1 gap-3">
                {services.map(s => (
                    <div
                        key={s.id}
                        onClick={() => {
                            setSelectedService(s);
                            setSelectedResource(null);
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${selectedService?.id === s.id
                            ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                            : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                            }`}
                    >
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900">{s.name}</h3>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">{s.description}</p>
                        </div>
                        {selectedService?.id === s.id && <CheckCircle2 className="h-5 w-5 text-indigo-600" />}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderResourceSelection = () => (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Select a Resource</h2>
            <p className="text-sm text-gray-500 mb-4">
                Available resources for <span className="font-semibold text-indigo-600">{selectedService?.name}</span>
            </p>
            <div className="grid grid-cols-1 gap-3">
                {resources.map(res => (
                    <div
                        key={res.id}
                        onClick={() => setSelectedResource(res)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-4 ${selectedResource?.id === res.id
                            ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                            : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                            }`}
                    >
                        <div className={`p-2.5 rounded-full shrink-0 ${res.type === 'staff' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                            {res.type === 'staff' ? <User className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">{res.name}</h3>
                            <p className="text-xs text-gray-500 mt-1 capitalize">{res.type}</p>
                        </div>
                        {selectedResource?.id === res.id && <CheckCircle2 className="h-5 w-5 text-indigo-600 mt-1" />}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderSlotSelection = () => (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Select a Time Slot</h2>
            {loadingSlots ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-400 h-8 w-8" /></div>
            ) : availableSlots.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No available slots</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableSlots.map(slot => (
                        <button
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-3 rounded-xl border text-center transition-all ${selectedSlot?.id === slot.id
                                ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600 text-indigo-700 font-bold'
                                : 'border-gray-200 hover:border-indigo-300 text-gray-600'
                                }`}
                        >
                            <div className="text-xs uppercase opacity-60 mb-1">{format(parseISO(slot.start_time), 'MMM d')}</div>
                            <div className="text-sm font-bold">{format(parseISO(slot.start_time), 'h:mm a')}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    const renderConfirmation = () => (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 text-center">Review Your Booking</h2>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                <div className="flex justify-between border-b pb-3 border-gray-200">
                    <span className="text-gray-500 text-sm">Service</span>
                    <span className="font-bold text-gray-900 text-sm">{selectedService?.name}</span>
                </div>
                {selectedResource && (
                    <div className="flex justify-between border-b pb-3 border-gray-200">
                        <span className="text-gray-500 text-sm">Resource</span>
                        <span className="font-bold text-gray-900 text-sm">{selectedResource.name}</span>
                    </div>
                )}
                {selectedSlot && (
                    <div className="flex justify-between border-b pb-3 border-gray-200">
                        <span className="text-gray-500 text-sm">Time</span>
                        <div className="text-right">
                            <span className="block font-bold text-gray-900 text-sm">{format(parseISO(selectedSlot.start_time), 'MMM d, h:mm a')}</span>
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={handleBookingCreation}
                disabled={loadingCreation}
                className="w-full flex items-center justify-center gap-3 p-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
            >
                {loadingCreation ? <Loader2 className="animate-spin h-5 w-5" /> : (
                    <>
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Join Queue Now</span>
                    </>
                )}
            </button>
        </div>
    );

    if (bookingResult && step > confirmationStep) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
                >
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition text-gray-500 z-10">
                        <X className="h-5 w-5" />
                    </button>

                    <div className="text-center py-10 px-8">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">You're in Queue!</h2>
                        <p className="text-gray-500 mb-6">Your ticket has been generated successfully.</p>

                        <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 relative overflow-hidden mb-6">
                            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-bold">Queue Number</p>
                            <p className="text-6xl font-black text-indigo-600 tracking-tighter">#{bookingResult.queueNumber || '1'}</p>
                            <div className="h-px bg-gray-200 my-4" />
                            <p className="text-sm font-bold text-gray-900">{selectedService?.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {selectedSlot ? format(parseISO(selectedSlot.start_time), 'MMM d | h:mm a') : (selectedResource?.name || 'Central Queue')}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleGoToAppointments}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg"
                            >
                                <LayoutDashboard className="h-4 w-4" /> View My Appointments
                            </button>

                            <button
                                onClick={handleBookAnother}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                            >
                                <CalendarCheck className="h-4 w-4" /> Book Another
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="bg-white px-8 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Get Your Ticket</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Step {step - (service ? 1 : 0)} of {totalSteps - (service ? 1 : 0)}</p>
                    </div>
                    <button onClick={handleClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="px-8 pt-6 pb-2 shrink-0">
                    <div className="flex gap-2">
                        {['Service', 'Resource', 'Time', 'Review'].map((label, i) => {
                            if (service && i === 0) return null;
                            if (!showTimeStep && i === 2) return null;

                            const stepNum = i + 1;
                            const isActive = stepNum <= step;

                            return (
                                <div key={label} className="flex-1 text-center">
                                    <div className={`h-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-indigo-600' : 'bg-gray-100'}`} />
                                    <p className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${isActive ? 'text-indigo-600' : 'text-gray-300'}`}>{label}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {loading && step < confirmationStep ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Loader2 className="animate-spin h-10 w-10 text-indigo-600 mb-4" />
                            <p>Loading...</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {step === 1 && renderServiceSelection()}
                                {step === 2 && renderResourceSelection()}
                                {step === 3 && (showTimeStep ? renderSlotSelection() : renderConfirmation())}
                                {step === 4 && renderConfirmation()}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>

                {/* Footer */}
                {step < confirmationStep && (
                    <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-white transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" /> Back
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={
                                (step === 1 && !selectedService) ||
                                (step === 2 && !selectedResource) ||
                                (step === 3 && showTimeStep && !selectedSlot)
                            }
                            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
                        >
                            Next Step <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default BookingWizard;
