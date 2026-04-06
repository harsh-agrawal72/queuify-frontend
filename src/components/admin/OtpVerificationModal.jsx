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

const OtpVerificationModal = ({ isOpen, onClose, appointment, onVerified, org }) => {
    const appointmentId = appointment?.id;
    const [isSuccess, setIsSuccess] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '']);
    const [remarks, setRemarks] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRefs = useRef([]);

    useEffect(() => {
        if (isOpen) {
            setOtp(['', '', '', '']);
            setRemarks('');
            setError('');
            setIsSuccess(false);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    }, [isOpen]);

    const handleChange = (index, value) => {
        // If multiple digits (e.g. paste or fast typing), distribute them
        if (value.length > 1) {
            const digits = value.split('').filter(d => /^\d$/.test(d));
            const newOtp = [...otp];
            for (let i = 0; i < digits.length && (index + i) < 4; i++) {
                newOtp[index + i] = digits[i];
            }
            setOtp(newOtp);
            const nextIndex = Math.min(index + digits.length, 3);
            inputRefs.current[nextIndex].focus();
            return;
        }

        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input if value is entered
        if (value && index < 3) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').trim();
        const digits = data.split('').filter(d => /^\d$/.test(d)).slice(0, 4);
        
        if (digits.length > 0) {
            const newOtp = [...otp];
            digits.forEach((d, i) => {
                newOtp[i] = d;
            });
            setOtp(newOtp);
            inputRefs.current[Math.min(digits.length - 1, 3)].focus();
        }
    };

    const handleVerify = async () => {
        const fullOtp = otp.join('');
        if (fullOtp.length !== 4) {
            setError('Please enter all 4 digits');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post(`/appointments/${appointmentId}/verify-otp`, { 
                otp: fullOtp,
                remarks: remarks.trim() || null 
            });
            toast.success('Check-in verified successfully');
            onVerified(appointmentId);
            setIsSuccess(true);
        } catch (err) {
            console.error('OTP Verification Error:', err);
            setError(err.response?.data?.message || 'Verification failed. Please check the OTP and try again.');
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
                    {isSuccess ? (
                        <div className="p-10 text-center space-y-6">
                            <motion.div 
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: [0.5, 1.2, 1], opacity: 1 }}
                                className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto"
                            >
                                <CheckCircle2 className="h-10 w-10 font-bold" />
                            </motion.div>
                            
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Check-in Verified!</h2>
                                <p className="text-sm text-gray-500">The service has been completed and funds released from escrow.</p>
                            </div>

                            <div className="space-y-3 pt-4">
                                <button 
                                    onClick={onClose}
                                    className="w-full bg-gray-50 text-gray-600 font-bold py-4 rounded-2xl hover:bg-gray-100 transition-all"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : (
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
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    className={`w-14 h-16 text-center text-3xl font-black rounded-2xl border-2 transition-all outline-none ${
                                        error ? 'border-rose-100 bg-rose-50 text-rose-600 focus:border-rose-400' : 
                                        'border-gray-100 bg-gray-50 text-indigo-600 focus:border-indigo-500 focus:bg-white'
                                    }`}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                />
                            ))}
                        </div>

                        {/* Admin Remarks Field */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Internal Note (Optional)</label>
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Add optional remarks about this visit..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all resize-none h-20 placeholder:text-gray-300"
                            />
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
                                    <span>
                                        {parseFloat(appointment?.price || 0) > 0 ? 'Verify & Unlock Funds' : 'Verify & Complete Visit'}
                                    </span>
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
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default OtpVerificationModal;
