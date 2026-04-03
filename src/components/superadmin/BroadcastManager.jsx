import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
    Send, Megaphone, Users, Shield, Info, AlertTriangle, 
    CheckCircle, History, Loader2, ArrowRight, Clock, Trash2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';

const BroadcastManager = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [formData, setFormData] = useState({
        target: 'all',
        title: '',
        message: '',
        type: 'info',
        link: ''
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;
    const totalPages = Math.ceil(history.length / itemsPerPage);
    const paginatedHistory = history.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const fetchHistory = async () => {
        try {
            const res = await api.get('/superadmin/broadcast');
            setHistory(res.data);
        } catch (error) {
            console.error("Failed to fetch broadcast history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.message) return toast.error("Please fill in all required fields");

        setSending(true);
        try {
            await api.post('/superadmin/broadcast', formData);
            toast.success("Broadcast sent successfully!");
            setFormData({ target: 'all', title: '', message: '', type: 'info', link: '' });
            fetchHistory();
            setCurrentPage(1); // Reset to first page to see new broadcast
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send broadcast");
        } finally {
            setSending(false);
        }
    };

    const getTypeStyles = (type) => {
        switch (type) {
            case 'success': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'warning': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'emergency': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-blue-50 text-blue-600 border-blue-100';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Megaphone className="h-6 w-6" />
                    </div>
                    Global Broadcast Center
                </h1>
                <p className="text-slate-500 mt-2 font-medium">Communicate directly with your entire platform audience</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Compose Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-8">
                        <div className="flex items-center gap-2 mb-8">
                            <Send className="h-5 w-5 text-indigo-600" />
                            <h2 className="text-xl font-bold text-slate-900">Compose Broadcast</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Target Audience</label>
                                    <select 
                                        className="w-full px-4 py-3 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all outline-none text-sm font-medium"
                                        value={formData.target}
                                        onChange={e => setFormData({...formData, target: e.target.value})}
                                    >
                                        <option value="all">Everyone (Admins & Users)</option>
                                        <option value="admins">Only Admins</option>
                                        <option value="users">Only Users</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Alert Type</label>
                                    <select 
                                        className="w-full px-4 py-3 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all outline-none text-sm font-medium"
                                        value={formData.type}
                                        onChange={e => setFormData({...formData, type: e.target.value})}
                                    >
                                        <option value="info">Information (Blue)</option>
                                        <option value="success">Success (Green)</option>
                                        <option value="warning">Warning (Orange)</option>
                                        <option value="emergency">Emergency (Red)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Broadcast Title</label>
                                <input 
                                    type="text"
                                    placeholder="e.g., Scheduled Maintenance Tonight"
                                    className="w-full px-4 py-3 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all outline-none text-sm font-medium"
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Message Content</label>
                                <textarea 
                                    rows="4"
                                    placeholder="Type your message here..."
                                    className="w-full px-4 py-3 rounded-3xl border-slate-200 bg-slate-50 focus:bg-white transition-all outline-none text-sm font-medium resize-none"
                                    value={formData.message}
                                    onChange={e => setFormData({...formData, message: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Action Link (Optional)</label>
                                <input 
                                    type="text"
                                    placeholder="e.g., /dashboard/billing"
                                    className="w-full px-4 py-3 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all outline-none text-sm font-medium"
                                    value={formData.link}
                                    onChange={e => setFormData({...formData, link: e.target.value})}
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={sending}
                                className="w-full py-4 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {sending ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
                                Send Global Broadcast Now
                            </button>
                        </form>
                    </div>
                </div>

                {/* History Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5 text-slate-400" />
                                <h2 className="text-lg font-bold text-slate-900">Recent History</h2>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {loading ? (
                                <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-300 h-8 w-8" /></div>
                            ) : history.length === 0 ? (
                                <div className="py-10 text-center text-slate-400 italic text-sm">No recent broadcasts</div>
                            ) : (
                                <>
                                    {paginatedHistory.map((item) => (
                                        <div key={item.id} className="p-4 rounded-[2rem] border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all group">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${getTypeStyles(item.type)}`}>
                                                    {item.type}
                                                </span>
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(parseISO(item.created_at), 'MMM d, HH:mm')}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1">{item.title}</h3>
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">{item.message}</p>
                                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-tighter border-t border-slate-50 pt-3">
                                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> To: {item.target}</span>
                                                <span className="flex items-center gap-1"><ArrowRight className="h-3 w-3" /> By: {item.sender_name?.split(' ')[0]}</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between px-2 pt-4 border-t border-slate-50">
                                            <button 
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ArrowRight className="h-4 w-4 rotate-180" />
                                            </button>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Page {currentPage} of {totalPages}
                                            </div>
                                            <button 
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ArrowRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BroadcastManager;
