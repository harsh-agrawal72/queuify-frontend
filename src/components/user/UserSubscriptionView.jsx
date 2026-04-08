import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Check, Zap, Star, ShieldCheck, Crown, BellRing, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

const UserSubscriptionView = () => {
    const { user, refreshUser } = useAuth();
    const { t } = useTranslation();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await apiService.getPlans({ target_role: 'user' });
            setPlans(response.data);
        } catch (error) {
            console.error('Failed to fetch plans:', error);
            toast.error('Failed to load membership plans');
        } finally {
            setLoading(false);
        }
    };

    const handleSwitchPlan = async (planId, planName) => {
        if (planName === 'Free' && !window.confirm('Are you sure you want to switch to the Free plan? Some features may be restricted.')) {
            return;
        }

        setProcessingId(planId);
        try {
            await apiService.assignUserPlan(planId);
            toast.success(`Successfully switched to ${planName} plan!`);
            await refreshUser(); // Refresh auth context to get new plan info
        } catch (error) {
            console.error('Plan switch failed:', error);
            toast.error(error.response?.data?.message || 'Failed to switch plan');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading exclusive plans...</p>
            </div>
        );
    }

    const getPlanIcon = (name) => {
        switch (name.toLowerCase()) {
            case 'premium': return <Crown className="h-6 w-6" />;
            case 'standard': return <Star className="h-6 w-6" />;
            default: return <Zap className="h-6 w-6" />;
        }
    };

    const getPlanColor = (name) => {
        switch (name.toLowerCase()) {
            case 'premium': return 'from-amber-400 to-orange-600';
            case 'standard': return 'from-indigo-500 to-purple-600';
            default: return 'from-gray-600 to-gray-800';
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
                    Upgrade Your Experience
                </h2>
                <p className="text-gray-500 max-w-2xl mx-auto font-medium">
                    Choose a membership level that fits your needs. Get priority access, enhanced notifications, and more booking flexibility.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                {plans.map((plan) => {
                    const isCurrent = user?.plan_id === plan.id;
                    const isPremium = plan.name.toLowerCase() === 'premium';
                    const isStandard = plan.name.toLowerCase() === 'standard';
                    const features = plan.features || {};

                    return (
                        <div 
                            key={plan.id}
                            className={clsx(
                                "relative flex flex-col p-8 rounded-[2.5rem] transition-all duration-500",
                                isPremium ? "bg-gray-900 text-white shadow-2xl scale-105 z-10 border-4 border-amber-400/30" : "bg-white text-gray-900 border border-gray-100 shadow-xl",
                                !isCurrent && "hover:-translate-y-2"
                            )}
                        >
                            {isPremium && (
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full shadow-lg">
                                    Best Value
                                </div>
                            )}

                            <div className="mb-8">
                                <div className={clsx(
                                    "inline-flex p-3 rounded-2xl mb-4",
                                    isPremium ? "bg-amber-400 text-black" : isStandard ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
                                )}>
                                    {getPlanIcon(plan.name)}
                                </div>
                                <h3 className="text-2xl font-black mb-1">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black">₹{plan.price_monthly}</span>
                                    <span className={clsx("text-sm opacity-60 font-bold", isPremium ? "text-gray-300" : "text-gray-500")}>/month</span>
                                </div>
                            </div>

                            <ul className="flex-grow space-y-4 mb-8">
                                <li className="flex items-center gap-3">
                                    <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-500">
                                        <Check className="h-4 w-4 stroke-[3px]" />
                                    </div>
                                    <span className="text-sm font-bold">
                                        {features.max_active_appointments > 100 ? 'Unlimited' : features.max_active_appointments} Active Bookings
                                    </span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-500">
                                        <Check className="h-4 w-4 stroke-[3px]" />
                                    </div>
                                    <span className="text-sm font-bold capitalize">
                                        {features.notifications?.join(' & ')} Notifications
                                    </span>
                                </li>
                                {features.priority && (
                                    <li className="flex items-center gap-3">
                                        <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-500">
                                            <ShieldCheck className="h-4 w-4 stroke-[3px]" />
                                        </div>
                                        <span className="text-sm font-bold italic text-indigo-400">VIP Queue Priority</span>
                                    </li>
                                )}
                                {features.refund_protection > 0 && (
                                    <li className="flex items-center gap-3">
                                        <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-500">
                                            <ShieldCheck className="h-4 w-4 stroke-[3px]" />
                                        </div>
                                        <span className="text-sm font-bold">{features.refund_protection}% Late Refund Protection</span>
                                    </li>
                                )}
                            </ul>

                            <button
                                onClick={() => !isCurrent && handleSwitchPlan(plan.id, plan.name)}
                                disabled={isCurrent || processingId === plan.id}
                                className={clsx(
                                    "w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2",
                                    isCurrent ? "bg-emerald-500/10 text-emerald-500 cursor-default" : 
                                    isPremium ? "bg-amber-400 text-black hover:bg-amber-300 active:scale-95" :
                                    "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-100"
                                )}
                            >
                                {processingId === plan.id ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : isCurrent ? (
                                    <>
                                        <Check className="h-5 w-5" /> Current Plan
                                    </>
                                ) : (
                                    plan.name === 'Free' ? 'Downgrade' : 'Upgrade Now'
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Feature Comparison Section */}
            <div className="bg-gray-50 rounded-[3rem] p-10 border border-gray-100">
                <h4 className="text-xl font-black mb-8 text-center text-gray-900 uppercase tracking-widest opacity-40">Why Go Global?</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="flex flex-col items-center text-center">
                        <div className="p-4 bg-white rounded-3xl text-indigo-600 mb-4 shadow-sm">
                            <Crown className="h-6 w-6" />
                        </div>
                        <h5 className="font-black text-gray-900 mb-2">Priority Tokens</h5>
                        <p className="text-xs text-gray-500 font-medium">Get placed ahead of the queue with our VIP token system.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="p-4 bg-white rounded-3xl text-amber-500 mb-4 shadow-sm">
                            <BellRing className="h-6 w-6" />
                        </div>
                        <h5 className="font-black text-gray-900 mb-2">All notifications</h5>
                        <p className="text-xs text-gray-500 font-medium">Never miss a turn with multi-channel alerts (SMS, push).</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="p-4 bg-white rounded-3xl text-purple-600 mb-4 shadow-sm">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <h5 className="font-black text-gray-900 mb-2">Refund Shield</h5>
                        <p className="text-xs text-gray-500 font-medium">Get 100% money back even if you cancel 5 mins before.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="p-4 bg-white rounded-3xl text-rose-500 mb-4 shadow-sm">
                            <MessageSquare className="h-6 w-6" />
                        </div>
                        <h5 className="font-black text-gray-900 mb-2">Direct Chat</h5>
                        <p className="text-xs text-gray-500 font-medium">Premium users get a direct chat line to admin support.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserSubscriptionView;
