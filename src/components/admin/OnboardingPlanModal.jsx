import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Check, 
    Zap, 
    Star, 
    Crown, 
    ArrowRight,
    Loader2,
    Sparkles,
    ShieldCheck
} from 'lucide-react';
import clsx from 'clsx';
import { apiService } from '../../services/api';
import { toast } from 'react-hot-toast';

const PlanFeature = ({ text, isPremium }) => (
    <div className="flex items-start gap-3">
        <div className={clsx(
            "mt-1 p-0.5 rounded-full flex-shrink-0",
            isPremium ? "bg-amber-400/20 text-amber-400" : "bg-indigo-100 text-indigo-600"
        )}>
            <Check className="h-3 w-3 stroke-[3px]" />
        </div>
        <span className={clsx(
            "text-xs font-bold leading-tight",
            isPremium ? "text-white/80" : "text-slate-600"
        )}>{text}</span>
    </div>
);

const OnboardingPlanModal = ({ isOpen, onComplete }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchPlans = async () => {
                try {
                    const res = await apiService.getPlans({ target_role: 'admin' });
                    setPlans(res.data);
                } catch (err) {
                    console.error("Failed to load plans", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchPlans();
        }
    }, [isOpen]);

    const handleStartFree = async () => {
        setSubmitting(true);
        try {
            await apiService.markAsOnboarded();
            onComplete();
            toast.success("Welcome aboard! Your dashboard is now active.");
        } catch (err) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

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

    const handleUpgrade = async (planId, planName) => {
        setSubmitting(true);
        const loadingToast = toast.loading(`Initiating upgrade to ${planName}...`);

        try {
            const hasRazorpay = await loadRazorpay();
            if (!hasRazorpay) {
                toast.error("Razorpay SDK failed to load.", { id: loadingToast });
                return;
            }

            const { data: orderData } = await apiService.createPlanPaymentOrder(planId);
            
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
                        
                        // After payment, also mark as onboarded
                        await apiService.markAsOnboarded();
                        toast.success(`Welcome to ${planName}!`, { id: loadingToast });
                        onComplete();
                    } catch (err) {
                        toast.error(err.response?.data?.message || "Verification failed.", { id: loadingToast });
                    } finally {
                        setSubmitting(false);
                    }
                },
                prefill: {
                    name: user?.name || "",
                    email: user?.email || "",
                },
                theme: { color: "#4F46E5" },
                modal: { ondismiss: () => setSubmitting(false) }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to initiate payment", { id: loadingToast });
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
                />

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="relative w-full max-w-6xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-8 md:p-12 text-center border-b border-gray-100 bg-gradient-to-b from-slate-50 to-white">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 12 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-lg shadow-indigo-200"
                        >
                            <Sparkles className="h-3 w-3" />
                            Organization Verified
                        </motion.div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">
                            Welcome to the <span className="text-indigo-600 italic">Future of Queueing.</span>
                        </h2>
                        <p className="text-slate-500 font-bold max-w-2xl mx-auto">
                            Congratulations! Your organization has been verified by our team. 
                            Choose a plan and start managing your workspace with precision.
                        </p>
                    </div>

                    {/* Plans Area */}
                    <div className="flex-grow overflow-y-auto p-8 md:p-12 bg-slate-50/50">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Fetching Business Tiers...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                                {plans.map((plan) => {
                                    const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || {});
                                    const isPremium = plan.name === 'Enterprise';
                                    const isStandard = plan.name === 'Professional';

                                    return (
                                        <motion.div
                                            key={plan.id}
                                            whileHover={{ y: -5 }}
                                            className={clsx(
                                                "p-8 rounded-[2rem] flex flex-col transition-all duration-300",
                                                isPremium 
                                                    ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/20" 
                                                    : "bg-white border border-slate-200 shadow-sm"
                                            )}
                                        >
                                            <div className="mb-6">
                                                <div className={clsx(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-4",
                                                    isPremium ? "bg-white/10" : "bg-indigo-50"
                                                )}>
                                                    {isPremium ? <Crown className="h-6 w-6 text-amber-400" /> : 
                                                     isStandard ? <Star className="h-6 w-6 text-indigo-600" /> : 
                                                     <Zap className="h-6 w-6 text-slate-400" />}
                                                </div>
                                                <h3 className="text-xl font-black">{plan.name}</h3>
                                                <p className={clsx("text-[10px] font-bold uppercase tracking-wider", isPremium ? "text-white/40" : "text-slate-400")}>Business Tier</p>
                                            </div>

                                            <div className="mb-6">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-black italic">₹{plan.price_monthly}</span>
                                                    <span className="text-xs font-bold opacity-40">/mo</span>
                                                </div>
                                            </div>

                                            <div className="space-y-4 mb-8">
                                                <PlanFeature isPremium={isPremium} text={`${features.resources || 0} Resources`} />
                                                <PlanFeature isPremium={isPremium} text={`${features.staff || 0} Staff Accounts`} />
                                                <PlanFeature isPremium={isPremium} text={`${features.max_daily_bookings || 0} Daily Limit`} />
                                                {features.custom_branding && <PlanFeature isPremium={isPremium} text="Custom Branding" />}
                                                {features.broadcast && <PlanFeature isPremium={isPremium} text="Broadcasting" />}
                                            </div>

                                            <button
                                                onClick={() => handleUpgrade(plan.id, plan.name)}
                                                disabled={submitting}
                                                className={clsx(
                                                    "w-full py-4 mt-auto rounded-2xl font-black transition-all flex items-center justify-center gap-2 active:scale-95",
                                                    isPremium 
                                                        ? "bg-amber-400 text-black hover:bg-white" 
                                                        : "bg-indigo-600 text-white hover:bg-black"
                                                )}
                                            >
                                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upgrade Now'}
                                                {!submitting && <ArrowRight className="h-4 w-4" />}
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-8 bg-white border-t border-gray-100 flex flex-col items-center gap-4">
                        <button
                            onClick={handleStartFree}
                            disabled={submitting}
                            className="group relative px-12 py-5 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-95 flex items-center gap-3 overflow-hidden"
                        >
                            {submitting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Start Exploring for Free
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                        <p className="text-[10px] text-slate-400 font-bold italic">
                            You can upgrade or change your plan anytime from your dashboard settings.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default OnboardingPlanModal;
