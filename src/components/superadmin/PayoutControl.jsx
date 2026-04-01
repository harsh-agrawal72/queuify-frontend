import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
    Wallet, Banknote, Clock, CheckCircle2, XCircle, 
    ExternalLink, Loader2, Search, Filter, ArrowUpRight,
    Building2, User as UserIcon, CreditCard
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';

const PayoutControl = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [processingId, setProcessingId] = useState(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/superadmin/payouts', {
                params: { status: filter === 'all' ? undefined : filter }
            });
            setRequests(res.data);
        } catch (error) {
            toast.error("Failed to fetch payout requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const handleStatusUpdate = async (payoutId, status, reason = '') => {
        if (!window.confirm(`Are you sure you want to mark this payout as ${status}?`)) return;

        setProcessingId(payoutId);
        try {
            await api.patch(`/superadmin/payouts/${payoutId}/status`, { status, reason });
            toast.success(`Payout ${status} successfully`);
            fetchRequests();
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to update payout status`);
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'rejected': return 'bg-red-50 text-red-600 border-red-100';
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const renderBankDetails = (details) => {
        if (!details) return <span className="text-slate-400 italic">No details</span>;
        const d = typeof details === 'string' ? JSON.parse(details) : details;
        
        return (
            <div className="space-y-1 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                    <Building2 className="h-3 w-3 text-slate-400" /> {d.bankName || 'Unknown Bank'}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                    <UserIcon className="h-3 w-3" /> {d.accountHolder || 'N/A'}
                </div>
                <div className="flex items-center gap-1.5 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 w-fit">
                    <CreditCard className="h-3 w-3" /> {d.accountNumber}
                </div>
                <div className="text-indigo-600 font-black tracking-wider">IFSC: {d.ifscCode}</div>
                {d.upiId && <div className="text-purple-600 font-medium italic">UPI: {d.upiId}</div>}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="h-10 w-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                            <Wallet className="h-6 w-6" />
                        </div>
                        Payout Control Center
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Verify and process manual bank transfers for organizations</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm self-start">
                    {['all', 'pending', 'completed', 'rejected'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                                filter === f ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-900'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                        <Loader2 className="h-10 w-10 animate-spin" />
                        <p className="font-bold uppercase tracking-widest text-xs">Loading ledger...</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="py-24 text-center">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Banknote className="h-10 w-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">No payout requests found</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-2">There are currently no withdrawal requests matching your filter.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Organization</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Amount</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Bank Details</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{req.org_name}</span>
                                                <span className="text-[10px] text-slate-400 font-mono">@{req.org_slug}</span>
                                                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
                                                    <Clock className="h-3 w-3" />
                                                    {format(parseISO(req.created_at), 'MMM d, yyyy · HH:mm')}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 font-mono">
                                            <div className="text-lg font-black text-slate-900">₹{parseFloat(req.amount).toLocaleString()}</div>
                                            <div className="text-[10px] text-emerald-600 font-bold uppercase mt-1">Wallet: ₹{parseFloat(req.current_wallet_balance).toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-6 max-w-[250px]">
                                            {renderBankDetails(req.bank_details)}
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${getStatusStyles(req.status)}`}>
                                                {req.status}
                                            </span>
                                            {req.processed_at && (
                                                <div className="mt-2 text-[10px] text-slate-400 italic">
                                                    Processed: {format(parseISO(req.processed_at), 'MMM d')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            {req.status === 'pending' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(req.id, 'rejected')}
                                                        disabled={processingId === req.id}
                                                        className="h-10 w-10 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all flex items-center justify-center border border-red-100"
                                                        title="Reject Request"
                                                    >
                                                        <XCircle className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(req.id, 'completed')}
                                                        disabled={processingId === req.id}
                                                        className="h-10 w-10 bg-emerald-600 text-white hover:bg-slate-900 rounded-xl transition-all flex items-center justify-center shadow-lg shadow-emerald-100"
                                                        title="Complete Transfer"
                                                    >
                                                        {processingId === req.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Immutable</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PayoutControl;
