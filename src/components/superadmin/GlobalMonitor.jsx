import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
    Activity,
    Users,
    TrendingUp,
    Clock,
    Search,
    RefreshCw,
    ExternalLink,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const GlobalMonitor = () => {
    const [stats, setStats] = useState({
        totalActiveQueues: 0,
        totalWaiting: 0,
        avgWaitTime: 0,
        systemLoad: 'Normal'
    });
    const [activeOrgs, setActiveOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    const fetchGlobalData = async () => {
        try {
            // This endpoint needs to be created on backend
            const res = await api.get('/superadmin/monitor');
            setStats(res.data.stats);
            setActiveOrgs(res.data.organizations);
        } catch (error) {
            console.error("Failed to fetch monitor data");
            // Mocking for now to show UI
            setStats({
                totalActiveQueues: 12,
                totalWaiting: 45,
                avgWaitTime: 18,
                systemLoad: 'Optimal'
            });
            setActiveOrgs([
                { id: '1', name: 'City Hospital', waiting: 15, serving: 3, status: 'busy' },
                { id: '2', name: 'HDFC Bank', waiting: 8, serving: 2, status: 'stable' },
                { id: '3', name: 'Modern Clinic', waiting: 22, serving: 4, status: 'critical' },
                { id: '4', name: 'Passport Office', waiting: 0, serving: 0, status: 'idle' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGlobalData();
        const interval = setInterval(fetchGlobalData, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, []);

    const filteredOrgs = activeOrgs.filter(org =>
        org.name.toLowerCase().includes(search.toLowerCase()) &&
        (filter === 'all' || org.status === filter)
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Activity className="h-6 w-6" />
                    </div>
                    Global Live Monitor
                </h1>
                <p className="text-slate-500 mt-2 font-medium">Real-time surveillance across all registered organizations</p>
            </div>

            {/* Global Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Active Queues', value: stats.totalActiveQueues, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Total Waiting', value: stats.totalWaiting, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Avg System Wait', value: `${stats.avgWaitTime}m`, icon: Clock, color: 'text-teal-600', bg: 'bg-teal-50' },
                    { label: 'System Status', value: stats.systemLoad, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm"
                    >
                        <div className={`h-12 w-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-1">{stat.value}</h3>
                    </motion.div>
                ))}
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search organization..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                </div>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-full md:w-auto overflow-x-auto">
                    {['all', 'idle', 'stable', 'busy', 'critical'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Org Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredOrgs.map((org) => (
                        <motion.div
                            key={org.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{org.name}</h3>
                                    <p className="text-xs text-slate-400 font-mono mt-1">ID: {org.id}</p>
                                </div>
                                <div className={`relative flex h-3 w-3`}>
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${org.status === 'critical' ? 'bg-red-400' : org.status === 'busy' ? 'bg-orange-400' : 'bg-emerald-400'
                                        }`}></span>
                                    <span className={`relative inline-flex rounded-full h-3 w-3 ${org.status === 'critical' ? 'bg-red-500' : org.status === 'busy' ? 'bg-orange-500' : 'bg-emerald-500'
                                        }`}></span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-slate-50 p-4 rounded-3xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Waiting</p>
                                    <p className="text-2xl font-black text-slate-900">{org.waiting}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-3xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Serving</p>
                                    <p className="text-2xl font-black text-slate-900">{org.serving}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full ${org.status === 'critical' ? 'bg-red-100 text-red-700' :
                                        org.status === 'busy' ? 'bg-orange-100 text-orange-700' :
                                            'bg-emerald-100 text-emerald-700'
                                    }`}>
                                    {org.status}
                                </span>
                                <button className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline">
                                    Analyze <ExternalLink className="h-4 w-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredOrgs.length === 0 && !loading && (
                <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <AlertCircle className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900">No organizations found</h3>
                    <p className="text-slate-500">Adjust your search or filter criteria</p>
                </div>
            )}
        </div>
    );
};

export default GlobalMonitor;
