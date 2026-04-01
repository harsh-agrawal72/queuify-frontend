import { useState, useEffect } from 'react';
import { 
    Wallet, 
    TrendingUp, 
    Lock, 
    ArrowUpRight, 
    ArrowDownLeft, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    CreditCard, 
    History,
    IndianRupee,
    Loader2,
    Search,
    Filter,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const WalletDashboard = () => {
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
    const [payoutForm, setPayoutForm] = useState({
        amount: '',
        bankDetails: {
            accountHolder: '',
            accountNumber: '',
            ifsc: '',
            bankName: '',
            upiId: ''
        }
    });

    const fetchWalletData = async () => {
        try {
            const [walletRes, transRes, orgRes] = await Promise.all([
                api.get('/payments/status'),
                api.get('/payments/transactions'),
                api.get('/admin/org')
            ]);
            setWallet(walletRes.data);
            setTransactions(transRes.data.transactions || []);
            
            // Pre-fill payout form if bank details are saved
            if (orgRes.data && (orgRes.data.payout_account_number || orgRes.data.payout_upi_id)) {
                setPayoutForm(prev => ({
                    ...prev,
                    bankDetails: {
                        accountHolder: orgRes.data.payout_account_holder || '',
                        accountNumber: orgRes.data.payout_account_number || '',
                        ifsc: orgRes.data.payout_ifsc || '',
                        bankName: orgRes.data.payout_bank_name || '',
                        upiId: orgRes.data.payout_upi_id || ''
                    }
                }));
            }
        } catch (error) {
            toast.error('Failed to load wallet data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWalletData();
    }, []);

    const handlePayoutRequest = async (e) => {
        e.preventDefault();
        if (parseFloat(payoutForm.amount) > wallet?.available_balance) {
            toast.error('Insufficient available balance');
            return;
        }

        try {
            await api.post('/payments/payout', payoutForm);
            toast.success('Payout request submitted successfully');
            setIsPayoutModalOpen(false);
            fetchWalletData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Payout request failed');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    const StatCard = ({ title, amount, icon: Icon, color, subtitle }) => (
        <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group"
        >
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 transition-transform group-hover:scale-150 duration-500 ${color}`} />
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
                    <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
                </div>
                <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
                    <TrendingUp className="h-3 w-3" />
                    +12%
                </div>
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1 flex items-center">
                    <IndianRupee className="h-5 w-5 mr-0.5" />
                    {parseFloat(amount).toLocaleString('en-IN')}
                </h3>
                {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
            </div>
        </motion.div>
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Financial Hub</h1>
                    <p className="text-gray-500 mt-1">Manage your earnings, escrow funds, and payouts.</p>
                </div>
                <button 
                    onClick={() => setIsPayoutModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <ArrowUpRight className="h-5 w-5" />
                    Request Payout
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Revenue" 
                    amount={parseFloat(wallet?.available_balance || 0) + parseFloat(wallet?.locked_funds || 0)} 
                    icon={Wallet} 
                    color="bg-indigo-500"
                    subtitle="Includes locked and available funds"
                />
                <StatCard 
                    title="Available Balance" 
                    amount={wallet?.available_balance || 0} 
                    icon={CheckCircle2} 
                    color="bg-emerald-500"
                    subtitle="Ready for payout transfer"
                />
                <StatCard 
                    title="Locked in Escrow" 
                    amount={wallet?.locked_funds || 0} 
                    icon={Lock} 
                    color="bg-amber-500"
                    subtitle="Pending check-in verification"
                />
            </div>

            {/* Layout Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Transaction History */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-6 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
                                    <History className="h-5 w-5" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">Transaction Ledger</h2>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg"><Search className="h-5 w-5" /></button>
                                <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg"><Filter className="h-5 w-5" /></button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Type</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Service & Transaction</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    <AnimatePresence>
                                        {transactions.map((tx, idx) => (
                                            <motion.tr 
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={tx.id} 
                                                className="hover:bg-gray-50/50 transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className={`p-2 rounded-lg inline-flex ${tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                        {tx.type === 'credit' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-semibold text-gray-900">{tx.customer_name || 'System'}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]">{tx.customer_email || 'Internal Transaction'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-semibold text-gray-900">{tx.service_name || tx.description}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <p className="text-[10px] text-indigo-500 uppercase font-black tracking-tight bg-indigo-50 px-1.5 py-0.5 rounded">
                                                            {tx.razorpay_payment_id || `REF: ${tx.reference_id?.substring(0,8)}`}
                                                        </p>
                                                        {tx.razorpay_payment_id && <span className="text-[9px] text-gray-300 font-bold uppercase">Razorpay</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-sm text-gray-900 whitespace-nowrap">
                                                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                        tx.status === 'confirmed' || tx.status === 'completed' || tx.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 
                                                        tx.status === 'locked' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-600'
                                                    }`}>
                                                        {tx.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500 font-medium whitespace-nowrap">
                                                    {tx.created_at ? format(new Date(tx.created_at), 'MMM dd, HH:mm') : 'N/A'}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                            {transactions.length === 0 && (
                                <div className="py-20 text-center space-y-3">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                                        <History className="h-8 w-8 text-gray-300" />
                                    </div>
                                    <p className="text-gray-400 text-sm font-medium">No transactions found in this period.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Payout Summary & Cards */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 p-8 rounded-3xl text-white relative overflow-hidden shadow-xl shadow-indigo-100">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <IndianRupee className="h-24 w-24" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold uppercase tracking-widest opacity-60">Verified Revenue</span>
                                <CreditCard className="h-5 w-5 opacity-60" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black tracking-tight">
                                    <span className="text-xl mr-1 opacity-60">₹</span>
                                    {parseFloat(wallet?.available_balance || 0).toLocaleString('en-IN')}
                                </h1>
                                <p className="text-xs text-indigo-300 font-medium mt-2">Maximum withdrawal limit: ₹50,000/day</p>
                            </div>
                            <div className="pt-4 flex items-center gap-2">
                                <div className="h-2 flex-1 bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-1000" 
                                        style={{ width: `${Math.min(100, ((parseFloat(wallet?.available_balance || 0) / 50000) * 100)).toFixed(1)}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-bold">
                                    {Math.min(100, ((parseFloat(wallet?.available_balance || 0) / 50000) * 100)).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            Payout Process
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Verified funds are instantly added to your <span className="font-bold text-indigo-600">Available Balance</span>. You can then request a manual payout to your bank account.
                        </p>
                        <button 
                            onClick={() => setIsPayoutModalOpen(true)}
                            className="w-full text-xs font-bold text-indigo-600 bg-indigo-50 py-3 rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 group"
                        >
                            Request a Payout Now
                            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Payout Modal */}
            <AnimatePresence>
                {isPayoutModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsPayoutModalOpen(false)}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-black text-gray-900">Request Fund Transfer</h2>
                                    <button onClick={() => setIsPayoutModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <XCircle className="h-6 w-6 text-gray-400" />
                                    </button>
                                </div>

                                <form onSubmit={handlePayoutRequest} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Amount to Withdraw (Min. ₹500)</label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input 
                                                required
                                                type="number"
                                                min="500"
                                                placeholder="500.00"
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold transition-all"
                                                value={payoutForm.amount}
                                                onChange={(e) => setPayoutForm({...payoutForm, amount: e.target.value})}
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-2 ml-1">Available: ₹{wallet?.available_balance || 0}</p>
                                    </div>

                                    <div className="space-y-4 pt-2">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Transfer Destination</p>
                                        {payoutForm.bankDetails.accountNumber ? (
                                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                                        <CreditCard className="h-4 w-4 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Saved Bank Account</p>
                                                        <p className="text-sm font-bold text-indigo-900 truncate">
                                                            {payoutForm.bankDetails.bankName} •••• {payoutForm.bankDetails.accountNumber.slice(-4)}
                                                        </p>
                                                        <p className="text-[10px] text-indigo-700 font-medium">{payoutForm.bankDetails.accountHolder}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 text-center space-y-2">
                                                <p className="text-xs text-gray-500">No bank details saved.</p>
                                                <button 
                                                    type="button"
                                                    onClick={() => navigate('/admin/settings')}
                                                    className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
                                                >
                                                    Go to Settings to add Bank Info
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={!payoutForm.bankDetails.accountNumber || parseFloat(payoutForm.amount) < 500}
                                        className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 mt-4 disabled:opacity-50 disabled:grayscale"
                                    >
                                        Verify & Transfer Funds
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WalletDashboard;
