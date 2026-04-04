import { X, Printer, Download, CheckCircle2, Building2, User, Calendar, Clock, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const ReceiptModal = ({ isOpen, onClose, appointment }) => {
    if (!appointment) return null;

    const handlePrint = () => {
        window.print();
    };

    // Calculate Breakdown (Matching backend logic)
    const B = parseFloat(appointment.price) || 0;
    const PLATFORM_FEE_NET = 5;
    const GST_RATE = 0.18;
    const RZP_FEE_RATE = 0.02;

    const calculateBreakdown = (basePrice) => {
        if (basePrice === 0) return { base: 0, platform: 0, rzp: 0, gst: 0, total: 0 };
        const total = (basePrice + (PLATFORM_FEE_NET * (1 + GST_RATE))) / (1 - (RZP_FEE_RATE * (1 + GST_RATE)));
        const rzp = total * RZP_FEE_RATE;
        const totalGst = (PLATFORM_FEE_NET * GST_RATE) + (rzp * GST_RATE);
        return {
            base: basePrice,
            platform: PLATFORM_FEE_NET,
            rzp: rzp,
            gst: totalGst,
            total: total
        };
    };

    const breakdown = calculateBreakdown(B);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-3 text-indigo-600">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <span className="font-bold text-lg">Transaction Receipt</span>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Scrollable Receipt Content */}
                        <div className="flex-1 overflow-y-auto p-8 print-container" id="receipt-content">
                            <div className="flex flex-col items-center mb-10 text-center">
                                <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
                                    <span className="text-white text-3xl font-black">Q</span>
                                </div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Queuify Digital Receipt</h1>
                                <p className="text-gray-500 font-medium">#{appointment.id.toUpperCase().slice(0, 8)}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Issued By</h4>
                                    <div className="flex items-start gap-3">
                                        <Building2 className="h-5 w-5 text-gray-400 mt-1" />
                                        <div>
                                            <p className="font-bold text-gray-900">{appointment.org_name}</p>
                                            <p className="text-sm text-gray-500 leading-relaxed">{appointment.org_address || 'Official Partner Outlet'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Issued To</h4>
                                    <div className="flex items-start gap-3">
                                        <User className="h-5 w-5 text-gray-400 mt-1" />
                                        <div>
                                            <p className="font-bold text-gray-900">{appointment.customer_name || 'Valued Customer'}</p>
                                            <p className="text-sm text-gray-500">{appointment.customer_phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-6 mb-10 grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-indigo-500" />
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Date</p>
                                        <p className="font-bold text-gray-900 leading-tight">{format(new Date(appointment.start_time), 'MMM dd, yyyy')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-indigo-500" />
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Token</p>
                                        <p className="font-bold text-gray-900 leading-tight">#{appointment.token_number}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Breakdown */}
                            <div className="space-y-4 border-t border-gray-100 pt-8">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-6">Payment Summary</h4>
                                
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-gray-500 font-medium">Professional Consultation ({appointment.service_name})</span>
                                    <span className="font-bold text-gray-900">₹{breakdown.base.toFixed(2)}</span>
                                </div>
                                
                                {breakdown.total > 0 && (
                                    <>
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-gray-500 font-medium italic">Convenience & Platform Fee</span>
                                            <span className="font-bold text-gray-900">₹{(breakdown.platform + breakdown.rzp).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-gray-500 font-medium">Taxes (GST 18%)</span>
                                            <span className="font-bold text-gray-900">₹{breakdown.gst.toFixed(2)}</span>
                                        </div>
                                    </>
                                )}

                                <div className="pt-6 mt-6 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-indigo-600 tracking-widest mb-1">Total Paid</p>
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-5 w-5 text-gray-400" />
                                            <span className="text-sm text-gray-500 font-medium">Paid via Digital Wallet/Gateay</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-3xl font-black text-gray-900 tracking-tighter">₹{breakdown.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-12 pt-8 border-t border-gray-50 text-center">
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em] mb-2">Thank you for choosing Queuify</p>
                                <p className="text-xs text-gray-400 italic">This is a system generated receipt. No physical signature required.</p>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 bg-gray-50 flex gap-3 no-print">
                            <button
                                onClick={handlePrint}
                                className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <Printer className="h-5 w-5" />
                                Print Receipt
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                            >
                                <Download className="h-5 w-5" />
                                Download PDF
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ReceiptModal;
