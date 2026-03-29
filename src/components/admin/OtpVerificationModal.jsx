import { useState, useRef, useEffect } from 'react';
import { 
    X, 
    ShieldCheck, 
    CheckCircle2, 
    AlertCircle,
    Loader2,
    Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';

const OtpVerificationModal = ({ isOpen, onClose, appointmentId, onVerified }) => {
    const [otp, setOtp] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRefs = [useRef(), useRef(), useRef(), useRef()];

    useEffect(() => {
        if (isOpen) {
            setOtp(['', '', '', '']);
            setError('');
            setTimeout(() => inputRefs[0].current?.focus(), 100);
        }
    }, [isOpen]);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        if (value && index < 3) {
            inputRefs[index + 1].current?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handleVerify = async () => {
        const fullOtp = otp.join('');
        if (fullOtp.length < 4) {
            setError('Please enter the full 4-digit OTP');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await api.post(`/appointments/${appointmentId}/verify-otp`, { otp: fullOtp });
            toast.success('Check-in Verified Successfully!');
            onVerified();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
                    onClick={onClose}
                />
                
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl relative z-10 overflow-hidden"
                >
                    <div className="p-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <h3 className="font-black text-gray-900 leading-none">Security Check</h3>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-bold text-gray-900">Verify Check-In OTP</h2>
                            <p className="text-sm text-gray-500">Ask the customer for the 4-digit code shown on their ticket.</p>
                        </div>

                        <div className="flex justify-center gap-4 py-2">
                            {otp.map((digit, idx) => (
                                <input
                                    key={idx}
                                    ref={inputRefs[idx]}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    className={`w-14 h-16 text-center text-3xl font-black rounded-2xl border-2 transition-all outline-none ${
                                        error ? 'border-rose-100 bg-rose-50 text-rose-600 focus:border-rose-400' : 
                                        'border-gray-100 bg-gray-50 text-indigo-600 focus:border-indigo-500 focus:bg-white'
                                    }`}
                                    value={digit}
                                    onChange={(e) => handleChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(idx, e)}
                                />
                            ))}
                        </div>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }} 
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 text-rose-500 bg-rose-50 p-3 rounded-xl text-xs font-bold"
                            >
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </motion.div>
                        )}

                        <button 
                            onClick={handleVerify}
                            disabled={loading || otp.some(d => !d)}
                            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                <>
                                    <ShieldCheck className="h-5 w-5" />
                                    <span>Verify & Unlock Funds</span>
                                </>
                            )}
                        </button>

                        <div className="text-center">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                Secured Verification
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default OtpVerificationModal;
