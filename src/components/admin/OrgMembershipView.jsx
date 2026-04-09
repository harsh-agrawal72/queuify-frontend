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
import { AnimatePresence } from 'framer-motion';

const CheckoutModal = ({ isOpen, onClose, plan, onPay, user, t }) => {
    const [couponCode, setCouponCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [couponData, setCouponData] = useState(null);
    const [error, setError] = useState('');

    const basePrice = plan?.price_monthly || 0;
    const discount = couponData ? couponData.discountAmount : 0;
    const discountedBase = Math.max(0, basePrice - discount);
    const gstAmount = parseFloat((discountedBase * 0.18).toFixed(2));
    const totalPayable = parseFloat((discountedBase + gstAmount).toFixed(2));

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsValidating(true);
        setError('');
        try {
            const res = await apiService.validateCoupon(couponCode, plan.id);
            setCouponData(res.data);
            toast.success("Coupon applied successfully!");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid coupon code");
            setCouponData(null);
        } finally {
            setIsValidating(false);
        }
    };

    if (!isOpen || !plan) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="bg-slate-900 p-8 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Shield className="h-24 w-24" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">Secure Checkout</p>
                        <h3 className="text-3xl font-black tracking-tight">{plan.name} Plan</h3>
                        <p className="text-slate-400 text-sm font-medium mt-1">Review your subscription details</p>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Summary Row */}
                    <div className="flex justify-between items-center text-slate-900">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Subscription Tier</p>
                            <p className="text-lg font-black">{plan.name} Membership</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Base Price</p>
                            <p className="text-lg font-black">₹{basePrice}</p>
                        </div>
                    </div>

                    {/* Coupon Input */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Have a coupon code?</label>
                        <div className="flex gap-2">
                            <div className="relative flex-grow">
                                <input 
                                    type="text" 
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    placeholder="ENTER CODE"
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold uppercase tracking-widest focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                />
                                {couponData && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <Check className="h-5 w-5 text-emerald-500 stroke-[3px]" />
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={handleApplyCoupon}
                                disabled={isValidating || !couponCode}
                                className="px-6 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-all"
                            >
                                {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                            </button>
                        </div>
                        {error && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{error}</p>}
                        {couponData && (
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                                Applied: {couponData.discountValue}{couponData.discountType === 'percentage' ? '%' : ' OFF'}
                            </p>
                        )}
                    </div>

                    {/* Price Breakdown */}
                    <div className="bg-slate-50 rounded-[2rem] p-6 space-y-3">
                        <div className="flex justify-between text-sm font-bold text-slate-500">
                            <span>Subtotal</span>
                            <span>₹{basePrice}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-sm font-bold text-emerald-600">
                                <span>Discount</span>
                                <span>-₹{discount}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm font-bold text-slate-500">
                            <span>GST (18%)</span>
                            <span>+₹{gstAmount}</span>
                        </div>
                        <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                            <span className="text-lg font-black">Total Payable</span>
                            <span className="text-2xl font-black text-indigo-600 tracking-tight">₹{totalPayable}</span>
                        </div>
                    </div>

                    {/* Action */}
                    <button 
                        onClick={() => onPay(plan.id, plan.name, couponCode, totalPayable === 0)}
                        className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-slate-900 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        {totalPayable === 0 ? 'Claim Free Plan' : 'Proceed to Payment'}
                        <ArrowRight className="h-4 w-4" />
                    </button>
                    
                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                        Secure SSL Encryption • Instant Activation
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

const PlanCard = ({ plan, isCurrent, isDowngrade, onUpgrade, processingId, t }) => {
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
                    t('user_subscription.current_plan', 'Current Plan')
                ) : isDowngrade ? (
                    'Downgrade'
                ) : (
                    t('user_subscription.upgrade_now', 'Upgrade Now')
                )}
                {!isCurrent && !isProcessing && <ArrowRight className="h-4 w-4" />}
            </button>
        </motion.div>
    );
};

