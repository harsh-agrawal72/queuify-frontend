import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Check, ArrowRight, Loader2, Shield 
} from 'lucide-react';
import { apiService } from '../../services/api';
import { toast } from 'react-hot-toast';

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

export default CheckoutModal;
