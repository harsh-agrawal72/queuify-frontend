import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, ShieldCheck, ScrollText, AlertTriangle, CheckCircle2, Info,
    CreditCard, Wallet, Building2, User, Banknote, RefreshCw, Lock, Star
} from 'lucide-react';

// ─── USER Terms ───
const USER_TERMS = [
    {
        icon: CheckCircle2,
        color: 'indigo',
        title: "Booking & Queue Commitment",
        content: "When you book an appointment, you are holding a spot in the queue. You are expected to be present at your estimated time. Repeated 'No Shows' may affect your ability to book in the future."
    },
    {
        icon: CreditCard,
        color: 'blue',
        title: "Secure Payments via Razorpay",
        content: "All payments are processed securely through Razorpay. A convenience fee (covering gateway charges and a platform fee) is added to your base service price. This is shown transparently before you pay."
    },
    {
        icon: RefreshCw,
        color: 'emerald',
        title: "Refunds & Cancellation Policy",
        content: "If you cancel more than 3 hours before your slot, you receive a 100% refund. Cancellations within 3 hours receive an 85% refund. Admin-initiated cancellations always entitle you to a full refund. No refund is issued for 'No Show' status."
    },
    {
        icon: Lock,
        color: 'amber',
        title: "Escrow Payment Protection",
        content: "Your payment is held securely in escrow and is NOT released to the business until the service is confirmed as 'Completed' via OTP verification. This protects you from paying for services not rendered."
    },
    {
        icon: ShieldCheck,
        color: 'purple',
        title: "Data Privacy",
        content: "Your personal data (name, email, phone) is shared with the organization you book with only for the purpose of your appointment. We do not sell your data to third parties."
    },
    {
        icon: Info,
        color: 'slate',
        title: "OTP Verification Responsibility",
        content: "You will receive a 4-digit OTP for your appointment. Share this OTP with the service provider at the time of service to confirm completion and release your payment. Do not share this OTP beforehand."
    }
];

// ─── BUSINESS/ADMIN Terms ───
const ORG_TERMS = [
    {
        icon: Info,
        color: 'indigo',
        title: "Accuracy of Service Information",
        content: "You must provide accurate information about your services, operating hours, and wait times. Misleading information can lead to account suspension. Regularly update your service details as they change."
    },
    {
        icon: ScrollText,
        color: 'blue',
        title: "Real-time Queue Management",
        content: "You are responsible for updating appointment statuses (Serving, Completed, Cancelled) in real-time. This ensures the Queuify algorithm remains accurate for customers and prevents disputes."
    },
    {
        icon: Wallet,
        color: 'emerald',
        title: "Payment Settlement & Wallet",
        content: "Customer payments are held in escrow by Queuify. Funds are credited to your Wallet only after a service is marked as 'Completed' via OTP verification. Disputed payments will be held until resolved."
    },
    {
        icon: Banknote,
        color: 'teal',
        title: "Payouts & Platform Fees",
        content: "You receive the exact base service price you set — all Razorpay transaction fees (2% + 18% GST) and the Queuify platform fee (₹5/transaction) are transparently charged to the end customer as a 'Convenience Fee'. You will never be deducted these charges."
    },
    {
        icon: RefreshCw,
        color: 'amber',
        title: "Admin Cancellation Policy",
        content: "If you cancel a paid appointment for any reason, the customer is entitled to a 100% full refund. Recurring admin cancellations may result in a ₹20 penalty per cancellation, deducted from your wallet balance."
    },
    {
        icon: Building2,
        color: 'purple',
        title: "Platform Integrity",
        content: "Creation of fake organizations, fraudulent services, or manipulation of ratings is strictly prohibited and will result in immediate account termination and potential legal action."
    },
    {
        icon: ShieldCheck,
        color: 'rose',
        title: "Customer Data Protection",
        content: "You agree to protect all customer data (names, emails, phone numbers) obtained through bookings. Using this data for marketing, spam, or sharing with third parties without explicit consent is prohibited."
    }
];

const colorMap = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', hover: 'group-hover:border-indigo-500 group-hover:bg-indigo-50 group-hover:text-indigo-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', hover: 'group-hover:border-blue-500 group-hover:bg-blue-50 group-hover:text-blue-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', hover: 'group-hover:border-emerald-500 group-hover:bg-emerald-50 group-hover:text-emerald-600' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100', hover: 'group-hover:border-teal-500 group-hover:bg-teal-50 group-hover:text-teal-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', hover: 'group-hover:border-amber-500 group-hover:bg-amber-50 group-hover:text-amber-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', hover: 'group-hover:border-purple-500 group-hover:bg-purple-50 group-hover:text-purple-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', hover: 'group-hover:border-rose-500 group-hover:bg-rose-50 group-hover:text-rose-600' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', hover: 'group-hover:border-slate-500 group-hover:bg-slate-50 group-hover:text-slate-600' },
};

