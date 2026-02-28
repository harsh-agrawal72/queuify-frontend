import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Loader2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const AppointmentControl = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAppts = async () => {
        try {
            const res = await api.get('/superadmin/appointments');
            setAppointments(res.data);
        } catch (error) {
            console.error("Failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppts();
    }, []);

    const cancelAppointment = async (id) => {
        if (!confirm("Are you sure you want to force cancel this appointment?")) return;
        try {
            await api.delete(`/superadmin/appointments/${id}`);
            toast.success("Appointment cancelled");
            fetchAppts();
        } catch (error) {
            toast.error("Failed to cancel");
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Global Appointments</h2>

            {loading ? <Loader2 className="animate-spin" /> : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">User</th>
                                <th className="p-4">Organization</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {appointments.map(appt => (
                                <tr key={appt.id} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        {format(new Date(appt.created_at), 'PP')}
                                    </td>
                                    <td className="p-4">{appt.user_name}</td>
                                    <td className="p-4 text-gray-500">{appt.org_name}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${appt.status === 'booked' ? 'bg-blue-100 text-blue-700' :
                                                appt.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {appt.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {appt.status === 'booked' && (
                                            <button onClick={() => cancelAppointment(appt.id)} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm">
                                                <XCircle className="h-4 w-4" /> Cancel
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AppointmentControl;
