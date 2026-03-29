import { useState, useEffect } from 'react';
import { 
    X, 
    ShieldCheck, 
    CreditCard, 
    Smartphone, 
    IndianRupee, 
    Loader2,
    CheckCircle2,
    Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RazorpayModal = ({ isOpen, onClose, amount, onPaymentSuccess, orgName }) => {
    const [step, setStep] = useState('method'); // method, card, processing, success
    const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '' });

    useEffect(() => {
        if (!isOpen) {
            setStep('method');
            setCardData({ number: '', expiry: '', cvv: '' });
        }
    }, [isOpen]);

    const handlePay = () => {
        setStep('processing');
        // Simulate realistic network delay
        setTimeout(() => {
            setStep('success');
            setTimeout(() => {
                onPaymentSuccess({ 
                    razorpay_order_id: `order_mock_${Math.random().toString(36).substring(2, 10)}`,
                    razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 10)}`,
                    razorpay_signature: 'valid_mock_signature'
                });
                onClose();
            }, 1500);
        }, 3000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                    onClick={onClose}
                />
                
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-[#1D212F] w-full max-w-sm rounded-[24px] shadow-2xl relative z-10 overflow-hidden text-white font-sans"
                >
                    {/* Header */}
                    <div className="px-6 py-4 flex items-center justify-between border-b border-gray-700/50">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs shadow-lg shadow-indigo-500/30">
                                {orgName?.[0] || 'Q'}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold truncate max-w-[150px]">{orgName || 'Queuify'}</h3>
                                <p className="text-[10px] text-gray-400 font-medium">Secured by Razorpay</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-gray-700/50 rounded-full transition-colors">
                            <X className="h-5 w-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            {step === 'method' && (
                                <motion.div 
                                    key="method"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                                        <h2 className="text-3xl font-black flex items-center justify-center gap-1">
                                            <IndianRupee className="h-6 w-6" />
                                            {amount}
                                        </h2>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-gray-400">SELECT PAYMENT METHOD</p>
                                        <button 
                                            onClick={() => setStep('card')}
                                            className="w-full flex items-center gap-4 bg-gray-800/50 p-4 rounded-xl border border-gray-700 hover:border-indigo-500 transition-all group"
                                        >
                                            <CreditCard className="h-5 w-5 text-gray-400 group-hover:text-indigo-400" />
                                            <div className="text-left">
                                                <p className="text-sm font-bold">Credit / Debit Card</p>
                                                <p className="text-[10px] text-gray-500">Visa, Mastercard, RuPay</p>
                                            </div>
                                        </button>
                                        <button className="w-full flex items-center gap-4 bg-gray-800/50 p-4 rounded-xl border border-gray-700 opacity-50 cursor-not-allowed grayscale">
                                            <Smartphone className="h-5 w-5 text-gray-400" />
                                            <div className="text-left">
                                                <p className="text-sm font-bold">UPI (PhonePe, GPay)</p>
                                                <p className="text-[10px] text-gray-500">Fast & Direct</p>
                                            </div>
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 'card' && (
                                <motion.div 
                                    key="card"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-5"
                                >
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-400">CARD NUMBER</p>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                placeholder="4242 4242 4242 4242"
                                                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                value={cardData.number}
                                                onChange={(e) => setCardData({...cardData, number: e.target.value})}
                                            />
                                            <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-gray-400">EXPIRY</p>
                                            <input 
                                                type="text" 
                                                placeholder="MM/YY"
                                                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                value={cardData.expiry}
                                                onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-gray-400">CVV</p>
                                            <div className="relative">
                                                <input 
                                                    type="password" 
                                                    placeholder="•••"
                                                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                    value={cardData.cvv}
                                                    onChange={(e) => setCardData({...cardData, cvv: e.target.value})}
                                                />
                                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handlePay}
                                        className="w-full bg-[#339AF0] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 hover:brightness-110 transition-all active:scale-95"
                                    >
                                        PAY ₹{amount}
                                    </button>
                                </motion.div>
                            )}

                            {step === 'processing' && (
                                <motion.div 
                                    key="processing"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center py-12 space-y-4"
                                >
                                    <Loader2 className="h-12 w-12 text-[#339AF0] animate-spin" />
                                    <div className="text-center">
                                        <p className="text-sm font-bold">Processing Payment</p>
                                        <p className="text-[10px] text-gray-400 mt-1">Please do not refresh this page</p>
                                    </div>
                                </motion.div>
                            )}

                            {step === 'success' && (
                                <motion.div 
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center py-12 space-y-4 text-center"
                                >
                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Payment Successful</p>
                                        <p className="text-[10px] text-gray-400 mt-1">Transaction ID: MOCK_{Math.floor(Math.random() * 1000000)}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-800/20 flex items-center justify-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        <ShieldCheck className="h-3 w-3 text-emerald-500" />
                        PCI-DSS Compliant Security
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default RazorpayModal;
