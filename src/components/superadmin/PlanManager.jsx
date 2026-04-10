import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
    Loader2, Plus, Edit2, Trash2, Check, X, Shield, 
    User, Briefcase, Sparkles, Zap, Award, Crown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const PlanManager = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('admin'); // 'admin' or 'user'
    const [isEditing, setIsEditing] = useState(null); // plan object or 'new'

    const [formData, setFormData] = useState({
        name: '',
        price_monthly: 0,
        price_yearly: 0,
        commission_rate: 0,
        features: {},
        is_active: true,
        target_role: 'admin'
    });

    const fetchPlans = async () => {
        setLoading(true);
        try {
            // Backend now supports includeInactive for superadmins automatically
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
                is_active: plan.is_active,
                target_role: plan.target_role || 'admin'
            });
        } else {
            setIsEditing('new');
            setFormData({
                name: '',
                price_monthly: 0,
                price_yearly: 0,
                commission_rate: 0,
                features: activeTab === 'admin' ? {
                    max_resources: 1,
                    max_admins: 1,
                    analytics: 'locked'
                } : {
                    max_active_appointments: 2,
                    notifications: ['email'],
                    priority: false
                },
                is_active: true,
                target_role: activeTab
            });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing === 'new') {
                await api.post('/plans', formData);
                toast.success("Plan created successfully");
            } else {
                await api.patch(`/plans/${isEditing.id}`, formData);
                toast.success("Plan updated successfully");
            }
            setIsEditing(null);
            fetchPlans();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save plan");
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

    const filteredPlans = plans.filter(p => p.target_role === activeTab);

    const getPlanIcon = (name, role) => {
        if (role === 'admin') {
            if (name.toLowerCase().includes('enterprise')) return <Crown className="h-6 w-6 text-amber-500" />;
            if (name.toLowerCase().includes('pro')) return <Award className="h-6 w-6 text-indigo-500" />;
            return <Briefcase className="h-6 w-6 text-slate-500" />;
        } else {
            if (name.toLowerCase().includes('premium')) return <Sparkles className="h-6 w-6 text-purple-500" />;
            if (name.toLowerCase().includes('standard')) return <Zap className="h-6 w-6 text-emerald-500" />;
            return <User className="h-6 w-6 text-slate-500" />;
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">SaaS Subscription Plans</h2>
                    <p className="text-slate-500 text-sm font-medium">Control pricing, features and role-specific access tiers.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-black transition-all shadow-lg shadow-indigo-100 font-bold text-sm uppercase tracking-widest active:scale-95"
                >
                    <Plus className="h-5 w-5" /> Create New Plan
                </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex p-1 bg-slate-200/50 backdrop-blur rounded-2xl w-fit border border-slate-200">
                <button
                    onClick={() => setActiveTab('admin')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${
                        activeTab === 'admin' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Briefcase className="h-4 w-4" /> Business Plans
                </button>
                <button
                    onClick={() => setActiveTab('user')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${
                        activeTab === 'user' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <User className="h-4 w-4" /> Consumer Plans
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <Loader2 className="animate-spin text-indigo-600 h-10 w-10" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Tiers...</p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {filteredPlans.map(plan => (
                            <div key={plan.id} className={`group bg-white rounded-[2rem] border p-8 flex flex-col transition-all relative ${!plan.is_active ? 'opacity-75 border-slate-100 bg-slate-50' : 'border-slate-200 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:shadow-indigo-100/50 hover:-translate-y-1'}`}>
                                {!plan.is_active && (
                                    <div className="absolute top-4 right-4 px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        Inactive
                                    </div>
                                )}
                                
                                <div className="mb-8">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${activeTab === 'admin' ? 'bg-indigo-50' : 'bg-emerald-50'}`}>
                                        {getPlanIcon(plan.name, plan.target_role)}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{plan.name}</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        {plan.target_role === 'admin' ? 'Organization Access' : 'Individual User'}
                                    </p>
                                </div>

                                <div className="mb-10 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="flex items-baseline gap-1 mb-2">
                                        <span className="text-4xl font-extrabold text-slate-900">₹{parseFloat(plan.price_monthly).toLocaleString()}</span>
                                        <span className="text-slate-500 font-bold text-sm tracking-tight">/mo</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <span>Annual: ₹{parseFloat(plan.price_yearly).toLocaleString()}</span>
                                        <span className="text-indigo-600">{plan.commission_rate}% Fee</span>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4 mb-8">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Enabled Features</p>
                                    <ul className="space-y-3">
                                        {Object.entries(plan.features).map(([key, val]) => (
                                            <li key={key} className="flex items-start gap-3">
                                                <div className="mt-1 p-0.5 bg-emerald-100 rounded-full">
                                                    <Check className="h-3 w-3 text-emerald-600 stroke-[3px]" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700 capitalize">{key.replace(/_/g, ' ')}</span>
                                                    <span className="text-[10px] font-black text-indigo-500 uppercase">{String(val)}</span>
                                                </div>
                                            </li>
                                        ))}
                                        {Object.keys(plan.features).length === 0 && <li className="text-slate-400 text-xs italic">No specific features defined</li>}
                                    </ul>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => openModal(plan)}
                                        className="flex-1 py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Edit2 className="h-4 w-4" /> Edit Tier
                                    </button>
                                    <button
                                        onClick={() => handleDelete(plan.id)}
                                        className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center active:scale-95"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {filteredPlans.length === 0 && (
                            <div className="col-span-full py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-6">
                                <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
                                    <Shield className="h-8 w-8 text-slate-300" />
                                </div>
                                <h4 className="text-xl font-black text-slate-800 tracking-tight mb-2">No {activeTab} plans found</h4>
                                <p className="text-slate-500 text-sm font-medium mb-6">Start by creating the first subscription tier for this audience.</p>
                                <button
                                    onClick={() => openModal()}
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-black transition-all"
                                >
                                    Create First Plan
                                </button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isEditing && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6 overflow-y-auto">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden my-auto"
                        >
                            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{isEditing === 'new' ? 'Create Dynamic Tier' : 'Modify Access Tier'}</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">SaaS Infrastructure Configuration</p>
                                </div>
                                <button onClick={() => setIsEditing(null)} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plan Identity</label>
                                        <input className="w-full border border-slate-200 p-4 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="e.g. Diamond Business" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Audience</label>
                                        <select 
                                            className="w-full border border-slate-200 p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            value={formData.target_role}
                                            onChange={e => setFormData({ ...formData, target_role: e.target.value })}
                                        >
                                            <option value="admin">Business / Organization</option>
                                            <option value="user">Individual Consumer</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monthly (₹)</label>
                                        <input type="number" step="1" className="w-full border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none" required value={formData.price_monthly} onChange={e => setFormData({ ...formData, price_monthly: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Annual (₹)</label>
                                        <input type="number" step="1" className="w-full border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none" required value={formData.price_yearly} onChange={e => setFormData({ ...formData, price_yearly: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5 col-span-2 md:col-span-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Platform Fee (%)</label>
                                        <input type="number" step="0.1" className="w-full border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none" required value={formData.commission_rate} onChange={e => setFormData({ ...formData, commission_rate: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center mb-1 px-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capabilities Matrix (JSON)</label>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const base = formData.target_role === 'admin' 
                                                    ? { max_resources: 5, max_admins: 2, analytics: 'basic' }
                                                    : { max_active_appointments: 5, notifications: ['email', 'push'], priority: true };
                                                setFormData({ ...formData, features: base });
                                            }}
                                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-black transition-all"
                                        >
                                            Load Template
                                        </button>
                                    </div>
                                    <textarea
                                        className="w-full border border-slate-200 p-6 rounded-3xl text-xs font-mono bg-slate-50 h-32 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        placeholder='{"max_users": 10, "support": "priority"}'
                                        value={JSON.stringify(formData.features, null, 2)}
                                        onChange={e => {
                                            try {
                                                setFormData({ ...formData, features: JSON.parse(e.target.value) });
                                            } catch (err) {
                                                // Temporarily store the string value for typing
                                                const val = e.target.value;
                                            }
                                        }}
                                    />
                                    <p className="text-[10px] text-slate-400 mt-2 italic px-1">Defines plan limits and permissions for frontend enforcement.</p>
                                </div>

                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${formData.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                            <Shield className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Status</p>
                                            <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Visibility for new signups</p>
                                        </div>
                                    </div>
                                    <div 
                                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                        className={`w-14 h-8 rounded-full cursor-pointer transition-all relative ${formData.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${formData.is_active ? 'left-7' : 'left-1'}`} />
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black shadow-xl shadow-indigo-100 transition-all mt-4 active:scale-95">
                                    {isEditing === 'new' ? 'Initialize Dynamic Tier' : 'Commit Configuration'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PlanManager;
