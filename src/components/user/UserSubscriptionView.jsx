import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Check, X, Zap, Star, ShieldCheck, Crown, BellRing, MessageSquare, AlertCircle, Loader2, Shield, HelpCircle, Lock, RefreshCcw, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';

const UserSubscriptionView = () => {
    const { user, refreshUser } = useAuth();
    const { t } = useTranslation();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchPlans();
        
        // Load Razorpay Script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await apiService.getPlans({ target_role: 'user' });
            setPlans(response.data);
        } catch (error) {
            console.error('Failed to fetch plans:', error);
            toast.error(t('user_subscription.load_failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleSwitchPlan = async (planId, planName, price) => {
        if (planName === 'Free' && !window.confirm(t('user_subscription.switch_free_confirm'))) {
            return;
        }

        setProcessingId(planId);

        if (parseFloat(price) > 0) {
            try {
                await initiatePlanPayment(planId, planName, price);
            } catch (error) {
                console.error('Payment initiation failed:', error);
                toast.error(t('user_subscription.payment_init_failed'));
                setProcessingId(null);
            }
            return;
        }

        // For free plans, direct assignment
        try {
            await apiService.assignUserPlan(planId);
            toast.success(t('user_subscription.switch_success', { name: planName }));
            await refreshUser();
        } catch (error) {
            console.error('Plan switch failed:', error);
            toast.error(error.response?.data?.message || t('user_subscription.switch_failed'));
        } finally {
            setProcessingId(null);
        }
    };

    const initiatePlanPayment = async (planId, planName, price) => {
        try {
            const orderRes = await apiService.createPlanPaymentOrder(planId);
            const { order } = orderRes.data;

            const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
            if (!rzpKey) {
                toast.error(t('user_subscription.config_missing'));
                return;
            }

            const options = {
                key: rzpKey,
                amount: order.amount,
                currency: order.currency,
                name: t('user_subscription.razorpay_name'),
                description: t('user_subscription.razorpay_desc', { name: planName }),
                order_id: order.id,
                handler: async (response) => {
                    const loadingToast = toast.loading(t('user_subscription.verifying_payment'));
                    try {
                        await apiService.verifyPlanPayment({
                            planId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        toast.success(t('user_subscription.welcome_to_plan', { name: planName }), { id: loadingToast });
                        await refreshUser();
                    } catch (err) {
                        toast.error(err.response?.data?.message || t('user_subscription.verif_failed'), { id: loadingToast });
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
                toast.error(t('user_subscription.payment_failed_with_desc', { desc: response.error.description }));
                setProcessingId(null);
            });
            rzp.open();
        } catch (error) {
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">{t('user_subscription.loading_plans')}</p>
            </div>
        );
    }

    const getPlanIcon = (name) => {
        switch (name.toString().toLowerCase()) {
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
                <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                    {t('user_subscription.title')}
                </h2>
                <p className="text-gray-500 max-w-2xl mx-auto font-medium">
                    {t('user_subscription.subtitle')}
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
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[10px] font-bold uppercase tracking-[0.2em] px-6 py-2 rounded-full shadow-lg">
                                    {t('user_subscription.best_value')}
                                </div>
                            )}

                            <div className="mb-8">
                                <div className={clsx(
                                    "inline-flex p-3 rounded-2xl mb-4",
                                    isPremium ? "bg-amber-400 text-black" : isStandard ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
                                )}>
                                    {getPlanIcon(plan.name)}
                                </div>
                                <h3 className="text-2xl font-black mb-1 tracking-tight">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black tracking-tighter">₹{plan.price_monthly}</span>
                                    <span className={clsx("text-sm opacity-60 font-bold", isPremium ? "text-gray-300" : "text-gray-500")}>{t('user_subscription.per_month')}</span>
                                </div>
                                {isCurrent && (
                                    <div className="absolute top-6 right-6">
                                        <div className="flex flex-col items-end">
                                            <span className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-emerald-500/30 border border-white/20">
                                                <div className="h-2 w-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]" />
                                                {t('user_subscription.active')}
                                            </span>
                                            {user?.subscription_expiry && (
                                                <span className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-wide opacity-50">
                                                    {t('user_subscription.expires', { date: format(parseISO(user.subscription_expiry), 'MMM dd, yyyy') })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <ul className="flex-grow space-y-4 mb-8">
                                <li className="flex items-center gap-3">
                                    <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-500">
                                        <Check className="h-4 w-4 stroke-[3px]" />
                                    </div>
                                    <span className="text-sm font-bold">
                                        {features.max_active_appointments > 100 ? t('user_subscription.unlimited') : features.max_active_appointments} {t('user_subscription.active_bookings')}
                                    </span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-500">
                                        <Check className="h-4 w-4 stroke-[3px]" />
                                    </div>
                                    <span className="text-sm font-bold capitalize">
                                        {features.notifications?.join(' & ')} {t('user_subscription.notifications')}
                                    </span>
                                </li>
                                {features.priority && (
                                    <li className="flex items-center gap-3">
                                        <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-500">
                                            <ShieldCheck className="h-4 w-4 stroke-[3px]" />
                                        </div>
                                        <span className="text-sm font-bold italic text-indigo-400">{t('user_subscription.vip_priority')}</span>
                                    </li>
                                )}
                                <li className="flex items-center gap-3">
                                    <div className={clsx("p-1 rounded-full", (features.reschedule_limit || 0) > 0 ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500")}>
                                        { (features.reschedule_limit || 0) > 0 ? <Check className="h-4 w-4 stroke-[3px]" /> : <X className="h-4 w-4 stroke-[3px]" /> }
                                    </div>
                                    <span className="text-sm font-bold">
                                        {features.reschedule_limit === 0 ? t('user_subscription.no_reschedule') : 
                                         features.reschedule_limit > 10 ? t('user_subscription.unlimited_reschedule') : 
                                         t('user_subscription.reschedule_allowed', { count: features.reschedule_limit })}
                                    </span>
                                </li>
                            </ul>

                            <button
                                onClick={() => !isCurrent && handleSwitchPlan(plan.id, plan.name, plan.price_monthly)}
                                disabled={isCurrent || processingId === plan.id}
                                className={clsx(
                                    "w-full py-4 rounded-2xl font-extrabold transition-all flex items-center justify-center gap-2",
                                    isCurrent ? "bg-emerald-500/10 text-emerald-500 cursor-default" : 
                                    isPremium ? "bg-amber-400 text-black hover:bg-amber-300 active:scale-95" :
                                    "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-100"
                                )}
                            >
                                {processingId === plan.id ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : isCurrent ? (
                                    <>
                                        <Check className="h-5 w-5" /> {t('user_subscription.current_plan')}
                                    </>
                                ) : (
                                    plan.name === 'Free' ? t('user_subscription.downgrade') : t('user_subscription.upgrade_now')
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Feature Comparison Section */}
            <div className="bg-gray-50 rounded-[3rem] p-10 border border-gray-100 mb-16">
                <h4 className="text-xl font-black mb-8 text-center text-gray-900 uppercase tracking-widest opacity-40">{t('user_subscription.why_global')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="flex flex-col items-center text-center">
                        <div className="p-4 bg-white rounded-3xl text-indigo-600 mb-4 shadow-sm border border-gray-100">
                            <Crown className="h-6 w-6" />
                        </div>
                        <h5 className="font-extrabold text-gray-900 mb-2">{t('user_subscription.priority_tokens_title')}</h5>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">{t('user_subscription.priority_tokens_desc')}</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="p-4 bg-white rounded-3xl text-amber-500 mb-4 shadow-sm border border-gray-100">
                            <BellRing className="h-6 w-6" />
                        </div>
                        <h5 className="font-extrabold text-gray-900 mb-2">{t('user_subscription.all_notifications_title')}</h5>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">{t('user_subscription.all_notifications_desc')}</p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="p-4 bg-white rounded-3xl text-emerald-500 mb-4 shadow-sm border border-gray-100">
                            <Shield className="h-6 w-6" />
                        </div>
                        <h5 className="font-extrabold text-gray-900 mb-2">{t('user_subscription.trust_secure_payments')}</h5>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">{t('user_subscription.faq_a3')}</p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="p-4 bg-white rounded-3xl text-rose-500 mb-4 shadow-sm border border-gray-100">
                            <MessageSquare className="h-6 w-6" />
                        </div>
                        <h5 className="font-extrabold text-gray-900 mb-2">{t('user_subscription.direct_chat_title')}</h5>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">{t('user_subscription.direct_chat_desc')}</p>
                    </div>
                </div>
            </div>

            {/* Comparison Matrix */}
            <div className="mb-16 overflow-hidden">
                <div className="text-center mb-10">
                    <h4 className="text-2xl font-black text-gray-900 tracking-tight">{t('user_subscription.comparison_title')}</h4>
                </div>
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="p-6 text-sm font-black text-gray-500 uppercase tracking-widest">{t('user_subscription.feature_name')}</th>
                                {plans.map(p => (
                                    <th key={p.id} className="p-6 text-sm font-black text-gray-900 text-center uppercase tracking-widest">{p.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            <tr>
                                <td className="p-6 font-bold text-gray-900">{t('user_subscription.active_bookings')}</td>
                                {plans.map(p => (
                                    <td key={p.id} className="p-6 text-center text-gray-500 font-bold">
                                        {p.features?.max_active_appointments > 100 ? t('user_subscription.unlimited') : p.features?.max_active_appointments}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="p-6 font-bold text-gray-900">{t('user_subscription.notifications')}</td>
                                {plans.map(p => (
                                    <td key={p.id} className="p-6 text-center text-gray-500 font-bold capitalize">
                                        {p.features?.notifications?.length} {t('user_subscription.notifications')}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="p-6 font-bold text-gray-900">{t('user_subscription.vip_priority')}</td>
                                {plans.map(p => (
                                    <td key={p.id} className="p-6 text-center">
                                        {p.features?.priority ? <Check className="h-5 w-5 text-emerald-500 mx-auto stroke-[3px]" /> : <X className="h-5 w-5 text-rose-500 mx-auto stroke-[3px]" />}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="p-6 font-bold text-gray-900">Reschedules</td>
                                {plans.map(p => (
                                    <td key={p.id} className="p-6 text-center text-gray-500 font-bold">
                                        {p.features?.reschedule_limit === 0 ? t('common.no') : 
                                         p.features?.reschedule_limit > 10 ? t('user_subscription.unlimited') : 
                                         p.features?.reschedule_limit}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="max-w-3xl mx-auto mb-20 px-4">
                <div className="text-center mb-10">
                    <HelpCircle className="h-10 w-10 text-indigo-600 mx-auto mb-4" />
                    <h4 className="text-3xl font-black text-gray-900 tracking-tight">{t('user_subscription.faq_title')}</h4>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <FAQItem 
                            key={i}
                            question={t(`user_subscription.faq_q${i}`)}
                            answer={t(`user_subscription.faq_a${i}`)}
                        />
                    ))}
                </div>
            </div>

            {/* Bottom Final CTA */}
            <div className="relative overflow-hidden bg-indigo-600 rounded-[3rem] p-12 text-center text-white shadow-2xl shadow-indigo-200 group">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)] pointer-events-none" />
                <Heart className="h-12 w-12 text-indigo-300 mx-auto mb-6 animate-bounce" />
                <h3 className="text-4xl font-black mb-4 tracking-tighter">{t('user_subscription.pricing_footer_title')}</h3>
                <p className="text-indigo-100 mb-10 font-medium max-w-xl mx-auto">
                    {t('user_subscription.pricing_footer_subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20">
                        <Lock className="h-4 w-4" />
                        <span className="text-xs font-bold tracking-widest uppercase">{t('user_subscription.trust_secure_payments')}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20">
                        <RefreshCcw className="h-4 w-4" />
                        <span className="text-xs font-bold tracking-widest uppercase">{t('user_subscription.trust_cancel_anytime')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// FAQ Item Sub-component
const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden transition-all duration-300">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 text-left"
            >
                <span className="font-black text-gray-900 tracking-tight">{question}</span>
                {isOpen ? <ChevronUp className="h-5 w-5 text-indigo-600" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 pt-0 text-gray-500 font-medium leading-relaxed">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserSubscriptionView;
