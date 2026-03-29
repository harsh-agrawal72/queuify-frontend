import React, { useMemo, useState } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { 
    Wallet, CreditCard, Clock, CheckCircle2, AlertCircle, TrendingUp, History, Search, Download, Filter, 
    RefreshCw, RotateCcw, XCircle
} from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO, startOfMonth, eachMonthOfInterval, subMonths, isSameMonth } from 'date-fns';

const UserPayments = ({ bookings }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // 1. Calculate Analytics
    const stats = useMemo(() => {
        const paid = bookings.filter(b => b.payment_status === 'paid' || b.payment_status === 'refunded');
        const pending = bookings.filter(b => b.payment_status === 'pending_payment' || (b.status === 'confirmed' && b.payment_status !== 'paid' && b.payment_status !== 'refunded' && parseFloat(b.price) > 0));
        
        const totalSpent = paid.reduce((sum, b) => {
            const price = parseFloat(b.price || 0);
            const refund = parseFloat(b.refund_amount || 0);
            return sum + (price - refund);
        }, 0);
        
        const pendingAmount = pending.reduce((sum, b) => sum + parseFloat(b.price || 0), 0);

        return {
            totalSpent,
            pendingAmount,
            paidCount: bookings.filter(b => b.payment_status === 'paid').length,
            refundCount: bookings.filter(b => b.payment_status === 'refunded').length,
            pendingCount: pending.length,
            completedBookings: bookings.filter(b => b.status === 'completed').length,
            totalBookings: bookings.length
        };
    }, [bookings]);

    // 2. Prepare Chart Data (Last 6 Months)
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
                    const price = parseFloat(b.price || 0);
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
            const matchesSearch = (b.org_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (b.service_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (b.payment_id || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesFilter = filterStatus === 'all' || 
                               (filterStatus === 'paid' && b.payment_status === 'paid') ||
                               (filterStatus === 'refunded' && b.payment_status === 'refunded') ||
                               (filterStatus === 'cancelled' && b.status === 'cancelled') ||
                               (filterStatus === 'pending' && b.payment_status !== 'paid' && b.payment_status !== 'refunded' && parseFloat(b.price) > 0);
            
            return matchesSearch && matchesFilter;
        }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [bookings, searchTerm, filterStatus]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    <div className="relative z-10">
                        <div className="p-3 bg-indigo-600 w-fit rounded-2xl text-white mb-4 shadow-lg shadow-indigo-200">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Total Spent</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">₹{stats.totalSpent.toLocaleString()}</h3>
                        <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs font-bold">
                            <TrendingUp className="h-3 w-3" />
                            <span>{stats.paidCount} successful payments</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    <div className="relative z-10">
                        <div className="p-3 bg-amber-500 w-fit rounded-2xl text-white mb-4 shadow-lg shadow-amber-200">
                            <Clock className="h-6 w-6" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Pending Payments</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">₹{stats.pendingAmount.toLocaleString()}</h3>
                        <div className="flex items-center gap-1 mt-2 text-amber-600 text-xs font-bold">
                            <AlertCircle className="h-3 w-3" />
                            <span>{stats.pendingCount} items awaiting payment</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    <div className="relative z-10">
                        <div className="p-3 bg-emerald-500 w-fit rounded-2xl text-white mb-4 shadow-lg shadow-emerald-200">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Completed Bookings</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.completedBookings}</h3>
                        <p className="text-xs text-gray-400 mt-2 font-medium">Out of {stats.totalBookings} total bookings</p>
                    </div>
                </div>
            </div>

            {/* Visual Analytics */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Spending Trends</h3>
                        <p className="text-sm text-gray-500">Monthly overview of your service expenditures</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full">
                        <History className="h-3 w-3" />
                        Last 6 Months
                    </div>
                </div>
                
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#94a3b8', fontSize: 12}}
                                dy={10}
                            />
                            <YAxis 
                                hide 
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    borderRadius: '16px', 
                                    border: 'none', 
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                    padding: '12px'
                                }}
                                formatter={(value) => [`₹${value}`, 'Spent']}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="amount" 
                                stroke="#4f46e5" 
                                strokeWidth={4}
                                fillOpacity={1} 
                                fill="url(#colorPrice)" 
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed History */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h3 className="text-xl font-bold text-gray-900">Payment History</h3>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search by ID, org or service..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-2xl text-sm w-full focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                />
                            </div>
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="bg-gray-50 border-none rounded-2xl px-4 py-2.5 text-sm font-bold text-gray-600 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                            >
                                <option value="all">All Status</option>
                                <option value="paid">Paid Only</option>
                                <option value="refunded">Refunded</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Transaction / Date</th>
                                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Service & Org</th>
                                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Amount</th>
                                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredHistory.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50/30 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-xs text-indigo-600 font-bold group-hover:text-indigo-700">
                                                {row.payment_id || `ID-${row.id.slice(0, 8)}`}
                                            </span>
                                            <span className="text-xs text-gray-400 mt-1">
                                                {format(parseISO(row.created_at || new Date().toISOString()), 'MMM dd, yyyy • hh:mm a')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">{row.service_name || 'Service'}</span>
                                            <span className="text-xs text-gray-500">{row.org_name || 'Organization'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-black text-gray-900">₹{parseFloat(row.price || 0).toLocaleString()}</span>
                                            {parseFloat(row.refund_amount || 0) > 0 && (
                                                <span className="text-[10px] font-bold text-rose-500 mt-0.5">
                                                    -₹{parseFloat(row.refund_amount).toLocaleString()} refund
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <span className={clsx(
                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                            row.payment_status === 'paid' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                                            row.payment_status === 'refunded' && "bg-blue-50 text-blue-700 border-blue-100",
                                            row.status === 'cancelled' && row.payment_status !== 'refunded' && "bg-rose-50 text-rose-700 border-rose-100",
                                            (row.payment_status === 'pending_payment' || (row.payment_status !== 'paid' && row.payment_status !== 'refunded' && row.status !== 'cancelled')) && "bg-amber-50 text-amber-700 border-amber-100"
                                        )}>
                                            {row.payment_status === 'paid' && <><CheckCircle2 className="h-3 w-3" /> Paid</>}
                                            {row.payment_status === 'refunded' && <><RefreshCw className="h-3 w-3" /> Refunded</>}
                                            {row.status === 'cancelled' && row.payment_status !== 'refunded' && <><AlertCircle className="h-3 w-3" /> Cancelled</>}
                                            {(row.payment_status === 'pending_payment' || (row.payment_status !== 'paid' && row.payment_status !== 'refunded' && row.status !== 'cancelled')) && <><Clock className="h-3 w-3" /> Pending</>}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredHistory.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-gray-400 italic">
                                        No transaction history found matching your filters.
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