/**
 * TermsModal
 * @prop {boolean} isOpen
 * @prop {function} onClose
 * @prop {function} onAgree
 * @prop {'user' | 'org'} role — determines which set of T&Cs to show
 */
const TermsModal = ({ isOpen, onClose, onAgree, role = 'org' }) => {
    if (!isOpen) return null;

    const isUser = role === 'user';
    const terms = isUser ? USER_TERMS : ORG_TERMS;

    const headerConfig = isUser
        ? {
            icon: User,
            gradientFrom: 'from-indigo-600',
            gradientTo: 'to-blue-600',
            title: 'User Terms & Conditions',
            subtitle: 'Please read our terms carefully before creating your account.',
            legalNote: 'By creating an account, you agree to abide by these terms. Violations, including payment fraud or abuse of the dispute system, may result in account suspension.',
        }
        : {
            icon: Building2,
            gradientFrom: 'from-blue-600',
            gradientTo: 'to-indigo-700',
            title: 'Business Terms & Conditions',
            subtitle: 'Please review our complete business agreement before joining Queuify as a partner.',
            legalNote: 'These terms govern your use of Queuify as a business administrator. Non-compliance may result in immediate suspension of your organization profile and wallet payout restrictions.',
        };

    const HeaderIcon = headerConfig.icon;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative my-4"
                >
                    {/* Header */}
                    <div className={`p-8 pb-6 bg-gradient-to-br ${headerConfig.gradientFrom} ${headerConfig.gradientTo} text-white relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl" />
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                                    <HeaderIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        {isUser
                                            ? <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">For Users</span>
                                            : <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">For Businesses</span>
                                        }
                                    </div>
                                    <h2 className="text-2xl font-extrabold tracking-tight">{headerConfig.title}</h2>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/70 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <p className="relative z-10 text-white/80 mt-3 font-medium text-sm">{headerConfig.subtitle}</p>
                    </div>

                    {/* Content */}
                    <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar flex-1">
                        {terms.map((term, index) => {
                            const Icon = term.icon;
                            const colors = colorMap[term.color] || colorMap.indigo;
                            return (
                                <div key={index} className="flex gap-4 group">
                                    <div className={`flex-shrink-0 w-11 h-11 bg-white border-2 border-gray-100 rounded-2xl flex items-center justify-center transition-all duration-300 text-gray-400 ${colors.hover}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="pt-1">
                                        <h3 className="text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wider group-hover:text-indigo-700 transition-colors">
                                            {term.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {term.content}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Payment Highlight Box — shown for both roles but different content */}
                        <div className={`rounded-2xl p-5 border ${isUser ? 'bg-indigo-50 border-indigo-100' : 'bg-blue-50 border-blue-100'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <CreditCard className={`h-4 w-4 ${isUser ? 'text-indigo-600' : 'text-blue-600'}`} />
                                <p className={`text-xs font-black uppercase tracking-widest ${isUser ? 'text-indigo-700' : 'text-blue-700'}`}>
                                    Payment Summary
                                </p>
                            </div>
                            {isUser ? (
                                <p className="text-xs text-indigo-800 font-medium leading-relaxed">
                                    You pay: <strong>Base Service Price + Convenience Fee + GST</strong>. The convenience fee covers Razorpay's gateway charges (2% + 18% GST) and Queuify's platform fee (₹5). This breakdown is always shown to you before payment.
                                </p>
                            ) : (
                                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                                    You receive: <strong>100% of your set service price</strong>. Queuify charges a platform fee (₹5/booking) and Razorpay charges a gateway fee (2% + 18% GST) — both are collected from the customer as a transparent "Convenience Fee". Your wallet reflects only your base service price.
                                </p>
                            )}
                        </div>

                        {/* Legal Note */}
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                    <strong>Legal Note:</strong> {headerConfig.legalNote}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-gray-50/80 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3.5 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all active:scale-95 shadow-sm text-sm"
                        >
                            Decline
                        </button>
                        <button
                            onClick={onAgree}
                            className={`flex-[2] px-6 py-3.5 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2 group text-sm ${isUser ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                        >
                            I Understand & Accept All Terms
                            <CheckCircle2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default TermsModal;
