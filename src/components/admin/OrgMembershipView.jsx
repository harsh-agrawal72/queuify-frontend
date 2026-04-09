import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Check, ArrowRight, Loader2, Sparkles, Shield, Zap, Crown, Star, Leaf, 
    TrendingUp, Globe, LayoutDashboard, Clock, AlertCircle
} from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const PlanCard = ({ plan, isCurrent, onUpgrade, processingId, t }) => {
    const isPremium = plan.name === 'Enterprise';
    const isStandard = plan.name === 'Professional';
    const isProcessing = processingId === plan.id;

    // Features can be a JSON string or object from DB
    const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || {});
    
    // Map DB features to readable strings for the cards
    const featureList = [
        t('setup.resources_count', { count: features.max_resources || 1 }),
        t('setup.admins_count', { count: features.max_admins || 1 }),
        features.analytics === 'advanced' ? t('setup.advance_analytics') : t('setup.basic_analytics'),
        features.has_basic_features ? t('setup.basic_features') : null,
        features.has_premium_features ? t('setup.premium_features') : null,
        features.has_customer_insight ? t('setup.customer_insight') : null,
        features.has_top_position ? t('setup.top_position') : null,
        features.has_one_on_one_support ? t('setup.one_on_one_support') : null,
        t('setup.availability_24_7')
    ].filter(Boolean);

    const getIcon = () => {
        if (plan.name === 'Enterprise') return <Crown className="h-8 w-8 text-amber-500" />;
        if (plan.name === 'Professional') return <Star className="h-8 w-8 text-indigo-500" />;
        if (plan.name === 'Starter') return <Zap className="h-8 w-8 text-slate-400" />;
        return <Leaf className="h-8 w-8 text-emerald-500" />;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            className={clsx(
                "relative flex flex-col p-8 rounded-[2.5rem] transition-all duration-500",
                isPremium 
                    ? "bg-slate-900 text-white shadow-2xl shadow-amber-200/20 scale-105 z-10" 
                    : "bg-white border border-gray-100 shadow-xl shadow-gray-100"
            )}
        >
            {isPremium && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-black shadow-xl">
                    Most Advanced
                </div>
            )}

            <div className="mb-8">
                <div className={clsx(
                    "w-16 h-16 rounded-3xl flex items-center justify-center mb-6",
                    isPremium ? "bg-amber-400/10" : isStandard ? "bg-indigo-50" : "bg-gray-50"
                )}>
                    {getIcon()}
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight mb-2">{plan.name}</h3>
                <p className={clsx("text-sm font-medium", isPremium ? "text-gray-400" : "text-gray-500")}>
                    {plan.target_role === 'admin' ? 'Business Membership' : 'Personal Membership'}
                </p>
            </div>

            <div className="mb-8">
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold italic">{plan.price_monthly > 0 ? `₹${plan.price_monthly}` : 'Free'}</span>
                    {plan.price_monthly > 0 && <span className={clsx("text-sm font-bold opacity-60", isPremium ? "text-gray-400" : "text-gray-500")}>/month</span>}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-40 italic">billed monthly</p>
            </div>

            <div className="flex-grow space-y-4 mb-8">
                {featureList.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                        <div className={clsx(
                            "mt-1 p-0.5 rounded-full",
                            isPremium ? "bg-amber-400/20 text-amber-400" : "bg-emerald-100 text-emerald-600"
                        )}>
                            <Check className="h-3 w-3 stroke-[3px]" />
                        </div>
                        <span className="text-sm font-bold leading-tight">{feature}</span>
                    </div>
                ))}
            </div>

            <button
                onClick={() => !isCurrent && onUpgrade(plan.id, plan.name)}
                disabled={isCurrent || isProcessing}
                className={clsx(
                    "w-full py-4 rounded-2xl font-extrabold transition-all flex items-center justify-center gap-2",
                    isCurrent 
                        ? "bg-emerald-500/10 text-emerald-500 cursor-default" 
                        : isPremium 
                        ? "bg-amber-400 text-black hover:bg-white active:scale-95 shadow-lg shadow-amber-400/20" 
                        : "bg-indigo-600 text-white hover:bg-black active:scale-95 shadow-lg shadow-indigo-100",
                    isProcessing && "opacity-70 cursor-wait"
                )}
            >
                {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCurrent ? (
                    'Active Plan'
                ) : (
                    'Upgrade Now'
                )}
                {!isCurrent && !isProcessing && <ArrowRight className="h-4 w-4" />}
            </button>
        </motion.div>
    );
};