const OrgMembershipView = () => {
    const { t } = useTranslation();
    const { user, refreshUser } = useAuth();
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [plansRes, statsRes] = await Promise.all([
                    apiService.getPlans({ target_role: 'admin' }),
                    apiService.getMembershipStats()
                ]);
                setPlans(plansRes.data);
                setStats(statsRes.data);
            } catch (err) {
                toast.error("Failed to load membership data");
            } finally {
                setLoading(false);
                setStatsLoading(false);
            }
        };
        fetchData();
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
    const now = new Date();
    const daysRemaining = expiryDate ? Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)) : null;
    const isExpired = daysRemaining !== null && daysRemaining <= 0;
    
    const currentPlan = plans.find(p => p.id === user?.org_plan_id) || plans.find(p => p.name === 'Free');
    const currentPlanName = currentPlan?.name || 'Free';
    const planFeatures = typeof currentPlan?.features === 'string' ? JSON.parse(currentPlan.features) : (currentPlan?.features || {});
    
    const isSubscribed = currentPlanName !== 'Free';

    const handleUpgradeClick = (planId, planName) => {
        const plan = plans.find(p => p.id === planId);
        
        // If it's a natively free plan (price is 0), just claim it directly
        if (parseFloat(plan.price_monthly) === 0) {
            handleActualPurchase(planId, planName, null, true);
            return;
        }

        setSelectedPlan(plan);
        setIsCheckoutOpen(true);
    };

    const handleActualPurchase = async (planId, planName, couponCode, isFree) => {
        setProcessingId(planId);
        setIsCheckoutOpen(false); // Close checkout before payment trigger
        const loadingToast = toast.loading(`${isFree ? 'Claiming' : 'Initiating upgrade to'} ${planName}...`);

        try {
            if (isFree) {
                // 100% Discount logic
                await apiService.claimFreePlan(planId, couponCode);
                toast.success(`Plan activated successfully!`, { id: loadingToast });
                await refreshUser();
                window.location.reload();
                return;
            }

            const hasRazorpay = await loadRazorpay();
            if (!hasRazorpay) {
                toast.error("Razorpay SDK failed to load. Check your internet connection.", { id: loadingToast });
                return;
            }

            // 1. Create Order with Optional Coupon
            const { data: orderData } = await apiService.createPlanPaymentOrder(planId, couponCode);
            
            // Handle if backend says it's free (backup check)
            if (orderData.isFree) {
                await apiService.claimFreePlan(planId, couponCode);
                toast.success(`Plan activated successfully!`, { id: loadingToast });
                await refreshUser();
                window.location.reload();
                return;
            }

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
                        window.location.reload();
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

    if (loading || statsLoading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Fetching Business Tiers...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20 px-4 md:px-0">
            {/* Current Plan Status Dashboard */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto mb-12"
            >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Status Banner */}
                    <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-100">
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <Crown className="h-40 w-40" />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-500 rounded-xl">
                                    <Sparkles className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">
                                    {t('membership.active_plan')}
                                </span>
                            </div>

                            <div className="flex flex-col md:flex-row items-baseline gap-4 mb-4">
                                <h2 className="text-5xl font-black tracking-tighter">{currentPlanName}</h2>
                                {isSubscribed && (
                                    <span className={clsx(
                                        "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
                                        isExpired ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                                    )}>
                                        {isExpired ? 'Expired' : 'Active'}
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
                                    <div className="p-3 bg-indigo-500/20 rounded-2xl">
                                        <Clock className="h-6 w-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                            {t('membership.valid_until')}
                                        </p>
                                        <p className="text-lg font-bold">
                                            {expiryDate ? format(expiryDate, 'MMM dd, yyyy') : 'No Expiry'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
                                    <div className={clsx(
                                        "p-3 rounded-2xl",
                                        daysRemaining <= 3 ? "bg-red-500/20" : "bg-emerald-500/20"
                                    )}>
                                        <Zap className={clsx(
                                            "h-6 w-6",
                                            daysRemaining <= 3 ? "text-red-400" : "text-emerald-400"
                                        )} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                            {t('membership.status')}
                                        </p>
                                        <p className={clsx(
                                            "text-lg font-bold",
                                            daysRemaining <= 3 ? "text-red-400" : "text-emerald-400"
                                        )}>
                                            {daysRemaining !== null 
                                                ? t('membership.days_remaining', { count: Math.max(0, daysRemaining) })
                                                : 'Lifetime'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Usage Stats Section */}
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-xl shadow-gray-100 flex flex-col justify-between">
                        <div>
                            <h3 className="text-xl font-black tracking-tight mb-8">
                                {t('membership.usage_title')}
                            </h3>
                            
                            <div className="space-y-8">
                                {/* Resources Usage */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                            {t('membership.resources_used')}
                                        </p>
                                        <span className="text-sm font-black">
                                            {stats?.resourceCount || 0} / {planFeatures.max_resources || 1}
                                        </span>
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, ((stats?.resourceCount || 0) / (planFeatures.max_resources || 1)) * 100)}%` }}
                                            className={clsx(
                                                "h-full rounded-full transition-all duration-1000",
                                                (stats?.resourceCount || 0) >= (planFeatures.max_resources || 1) ? "bg-red-500" : "bg-indigo-600"
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Admins Usage */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                            {t('membership.admins_used')}
                                        </p>
                                        <span className="text-sm font-black">
                                            {stats?.adminCount || 0} / {planFeatures.max_admins || 1}
                                        </span>
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, ((stats?.adminCount || 0) / (planFeatures.max_admins || 1)) * 100)}%` }}
                                            className={clsx(
                                                "h-full rounded-full transition-all duration-1000",
                                                (stats?.adminCount || 0) >= (planFeatures.max_admins || 1) ? "bg-red-500" : "bg-indigo-600"
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-50">
                            <div className="flex items-center gap-3 text-gray-400">
                                <AlertCircle className="h-4 w-4" />
                                <p className="text-[10px] font-bold uppercase tracking-wider">
                                    Limits refresh upon plan upgrade
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Header Hero Area */}
            <div className="max-w-7xl mx-auto mb-16 text-center">
                <div className="flex flex-col items-center justify-center gap-8">
                    <div className="max-w-3xl">
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6"
                        >
                            <TrendingUp className="h-3 w-3" />
                            {t('membership.scale_business')}
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tighter leading-none mb-6"
                        >
                            {t('membership.title')} <br/>
                            <span className="text-indigo-600 italic">{t('membership.title_italic')}</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-500 text-base font-medium max-w-2xl mx-auto"
                        >
                            {t('membership.subtitle')}
                        </motion.p>
                    </div>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 max-w-7xl mx-auto">
                {plans.map((plan) => (
                    <PlanCard 
                        key={plan.id} 
                        plan={plan} 
                        isCurrent={user?.org_plan_id === plan.id || (!user?.org_plan_id && plan.name === 'Free')} 
                        isDowngrade={parseFloat(plan.price_monthly) < parseFloat(currentPlan?.price_monthly || 0)}
                        onUpgrade={handleUpgradeClick}
                        processingId={processingId}
                        t={t}
                    />
                ))}
            </div>

            <AnimatePresence>
                {isCheckoutOpen && (
                    <CheckoutModal 
                        isOpen={isCheckoutOpen}
                        onClose={() => setIsCheckoutOpen(false)}
                        plan={selectedPlan}
                        onPay={handleActualPurchase}
                        user={user}
                        t={t}
                    />
                )}
            </AnimatePresence>


            {/* Bottom Info Section */}
            <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="max-w-4xl mx-auto mt-20 p-10 bg-gradient-to-br from-indigo-50 to-white rounded-[3rem] border border-indigo-100 text-center"
            >
                <div className="inline-flex p-3 bg-white rounded-2xl shadow-sm mb-6">
                    <LayoutDashboard className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-3xl font-extrabold tracking-tight mb-4">{t('membership.custom_setup_title')}</h3>
                <p className="text-gray-500 font-medium mb-8">
                    {t('membership.custom_setup_desc')}
                </p>
                <button 
                    onClick={() => window.location.href = 'mailto:support@queuify.in?subject=Custom%20Setup%20Inquiry%20-%20Queuify%20Business'}
                    className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-extrabold text-sm uppercase tracking-widest hover:bg-indigo-600 transition-colors"
                >
                    {t('membership.contact_sales')}
                </button>
            </motion.div>
        </div>
    );
};

export default OrgMembershipView;
