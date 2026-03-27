import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Loader2, Calendar, Search, Filter, Ban } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const GlobalAppointments = () => {
    const [viewMode, setViewMode] = useState('aggregated'); // 'aggregated' | 'detailed'
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [stats, setStats] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchAggregated = async () => {
        setLoading(true);
        try {
            const params = search ? { search } : { mode: 'aggregated' };
            const res = await api.get('/superadmin/appointments', { params });
            if (res.data.isSearch) {
                setAppointments(res.data.results);
                setViewMode('search');
            } else {
                setStats(res.data);
                setViewMode('aggregated');
            }
        } catch (error) {
            toast.error("Failed to load booking stats");
        } finally {
            setLoading(false);
        }
    };

    const fetchOrgBookings = async (orgId) => {
        setLoading(true);
        try {
            const params = { mode: 'detailed', orgId, page, limit: 10 };
            const res = await api.get('/superadmin/appointments', { params });
            setAppointments(res.data.data);
            setTotalPages(Math.ceil(res.data.meta.total / 10)); // Assuming limits passed back or calc here
        } catch (error) {
            toast.error("Failed to load details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (viewMode === 'detailed' && selectedOrg) {
            fetchOrgBookings(selectedOrg.id);
        } else {
            // Aggregated or Search mode
            fetchAggregated();
        }
    }, [viewMode, selectedOrg, page, search]);

    const handleOrgClick = (org) => {
        setSelectedOrg(org);
        setViewMode('detailed');
        setPage(1);
    };

    const handleCancel = async (id) => {
        if (!confirm("Force cancel this appointment? Client will be notified.")) return;
        try {
            await api.delete(`/superadmin/appointments/${id}`);
            toast.success("Appointment cancelled");
            fetchOrgBookings(selectedOrg.id); // Refresh
        } catch (error) {
            toast.error("Cancellation failed");
        }
    };

    const filteredStats = stats.filter(s =>
        s.org_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {viewMode === 'aggregated' ? 'Global Bookings' : `${selectedOrg?.name} Bookings`}
                    </h2>
                    <p className="text-gray-500 text-sm">
                        {viewMode === 'aggregated'
                            ? 'Monitor booking activity across all organizations.'
                            : 'Manage appointments for this specific organization.'}
                    </p>
                </div>
                {viewMode === 'detailed' && (
                    <button
                        onClick={() => { setViewMode('aggregated'); setSelectedOrg(null); }}
                        className="text-sm text-gray-600 hover:text-gray-900 underline"
                    >
                        Back to Overview
                    </button>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none w-full focus:ring-2 focus:ring-indigo-500"
                        placeholder="Search Token, Phone, Name, or Org..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                {search && (
                    <button 
                        onClick={() => setSearch('')}
                        className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Clear Search
                    </button>
                )}
            </div>

            {loading ? <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div> : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {viewMode === 'aggregated' ? (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Organization</th>
                                    <th className="px-6 py-4 text-center">Total Bookings</th>
                                    <th className="px-6 py-4 text-center">Today</th>
                                    <th className="px-6 py-4 text-center">Waitlist</th>
                                    <th className="px-6 py-4 text-center">Cancelled</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredStats.map(stat => (
                                    <tr
                                        key={stat.org_id}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => handleOrgClick({ id: stat.org_id, name: stat.org_name })}
                                    >
                                        <td className="px-6 py-4 font-medium text-gray-900">{stat.org_name}</td>
                                        <td className="px-6 py-4 text-center font-semibold">{stat.total_bookings}</td>
                                        <td className="px-6 py-4 text-center text-emerald-600">+{stat.today_bookings}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="text-orange-600 font-bold">{stat.pending}</span>
                                                {stat.urgent > 0 && <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-black">+{stat.urgent}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-red-500">{stat.cancelled}</td>
                                        <td className="px-6 py-4 text-right text-indigo-600 text-xs font-bold">View Details &rarr;</td>
                                    </tr>
                                ))}
                                {filteredStats.length === 0 && (
                                    <tr><td colSpan="7" className="p-8 text-center text-gray-500">No organizations found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    ) : viewMode === 'search' ? (
                        <div>
                             <div className="bg-indigo-50 p-3 px-6 text-xs font-bold text-indigo-700 flex justify-between items-center">
                                <span>Search Results ({appointments.length})</span>
                                <button onClick={() => { setSearch(''); fetchAggregated(); }} className="underline hover:no-underline">Reset Search</button>
                             </div>
                             <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Org</th>
                                        <th className="px-6 py-4">User / Patient</th>
                                        <th className="px-6 py-4">Professional</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {appointments.map(apt => (
                                        <tr key={apt.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-bold text-gray-700">{apt.org_name}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{apt.user_name || apt.customer_name || 'Guest'}</div>
                                                <div className="text-[10px] text-gray-400 font-mono">ID: {apt.id.slice(0, 8)} | Token: {apt.token_number}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 font-medium italic">{apt.resource_name || 'Unassigned'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                                                    apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                    apt.status === 'waitlisted_urgent' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {apt.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {apt.created_at && format(parseISO(apt.created_at), 'MMM d, yyyy')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                             </table>
                        </div>
                    ) : (
                        <div>
                             <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">ID</th>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Date & Time</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {appointments.map(apt => (
                                        <tr key={apt.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-mono text-xs text-gray-400">{apt.id.slice(0, 8)}...</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{apt.user_name || apt.customer_name || 'Guest'}</td>
                                            <td className="px-6 py-4">
                                                {apt.start_time ? format(parseISO(apt.start_time), 'MMM d, h:mm a') : 'Not Scheduled'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                    apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                    apt.status === 'waitlisted_urgent' ? 'bg-red-100 text-red-700' :
                                                    apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {apt.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {apt.status === 'confirmed' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleCancel(apt.id); }}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                        title="Force Cancel"
                                                    >
                                                        <Ban className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {appointments.length === 0 && (
                                        <tr><td colSpan="5" className="p-8 text-center text-gray-500">No bookings found for this organization.</td></tr>
                                    )}
                                </tbody>
                            </table>
                            {/* Pagination for Detailed View */}
                            {totalPages > 1 && (
                                <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50">
                                    <button
                                        disabled={page === 1}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                                    </span>
                                    <button
                                        disabled={page === totalPages}
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalAppointments;
