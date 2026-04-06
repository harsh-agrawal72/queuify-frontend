import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../services/api';
import { useQueueSocket } from '../../hooks/useQueueSocket';
import {
    Search,
    Filter,
    Calendar,
    MoreVertical,
    Check,
    CheckCircle,
    XCircle,
    Clock,
    DollarSign,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Trash2,
    AlertCircle,
    AlertTriangle,
    MoreHorizontal,
    User,
    CreditCard,
    CalendarClock,
    Award,
    History,
    ShieldCheck,
    RefreshCw
} from 'lucide-react';
import UserHistoryModal from './UserHistoryModal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import AdminRescheduleModal from './AdminRescheduleModal';
import OtpVerificationModal from './OtpVerificationModal';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socketService';

const AppointmentManager = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [processingId, setProcessingId] = useState(null);
    const [activeActionId, setActiveActionId] = useState(null);
    const [reschedulingAppt, setReschedulingAppt] = useState(null);
    const [resources, setResources] = useState([]);
    const [selectedResourceId, setSelectedResourceId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [historyModal, setHistoryModal] = useState({ isOpen: false, userId: null, userName: '' });
    const [otpModal, setOtpModal] = useState({ isOpen: false, appointment: null });
    const [orgProfile, setOrgProfile] = useState(null);

    // Fetch organization profile for PDF branding
    const fetchOrgProfile = async () => {
        try {
            const res = await api.get('/organizations/profile');
            setOrgProfile(res.data);
        } catch (error) {
            console.error('Failed to fetch org profile', error);
        }
    };

    useEffect(() => {
        fetchOrgProfile();
    }, []);

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Logic for clicking outside to close dropdown
    const dropdownRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveActionId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchAppointments = useCallback(async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const res = await api.get('/admin/appointments', {
                params: {
                    page,
                    limit: 10,
                    search: debouncedSearch,
                    status: statusFilter,
                    resourceId: selectedResourceId,
                    date: selectedDate
                }
            });
            setAppointments(res.data.appointments || []);
            const apiTotalPages = res.data.totalPages;
            const apiTotal = res.data.total;
            
            // Calculate totalPages if API doesn't provide it, or use API value
            if (apiTotalPages !== undefined) {
                setTotalPages(apiTotalPages);
            } else if (apiTotal !== undefined) {
                setTotalPages(Math.ceil(apiTotal / 10));
            }
        } catch (error) {
            console.error("Failed to fetch appointments", error);
            if (!isBackground) {
                toast.error(t('appointment.load_failed', "Failed to load appointments"));
            }
        } finally {
            if (!isBackground) setLoading(false);
        }
    }, [page, debouncedSearch, statusFilter, selectedResourceId, selectedDate, t]);

    const fetchResources = async () => {
        try {
            const res = await api.get('/resources', { params: { activeOnly: true } });
            setResources(res.data);
        } catch (error) {
            console.error("Failed to fetch resources", error);
        }
    };

    // Main data fetch effect
    useEffect(() => {
        fetchAppointments();
    }, [page, debouncedSearch, statusFilter, selectedResourceId, selectedDate]);

    // --- REAL-TIME UPDATES VIA SOCKET HOOK ---
    const { queueData } = useQueueSocket(user?.org_id);
    
    useEffect(() => {
        if (queueData) {
            console.log('[AdminSocket] Appointment refresh triggered:', queueData);
            fetchAppointments(true); // Background refresh
        }
    }, [queueData, fetchAppointments]);

    // Fetch resources only on mount
    useEffect(() => {
        fetchResources();
    }, []);

    // Reset to page 1 ONLY if we are not already on page 1 when filters change
    useEffect(() => {
        if (page !== 1) {
            setPage(1);
        }
    }, [debouncedSearch, statusFilter, selectedResourceId, selectedDate]);

    const handleStatusUpdate = async (id, newStatus) => {
        setActiveActionId(null);
        let reason = null;
        if (newStatus === 'cancelled') {
            const apt = appointments.find(a => a.id === id);
            const isPaid = apt?.payment_status === 'paid' && apt?.price > 0;
            
            const confirmMsg = isPaid 
                ? t('appointment.confirm_cancel_paid', 'Are you sure? This is a PAID appointment and a 100% REFUND will be issued automatically.')
                : t('appointment.confirm_cancel_generic', 'Are you sure you want to cancel this appointment?');
                
            if (!window.confirm(confirmMsg)) return;

            reason = window.prompt(t('appointment.enter_cancel_reason', 'Please enter a reason for cancellation:'));
            if (reason === null) return; // Cancelled prompt
            if (!reason.trim()) {
                toast.error(t('appointment.reason_required', 'Cancellation reason is required'));
                return;
            }
        }
        
        setProcessingId(id);
        try {
            await api.patch(`/admin/appointments/${id}`, { status: newStatus, reason });
            setAppointments(prev => prev.map(apt =>
                apt.id === id ? { ...apt, status: newStatus, cancellation_reason: reason, cancelled_by: 'admin' } : apt
            ));
            toast.success(t('appointment.status_updated', 'Status updated to {{status}}', { status: newStatus }));
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || t('appointment.update_failed', "Failed to update status"));
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (apt) => {
        setActiveActionId(null);
        
        const isPaid = apt.payment_status === 'paid' && apt.price > 0;
        const isCancelled = apt.status === 'cancelled';

        // Removed confirmation as requested for direct removal
        const reason = "Deleted by Admin";

        setProcessingId(apt.id);
        try {
            await api.delete(`/admin/appointments/${apt.id}`, { data: { reason } });
            
            // Immediately remove from the local state for instant UI feedback
            setAppointments(prev => prev.filter(a => a.id !== apt.id));
            toast.success(t('appointment.delete_success', "Appointment deleted successfully"));
            
            // Optional: Background refresh to sync any other changes
            fetchAppointments(true);
        } catch (error) {
            console.error(error);
            toast.error(t('appointment.delete_failed', "Failed to delete appointment"));
        } finally {
            setProcessingId(null);
        }
    };

    const handleRetryRefund = async (id) => {
        setActiveActionId(null);
        setProcessingId(id);
        const toastId = toast.loading(t('appointment.retrying_refund', 'Retrying refund...'));
        try {
            await api.post(`/admin/appointments/${id}/retry-refund`);
            toast.success(t('appointment.refund_retried', 'Refund successfully retried'), { id: toastId });
            fetchAppointments();
        } catch (error) {
            console.error("Refund retry failed:", error);
            toast.error(error.response?.data?.message || "Refund retry failed", { id: toastId });
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateString, formatStr) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            return format(date, formatStr);
        } catch (error) {
            console.error("Date formatting error:", error);
            return '-';
        }
    };

    const getStatusBadge = (apt) => {
        const { status, cancelled_by, reschedule_status, payment_status } = apt;
        
        if (reschedule_status === 'pending') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-orange-200 bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-100 animate-pulse">
                    <Clock className="h-3 w-3" />
                    {t('status.reschedule_proposed', 'Reschedule Proposed')}
                </span>
            );
        }

        if (payment_status === 'refund_failed') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-rose-300 bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-200">
                    <AlertTriangle className="h-3 w-3" />
                    {t('status.refund_failed', 'Refund Failed')}
                </span>
            );
        }

        const styles = {
            'pending': 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-100',
            'booked': 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-100',
            'confirmed': 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-100',
            'completed': 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100',
            'cancelled': 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-100'
        };
        const activeStyle = styles[status] || 'bg-gray-50 text-gray-700 border-gray-200';

        const icons = {
            'pending': <Clock className="h-3 w-3" />,
            'booked': <Calendar className="h-3 w-3" />,
            'confirmed': <CheckCircle className="h-3 w-3" />,
            'completed': <CheckCircle className="h-3 w-3" />,
            'cancelled': <XCircle className="h-3 w-3" />
        };

        let displayLabel = t(`status.${status}`, status);
        if (status === 'cancelled' && cancelled_by) {
            displayLabel = cancelled_by === 'admin' 
                ? t('status.cancelled_by_admin', 'Cancelled by Admin') 
                : t('status.cancelled_by_user', 'Cancelled by User');
        }

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ring-1 ring-inset ${activeStyle}`}>
                {icons[status] || <Clock className="h-3 w-3" />}
                {displayLabel}
            </span>
        );
    };

    const getLoyaltyBadge = (count) => {
        if (!count || count < 1) return null;
        
        let tier = { 
            name: t('loyalty.bronze', 'Bronze'), 
            color: 'bg-orange-50 text-orange-700 border-orange-200', 
            icon: <Award className="h-2.5 w-2.5" /> 
        };
        if (count >= 10) tier = { name: t('loyalty.diamond', 'Diamond'), color: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: <Award className="h-2.5 w-2.5" /> };
        else if (count >= 5) tier = { name: t('loyalty.gold', 'Gold'), color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Award className="h-2.5 w-2.5" /> };
        else if (count >= 3) tier = { name: t('loyalty.silver', 'Silver'), color: 'bg-slate-50 text-slate-700 border-slate-200', icon: <Award className="h-2.5 w-2.5" /> };

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border shadow-sm ${tier.color}`}>
                {tier.icon} {tier.name}
            </span>
        );
    };

    return (
        <div className="w-full space-y-8">
            {/* Header with improved styling */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-gray-100 pb-6 px-1">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('navigation.appointments', 'Appointments')}</h1>
                    <p className="text-gray-500 mt-2">{t('appointment.mgmt_subtitle', 'Manage bookings, track status, and handle payments.')}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1 shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium text-gray-700 focus:outline-none p-1.5"
                        />
                    </div>

                    <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <select
                            value={selectedResourceId}
                            onChange={(e) => setSelectedResourceId(e.target.value)}
                            className="pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none appearance-none bg-white transition-all cursor-pointer shadow-sm min-w-[180px]"
                        >
                            <option value="">{t('common.all_resources', 'All Resources')}</option>
                            {resources.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronLeft className="h-3 w-3 text-gray-400 -rotate-90" />
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder={t('common.search_placeholder', 'Search accounts...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none w-full sm:w-64 transition-all shadow-sm"
                        />
                    </div>

                    <div className="relative group">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none appearance-none bg-white transition-all cursor-pointer shadow-sm min-w-[140px]"
                        >
                            <option value="">{t('common.all_status', 'All Status')}</option>
                            <option value="pending">{t('status.pending', 'Pending')}</option>
                            <option value="reschedule_proposed">{t('status.reschedule_proposed', 'Reschedule Proposed')}</option>
                            <option value="confirmed">{t('status.confirmed', 'Confirmed')}</option>
                            <option value="completed">{t('status.completed', 'Completed')}</option>
                            <option value="cancelled">{t('status.cancelled', 'Cancelled')}</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronLeft className="h-3 w-3 text-gray-400 -rotate-90" />
                        </div>
                    </div>

                    {(search || statusFilter || selectedResourceId || selectedDate) && (
                        <button
                            onClick={() => {
                                setSearch('');
                                setStatusFilter('');
                                setSelectedResourceId('');
                                setSelectedDate('');
                            }}
                            className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                            {t('common.clear', 'Clear')}
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                {/* Desktop view table */}
                <div className="hidden md:block overflow-x-auto flex-grow">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('appointment.customer', 'Customer')}</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('appointment.service_details', 'Service Details')}</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('slot.date_time', 'Date & Time')}</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('appointment.assigned_resource', 'Assigned Resource')}</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('common.status', 'Status')}</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{t('common.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-10 w-10 bg-gray-100 rounded-full inline-block mr-3 align-middle"></div> <div className="h-4 bg-gray-100 rounded w-24 inline-block align-middle"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-28"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-full w-20"></div></td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                ))
                            ) : appointments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-gray-50 p-4 rounded-full mb-4">
                                                <Calendar className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <p className="text-lg font-semibold text-gray-900">{t('appointment.no_appointments', 'No appointments found')}</p>
                                            <p className="text-sm text-gray-500 max-w-xs mt-1">{t('appointment.adjust_filters', "Try adjusting your search or filters to find what you're looking for.")}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                appointments.map((apt, index) => {
                                    // Logic to determine if dropdown should open upwards
                                    const isLastItems = index >= appointments.length - 2 && appointments.length > 3;

                                    return (
                                        <tr key={apt.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                        {apt.user_name?.[0]?.toUpperCase() || 'G'}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-gray-900 text-sm">{apt.user_name || t('common.guest_user', 'Guest User')}</p>
                                                            {getLoyaltyBadge(apt.completed_count)}
                                                        </div>
                                                        <p className="text-xs text-gray-500 font-mono">{apt.user_email || '-'}</p>
                                                        {apt.user_phone && <p className="text-[10px] text-indigo-600 font-bold mt-0.5">{apt.user_phone}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-medium text-gray-900">{apt.service_name || t('common.general_service', 'General Service')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-gray-900 font-medium text-sm">
                                                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                        {formatDate(apt.start_time, 'MMM d, yyyy')}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {formatDate(apt.start_time, 'h:mm a')}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                    <span className="text-sm font-medium text-gray-700">{apt.resource_name || t('common.unassigned', 'Unassigned')}</span>
                                                </div>
                                            </td>
                                             <td className="px-6 py-4">
                                                {getStatusBadge(apt)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="relative inline-block text-left" ref={activeActionId === apt.id ? dropdownRef : null}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveActionId(activeActionId === apt.id ? null : apt.id);
                                                        }}
                                                        className={`
                                                            p-2 rounded-lg transition-all
                                                            ${activeActionId === apt.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}
                                                        `}
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>

                                                    <AnimatePresence>
                                                        {activeActionId === apt.id && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.95, y: isLastItems ? 10 : -10 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.95, y: isLastItems ? 10 : -10 }}
                                                                className={`
                                                                    absolute right-0 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-[100] py-1 overflow-hidden
                                                                    ${isLastItems ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'}
                                                                `}
                                                            >
                                                                <div className="px-3 py-2 border-b border-gray-50 bg-gray-50/50">
                                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('common.actions', 'Actions')}</p>
                                                                </div>
                                                                 <div className="p-1">
                                                                    {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                                                                        <button 
                                                                            onClick={() => {
                                                                                setReschedulingAppt(apt);
                                                                                setActiveActionId(null);
                                                                            }} 
                                                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition-colors"
                                                                        >
                                                                            <CalendarClock className="h-4 w-4 text-indigo-500" /> {t('appointment.transfer_slot', 'Transfer Slot')}
                                                                        </button>
                                                                    )}
                                                                    {apt.user_id && (
                                                                        <button 
                                                                            onClick={() => {
                                                                                setHistoryModal({ isOpen: true, userId: apt.user_id, userName: apt.user_name });
                                                                                setActiveActionId(null);
                                                                            }} 
                                                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition-colors"
                                                                        >
                                                                            <History className="h-4 w-4 text-indigo-500" /> {t('appointment.view_history', 'View Visit History')}
                                                                        </button>
                                                                    )}
                                                                    {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                                                                        <button 
                                                                            onClick={() => {
                                                                                const isWalkin = !(apt.payment_status === 'paid' && parseFloat(apt.price) > 0);
                                                                                setOtpModal({ isOpen: true, appointment: apt, isWalkin });
                                                                                setActiveActionId(null);
                                                                            }} 
                                                                            className="w-full text-left px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center gap-2 transition-colors font-bold"
                                                                        >
                                                                            <ShieldCheck className="h-4 w-4" /> {t('appointment.verify_checkin', 'Verify & Complete')}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                 {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                                                                    <>
                                                                        <div className="px-3 py-1 border-y border-gray-50 bg-gray-50/50">
                                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('appointment.update_status', 'Update Status')}</p>
                                                                        </div>
                                                                        <div className="p-1">
                                                                            <button onClick={() => handleStatusUpdate(apt.id, 'pending')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition-colors">
                                                                                <div className="w-2 h-2 rounded-full bg-amber-500"></div> {t('status.pending', 'Pending')}
                                                                            </button>
                                                                            <button onClick={() => handleStatusUpdate(apt.id, 'confirmed')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition-colors">
                                                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div> {t('status.confirmed', 'Confirmed')}
                                                                            </button>
                                                                            {!(apt.payment_status === 'paid' && parseFloat(apt.price) > 0) && (
                                                                                <button onClick={() => handleStatusUpdate(apt.id, 'completed')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition-colors">
                                                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> {t('status.completed', 'Completed')}
                                                                                </button>
                                                                            )}
                                                                            {apt.check_in_method !== 'user_signal' && apt.check_in_method !== 'user_delayed' && (
                                                                                <button onClick={() => {
                                                                                        console.log('Marking No-Show for:', apt.id, 'Arrival Method:', apt.check_in_method);
                                                                                        if (window.confirm(t('appointment.confirm_no_show', 'Mark this user as No-Show?'))) {
                                                                                            handleStatusUpdate(apt.id, 'no_show');
                                                                                        }
                                                                                    }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg flex items-center gap-2 transition-colors">
                                                                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div> {t('status.no_show', 'No-Show')}
                                                                                </button>
                                                                            )}
                                                                            <button onClick={() => handleStatusUpdate(apt.id, 'cancelled')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition-colors">
                                                                                <div className="w-2 h-2 rounded-full bg-rose-500"></div> {t('status.cancelled', 'Cancelled')}
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                )}

                                                                {apt.payment_status === 'refund_failed' && (
                                                                    <>
                                                                        <div className="px-3 py-1 border-y border-gray-50 bg-gray-50/50">
                                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('appointment.payment_action', 'Payment Action')}</p>
                                                                        </div>
                                                                        <div className="p-1">
                                                                            <button 
                                                                                onClick={() => handleRetryRefund(apt.id)} 
                                                                                className="w-full text-left px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 rounded-lg flex items-center gap-2 transition-colors font-bold"
                                                                            >
                                                                                <DollarSign className="h-4 w-4" /> {t('appointment.retry_refund', 'Retry Refund')}
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                )}

                                                                <div className="h-px bg-gray-100 my-1"></div>

                                                                <div className="p-1">
                                                                 {apt.status !== 'confirmed' && apt.status !== 'pending' && (
                                                                    <div className="p-1">
                                                                        <button
                                                                            onClick={() => handleDelete(apt)}
                                                                            className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" /> {t('common.delete', 'Delete')}
                                                                        </button>
                                                                    </div>
                                                                 )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile view cards */}
                <div className="md:hidden flex-grow px-4 py-6 space-y-4">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="bg-gray-50/50 rounded-2xl p-4 animate-pulse border border-gray-100">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                </div>
                            </div>
                        ))
                    ) : appointments.length === 0 ? (
                        <div className="py-20 text-center text-gray-500">
                            <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                            <p className="font-semibold text-gray-900">{t('appointment.no_appointments', 'No appointments found')}</p>
                        </div>
                    ) : (
                        appointments.map((apt) => (
                            <div key={apt.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm relative">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                            {apt.user_name?.[0]?.toUpperCase() || 'G'}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-900 leading-tight">{apt.user_name || t('common.guest_user', 'Guest User')}</p>
                                                {apt.completed_count > 0 && (
                                                    <Award className={`h-3 w-3 ${
                                                        apt.completed_count >= 10 ? "text-cyan-500" :
                                                        apt.completed_count >= 5 ? "text-amber-500" :
                                                        apt.completed_count >= 3 ? "text-slate-400" : "text-orange-500"
                                                    }`} />
                                                )}
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-0.5">{apt.user_email || '-'}</p>
                                            {apt.user_phone && <p className="text-[10px] text-indigo-600 font-bold mt-0.5">{apt.user_phone}</p>}
                                        </div>
                                    </div>
                                     <div className="flex flex-col items-end gap-2">
                                        {getStatusBadge(apt)}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveActionId(activeActionId === apt.id ? null : apt.id);
                                            }}
                                            className={`p-1.5 rounded-lg border ${activeActionId === apt.id ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'text-gray-400 border-gray-100'}`}
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 py-3 border-t border-gray-50 mt-1">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{t('common.service', 'Service')}</p>
                                        <p className="text-xs font-semibold text-gray-800 line-clamp-1">{apt.service_name || t('common.general', 'General')}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{t('common.resource', 'Resource')}</p>
                                        <p className="text-xs font-semibold text-gray-800 line-clamp-1">{apt.resource_name || t('common.unassigned', 'Unassigned')}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{t('common.date', 'Date')}</p>
                                        <p className="text-xs font-semibold text-gray-800">{formatDate(apt.start_time, 'MMM d, yyyy')}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{t('common.time', 'Time')}</p>
                                        <p className="text-xs font-semibold text-gray-800 font-mono">{formatDate(apt.start_time, 'h:mm a')}</p>
                                    </div>
                                </div>

                                {/* Mobile Action Overlay */}
                                <AnimatePresence>
                                    {activeActionId === apt.id && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 rounded-2xl flex flex-col p-4 shadow-xl border border-indigo-100"
                                        >
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{apt.status === 'completed' ? 'Appointment Completed' : t('appointment.update_status', 'Update Status')}</h4>
                                                <button onClick={() => setActiveActionId(null)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                                    <XCircle className="h-4 w-4 text-gray-400" />
                                                </button>
                                            </div>
                                            <div className="flex flex-col gap-2 mb-3">
                                                {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                                                    <button 
                                                        onClick={() => {
                                                            setReschedulingAppt(apt);
                                                            setActiveActionId(null);
                                                        }}
                                                        className="w-full py-2.5 text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <CalendarClock className="h-4 w-4" /> {t('appointment.transfer_slot', 'Transfer Slot')}
                                                    </button>
                                                )}
                                                {apt.user_id && (
                                                    <button 
                                                        onClick={() => {
                                                            setHistoryModal({ isOpen: true, userId: apt.user_id, userName: apt.user_name });
                                                            setActiveActionId(null);
                                                        }}
                                                        className="w-full py-2.5 text-sm font-bold text-indigo-700 bg-indigo-100/50 border border-indigo-200 rounded-xl hover:bg-indigo-200 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <History className="h-4 w-4" /> {t('appointment.view_history', 'Visit History')}
                                                    </button>
                                                )}
                                                {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                                                    <button 
                                                        onClick={() => {
                                                            const isWalkin = !(apt.payment_status === 'paid' && parseFloat(apt.price) > 0);
                                                            setOtpModal({ isOpen: true, appointmentId: apt.id, isWalkin });
                                                            setActiveActionId(null);
                                                        }}
                                                        className="w-full py-2.5 text-sm font-black text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <ShieldCheck className="h-4 w-4" /> {t('appointment.verify_checkin', 'Verify & Complete')}
                                                    </button>
                                                )}
                                                {apt.status === 'confirmed' && apt.check_in_method !== 'user_signal' && apt.check_in_method !== 'user_delayed' && (
                                                    <button 
                                                        onClick={() => {
                                                            if (window.confirm('Mark this user as No-Show? Funds will be settled accordingly.')) {
                                                                handleStatusUpdate(apt.id, 'no_show');
                                                            }
                                                        }}
                                                        className="w-full py-2.5 text-sm font-bold text-orange-700 bg-orange-50 border border-orange-100 rounded-xl hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <AlertTriangle className="h-4 w-4" /> Mark No-Show
                                                    </button>
                                                )}
                                            </div>
                                                 {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                                                    <div className="grid grid-cols-2 gap-2 flex-grow mt-2">
                                                        <button onClick={() => handleStatusUpdate(apt.id, 'pending')} className="py-2 text-xs font-bold rounded-xl border border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">{t('status.pending', 'Pending')}</button>
                                                        <button onClick={() => handleStatusUpdate(apt.id, 'confirmed')} className="py-2 text-xs font-bold rounded-xl border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">{t('status.confirmed', 'Confirmed')}</button>
                                                        {!(apt.payment_status === 'paid' && parseFloat(apt.price) > 0) && (
                                                            <button onClick={() => handleStatusUpdate(apt.id, 'completed')} className="py-2 text-xs font-bold rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">{t('status.completed', 'Completed')}</button>
                                                        )}
                                                        <button onClick={() => handleStatusUpdate(apt.id, 'cancelled')} className="py-2 text-xs font-bold rounded-xl border border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors">{t('status.cancelled', 'Cancelled')}</button>
                                                    </div>
                                                )}
                                            <button
                                                onClick={() => handleDelete(apt)}
                                                className="mt-3 w-full py-2.5 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" /> {t('appointment.delete_permanently', 'Delete Permanently')}
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 mt-auto">
                    <p className="text-xs text-gray-500 font-medium">
                        {t('common.showing_page', 'Showing page {{page}} of {{totalPages}}', { page, totalPages })}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all border border-transparent hover:border-gray-200"
                        >
                            <ChevronLeft className="h-4 w-4" /> {t('common.previous', 'Previous')}
                        </button>
                        <button
                            onClick={() => {
                                const nextPage = page + 1;
                                if (!isNaN(totalPages) && nextPage <= totalPages) {
                                    setPage(nextPage);
                                }
                            }}
                            disabled={page >= totalPages || totalPages <= 0 || isNaN(totalPages)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all border border-transparent hover:border-gray-200"
                        >
                            {t('common.next', 'Next')} <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {reschedulingAppt && (
                    <AdminRescheduleModal
                        appointment={reschedulingAppt}
                        onClose={() => setReschedulingAppt(null)}
                        onSuccess={() => {
                            setReschedulingAppt(null);
                            fetchAppointments();
                        }}
                    />
                )}
            </AnimatePresence>

            <UserHistoryModal 
                isOpen={historyModal.isOpen}
                userId={historyModal.userId}
                userName={historyModal.userName}
                onClose={() => setHistoryModal({ ...historyModal, isOpen: false })}
            />
            <OtpVerificationModal 
                isOpen={otpModal.isOpen}
                onClose={() => setOtpModal({ isOpen: false, appointment: null })}
                appointment={otpModal.appointment}
                org={orgProfile}
                onVerified={(id) => {
                    fetchAppointments(true);
                }}
            />
        </div>
    );
};

export default AppointmentManager;
