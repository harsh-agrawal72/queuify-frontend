import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
    MoreVertical, ShieldAlert, CheckCircle,
    XCircle, Search, Filter, RefreshCcw, Power, Trash2, ShieldCheck,
    Users, Shield, Send, Edit
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const AdminManager = () => {
    const [admins, setAdmins] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, suspended: 0 });
    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [orgFilter, setOrgFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [activeRow, setActiveRow] = useState(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteForm, setInviteForm] = useState({ name: '', email: '', orgId: '' });
    const [inviting, setInviting] = useState(false);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 10,
                search: search || undefined,
                status: statusFilter || undefined,
                orgId: orgFilter || undefined
            };

            const res = await api.get('/superadmin/admins', { params });
            setAdmins(res.data.data || []);
            setStats(res.data.stats || { total: 0, active: 0, pending: 0, suspended: 0 });
            setTotalPages(res.data.meta?.totalPages || 1);
        } catch (error) {
            toast.error("Failed to load admins");
        } finally {
            setLoading(false);
        }
    };

    const fetchOrgs = async () => {
        try {
            const res = await api.get('/superadmin/organizations');
            setOrgs(res.data || []);
        } catch (error) {
            console.error("Failed to load organizations");
        }
    };

    useEffect(() => {
        fetchOrgs();
    }, []);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchAdmins();
        }, 300);
        return () => clearTimeout(debounce);
    }, [page, search, statusFilter, orgFilter]);

    const handleAction = async (adminId, action) => {
        try {
            if (action === 'delete') {
                if (!window.confirm("Are you sure you want to delete this admin? This action is permanent.")) return;
                await api.delete(`/superadmin/admins/${adminId}`);
                toast.success("Admin deleted successfully");
            } else if (action === 'resend-invite') {
                await api.post(`/superadmin/admins/${adminId}/resend-invite`);
                toast.success("Invitation resent");
            } else {
                // suspend, unsuspend, activate
                await api.patch(`/superadmin/admins/${adminId}/status`, { status: action });
                toast.success(`Admin ${action}d successfully`);
            }
            fetchAdmins();
        } catch (error) {
            toast.error(`Action failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setActiveRow(null);
        }
    };

    const handleInviteAdmin = async (e) => {
        e.preventDefault();
        setInviting(true);
        try {
            await api.post('/superadmin/admins/invite', inviteForm);
            toast.success("Admin invited successfully");
            setIsInviteModalOpen(false);
            setInviteForm({ name: '', email: '', orgId: '' });
            fetchAdmins();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to invite admin");
        } finally {
            setInviting(false);
        }
    };


    const getStatusStyles = (status) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-700 border-green-200';
            case 'Invited': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Suspended': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Admin Management</h2>
                    <p className="text-gray-500 text-sm">Monitor and control organization administrators across the platform.</p>
                </div>
                <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
                >
                    <Users className="h-4 w-4" /> Invite Admin
                </button>
            </div>

            {/* Analytics Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Admins', value: stats.total, icon: Users, color: 'indigo' },
                    { label: 'Active Admins', value: stats.active, icon: CheckCircle, color: 'emerald' },
                    { label: 'Suspended', value: stats.suspended, icon: ShieldAlert, color: 'rose' }
                ].map((item, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={item.label}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
                    >
                        <div className={`p-3 rounded-xl bg-${item.color}-50 text-${item.color}-600`}>
                            <item.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{item.label}</p>
                            <h3 className="text-2xl font-bold text-gray-900">{item.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Controls Section */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition-all text-sm"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="text-gray-400 h-4 w-4" />
                    <select
                        className="bg-gray-50 border border-transparent focus:border-indigo-500 rounded-xl px-3 py-2 text-sm outline-none cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Invited">Invited</option>
                        <option value="Suspended">Suspended</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <Shield className="text-gray-400 h-4 w-4" />
                    <select
                        className="bg-gray-50 border border-transparent focus:border-indigo-500 rounded-xl px-3 py-2 text-sm outline-none cursor-pointer max-w-[200px]"
                        value={orgFilter}
                        onChange={(e) => setOrgFilter(e.target.value)}
                    >
                        <option value="">All Organizations</option>
                        {orgs.map(org => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={fetchAdmins}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Refresh List"
                >
                    <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Admin User</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Organization</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Account Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Last Login</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-8">
                                            <div className="h-10 bg-gray-50 rounded-xl w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : admins.length > 0 ? (
                                admins.map((admin, idx) => (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={admin.id}
                                        className="group hover:bg-gray-50/80 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                    {getInitials(admin.name)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{admin.name}</p>
                                                    <p className="text-xs text-gray-500">{admin.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-700">{admin.org_name || 'System Managed'}</span>
                                                <span className="text-[10px] text-gray-400 uppercase tracking-tight">{admin.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusStyles(admin.status)}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full mr-1.5 bg-current`}></span>
                                                {admin.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-600">
                                                    {admin.last_login_at
                                                        ? formatDistanceToNow(new Date(admin.last_login_at), { addSuffix: true })
                                                        : 'Not yet logged in'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <button
                                                onClick={() => setActiveRow(activeRow === admin.id ? null : admin.id)}
                                                className="p-2 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl text-gray-400 hover:text-gray-900 transition-all shadow-none hover:shadow-sm"
                                            >
                                                <MoreVertical className="h-5 w-5" />
                                            </button>

                                            <AnimatePresence>
                                                {activeRow === admin.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                        className="absolute right-6 top-14 w-48 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 z-50 py-2 border border-gray-100 overflow-hidden"
                                                    >
                                                        {(admin.status === 'Invited' || admin.status === 'Pending') && (
                                                            <button
                                                                onClick={() => handleAction(admin.id, 'activate')}
                                                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full transition-colors"
                                                            >
                                                                <CheckCircle className="h-4 w-4 text-green-500" /> Activate Account
                                                            </button>
                                                        )}
                                                        {admin.status === 'Invited' && (
                                                            <button
                                                                onClick={() => handleAction(admin.id, 'resend-invite')}
                                                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full transition-colors"
                                                            >
                                                                <Send className="h-4 w-4 text-amber-500" /> Resend Invitation
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => toast.success("Edit feature coming soon")}
                                                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full transition-colors"
                                                        >
                                                            <Edit className="h-4 w-4 text-blue-500" /> Edit Details
                                                        </button>
                                                        {admin.is_suspended ? (
                                                            <button
                                                                onClick={() => handleAction(admin.id, 'unsuspend')}
                                                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full transition-colors"
                                                            >
                                                                <ShieldCheck className="h-4 w-4 text-green-500" /> Unsuspend Admin
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleAction(admin.id, 'suspend')}
                                                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full transition-colors"
                                                            >
                                                                <XCircle className="h-4 w-4 text-red-500" /> Suspend Account
                                                            </button>
                                                        )}
                                                        <hr className="my-1 border-gray-50" />
                                                        <button
                                                            onClick={() => handleAction(admin.id, 'delete')}
                                                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full font-medium transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" /> {admin.status === 'Invited' ? 'Cancel Invitation' : 'Delete Admin'}
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 rounded-full bg-gray-50 text-gray-300">
                                                <Search className="h-8 w-8" />
                                            </div>
                                            <p className="text-gray-500 font-medium">No administrators found</p>
                                            <button
                                                onClick={() => { setSearch(''); setStatusFilter(''); setOrgFilter(''); }}
                                                className="text-indigo-600 text-sm hover:underline"
                                            >
                                                Clear all filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 flex items-center justify-between bg-gray-50/50 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">
                        Showing page <span className="text-gray-900">{page}</span> of <span className="text-gray-900">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg hover:border-gray-300 disabled:opacity-50 transition-all text-gray-700"
                        >
                            Previous
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg hover:border-gray-300 disabled:opacity-50 transition-all text-gray-700"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Invite Admin Modal */}
            <AnimatePresence>
                {isInviteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-900">Invite New Admin</h3>
                                <button
                                    onClick={() => setIsInviteModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <XCircle className="h-6 w-6 text-gray-400" />
                                </button>
                            </div>
                            <form onSubmit={handleInviteAdmin} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="Enter admin name"
                                        value={inviteForm.name}
                                        onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="admin@example.com"
                                        value={inviteForm.email}
                                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Organization</label>
                                    <select
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                                        value={inviteForm.orgId}
                                        onChange={(e) => setInviteForm({ ...inviteForm, orgId: e.target.value })}
                                    >
                                        <option value="">Select Organization</option>
                                        {orgs.map(org => (
                                            <option key={org.id} value={org.id}>{org.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsInviteModalOpen(false)}
                                        className="flex-1 py-3 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={inviting}
                                        className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-200 disabled:opacity-50"
                                    >
                                        {inviting ? 'Inviting...' : 'Send Invitation'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminManager;
