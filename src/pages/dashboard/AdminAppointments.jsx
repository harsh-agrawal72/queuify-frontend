import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, Info, Award, History } from 'lucide-react';
import clsx from 'clsx';
import InfoTooltip from '../../components/common/InfoTooltip';
import UserHistoryModal from '../../components/admin/UserHistoryModal';

const AdminAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyModal, setHistoryModal] = useState({ isOpen: false, userId: null, userName: '' });

    const fetchAppointments = async () => {
        try {
            const res = await api.get('/admin/appointments');
            // Backend returns { appointments: [], totalPages: 1, currentPage: 1 }
            setAppointments(res.data.appointments || []);
        } catch (err) {
            console.error('[AdminAppointments] Error loading:', err);
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        let reason = null;
        if (status === 'cancelled') {
            reason = window.prompt('Please enter the reason for cancellation:');
            if (reason === null) return; // User clicked Cancel in prompt
            if (!reason.trim()) {
                toast.error('Cancellation reason is required');
                return;
            }
        }

        try {
            await api.patch(`/admin/appointments/${id}`, { status, reason });
            toast.success(`Appointment marked as ${status}`);
            fetchAppointments();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    };

    const waitlistedCount = appointments.length > 0 && Array.isArray(appointments)
        ? appointments.filter(app => app.status === 'waitlisted_urgent').length 
        : 0;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Manage Appointments</h2>
                <button 
                    onClick={fetchAppointments}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    Refresh List
                </button>
            </div>

            {waitlistedCount > 0 && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl animate-pulse">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Clock className="h-5 w-5 text-amber-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-amber-700 font-bold flex items-center gap-1.5">
                                Attention: There are {waitlistedCount} urgent appointments requiring manual reassignment for today.
                                <InfoTooltip text="These are appointments from deleted or modified slots that currently have no assigned resource. Please reassign them manually." />
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Token</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Time Slot</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {appointments.map(app => (
                                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-indigo-600">
                                        #{app.token_number || app.id.slice(-6).toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm font-semibold text-gray-900">{app.user_name || 'Guest'}</div>
                                            {app.is_frequent_visitor && (
                                                <div className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm shadow-indigo-200">
                                                    <Award className="h-3 w-3" /> LOYAL
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">{app.user_email}</div>
                                        {app.user_phone && (
                                            <div className="text-xs text-indigo-600 font-medium">{app.user_phone}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {app.start_time ? (
                                            <>
                                                <span className="font-medium text-gray-900">{format(new Date(app.start_time), 'MMM d')}</span><br />
                                                <span className="text-xs text-gray-400">{format(new Date(app.start_time), 'h:mm a')}</span>
                                            </>
                                        ) : app.preferred_date ? (
                                            <>
                                                <span className="font-medium text-amber-700">{format(new Date(app.preferred_date), 'MMM d')}</span><br />
                                                <span className="text-xs text-amber-500 font-bold italic">Waitlisted</span>
                                            </>
                                        ) : (
                                            <span className="text-amber-600 font-bold italic">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={clsx(
                                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                                            app.status === 'confirmed' && "bg-blue-50 text-blue-700 border-blue-100",
                                            app.status === 'completed' && "bg-green-50 text-green-700 border-green-100",
                                            app.status === 'cancelled' && "bg-red-50 text-red-700 border-red-100",
                                            app.status === 'waitlisted_urgent' && "bg-amber-100 text-amber-800 border-amber-200 animate-pulse",
                                            app.status === 'pending' && "bg-gray-100 text-gray-600 border-gray-200"
                                        )}>
                                            {app.status === 'waitlisted_urgent' ? 'URGENT WAITLIST' : app.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-3">
                                            {app.user_id && (
                                                <button
                                                    onClick={() => setHistoryModal({ isOpen: true, userId: app.user_id, userName: app.user_name })}
                                                    className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="View Visit History"
                                                >
                                                    <History className="h-5 w-5" />
                                                </button>
                                            )}
                                            {(app.status === 'confirmed' || app.status === 'waitlisted_urgent' || app.status === 'pending') && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(app.id, 'completed')}
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Complete"
                                                    >
                                                        <CheckCircle className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(app.id, 'cancelled')}
                                                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Cancel"
                                                    >
                                                        <XCircle className="h-5 w-5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <UserHistoryModal 
                isOpen={historyModal.isOpen}
                userId={historyModal.userId}
                userName={historyModal.userName}
                onClose={() => setHistoryModal({ ...historyModal, isOpen: false })}
            />
        </div>
    );
};

export default AdminAppointments;
