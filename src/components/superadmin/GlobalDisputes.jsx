import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Loader2, AlertCircle, CheckCircle2, XCircle, Clock, Building2, User, ShieldCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const GlobalDisputes = () => {
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const res = await api.get('/superadmin/disputes');
            setDisputes(res.data);
        } catch (error) {
            toast.error("Failed to load disputes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDisputes();
    }, []);

    const handleResolve = async (appointmentId, decision) => {
        const confirmMsg = decision === 'refund' 
            ? "Confirm 100% REFUND for this patient? This will deduct funds from the organization's wallet."
            : "Confirm RELEASE of funds to the organization? This will dismiss the patient's complaint.";
        
        if (!window.confirm(confirmMsg)) return;

        setProcessingId(appointmentId);
        try {
            await api.patch(`/superadmin/disputes/${appointmentId}/resolve`, { decision });
            toast.success(`Dispute resolved: ${decision === 'refund' ? 'Refunded' : 'Released'}`);
            fetchDisputes();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to resolve dispute");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 italic">Patient Complaints & Disputes</h2>
                    <p className="text-gray-500 text-sm">Review issues reported by patients and arbitrate fund distribution.</p>
                </div>
                <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-amber-200">
                    {disputes.length} Active Disputes
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {disputes.map(dispute => (
                    <div key={dispute.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                        <div className="flex flex-col md:flex-row">
                            {/* Left Side: Details */}
                            <div className="flex-1 p-6 md:p-8 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Complaint ID: {dispute.id.slice(0, 8)}</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <span className="text-[10px] font-bold text-gray-400 capitalize">{format(parseISO(dispute.created_at), 'PPP')}</span>
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900 italic tracking-tight uppercase">
                                            {dispute.customer_name} vs {dispute.org_name}
                                        </h3>
                                    </div>
                                    <div className="bg-rose-50 text-rose-600 p-3 rounded-2xl border border-rose-100">
                                        <AlertCircle className="h-6 w-6" />
                                    </div>
                                </div>

                                <div className="p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Patient's Reason</p>
                                    <p className="text-sm font-medium text-slate-700 italic leading-relaxed">
                                        "{dispute.dispute_reason || 'No reason provided.'}"
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-6 text-sm">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-indigo-50 rounded-lg"><Building2 className="h-4 w-4 text-indigo-600" /></div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Clinic</p>
                                            <p className="font-bold text-gray-700">{dispute.org_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-emerald-50 rounded-lg"><User className="h-4 w-4 text-emerald-600" /></div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Patient Phone</p>
                                            <p className="font-bold text-gray-700">{dispute.customer_phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600 font-bold italic">₹</div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount Disputed</p>
                                            <p className="font-bold text-amber-600 text-lg tracking-tighter">₹{parseFloat(dispute.price).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Actions */}
                            <div className="md:w-72 bg-slate-50/50 border-t md:border-t-0 md:border-l border-gray-100 p-6 flex flex-col justify-center gap-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-2">Arbitration Decision</p>
                                
                                <button
                                    disabled={processingId === dispute.id}
                                    onClick={() => handleResolve(dispute.id, 'refund')}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95 disabled:opacity-50"
                                >
                                    {processingId === dispute.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Refund User</>}
                                </button>

                                <button
                                    disabled={processingId === dispute.id}
                                    onClick={() => handleResolve(dispute.id, 'release')}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {processingId === dispute.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4" /> Dismiss Issue</>}
                                </button>

                                <p className="text-[9px] text-gray-400 text-center leading-tight mt-2 px-4">
                                    Funds are currently <strong>frozen</strong> in the Dispute Balance and will be moved based on your decision.
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                {disputes.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-24 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="p-4 bg-gray-50 rounded-full mb-4">
                            <ShieldCheck className="h-12 w-12 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">All clear!</h3>
                        <p className="text-gray-500 text-sm">No active disputes require your attention at the moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobalDisputes;
