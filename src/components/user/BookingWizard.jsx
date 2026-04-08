import { useState, useEffect, useRef, useMemo } from 'react';
import { apiService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
    ArrowRight,
    RefreshCw,
    QrCode
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO, isValid } from 'date-fns';
import { calculatePaymentBreakdown } from '../../utils/paymentHelper';
import { motion, AnimatePresence } from 'framer-motion';
// Removing mock RazorpayModal as we use real window.Razorpay

const BookingWizard = ({ orgId, service, initialResource, initialSlot, onClose }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    // If slot/resource provided, start at step 4 (Review) or 3 (Time/Slot)
    const getInitialStep = () => {
        if (initialSlot || initialResource) return 4;
        if (service) return 2;
        return 1;
    };
    const [step, setStep] = useState(getInitialStep());
    const [loading, setLoading] = useState(false);

    // Data
    const [services, setServices] = useState([]);
    const [resources, setResources] = useState([]);

    // Selection
    const [selectedService, setSelectedService] = useState(service || null);
    const [selectedResource, setSelectedResource] = useState(initialResource || null);
    const [selectedSlot, setSelectedSlot] = useState(initialSlot || null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Booking State
    const [pendingAppointment, setPendingAppointment] = useState(null);
    const [bookingResult, setBookingResult] = useState(null);
    const [loadingCreation, setLoadingCreation] = useState(false);
    const [prefResource, setPrefResource] = useState('ANY');
    const [prefTime, setPrefTime] = useState('FLEXIBLE');
    const [notificationTime, setNotificationTime] = useState('');
    const [requestingNotification, setRequestingNotification] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const apptRef = useRef(null);

    // Derived Financial State (Preview)
    const basePrice = selectedResource?.price || selectedService?.price || 0;
    const previewBreakdown = useMemo(() => calculatePaymentBreakdown(basePrice), [basePrice]);

    // Helper to generate time intervals between slot boundaries
    const getTimeOptions = (slot, minTimeStr) => {
        if (!slot?.start_time || !slot?.end_time) return [];
        const start = parseISO(slot.start_time);
        const end = parseISO(slot.end_time);
        const minTime = minTimeStr ? parseISO(minTimeStr) : null;
        
        const options = [];
        let curr = new Date(start);
        
        // Add intervals every 15 minutes
        while (curr <= end) {
            // Only add if it's after minTime (or no minTime provided)
            const isAfterMin = !minTime || curr > minTime;
            
            if (isAfterMin) {
                options.push({
                    value: format(curr, 'HH:mm'),
                    label: format(curr, 'h:mm a'),
                    date: new Date(curr)
                });
            }
            curr = new Date(curr.getTime() + 15 * 60000);
        }
        
        // Ensure end time is included if not already and it's after minTime
        const lastVal = format(end, 'HH:mm');
        const isEndAfterMin = !minTime || end > minTime;

        if (isEndAfterMin && (options.length === 0 || options[options.length-1].value !== lastVal)) {
            options.push({
                value: lastVal,
                label: format(end, 'h:mm a'),
                date: new Date(end)
            });
        }
        return options;
    };

    // Derived State
    const showTimeStep = true;
    const totalSteps = 5;
    const confirmationStep = 4; // Review is 4, Payment is 5.
    const paymentStep = 5;

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
                toast.error(t('common.operation_failed', "Failed to load services"));
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
                toast.error(t('common.operation_failed', "Failed to load resources for this service"));
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
                const res = await apiService.getSlotsForResource(orgId, selectedResource.id, selectedService?.id);
                setAvailableSlots(res.data);
            } catch (error) {
                console.error('[BookingWizard] Failed to load slots', error);
                toast.error(t('common.operation_failed', "Failed to load available slots"));
            } finally {
                setLoadingSlots(false);
            }
        };
        fetchSlots();
    }, [selectedResource, orgId]);

    const handleNext = () => {
        // If we are on Review (Step 4) and price is 0, skip Payment (Step 5)
        const currentPrice = selectedResource?.price || selectedService?.price || 0;
        if (step === 4 && parseFloat(currentPrice) === 0) {
            handleBookingCreation();
            return;
        }
        setStep(prev => prev + 1);
    };
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
    const handlePaymentComplete = async (response) => {
        try {
            setLoading(true);
            const currentAppt = apptRef.current;
            if (!currentAppt) {
                console.error('[Payment] No pending appointment in ref');
                toast.error(t('booking.wizard.errors.timeout', "Process timed out. Please check your appointments."));
                return;
            }

            await apiService.verifyPayment({
                appointmentId: currentAppt.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
            });
            
            setBookingResult({
                success: true,
                queueNumber: currentAppt.queueNumber,
                appointmentId: currentAppt.id
            });
            setStep(6); // Success screen
            toast.success(t('booking.wizard.success.payment_verified', "Payment Verified & Ticket Generated!"));
        } catch (error) {
            console.error('[Payment] Verification failed:', error);
            toast.error(error.response?.data?.message || t('common.error', "Payment verification failed."));
        } finally {
            setLoading(false);
        }
    };

    const initiateRazorpayPayment = async (appointment) => {
        try {
            const orderRes = await apiService.createPaymentOrder(appointment.id);
            const { order, breakdown } = orderRes.data;

            // Update local state with exact amount and breakdown from backend
            if (breakdown) {
                setPendingAppointment(prev => ({
                    ...prev,
                    price: breakdown.basePrice,
                    total_payable: breakdown.totalPayable,
                    breakdown
                }));
            }

            const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
            if (!rzpKey) {
                console.error('[Payment] Razorpay Key ID is missing!');
                toast.error(t('booking.wizard.errors.config_missing', "Payment configuration missing. Please contact support."));
                setLoadingCreation(false);
                return;
            }

            const options = {
                key: rzpKey,
                amount: order.amount,
                currency: order.currency,
                name: "Queuify",
                description: `Booking Fee for ${selectedService?.name}`,
                order_id: order.id,
                handler: handlePaymentComplete,
                prefill: {
                    name: JSON.parse(localStorage.getItem('user'))?.name || "",
                    email: JSON.parse(localStorage.getItem('user'))?.email || "",
                },
                theme: {
                    color: "#4F46E5",
                },
                modal: {
                    ondismiss: function() {
                        console.log('[Payment] Modal dismissed. Releasing seat...');
                        // Instant cleanup call (Fire and forget, we don't want to block UI)
                        apiService.cancelPendingPayment(appointment.id).catch(e => {
                            console.warn('[Payment] Instant cleanup failed:', e.message);
                        });
                        setLoadingCreation(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast.error(t('booking.wizard.errors.payment_failed', "Payment failed: ") + response.error.description);
                setLoadingCreation(false);
            });
            rzp.open();
        } catch (error) {
            console.error('[Payment] Initiation failed:', error);
            toast.error(t('booking.wizard.errors.init_failed', "Failed to start payment process."));
            setLoadingCreation(false);
        }
    };

    const handleBookingCreation = async (bypassDuplicate = false) => {
        setLoadingCreation(true);
        try {
            const res = await apiService.bookAppointment({
                serviceId: selectedService.id,
                resourceId: selectedResource?.id,
                slotId: selectedSlot?.id,
                orgId: orgId,
                pref_resource: prefResource,
                pref_time: prefTime,
                bypassDuplicate
            });

            const apptData = {
                id: res.data.appointmentId,
                queueNumber: res.data.queueNumber,
                price: res.data.appointment?.price || res.data.price || 0,
                ...res.data
            };

            setPendingAppointment(apptData);
            apptRef.current = apptData;

            if (parseFloat(apptData.price) > 0) {
                await initiateRazorpayPayment(apptData);
            } else {
                setBookingResult({
                    success: true,
                    queueNumber: res.data.queueNumber,
                    appointmentId: res.data.appointmentId
                });
                setStep(6);
                toast.success(t('booking.wizard.success.title', "Joined Queue Successfully!"));
            }
        } catch (error) {
            console.error('[Booking] Creation error:', error);
            if (error.response?.status === 409 && error.response?.data?.message === 'DUPLICATE_BOOKING_WARNING') {
                const proceed = window.confirm(t('booking.wizard.duplicate_warning', "You already have an active booking for this. Continue anyway?"));
                if (proceed) handleBookingCreation(true);
            } else {
                toast.error(error.response?.data?.message || t('booking.wizard.errors.booking_failed', "Booking failed"));
            }
        } finally {
            if (step !== 5) setLoadingCreation(false); // Only stop loading if not waiting for modal
        }
    };

    const handleClose = () => {
        onClose();
    };

    const handleBookAnother = () => {
        setBookingResult(null);
        setPendingAppointment(null);
        apptRef.current = null;
        if (service) {
            setStep(2);
            setSelectedResource(null);
        } else {
            setStep(1);
            setSelectedService(null);
            setSelectedResource(null);
        }
        setPrefResource('ANY');
        setPrefTime('FLEXIBLE');
    };

    const handleGoToAppointments = () => {
        navigate('/dashboard');
    };

    // ──── RENDER STEPS ────

    const renderServiceSelection = () => (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('booking.wizard.select_service', 'Select a Service')}</h2>
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
            <h2 className="text-xl font-bold text-gray-900 mb-1">{t('booking.wizard.select_resource', 'Select a Resource')}</h2>
            <p className="text-sm text-gray-500 mb-4">
                {t('booking.wizard.available_for', 'Available resources for {{name}}', { name: selectedService?.name })}
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
                        <div className="flex flex-col items-end gap-2">
                             <span className="text-sm font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100">₹{res.price || selectedService?.price || 0}</span>
                             {selectedResource?.id === res.id && <CheckCircle2 className="h-5 w-5 text-indigo-600" />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderSlotSelection = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-1">
                <h2 className="text-xl font-bold text-gray-900">{t('booking.wizard.select_time', 'Select a Time Slot')}</h2>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{t('booking.wizard.fee', 'Fee: ₹{{amount}}', { amount: selectedResource?.price || selectedService?.price || 0 })}</span>
            </div>
            {loadingSlots ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-400 h-8 w-8" /></div>
            ) : availableSlots.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">{t('booking.wizard.no_slots', 'No available slots')}</p>
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
                            <div className="text-xs uppercase opacity-60 mb-1">
                                {(() => {
                                    const d = slot.start_time ? parseISO(slot.start_time) : null;
                                    return (d && isValid(d)) ? format(d, 'MMM d') : '---';
                                })()}
                            </div>
                            <div className="text-[11px] font-bold leading-tight">
                                {(() => {
                                    const start = slot.start_time ? parseISO(slot.start_time) : null;
                                    const end = slot.end_time ? parseISO(slot.end_time) : null;
                                    const startStr = (start && isValid(start)) ? format(start, 'h:mm a') : '??';
                                    const endStr = (end && isValid(end)) ? format(end, 'h:mm a') : '??';
                                    return `${startStr} - ${endStr}`;
                                })()}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {selectedSlot && (
                <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                        <div className="space-y-3">
                            <p className="text-sm text-indigo-900 leading-relaxed font-medium">
                                {selectedSlot.descriptive_message?.split('**').map((part, i) => 
                                    i % 2 === 1 ? <strong key={i} className="text-indigo-700 font-extrabold">{part}</strong> : part
                                )}
                            </p>
                            
                            <div className="pt-2 border-t border-indigo-100">
                                <p className="text-[11px] text-indigo-500 font-bold uppercase tracking-wider mb-2">{t('booking.wizard.notify_me.title', 'Not free at this time?')}</p>
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                                        <div className="flex flex-col flex-1">
                                            <span className="text-[10px] text-indigo-400 font-bold uppercase ml-1 mb-0.5">{t('booking.wizard.notify_me.desired', 'Desired Time')}</span>
                                            <select
                                                value={notificationTime}
                                                onChange={(e) => setNotificationTime(e.target.value)}
                                                className="w-full text-sm border-gray-200 rounded-lg p-3 sm:p-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                                            >
                                                <option value="">{t('booking.wizard.notify_me.select', 'Select Time...')}</option>
                                                {getTimeOptions(selectedSlot, selectedSlot.estimated_next_time).map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (!notificationTime) return toast.error(t('booking.wizard.notify_me.select', "Please pick a time"));
                                                setRequestingNotification(true);
                                                try {
                                                    const options = getTimeOptions(selectedSlot, selectedSlot.estimated_next_time);
                                                    const desiredOption = options.find(o => o.value === notificationTime);
                                                    const desiredDate = desiredOption ? desiredOption.date : null;
                                                    
                                                    if (!desiredDate) return toast.error(t('common.error', "Invalid time selected"));
 
                                                    await apiService.requestSlotNotification(selectedSlot.id, {
                                                        desiredTime: desiredDate.toISOString(),
                                                        serviceId: selectedService?.id || selectedSlot.service_id,
                                                        resourceId: selectedResource?.id || selectedSlot.resource_id,
                                                        customerPhone: null
                                                    });
                                                    
                                                    toast.success(t('booking.wizard.notify_me.request_success', "We'll notify you when it reaches your time!"));
                                                    setNotificationTime('');
                                                    onClose();
                                                } catch (e) {
                                                    toast.error(e.response?.data?.message || t('common.error', "Failed to set notification"));
                                                } finally {
                                                    setRequestingNotification(false);
                                                }
                                            }}
                                            disabled={requestingNotification}
                                            className="w-full sm:w-auto h-[42px] px-6 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md shadow-indigo-100 flex items-center justify-center"
                                        >
                                            {requestingNotification ? <Loader2 className="h-4 w-4 animate-spin"/> : t('booking.wizard.notify_me.button', 'Notify Me')}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-indigo-400 mt-2 italic">{t('booking.wizard.notify_me.footer', "We'll send you an alert when the estimated time reaches your preference.")}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderConfirmation = () => (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 text-center">{t('booking.wizard.review_title', 'Review Your Booking')}</h2>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                <div className="flex justify-between border-b pb-3 border-gray-200">
                    <span className="text-gray-500 text-sm">{t('booking.wizard.steps.service', 'Service')}</span>
                    <span className="font-bold text-gray-900 text-sm">{selectedService?.name}</span>
                </div>
                {selectedResource && (
                    <div className="flex justify-between border-b pb-3 border-gray-200">
                        <span className="text-gray-500 text-sm">{t('booking.wizard.steps.resource', 'Resource')}</span>
                        <span className="font-bold text-gray-900 text-sm">{selectedResource.name}</span>
                    </div>
                )}
                {selectedSlot && (
                    <div className="flex justify-between border-b pb-3 border-gray-200">
                        <span className="text-gray-500 text-sm">{t('booking.wizard.steps.time', 'Time')}</span>
                        <div className="text-right text-sm">
                            <span className="block font-bold text-gray-900">
                                {format(parseISO(selectedSlot.start_time), 'MMM d, h:mm a')}
                            </span>
                        </div>
                    </div>
                )}
                
                <div className="flex justify-between pt-1">
                    <span className="text-gray-500 text-sm font-medium">{t('booking.wizard.total_fee', 'Total Fee')}</span>
                    <span className="text-lg font-black text-green-600">
                        ₹{selectedResource?.price || selectedService?.price || 0}
                    </span>
                </div>
            </div>

            {/* Preferences Checkboxes */}
            <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group">
                    <div className="pt-0.5">
                        <input
                            type="checkbox"
                            checked={prefResource === 'ANY'}
                            onChange={(e) => setPrefResource(e.target.checked ? 'ANY' : 'SPECIFIC')}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <span className="block text-xs font-bold text-gray-700">{t('booking.wizard.prefs.flexible_staff', 'Flexible Staff')}</span>
                        <span className="block text-[10px] text-gray-400 mt-0.5 leading-tight">
                            {t('booking.wizard.prefs.flexible_staff_desc', 'Allow us to move you to another staff member if {{name}} becomes unavailable.', { name: selectedResource?.name })}
                        </span>
                    </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group">
                    <div className="pt-0.5">
                        <input
                            type="checkbox"
                            checked={prefTime === 'URGENT'}
                            onChange={(e) => setPrefTime(e.target.checked ? 'URGENT' : 'FLEXIBLE')}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <span className="block text-xs font-bold text-gray-700">{t('booking.wizard.prefs.urgent', 'Urgent Requirement (Today)')}</span>
                        <span className="block text-[10px] text-gray-400 mt-0.5 leading-tight">
                            {t('booking.wizard.prefs.urgent_desc', 'If this slot is cancelled, keep me on high-priority waitlist for same-day openings.')}
                        </span>
                    </div>
                </label>
            </div>

            {/* Primary Action Button removed from here as it is unified in the footer */}
        </div>
    );

    const renderPaymentStep = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t('booking.wizard.payment.heading', 'Secure Payment')}</h2>
                <p className="text-sm text-gray-500 mt-1">{t('booking.wizard.payment.subtitle', 'Confirm your booking fee to join the queue.')}</p>
            </div>

            <div className="bg-white border-2 border-indigo-50 rounded-3xl p-6 shadow-sm">
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400 font-medium">{t('booking.wizard.steps.service', 'Service')}</span>
                        <span className="text-gray-900 font-bold">{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400 font-medium">{t('booking.wizard.steps.resource', 'Resource')}</span>
                        <span className="text-gray-900 font-bold">{selectedResource?.name}</span>
                    </div>
                    {selectedSlot && (
                        <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-4">
                            <span className="text-gray-400 font-medium">{t('booking.wizard.steps.time', 'Time')}</span>
                            <span className="text-gray-900 font-bold">{format(parseISO(selectedSlot.start_time), 'MMM d, h:mm a')}</span>
                        </div>
                    )}

                    {/* Breakdown of Fees */}
                    <div className="space-y-2 py-2">
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{t('booking.wizard.payment.appointment_fee', 'Appointment Fee')}</span>
                            <span>₹{pendingAppointment?.price || basePrice || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{t('booking.wizard.payment.convenience_fee', 'Convenience Fee')}</span>
                            <span>
                                ₹{pendingAppointment?.breakdown 
                                    ? ((parseFloat(pendingAppointment.breakdown.platformFee) || 0) + (parseFloat(pendingAppointment.breakdown.transactionFee) || 0)).toFixed(2) 
                                    : (previewBreakdown.platformFee + previewBreakdown.transactionFee).toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{t('booking.wizard.payment.gst', 'GST (18%)')}</span>
                            <span>₹{parseFloat(pendingAppointment?.breakdown?.paymentGst || previewBreakdown.paymentGst || 0).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-indigo-100">
                        <span className="text-gray-900 font-bold">{t('booking.wizard.payment.total', 'Total Amount')}</span>
                        <span className="text-2xl font-black text-indigo-600 font-mono">₹{parseFloat(pendingAppointment?.total_payable || previewBreakdown.totalPayable || basePrice || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                        {t('booking.wizard.payment.escrow_note', 'Payments are held in escrow and released only after your appointment is verified or successfully completed.')}
                    </p>
                </div>
                <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <RefreshCw className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-indigo-800 leading-relaxed font-medium">
                        {t('booking.wizard.payment.refund_policy', 'Refund Policy: Full refund if cancelled 3+ hours before. 85% refund if cancelled within 3 hours.')}
                    </p>
                </div>
            </div>

            <button
                onClick={() => handleBookingCreation()}
                disabled={loadingCreation}
                className="w-full flex items-center justify-center gap-3 p-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98]"
            >
                {loadingCreation ? <Loader2 className="animate-spin h-6 w-6" /> : (
                    <>
                        <CreditCard className="h-6 w-6" />
                        <span>{t('booking.wizard.payment.pay_button', 'Pay ₹{{amount}} & Join Queue', { amount: pendingAppointment?.total_payable || previewBreakdown.totalPayable || basePrice || 0 })}</span>
                    </>
                )}
            </button>
            <p className="text-center text-[10px] text-gray-400 font-medium">{t('booking.wizard.payment.powered_by', 'Powered by Razorpay Escrow')}</p>
        </div>
    );

    if (bookingResult && step > paymentStep) {
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
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('booking.wizard.success.title', "You're in Queue!")}</h2>
                        <p className="text-gray-500 mb-6">{t('booking.wizard.success.subtitle', "Your ticket has been generated successfully.")}</p>

                        <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 relative overflow-hidden mb-6">
                            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-bold">{t('booking.wizard.success.queue_number', "Queue Number")}</p>
                            <p className="text-6xl font-black text-indigo-600 tracking-tighter">#{bookingResult.queueNumber || '1'}</p>
                            <div className="h-px bg-gray-200 my-4" />
                            <p className="text-sm font-bold text-gray-900">{selectedService?.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {(() => {
                                    const start = selectedSlot.start_time ? parseISO(selectedSlot.start_time) : null;
                                    const end = selectedSlot.end_time ? parseISO(selectedSlot.end_time) : null;
                                    if (start && isValid(start)) {
                                        const startStr = format(start, 'MMM d | h:mm a');
                                        const endStr = (end && isValid(end)) ? format(end, 'h:mm a') : '??';
                                        return `${startStr} - ${endStr}`;
                                    }
                                    return selectedResource?.name || t('booking.wizard.central_queue', 'Central Queue');
                                })()}
                            </p>
                        </div>

                        {/* --- QR Check-in Instruction --- */}
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mb-8 p-5 bg-amber-50 border border-amber-100 rounded-3xl text-left flex gap-4 shadow-sm"
                        >
                            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                                <QrCode className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-amber-900 leading-tight mb-1">{t('common.qr_checkin_instruction', 'Wait! Scanning Mandatory')}</h4>
                                <p className="text-[11px] text-amber-700/80 font-bold leading-relaxed">{t('common.qr_checkin_instruction_desc', 'Please scan the organization QR code at the desk upon arrival to verify your session.')}</p>
                            </div>
                        </motion.div>

                        <div className="space-y-3">
                            <button
                                onClick={handleGoToAppointments}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg"
                            >
                                <LayoutDashboard className="h-4 w-4" /> {t('booking.wizard.success.view_appointments', "View My Appointments")}
                            </button>

                            <button
                                onClick={handleBookAnother}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                            >
                                <CalendarCheck className="h-4 w-4" /> {t('booking.wizard.success.book_another', "Book Another")}
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
                        <h1 className="text-xl font-bold text-gray-900">{t('booking.wizard.title', 'Get Your Ticket')}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{t('booking.wizard.step_of', 'Step {{current}} of {{total}}', { current: step - (service ? 1 : 0), total: ((selectedResource?.price || selectedService?.price || 0) > 0 ? totalSteps : totalSteps - 1) - (service ? 1 : 0) })}</p>
                    </div>
                    <button onClick={handleClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="px-8 pt-6 pb-2 shrink-0">
                    <div className="flex gap-2">
                        {[
                            { key: 'service', label: t('booking.wizard.steps.service', 'Service') },
                            { key: 'resource', label: t('booking.wizard.steps.resource', 'Resource') },
                            { key: 'time', label: t('booking.wizard.steps.time', 'Time') },
                            { key: 'review', label: t('booking.wizard.steps.review', 'Review') },
                            { key: 'payment', label: t('booking.wizard.steps.payment', 'Payment') }
                        ].map((s, i) => {
                            if (service && i === 0) return null;
                            if (!showTimeStep && i === 2) return null;
                            
                            // Hide payment step if price is 0
                            const price = selectedResource?.price || selectedService?.price || 0;
                            if (i === 4 && parseFloat(price) === 0) return null;

                            const stepNum = i + 1;
                            const isActive = stepNum <= step;

                            return (
                                <div key={s.key} className="flex-1 text-center">
                                    <div className={`h-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-indigo-600' : 'bg-gray-100'}`} />
                                    <p className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${isActive ? 'text-indigo-600' : 'text-gray-300'}`}>{s.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {loading && step < confirmationStep ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Loader2 className="animate-spin h-10 w-10 text-indigo-600 mb-4" />
                            <p>{t('common.loading', 'Loading...')}</p>
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
                                {step === 5 && renderPaymentStep()}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>

                {/* Footer */}
                {step < (selectedResource?.price || selectedService?.price || 0 > 0 ? paymentStep : confirmationStep) && (
                    <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-white transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" /> {t('common.back', 'Back')}
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={
                                (step === 1 && !selectedService) ||
                                (step === 2 && !selectedResource) ||
                                (step === 3 && showTimeStep && (!selectedSlot || notificationTime))
                            }
                            className={`flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed`}
                        >
                            {step === 4 ? (
                                <>
                                    <span>{(selectedResource?.price || selectedService?.price || 0) > 0 ? t('booking.wizard.payment.continue_btn', "Continue to Payment") : t('booking.wizard.payment.join_now', "Join Queue Now")}</span>
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            ) : (
                                <>
                                    <span>{t('common.next', 'Next Step')}</span>
                                    <ChevronRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default BookingWizard;
