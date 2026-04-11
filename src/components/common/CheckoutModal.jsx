import React, { useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { 
    Check, ArrowRight, Loader2, Shield, X
} from 'lucide-react';
import { apiService } from '../../services/api';
import { toast } from 'react-hot-toast';

const CheckoutModal = ({ isOpen, onClose, plan, onPay, user, t }) => {
    const [couponCode, setCouponCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [couponData, setCouponData] = useState(null);
    const [error, setError] = useState('');
    const [duration, setDuration] = useState(1);

    const DURATIONS = [
        { label: '1 Month', months: 1, discount: 0 },
        { label: '3 Months', months: 3, discount: 0.05 },
        { label: '6 Months', months: 6, discount: 0.10 },
        { label: '1 Year', months: 12, discount: 0.20 },
    ];

    const pricePerMonth = plan?.price_monthly || 0;
    const currentDuration = DURATIONS.find(d => d.months === duration);
    const baseAggregate = pricePerMonth * duration;
    const multiMonthDiscount = parseFloat((baseAggregate * (currentDuration?.discount || 0)).toFixed(2));
    const discountedSubtotal = baseAggregate - multiMonthDiscount;
    
    const couponDiscount = couponData ? couponData.discountAmount : 0;
    const discountedBase = Math.max(0, discountedSubtotal - couponDiscount);
    const gstAmount = parseFloat((discountedBase * 0.18).toFixed(2));
    const totalPayable = parseFloat((discountedBase + gstAmount).toFixed(2));

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsValidating(true);
        setError('');
        try {
            // Validate coupon against the discounted subtotal
            const res = await apiService.validateCoupon(couponCode, plan.id, duration);
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
                className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-y-auto max-h-[95vh] custom-scrollbar"
            >
                {/* Header */}
                <div className="bg-slate-900 p-6 md:p-8 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Shield className="h-24 w-24" />
                    </div>
                    {/* Close Button */}
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all z-20 text-white/50 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">Secure Checkout</p>
                        <h3 className="text-3xl font-black tracking-tight">{plan.name} Plan</h3>
                        <p className="text-slate-400 text-sm font-medium mt-1">Review your subscription details</p>
                    </div>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                    {/* Summary Row */}
                    <div className="flex justify-between items-center text-slate-900">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Subscription Tier</p>
                            <p className="text-lg font-black">{plan.name} Membership</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Price / Month</p>
                            <p className="text-lg font-black">₹{pricePerMonth}</p>
                        </div>
                    </div>

                    {/* Duration Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Select Duration</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {DURATIONS.map((d) => (
                                <button
                                    key={d.months}
                                    onClick={() => {
                                        setDuration(d.months);
                                        setCouponData(null); // Reset coupon when duration changes
                                        setCouponCode('');
                                    }}
                                    className={clsx(
                                        "relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1",
                                        duration === d.months 
                                            ? "border-indigo-600 bg-indigo-50" 
                                            : "border-slate-100 bg-slate-50 hover:border-slate-200"
                                    )}
                                >
                                    <span className="text-xs font-black">{d.label}</span>
                                    {d.discount > 0 && (
                                        <span className="text-[8px] font-bold uppercase text-emerald-600">
                                            Save {(d.discount * 100)}%
                                        </span>
                                    )}
                                    {duration === d.months && (
                                        <div className="absolute -top-2 -right-2 bg-indigo-600 rounded-full p-1 shadow-sm">
                                            <Check className="h-2 w-2 text-white stroke-[4px]" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Coupon Input */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Have a coupon code?</label>
                        {couponData ? (
                            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl group transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500 rounded-lg">
                                        <Check className="h-4 w-4 text-white stroke-[3px]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Coupon Applied</p>
                                        <p className="text-sm font-black text-emerald-900">{couponCode}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        setCouponData(null);
                                        setCouponCode('');
                                    }}
                                    className="p-2 hover:bg-emerald-100 rounded-xl transition-colors text-emerald-600"
                                    title="Remove Coupon"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <div className="relative flex-grow">
                                    <input 
                                        type="text" 
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        placeholder="ENTER CODE"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold uppercase tracking-widest focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                    />
                                </div>
                                <button 
                                    onClick={handleApplyCoupon}
                                    disabled={isValidating || !couponCode}
                                    className="px-6 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-all"
                                >
                                    {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                                </button>
                            </div>
                        )}
                        {error && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{error}</p>}
                        {couponData && (
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                                Applied: {couponData.discountValue}{couponData.discountType === 'percentage' ? '%' : ' OFF'}
                            </p>
                        )}
                    </div>

                    {/* Price Breakdown */}
                    <div className="bg-slate-50 rounded-[2rem] p-5 space-y-2.5">
                        <div className="flex justify-between text-sm font-bold text-slate-500">
                            <span>Base Subtotal ({duration} {duration === 1 ? 'Month' : 'Months'})</span>
                            <span>₹{baseAggregate}</span>
                        </div>
                        {multiMonthDiscount > 0 && (
                            <div className="flex justify-between text-sm font-bold text-emerald-600">
                                <span>Multi-Month Savings</span>
                                <span>-₹{multiMonthDiscount}</span>
                            </div>
                        )}
                        {couponDiscount > 0 && (
                            <div className="flex justify-between text-sm font-bold text-emerald-600">
                                <span>Coupon Discount</span>
                                <span>-₹{couponDiscount}</span>
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
                        onClick={() => onPay(plan.id, plan.name, couponCode, totalPayable === 0, duration)}
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

export default CheckoutModal;