const OrgMembershipView = () => {
    const { t } = useTranslation();
    const { user, refreshUser } = useAuth();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await apiService.getPlans({ target_role: 'admin' });
                setPlans(res.data);
            } catch (err) {
                toast.error("Failed to load plans");
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const expiryDate = user?.subscription_expiry ? new Date(user.subscription_expiry) : null;
    const isSubscribed = user?.org_plan_id && user?.org_plan_id !== plans.find(p => p.name === 'Free')?.id;
    const currentPlanName = plans.find(p => p.id === user?.org_plan_id)?.name || 'Free';

    const handleUpgrade = async (planId, planName) => {
        setProcessingId(planId);
        const loadingToast = toast.loading(`Initiating upgrade to ${planName}...`);

        try {
            const hasRazorpay = await loadRazorpay();
            if (!hasRazorpay) {
                toast.error("Razorpay SDK failed to load. Check your internet connection.", { id: loadingToast });
                return;
            }

            // 1. Create Order
            const { data: orderData } = await apiService.createPlanPaymentOrder(planId);
            
            // 2. Open Razorpay Checkout
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.order.amount,
                currency: orderData.order.currency,
                name: "Queuify Business",
                description: `Upgrade to ${planName} Plan`,
                order_id: orderData.order.id,
                handler: async (response) => {
                    try {
                        toast.loading("Verifying payment...", { id: loadingToast });
                        await apiService.verifyPlanPayment({
                            planId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        toast.success(`Organization upgraded to ${planName}!`, { id: loadingToast });
                        await refreshUser();
                    } catch (err) {
                        toast.error(err.response?.data?.message || "Verification failed.", { id: loadingToast });
                    } finally {
                        setProcessingId(null);
                    }
                },
                prefill: {
                    name: user?.name || "",
                    email: user?.email || "",
                },
                theme: { color: "#4F46E5" },
                modal: {
                    ondismiss: () => setProcessingId(null)
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast.error("Payment failed: " + response.error.description);
                setProcessingId(null);
            });
            rzp.open();
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong", { id: loadingToast });
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Fetching Business Tiers...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20 px-4 md:px-0">
            {/* Current Plan Status Banner */}
            {isSubscribed && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-7xl mx-auto mb-8"
                >
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4 text-center md:text-left">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">You are on the {currentPlanName} Plan</h2>
                                <p className="text-indigo-100 text-sm font-medium">Your subscription is active and protecting your organization.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/10">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-indigo-200" />
                                <div className="text-left">
                                    <p className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">Valid Until</p>
                                    <p className="text-sm font-bold">{expiryDate ? format(expiryDate, 'MMMM dd, yyyy') : 'N/A'}</p>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-white/20" />
                            <div className="text-left">
                                <p className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">Status</p>
                                <p className="text-sm font-bold flex items-center gap-1.5 text-emerald-300">
                                    <Check className="h-4 w-4" /> Active
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Header Hero Area */}
            <div className="max-w-7xl mx-auto mb-16">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex-1 text-center md:text-left">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
                        >
                            <TrendingUp className="h-3 w-3" />
                            Scale Your Business
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tighter leading-none mb-6"
                        >
                            Choose the plan that's <br/>
                            <span className="text-indigo-600 italic">right for you.</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-500 text-lg font-medium max-w-xl"
                        >
                            Manage your queues, staff, and appointments with military precision. 
                            Our plans are designed to help you scale smoothly.
                        </motion.p>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-shrink-0 grid grid-cols-2 gap-4 w-full md:w-[400px]"
                    >
                        <div className="p-6 bg-white rounded-[2rem] shadow-xl shadow-indigo-50 border border-indigo-50">
                            <Shield className="h-10 w-10 text-indigo-600 mb-4" />
                            <h4 className="font-bold text-sm">Secure Data</h4>
                            <p className="text-[10px] text-gray-400 font-bold mt-1">Enterprise grade encryption</p>
                        </div>
                        <div className="p-6 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-200 text-white">
                            <Globe className="h-10 w-10 text-white/50 mb-4" />
                            <h4 className="font-bold text-sm">Cloud Scale</h4>
                            <p className="text-[10px] text-white/50 font-bold mt-1">99.9% Sla Uptime</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 max-w-7xl mx-auto">
                {plans.map((plan) => (
                    <PlanCard 
                        key={plan.id} 
                        plan={plan} 
                        isCurrent={user?.org_plan_id === plan.id} 
                        onUpgrade={handleUpgrade}
                        processingId={processingId}
                        t={t}
                    />
                ))}
            </div>


            {/* Bottom Info Section */}
            <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="max-w-4xl mx-auto mt-20 p-10 bg-gradient-to-br from-indigo-50 to-white rounded-[3rem] border border-indigo-100 text-center"
            >
                <div className="inline-flex p-3 bg-white rounded-2xl shadow-sm mb-6">
                    <LayoutDashboard className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-3xl font-extrabold tracking-tight mb-4">Need a Custom Setup?</h3>
                <p className="text-gray-500 font-medium mb-8">
                    If you manage more than 20 branches or have complex integration requirements, 
                    our team can build a custom solution for your specific workflow.
                </p>
                <button className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-extrabold text-sm uppercase tracking-widest hover:bg-indigo-600 transition-colors">
                    Contact Sales Team
                </button>
            </motion.div>
        </div>
    );
};

export default OrgMembershipView;
