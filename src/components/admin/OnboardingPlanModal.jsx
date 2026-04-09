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
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

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
    const { user } = useAuth();
    const { t } = useTranslation();
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
                    console.error(t('onboarding_modal.failed_load_plans'), err);
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
            toast.success(t('onboarding_modal.welcome_aboard'));
        } catch (err) {
            toast.error(t('onboarding_modal.generic_error'));
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
        const loadingToast = toast.loading(t('onboarding_modal.initiating_upgrade', { name: planName }));

        try {
            const hasRazorpay = await loadRazorpay();
            if (!hasRazorpay) {
                toast.error(t('onboarding_modal.razorpay_failed'), { id: loadingToast });
                return;
            }

            const { data: orderData } = await apiService.createPlanPaymentOrder(planId);
            
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.order.amount,
                currency: orderData.order.currency,
                name: "Queuify Business",
                description: t('onboarding_modal.initiating_upgrade', { name: planName }),
                order_id: orderData.order.id,
                handler: async (response) => {
                    try {
                        toast.loading(t('onboarding_modal.verifying_payment'), { id: loadingToast });
                        await apiService.verifyPlanPayment({
                            planId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        
                        // After payment, also mark as onboarded
                        await apiService.markAsOnboarded();
                        toast.success(t('onboarding_modal.welcome_to_plan', { name: planName }), { id: loadingToast });
                        onComplete();
                    } catch (err) {
                        toast.error(err.response?.data?.message || t('onboarding_modal.verif_failed'), { id: loadingToast });
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
            toast.error(error.response?.data?.message || t('onboarding_modal.payment_failed'), { id: loadingToast });
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
                            {t('onboarding_modal.org_verified')}
                        </motion.div>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tighter mb-4">
                            {t('onboarding_modal.welcome_title')} <span className="text-indigo-600 italic">{t('onboarding_modal.welcome_italic')}</span>
                        </h2>
                        <p className="text-slate-500 font-bold max-w-2xl mx-auto">
                            {t('onboarding_modal.welcome_subtitle')}
                        </p>
                    </div>

                    {/* Plans Area */}
                    <div className="flex-grow overflow-y-auto p-8 md:p-12 bg-slate-50/50">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 italic">{t('onboarding_modal.fetching_tiers')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
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
                                                     plan.name === 'Starter' ? <Zap className="h-6 w-6 text-slate-400" /> :
                                                     <Leaf className="h-6 w-6 text-emerald-500" />}
                                                </div>
                                                <h3 className="text-xl font-extrabold tracking-tight">{plan.name}</h3>
                                                <p className={clsx("text-[10px] font-bold uppercase tracking-widest", isPremium ? "text-white/40" : "text-slate-400")}>{t('onboarding_modal.business_tier')}</p>
                                            </div>

                                            <div className="mb-6">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-extrabold italic tracking-tighter text-indigo-600">₹{plan.price_monthly}</span>
                                                    <span className={clsx("text-xs font-bold opacity-40", isPremium ? "text-white" : "text-slate-900")}>{t('onboarding_modal.per_month')}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-4 mb-8">
                                                <PlanFeature isPremium={isPremium} text={t('setup.resources_count', { count: features.max_resources || 1 })} />
                                                <PlanFeature isPremium={isPremium} text={t('setup.admins_count', { count: features.max_admins || 1 })} />
                                                <PlanFeature isPremium={isPremium} text={features.analytics === 'advanced' ? t('setup.advance_analytics') : t('setup.basic_analytics')} />
                                                {features.has_premium_features && <PlanFeature isPremium={isPremium} text={t('setup.premium_features')} />}
                                                {features.has_customer_insight && <PlanFeature isPremium={isPremium} text={t('setup.customer_insight')} />}
                                                <PlanFeature isPremium={isPremium} text={t('setup.availability_24_7')} />
                                            </div>

                                            <button
                                                onClick={() => handleUpgrade(plan.id, plan.name)}
                                                disabled={submitting}
                                                className={clsx(
                                                    "w-full py-4 mt-auto rounded-2xl font-extrabold transition-all flex items-center justify-center gap-2 active:scale-95",
                                                    isPremium 
                                                        ? "bg-amber-400 text-black hover:bg-white" 
                                                        : "bg-indigo-600 text-white hover:bg-black"
                                                )}
                                            >
                                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (plan.price_monthly === 0 ? t('common.current_plan', 'Get Started') : t('onboarding_modal.upgrade_now'))}
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
                            className="group relative px-12 py-5 bg-indigo-50 text-indigo-700 rounded-2xl font-extrabold text-sm uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-95 flex items-center gap-3 overflow-hidden"
                        >
                            {submitting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    {t('onboarding_modal.start_exploring')}
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                        <p className="text-[10px] text-slate-400 font-bold italic">
                            {t('onboarding_modal.upgrade_hint')}
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default OnboardingPlanModal;
