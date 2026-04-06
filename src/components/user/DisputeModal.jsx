import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Send, Loader2 } from 'lucide-react';

const DisputeModal = ({ isOpen, onClose, onSubmit, appointment }) => {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) return;
        
        setLoading(true);
        try {
            await onSubmit(appointment.id, reason);
            onClose();
            setReason('');
        } catch (error) {
            console.error('Dispute submission failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
                >
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-rose-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-100 rounded-xl">
                                <AlertCircle className="h-5 w-5 text-rose-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900 tracking-tight">Report an Issue</h3>
                                <p className="text-xs text-rose-600 font-bold uppercase tracking-wider">Appointment Dispute</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                            <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                <strong>Important:</strong> If you believe you were incorrectly marked as a "No-Show" or the service was not provided as expected, please describe the issue. Our support team will review it and arbitrate the refund.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                Explain the problem
                            </label>
                            <textarea
                                required
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Example: I was present at the clinic at 5:00 PM but was marked as No-Show..."
                                className="w-full h-32 px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm resize-none font-medium"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !reason.trim()}
                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-100 hover:shadow-indigo-200 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Submit Report
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default DisputeModal;
