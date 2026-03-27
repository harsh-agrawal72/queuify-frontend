import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
    Activity, Search, Filter, Calendar as CalendarIcon, 
    ArrowRight, User, Building, Shield, Loader2, AlertCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const GlobalAuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ action: '', orgId: '' });
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/superadmin/activity/audit-trail', {
                params: { ...filter, page, limit: 50 }
            });
            setLogs(res.data.logs);
            setTotal(res.data.total);
        } catch (error) {
            console.error("Failed to fetch logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, filter]);

    const getActionColor = (action) => {
        if (action.includes('DELETE') || action.includes('CANCEL')) return 'text-red-600 bg-red-50 border-red-100';
        if (action.includes('CREATE') || action.includes('INVITE')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        if (action.includes('UPDATE')) return 'text-blue-600 bg-blue-50 border-blue-100';
        return 'text-slate-600 bg-slate-50 border-slate-100';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                        <Activity className="h-6 w-6" />
                    </div>
                    Platform Audit Trail
                </h1>
                <p className="text-slate-500 mt-2 font-medium">Immutable stream of system-wide administrative actions</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Filter by action (e.g. ORG_CREATED)..."
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all outline-none text-sm"
                        value={filter.action}
                        onChange={e => setFilter({...filter, action: e.target.value})}
                    />
                </div>
                <div className="h-10 w-px bg-slate-100 hidden md:block" />
                <button 
                    onClick={() => setFilter({action: '', orgId: ''})}
                    className="px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                >
                    Reset Filters
                </button>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                {loading && page === 1 ? (
                    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-slate-900 h-8 w-8" /></div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {logs.map((log) => (
                            <div key={log.id} className="p-6 hover:bg-slate-50/50 transition-all group">
                                <div className="flex items-start gap-6">
                                    <div className="flex flex-col items-center">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform">
                                            {log.action.includes('USER') ? <User className="h-4 w-4" /> : 
                                             log.action.includes('ORG') ? <Building className="h-4 w-4" /> : 
                                             <Shield className="h-4 w-4" />}
                                        </div>
                                        <div className="w-px h-full bg-slate-100 mt-2 min-h-[20px]" />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                                <span className="text-sm font-bold text-slate-900">{log.user_name || 'System'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px] bg-slate-50 px-3 py-1 rounded-full">
                                                <CalendarIcon className="h-3 w-3" />
                                                {format(parseISO(log.created_at), 'MMM d, yyyy · HH:mm:ss')}
                                            </div>
                                        </div>

                                        <p className="text-sm text-slate-600 mb-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100 inline-block w-full">
                                            {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                                        </p>

                                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            <span className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3" /> IP: {log.ip_address || '::1'}</span>
                                            <span className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3" /> USER_ID: {log.user_id?.slice(0, 8)}...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <div className="py-20 text-center">
                                <AlertCircle className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-900">No activity logged</h3>
                                <p className="text-slate-500">System is currently quiet</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination Placeholder */}
            {total > 50 && (
                <div className="flex justify-center gap-2">
                    <button 
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-sm disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button 
                        onClick={() => setPage(p => p + 1)}
                        className="px-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-sm"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default GlobalAuditLog;
