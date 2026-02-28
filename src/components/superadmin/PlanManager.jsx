import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
    Loader2, Plus, Edit2, Trash2, Check, X, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

const PlanManager = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(null); // plan object or 'new'

    const [formData, setFormData] = useState({
        name: '',
        price_monthly: 0,
        price_yearly: 0,
        commission_rate: 0,
        features: {},
        is_active: true
    });

    const fetchPlans = async () => {
        try {
            const res = await api.get('/plans');
            setPlans(res.data);
        } catch (error) {
            toast.error("Failed to load plans");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const openModal = (plan = null) => {
        if (plan) {
            setIsEditing(plan);
            setFormData({
                name: plan.name,
                price_monthly: plan.price_monthly,
                price_yearly: plan.price_yearly,
                commission_rate: plan.commission_rate,
                features: plan.features || {},
                is_active: plan.is_active
            });
        } else {
            setIsEditing('new');
            setFormData({
                name: '',
                price_monthly: 0,
                price_yearly: 0,
                commission_rate: 0,
                features: {},
                is_active: true
            });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing === 'new') {
                await api.post('/plans', formData);
                toast.success("Plan created");
            } else {
                await api.patch(`/plans/${isEditing.id}`, formData);
                toast.success("Plan updated");
            }
            setIsEditing(null);
            fetchPlans();
        } catch (error) {
            toast.error("Failed to save plan");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this plan? This action cannot be undone if organizations are using it.")) return;
        try {
            await api.delete(`/plans/${id}`);
            toast.success("Plan deleted");
            fetchPlans();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete plan");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Subscription Plans</h2>
                    <p className="text-gray-500 text-sm">Manage SaaS pricing and features.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                    <Plus className="h-4 w-4" /> Create Plan
                </button>
            </div>

            {loading ? <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map(plan => (
                        <div key={plan.id} className={`bg-white rounded-2xl border p-6 flex flex-col transition-all ${!plan.is_active ? 'opacity-75 border-gray-100 bg-gray-50' : 'border-gray-200 shadow-sm hover:shadow-md'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                {plan.is_active ? (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Active</span>
                                ) : (
                                    <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold">Inactive</span>
                                )}
                            </div>

                            <div className="mb-6 space-y-2">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-gray-900">${plan.price_monthly}</span>
                                    <span className="text-gray-500 text-sm">/month</span>
                                </div>
                                <div className="text-sm text-gray-500">
                                    or <strong>${plan.price_yearly}</strong>/year
                                </div>
                                <div className="text-sm text-indigo-600 font-medium">
                                    {plan.commission_rate}% Commission
                                </div>
                            </div>

                            <div className="flex-1 space-y-3 mb-6">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Features</p>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    {Object.entries(plan.features).map(([key, val]) => (
                                        <li key={key} className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-green-500" />
                                            <span>{key.replace(/_/g, ' ')}: <strong>{val}</strong></span>
                                        </li>
                                    ))}
                                    {Object.keys(plan.features).length === 0 && <li className="text-gray-400 italic">No features defined</li>}
                                </ul>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex gap-2">
                                <button
                                    onClick={() => openModal(plan)}
                                    className="flex-1 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit2 className="h-4 w-4" /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(plan.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-semibold text-gray-900">{isEditing === 'new' ? 'New Subscription Plan' : 'Edit Plan'}</h3>
                            <button onClick={() => setIsEditing(null)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                                <input className="w-full border border-gray-200 p-2.5 rounded-xl text-sm" placeholder="Pro Plan" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price ($)</label>
                                    <input type="number" step="0.01" className="w-full border border-gray-200 p-2.5 rounded-xl text-sm" required value={formData.price_monthly} onChange={e => setFormData({ ...formData, price_monthly: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Yearly Price ($)</label>
                                    <input type="number" step="0.01" className="w-full border border-gray-200 p-2.5 rounded-xl text-sm" required value={formData.price_yearly} onChange={e => setFormData({ ...formData, price_yearly: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                                <input type="number" step="0.1" className="w-full border border-gray-200 p-2.5 rounded-xl text-sm" required value={formData.commission_rate} onChange={e => setFormData({ ...formData, commission_rate: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4 text-indigo-600 rounded" />
                                    <span className="text-sm text-gray-600">Active (Visible to new orgs)</span>
                                </div>
                            </div>

                            {/* Feature JSON Editor (Simple Textarea for now) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Features (JSON)</label>
                                <textarea
                                    className="w-full border border-gray-200 p-2.5 rounded-xl text-sm font-mono bg-gray-50 h-24"
                                    placeholder='{"max_users": 10, "support": "priority"}'
                                    value={JSON.stringify(formData.features, null, 2)}
                                    onChange={e => {
                                        try {
                                            setFormData({ ...formData, features: JSON.parse(e.target.value) });
                                        } catch (err) {
                                            // Handle invalid JSON gracefully or just let user finish typing
                                        }
                                    }}
                                />
                                <p className="text-xs text-gray-400 mt-1">Enter valid JSON object.</p>
                            </div>

                            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all mt-2">
                                {isEditing === 'new' ? 'Create Plan' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanManager;
