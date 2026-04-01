import React, { useMemo, useState } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
    Wallet, CreditCard, Clock, CheckCircle2, AlertCircle, TrendingUp, History, Search, Filter, 
    RefreshCw, IndianRupee, ArrowDownLeft, ArrowUpRight, Copy, ExternalLink, XCircle
} from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO, startOfMonth, eachMonthOfInterval, subMonths, isSameMonth } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const UserPayments = ({ bookings }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // 1. Calculate Advanced Analytics
    const stats = useMemo(() => {
        const paidOnly = bookings.filter(b => b.payment_status === 'paid');
        const refundedOnly = bookings.filter(b => b.payment_status === 'refunded');
        const pending = bookings.filter(b => 
            b.payment_status === 'pending_payment' || 
            (b.status === 'confirmed' && b.payment_status !== 'paid' && b.payment_status !== 'refunded' && parseFloat(b.price) > 0)
        );
        
        // Net spent = Sum(Prices of Paid) - Sum(Refund Amounts)
        const totalPaidAmount = paidOnly.reduce((sum, b) => sum + parseFloat(b.price || 0), 0);
        const totalRefundedAmount = refundedOnly.reduce((sum, b) => sum + parseFloat(b.refund_amount || 0), 0);
        
        // For partial refunds that are still marked as 'paid' (if any)
        const partialRefunds = paidOnly.reduce((sum, b) => sum + parseFloat(b.refund_amount || 0), 0);
        
        const totalNetSpent = Math.max(0, totalPaidAmount - totalRefundedAmount - partialRefunds);
        const totalRefunds = totalRefundedAmount + partialRefunds;

        return {
            totalNetSpent,
            totalRefunds,
            pendingAmount: pending.reduce((sum, b) => sum + parseFloat(b.price || 0), 0),
            paidCount: paidOnly.length,
            refundCount: refundedOnly.length,
            pendingCount: pending.length,
            totalBookings: bookings.length
        };
    }, [bookings]);

    // 2. Prepare Premium Chart Data (Last 6 Months)
    const chartData = useMemo(() => {
        const now = new Date();
        const months = eachMonthOfInterval({
            start: subMonths(now, 5),
            end: now
        });

        return months.map(month => {
            const monthStart = startOfMonth(month);
            const spentInMonth = bookings
                .filter(b => (b.payment_status === 'paid' || b.payment_status === 'refunded') && isSameMonth(parseISO(b.created_at || new Date().toISOString()), monthStart))
                .reduce((sum, b) => {
                    const price = b.payment_status === 'paid' ? parseFloat(b.price || 0) : 0;
                    const refund = parseFloat(b.refund_amount || 0);
                    return sum + (price - refund);
                }, 0);
            
            return {
                name: format(month, 'MMM'),
                amount: Math.max(0, spentInMonth)
            };
        });
    }, [bookings]);

    // 3. Filtered History
    const filteredHistory = useMemo(() => {
        return bookings.filter(b => {
            const searchStr = `${b.org_name} ${b.service_name} ${b.payment_id} ${b.razorpay_refund_id}`.toLowerCase();
            const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
            
            const matchesFilter = filterStatus === 'all' || 
                               (filterStatus === 'paid' && b.payment_status === 'paid') ||
                               (filterStatus === 'refunded' && b.payment_status === 'refunded') ||
                               (filterStatus === 'cancelled' && b.status === 'cancelled') ||
                               (filterStatus === 'pending' && (b.payment_status === 'pending_payment' || (parseFloat(b.price) > 0 && b.payment_status !== 'paid' && b.payment_status !== 'refunded')));
            
            return matchesSearch && matchesFilter;
        }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [bookings, searchTerm, filterStatus]);

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        toast.success(t('payments_user.copy_id', '{{type}} ID copied!', { type }));
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-8 -mt-8 opacity-50 transition-transform group-hover:scale-150 duration-500" />
                    <div className="relative z-10">
                        <div className="p-3 bg-indigo-600 w-fit rounded-2xl text-white mb-4 shadow-lg shadow-indigo-100">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">{t('payments_user.total_net_spent', 'Total Net Spent')}</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1 flex items-center">
                            <IndianRupee className="h-6 w-6 mr-0.5" />
                            {stats.totalNetSpent.toLocaleString('en-IN')}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-2 text-emerald-600 text-xs font-bold">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span>{t('payments_user.successful_payments', '{{count}} successful payments', { count: stats.paidCount })}</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8 opacity-50 transition-transform group-hover:scale-150 duration-500" />
                    <div className="relative z-10">
                        <div className="p-3 bg-blue-500 w-fit rounded-2xl text-white mb-4 shadow-lg shadow-blue-100">
                            <RefreshCw className="h-6 w-6" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">{t('payments_user.total_refunds', 'Total Refunds')}</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1 flex items-center">
                            <IndianRupee className="h-6 w-6 mr-0.5" />
                            {stats.totalRefunds.toLocaleString('en-IN')}
                        </h3>
                        <p className="text-xs text-gray-400 mt-2 font-medium">{t('payments_user.refunded_appointments', 'Across {{count}} refunded appointments', { count: stats.refundCount })}</p>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8 opacity-50 transition-transform group-hover:scale-150 duration-500" />
                    <div className="relative z-10">
                        <div className="p-3 bg-amber-500 w-fit rounded-2xl text-white mb-4 shadow-lg shadow-amber-100">
                            <Clock className="h-6 w-6" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">{t('payments_user.awaiting_payment', 'Awaiting Payment')}</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1 flex items-center">
                            <IndianRupee className="h-6 w-6 mr-0.5" />
                            {stats.pendingAmount.toLocaleString('en-IN')}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-2 text-amber-600 text-xs font-bold">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>{t('payments_user.pending_appointments', '{{count}} pending appointments', { count: stats.pendingCount })}</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Visual Analytics */}
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm"
            >
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-black text-gray-900">{t('payments_user.spending_trends', 'Spending Trends')}</h3>
                        <p className="text-sm text-gray-500 font-medium">{t('payments_user.monthly_breakdown', 'Your monthly breakdown of service costs')}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                        <History className="h-3 w-3" />
                        {t('payments_user.last_6_months', 'Last 6 Months')}
                    </div>
                </div>
                
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="userSpentGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}}
                                dy={10}
                            />
                            <YAxis hide />
                            <Tooltip 
                                cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                                contentStyle={{ 
                                    borderRadius: '20px', 
                                    border: 'none', 
                                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                    padding: '16px'
                                }}
                                formatter={(value) => [`₹${value.toLocaleString()}`, 'Total Spent']}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="amount" 
                                stroke="#4f46e5" 
                                strokeWidth={4}
                                fillOpacity={1} 
                                fill="url(#userSpentGrad)" 
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Detailed Ledger History */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h3 className="text-xl font-black text-gray-900">{t('payments_user.history_title', 'Transaction History')}</h3>
                        <p className="text-sm text-gray-500 font-medium">{t('payments_user.history_subtitle', 'A detailed log of all payments and refunds')}</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-grow md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder={t('payments_user.search_placeholder', 'Search payments...')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm w-full focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                            />
                        </div>
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-black text-gray-600 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        >
                            <option value="all">{t('payments_user.status.all', 'Status: All')}</option>
                            <option value="paid">{t('payments_user.status.paid', 'Paid')}</option>
                            <option value="refunded">{t('payments_user.status.refunded', 'Refunded')}</option>
                            <option value="pending">{t('payments_user.status.pending', 'Pending')}</option>
                            <option value="cancelled">{t('payments_user.status.cancelled', 'Cancelled')}</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('payments_user.table.service_org', 'Service & Organization')}</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('payments_user.table.trans_details', 'Transaction Details')}</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">{t('payments_user.table.amount', 'Amount')}</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t('payments_user.table.status', 'Status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            <AnimatePresence>
                                {filteredHistory.map((row, idx) => (
                                    <motion.tr 
                                        key={row.id}
                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                                        className="hover:bg-gray-50/50 transition-colors group"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                    {row.service_name || 'Service'}
                                                </span>
                                                <span className="text-xs text-gray-400 font-medium mt-0.5">{row.org_name || 'Organization'}</span>
                                                <span className="text-[10px] text-gray-300 font-bold mt-2 uppercase tracking-tight">
                                                    {format(parseISO(row.created_at || new Date().toISOString()), 'MMM dd, yyyy • hh:mm a')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-2">
                                                {row.payment_id ? (
                                                    <div className="flex items-center gap-2 group/id">
                                                        <span className="font-mono text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg font-black flex items-center gap-1.5 border border-indigo-100">
                                                            <CreditCard className="h-3 w-3" />
                                                            {row.payment_id}
                                                        </span>
                                                        <button onClick={() => copyToClipboard(row.payment_id, 'Payment')} className="opacity-0 group-hover/id:opacity-100 p-1 hover:bg-gray-100 rounded transition-all">
                                                            <Copy className="h-3 w-3 text-gray-400" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-gray-300 italic font-medium">{t('payments_user.no_payment_id', 'No Payment ID')}</span>
                                                )}

                                                {row.razorpay_refund_id && (
                                                    <div className="flex items-center gap-2 group/id">
                                                        <span className="font-mono text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg font-black flex items-center gap-1.5 border border-emerald-100">
                                                            <RefreshCw className="h-3 w-3" />
                                                            {row.razorpay_refund_id}
                                                        </span>
                                                        <button onClick={() => copyToClipboard(row.razorpay_refund_id, 'Refund')} className="opacity-0 group-hover/id:opacity-100 p-1 hover:bg-gray-100 rounded transition-all">
                                                            <Copy className="h-3 w-3 text-gray-400" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className={clsx(
                                                    "text-sm font-black",
                                                    row.payment_status === 'refunded' ? "text-gray-400 line-through decoration-rose-400" : "text-gray-900"
                                                )}>
                                                    ₹{parseFloat(row.price || 0).toLocaleString('en-IN')}
                                                </span>
                                                {parseFloat(row.refund_amount || 0) > 0 && (
                                                    <span className="text-[11px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full mt-1.5 flex items-center gap-1">
                                                        <ArrowUpRight className="h-3 w-3" />
                                                        -₹{parseFloat(row.refund_amount).toLocaleString('en-IN')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className={clsx(
                                                "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                                                row.payment_status === 'paid' && "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100",
                                                row.payment_status === 'refunded' && "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100",
                                                row.status === 'cancelled' && row.payment_status !== 'refunded' && "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100",
                                                (row.payment_status === 'pending_payment' || (row.payment_status !== 'paid' && row.payment_status !== 'refunded' && row.status !== 'cancelled')) && "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100"
                                            )}>
                                                {row.payment_status === 'paid' && <><CheckCircle2 className="h-3.5 w-3.5" /> {t('payments_user.status.paid', 'Paid')}</>}
                                                {row.payment_status === 'refunded' && <><RefreshCw className="h-3.5 w-3.5" /> {t('payments_user.status.refunded', 'Refunded')}</>}
                                                {row.status === 'cancelled' && row.payment_status !== 'refunded' && <><XCircle className="h-3.5 w-3.5" /> {t('payments_user.status.cancelled', 'Cancelled')}</>}
                                                {(row.payment_status === 'pending_payment' || (row.payment_status !== 'paid' && row.payment_status !== 'refunded' && row.status !== 'cancelled')) && <><Clock className="h-3.5 w-3.5" /> {t('payments_user.status.pending', 'Pending')}</>}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {filteredHistory.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-gray-50 rounded-full text-gray-200">
                                                <History className="h-12 w-12" />
                                            </div>
                                            <p className="text-gray-400 font-bold italic">{t('payments_user.table.no_history', 'No financial history matching your criteria.')}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserPayments;
