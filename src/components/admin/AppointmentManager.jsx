import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import {
    Search,
    Filter,
    Calendar,
    MoreVertical,
    CheckCircle,
    XCircle,
    Clock,
    DollarSign,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Trash2,
    AlertCircle,
    Check,
    MoreHorizontal,
    User,
    CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const AppointmentManager = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [processingId, setProcessingId] = useState(null);
    const [activeActionId, setActiveActionId] = useState(null);

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

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/appointments', {
                params: {
                    page,
                    limit: 10,
                    search,
                    status: statusFilter
                }
            });
            setAppointments(res.data.appointments);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error("Failed to fetch appointments", error);
            toast.error("Failed to load appointments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [page, search, statusFilter]);

    const handleStatusUpdate = async (id, newStatus) => {
        setActiveActionId(null);
        setProcessingId(id);
        try {
            await api.patch(`/admin/appointments/${id}`, { status: newStatus });
            setAppointments(prev => prev.map(apt =>
                apt.id === id ? { ...apt, status: newStatus } : apt
            ));
            toast.success(`Status updated to ${newStatus}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (id) => {
        setActiveActionId(null);
        if (!window.confirm("Are you sure you want to permanently delete this appointment?")) return;

        setProcessingId(id);
        try {
            await api.delete(`/admin/appointments/${id}`);
            setAppointments(prev => prev.filter(apt => apt.id !== id));
            toast.success("Appointment deleted successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete appointment");
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status, cancelledBy) => {
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
            'completed': <Check className="h-3 w-3" />,
            'cancelled': <XCircle className="h-3 w-3" />
        };

        let displayLabel = status;
        if (status === 'cancelled' && cancelledBy) {
            displayLabel = cancelledBy === 'admin' ? 'Cancelled by Admin' : 'Cancelled by User';
        }

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ring-1 ring-inset ${activeStyle}`}>
                {icons[status] || <Clock className="h-3 w-3" />}
                {displayLabel}
            </span>
        );
    };

    return (
        <div className="w-full space-y-8">
            {/* Header with improved styling */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Appointments</h1>
                    <p className="text-gray-500 mt-2">Manage bookings, track status, and handle payments.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search appointments..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none w-full sm:w-72 transition-all shadow-sm"
                        />
                    </div>

                    <div className="relative group">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none appearance-none bg-white transition-all cursor-pointer shadow-sm min-w-[160px]"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <motion.div
                                animate={{ rotate: statusFilter ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronLeft className="h-3 w-3 text-gray-400 -rotate-90" />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                <div className="overflow-x-visible flex-grow">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Details</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Resource</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
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
                                            <p className="text-lg font-semibold text-gray-900">No appointments found</p>
                                            <p className="text-sm text-gray-500 max-w-xs mt-1">Try adjusting your search or filters to find what you're looking for.</p>
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
                                                        <p className="font-semibold text-gray-900 text-sm">{apt.user_name || 'Guest User'}</p>
                                                        <p className="text-xs text-gray-500 font-mono">{apt.user_email || '-'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-medium text-gray-900">{apt.service_name || 'General Service'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-gray-900 font-medium text-sm">
                                                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                        {apt.start_time ? format(new Date(apt.start_time), 'MMM d, yyyy') : '-'}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {apt.start_time ? format(new Date(apt.start_time), 'h:mm a') : '-'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                    <span className="text-sm font-medium text-gray-700">{apt.resource_name || 'Unassigned'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(apt.status, apt.cancelled_by)}
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
                                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Update Status</p>
                                                                </div>
                                                                <div className="p-1">
                                                                    <button onClick={() => handleStatusUpdate(apt.id, 'pending')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition-colors">
                                                                        <div className="w-2 h-2 rounded-full bg-amber-500"></div> Pending
                                                                    </button>
                                                                    <button onClick={() => handleStatusUpdate(apt.id, 'confirmed')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition-colors">
                                                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div> Confirmed
                                                                    </button>
                                                                    <button onClick={() => handleStatusUpdate(apt.id, 'completed')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition-colors">
                                                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Completed
                                                                    </button>
                                                                    <button onClick={() => handleStatusUpdate(apt.id, 'cancelled')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition-colors">
                                                                        <div className="w-2 h-2 rounded-full bg-rose-500"></div> Cancelled
                                                                    </button>
                                                                </div>

                                                                <div className="h-px bg-gray-100 my-1"></div>

                                                                <div className="p-1">
                                                                    <button
                                                                        onClick={() => handleDelete(apt.id)}
                                                                        className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" /> Delete
                                                                    </button>
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

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 mt-auto">
                    <p className="text-xs text-gray-500 font-medium">
                        Showing page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all border border-transparent hover:border-gray-200"
                        >
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all border border-transparent hover:border-gray-200"
                        >
                            Next <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppointmentManager;
