import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, ScrollText, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const TermsModal = ({ isOpen, onClose, onAgree }) => {
    if (!isOpen) return null;

    const terms = [
        {
            title: "Accuracy of Service Information",
            icon: Info,
            content: "As a business owner/admin, you agree to provide accurate information regarding your services, starting hours, and wait times. Misleading information can lead to account suspension."
        },
        {
            title: "Real-time Queue Management",
            icon: ScrollText,
            content: "You are responsible for updating the status of appointments (Serving, Completed, Cancelled) in real-time to ensure the Queuify algorithm remains accurate for all users."
        },
        {
            title: "Data Privacy & Security",
            icon: ShieldCheck,
            content: "You agree to protect the personal data (names, emails, phone numbers) of customers who book through your organization. Use of this data for spam or unauthorized purposes is strictly prohibited."
        },
        {
            title: "Platform Integrity",
            icon: AlertTriangle,
            content: "Creation of fake organizations or multiple accounts to manipulate ratings or system visibility is a violation of our terms."
        },
        {
            title: "Communication Consent",
            icon: CheckCircle2,
            content: "By signing up, you agree to receive essential operational emails and notifications related to your queue management and organization status."
        }
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative"
                >
                    {/* Header */}
                    <div className="p-8 pb-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                                <ScrollText className="h-6 w-6" />
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Terms & Conditions</h2>
                        <p className="text-gray-500 mt-1 font-medium italic">Please review our business agreement before joining Queuify.</p>
                    </div>

                    {/* Content */}
                    <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                        {terms.map((term, index) => {
                            const Icon = term.icon;
                            return (
                                <div key={index} className="flex gap-5 group">
                                    <div className="flex-shrink-0 w-12 h-12 bg-white border-2 border-gray-100 rounded-xl flex items-center justify-center group-hover:border-indigo-600 group-hover:bg-indigo-50 transition-all duration-300">
                                        <Icon className="h-6 w-6 text-gray-400 group-hover:text-indigo-600" />
                                    </div>
                                    <div className="pt-1">
                                        <h3 className="text-lg font-bold text-gray-900 mb-1.5 group-hover:text-indigo-900 transition-colors uppercase tracking-wide text-xs">
                                            {term.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {term.content}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mt-4">
                            <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                <strong>Legal Note:</strong> These terms govern your use of the Queuify platform as an administrator. Failure to comply with these terms may result in immediate termination of your organization profile without prior notice.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-8 bg-gray-50/80 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={onClose}
                            className="flex-1 px-6 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all active:scale-95 shadow-sm"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={onAgree}
                            className="flex-[2] px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 group"
                        >
                            I Understand & Accept Terms
                            <CheckCircle2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default TermsModal;
