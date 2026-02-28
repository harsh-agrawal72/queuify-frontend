import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
    Loader2, Plus, Edit2, ShieldOff, ShieldCheck,
    MoreVertical, LogIn, CreditCard, Trash2, Search
} from 'lucide-react';
import toast from 'react-hot-toast';

const OrganizationManager = () => {
    const [orgs, setOrgs] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(null); // org object
    const [search, setSearch] = useState('');

    console.log("Rendering OrganizationManager", { isCreating, isEditing, orgsCount: orgs.length });

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        contact_email: '',
        plan_id: '',
        type: 'Clinic',
        admin_name: '',
        admin_email: ''
    });

    const [confirmModal, setConfirmModal] = useState({ show: false, org: null, type: null });

    const fetchData = async () => {
        try {
            const [orgsRes, plansRes] = await Promise.all([
                api.get('/superadmin/organizations'),
                api.get('/plans')
            ]);
            setOrgs(orgsRes.data);
            setPlans(plansRes.data);
        } catch (error) {
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/superadmin/organizations', formData);
            toast.success("Organization created. Invitation email sent.");
            setIsCreating(false);
            setFormData({
                name: '', slug: '', contact_email: '', plan_id: '',
                type: 'Clinic', admin_name: '', admin_email: ''
            });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create organization");
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/superadmin/organizations/${isEditing.id}`, formData);
            toast.success("Organization updated");
            setIsEditing(null);
            setFormData({ name: '', slug: '', contact_email: '', plan_id: '' });
            fetchData();
        } catch (error) {
            toast.error("Update failed");
        }
    };

    const handleDelete = async (orgId) => {
        try {
            await api.delete(`/superadmin/organizations/${orgId}`);
            toast.success("Organization permanently deleted");
            setConfirmModal({ show: false, org: null, type: null });
            fetchData();
        } catch (error) {
            toast.error("Deletion failed");
        }
    };

    const toggleStatus = async (org) => {
        const action = org.status === 'active' ? 'suspend' : 'activate';
        if (!confirm(`Are you sure you want to ${action} this organization?`)) return;
        try {
            await api.patch(`/superadmin/organizations/${org.id}/${action}`);
            toast.success(`Organization ${action}ed`);
            fetchData();
        } catch (error) {
            toast.error(`Failed to ${action} organization`);
        }
    };


    const handleImpersonate = async (org) => {
        if (!confirm(`Log in as admin for ${org.name}? You will be logged out of SuperAdmin.`)) return;
        try {
            const res = await api.post(`/superadmin/organizations/${org.id}/impersonate`);
            const { tokens, user } = res.data;
            const currentToken = localStorage.getItem('token');
            const currentRefreshToken = localStorage.getItem('refreshToken');
            const currentUser = localStorage.getItem('user');
            if (currentToken) {
                localStorage.setItem('superadminToken', currentToken);
                localStorage.setItem('superadminRefreshToken', currentRefreshToken);
                localStorage.setItem('superadminUser', currentUser);
            }
            localStorage.setItem('token', tokens.access.token);
            if (tokens.refresh) {
                localStorage.setItem('refreshToken', tokens.refresh.token);
            }
            localStorage.setItem('user', JSON.stringify(user));
            window.location.href = '/admin';
        } catch (error) {
            toast.error("Impersonation failed. Ensure org has an admin.");
        }
    };

    const openEdit = (org) => {
        setIsEditing(org);
        setFormData({
            name: org.name,
            slug: org.slug,
            contact_email: org.contact_email,
            plan_id: org.plan_id || '',
            type: org.type || 'Clinic',
            subscription_status: org.subscription_status
        });
    };

    const filteredOrgs = orgs.filter(o => {
        const matchesSearch = (o.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (o.contact_email?.toLowerCase() || '').includes(search.toLowerCase());
        const matchesType = !formData.typeFilter || o.type === formData.typeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Organizations</h2>
                    <p className="text-gray-500 text-sm">Manage all platform tenants.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search organizations..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-64"
                        />
                    </div>
                    <select
                        value={formData.typeFilter || ''}
                        onChange={e => setFormData({ ...formData, typeFilter: e.target.value })}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                    >
                        <option value="">All Types</option>
                        <option value="Clinic">Clinic</option>
                        <option value="Hospital">Hospital</option>
                        <option value="Salon">Salon</option>
                        <option value="Bank">Bank</option>
                        <option value="Government Office">Government Office</option>
                        <option value="Consultancy">Consultancy</option>
                        <option value="Coaching Institute">Coaching Institute</option>
                        <option value="Service Center">Service Center</option>
                        <option value="Other">Other</option>
                    </select>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium"
                    >
                        <Plus className="h-4 w-4" /> Add Org
                    </button>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {(isCreating || isEditing) && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">{isEditing ? 'Edit Organization' : 'New Organization'}</h3>
                            <button onClick={() => { setIsCreating(false); setIsEditing(null); }} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <form onSubmit={isEditing ? handleUpdate : handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input className="w-full border border-gray-200 p-2.5 rounded-xl text-sm outline-none focus:border-emerald-500" placeholder="Acme Corp" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                                <input className="w-full border border-gray-200 p-2.5 rounded-xl text-sm outline-none focus:border-emerald-500" placeholder="acme-corp" required value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                                <input className="w-full border border-gray-200 p-2.5 rounded-xl text-sm outline-none focus:border-emerald-500" type="email" placeholder="org@acme.com" required value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Type</label>
                                <select className="w-full border border-gray-200 p-2.5 rounded-xl text-sm outline-none focus:border-emerald-500 bg-white" required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="Clinic">Clinic</option>
                                    <option value="Hospital">Hospital</option>
                                    <option value="Salon">Salon</option>
                                    <option value="Bank">Bank</option>
                                    <option value="Government Office">Government Office</option>
                                    <option value="Consultancy">Consultancy</option>
                                    <option value="Coaching Institute">Coaching Institute</option>
                                    <option value="Service Center">Service Center</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {!isEditing && (
                                <div className="space-y-4 pt-2 border-t border-gray-100">
                                    <h4 className="font-medium text-gray-900 text-sm">Admin Account</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name</label>
                                        <input className="w-full border border-gray-200 p-2.5 rounded-xl text-sm outline-none focus:border-emerald-500" placeholder="John Doe" required value={formData.admin_name} onChange={e => setFormData({ ...formData, admin_name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                                        <input className="w-full border border-gray-200 p-2.5 rounded-xl text-sm outline-none focus:border-emerald-500" type="email" placeholder="admin@acme.com" required value={formData.admin_email} onChange={e => setFormData({ ...formData, admin_email: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                                <select className="w-full border border-gray-200 p-2.5 rounded-xl text-sm outline-none focus:border-emerald-500 bg-white" value={formData.plan_id} onChange={e => setFormData({ ...formData, plan_id: e.target.value })}>
                                    <option value="">Select a Plan</option>
                                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price_monthly}/mo)</option>)}
                                </select>
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => { setIsCreating(false); setIsEditing(null); }} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700">{isEditing ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                Delete {confirmModal.org.name}?
                            </h3>
                            <p className="text-gray-500 text-sm mb-6">
                                WARNING: This action is irreversible. This will permanently delete the organization and ALL related data (appointments, users, logs).
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmModal({ show: false, org: null, type: null })}
                                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(confirmModal.org.id)}
                                    className="flex-1 py-2.5 text-white rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700"
                                >
                                    Delete Permanently
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {loading ? <div className="flex justify-center p-12"><Loader2 className="animate-spin text-emerald-600" /></div> : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase text-xs font-semibold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Organization</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Plan</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Membership</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredOrgs.map(org => {
                                    const orgPlan = plans.find(p => p.id === org.plan_id);
                                    return (
                                        <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-900">{org.name}</p>
                                                <p className="text-gray-500 text-xs">{org.contact_email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                                                    {org.type || 'Clinic'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {orgPlan ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                        <CreditCard className="h-3 w-3" /> {orgPlan.name}
                                                    </span>
                                                ) : <span className="text-gray-400 text-xs italic">No Plan</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${org.status === 'active'
                                                    ? 'bg-green-50 text-green-700 border-green-100'
                                                    : 'bg-red-50 text-red-700 border-red-100'
                                                    }`}>
                                                    {org.status === 'active' ? 'Active' : org.status.charAt(0).toUpperCase() + org.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                <span className="text-xs">Joined {new Date(org.created_at).toLocaleDateString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleImpersonate(org)} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Impersonate Admin"><LogIn className="h-4 w-4" /></button>
                                                    <button onClick={() => openEdit(org)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Details"><Edit2 className="h-4 w-4" /></button>
                                                    <button
                                                        onClick={() => toggleStatus(org)}
                                                        className={`p-2 rounded-lg transition-colors ${org.status === 'active' ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}
                                                        title={org.status === 'active' ? "Suspend" : "Activate"}
                                                    >
                                                        {org.status === 'active' ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                                                    </button>
                                                    <div className="h-4 w-px bg-gray-200 mx-1" />
                                                    <button
                                                        onClick={() => setConfirmModal({ show: true, org, type: 'delete' })}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Organization"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {filteredOrgs.length === 0 && <div className="text-center py-12 text-gray-500">No organizations found.</div>}
                </div>
            )}
        </div>
    );
};

export default OrganizationManager;
