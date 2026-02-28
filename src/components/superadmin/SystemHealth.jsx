import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
    Loader2, Server, Database, Activity, Cpu, ShieldCheck,
    AlertTriangle, CheckCircle, Clock, Zap, Users, Globe,
    RefreshCcw, Terminal, HardDrive, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const SystemHealth = () => {
    const [health, setHealth] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchHealthData = async () => {
        setRefreshing(true);
        try {
            const [healthRes, activityRes] = await Promise.all([
                api.get('/superadmin/system'),
                api.get('/superadmin/activity')
            ]);
            setHealth(healthRes.data);
            setActivity(activityRes.data || []);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Failed to load system health", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHealthData();
        const interval = setInterval(fetchHealthData, 15000); // 15s refresh
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-24 gap-4">
            <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
            <p className="text-gray-500 font-medium animate-pulse">Initializing monitoring systems...</p>
        </div>
    );

    const getStatusColor = (status) => {
        if (status === 'healthy' || status === 'Connected') return 'text-emerald-600';
        if (status === 'degraded') return 'text-amber-600';
        return 'text-rose-600';
    };

    const getProgressColor = (percent) => {
        if (percent < 60) return 'bg-emerald-500';
        if (percent < 85) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Activity className="h-7 w-7 text-indigo-600" />
                        Infrastructure Monitoring
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">DevOps-level real-time visibility into your system performance.</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-2 px-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex flex-col items-end">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Updated</p>
                        <p className="text-sm font-semibold text-gray-700">{lastUpdated.toLocaleTimeString()}</p>
                    </div>
                    <button
                        onClick={fetchHealthData}
                        className={`p-2 rounded-xl transition-all ${refreshing ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50 text-gray-400 hover:text-indigo-600'}`}
                        disabled={refreshing}
                    >
                        <RefreshCcw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Critical Alerts */}
            <AnimatePresence>
                {(health.database.status !== 'Connected' || health.database.poolUsage > 90 || health.errors.total24h > 100) && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-4 text-rose-800"
                    >
                        <div className="p-2 bg-rose-100 rounded-xl">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold">System Warning Detected</h4>
                            <p className="text-sm opacity-90">
                                {health.database.status !== 'Connected' ? 'Database connection failure.' : ''}
                                {health.database.poolUsage > 90 ? 'Database connection pool is nearly full.' : ''}
                                {health.errors.total24h > 100 ? 'High error rate detected in the last 24h.' : ''}
                            </p>
                        </div>
                        <button className="text-xs font-bold uppercase tracking-widest bg-rose-200 px-3 py-1.5 rounded-lg hover:bg-rose-300 transition-colors">Acknowledge</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* API Status */}
                <Card title="API Infrastructure" icon={Server}>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-500">Status</span>
                        <div className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full bg-current ${getStatusColor(health.api.status)}`}></span>
                            <span className={`text-sm font-bold capitalize ${getStatusColor(health.api.status)}`}>
                                {health.api.status}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <MetricRow label="Uptime" value={`${Math.floor(health.api.uptime / 3600)}h ${Math.floor((health.api.uptime % 3600) / 60)}m`} icon={Clock} />
                        <MetricRow label="Version" value={`v${health.api.version}`} icon={ShieldCheck} />
                        <MetricRow label="Node" value={health.api.nodeVersion} icon={Zap} />
                    </div>
                </Card>

                {/* Database Health */}
                <Card title="Database System" icon={Database}>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-500">Latency</span>
                        <span className="text-sm font-bold text-indigo-600">{health.database.latency}ms</span>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase mb-1.5">
                                <span>Pool Usage</span>
                                <span>{health.database.poolUsage}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${health.database.poolUsage}%` }}
                                    className={`h-full ${getProgressColor(health.database.poolUsage)}`}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-50 p-2.5 rounded-xl">
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Active</p>
                                <p className="text-lg font-bold text-gray-700">{health.database.activeConnections}</p>
                            </div>
                            <div className="bg-gray-50 p-2.5 rounded-xl">
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Idle</p>
                                <p className="text-lg font-bold text-gray-700">{health.database.idleConnections}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Traffic Analytics */}
                <Card title="Traffic & Load" icon={Globe}>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-500">Requests (24h)</span>
                        <span className="text-sm font-bold text-indigo-600">{health.traffic.totalRequests24h.toLocaleString()}</span>
                    </div>
                    <div className="space-y-3">
                        <MetricRow label="Avg Latency" value={`${health.traffic.avgLatency}ms`} icon={Activity} />
                        <MetricRow label="Live Users" value={health.traffic.activeUsers15m} icon={Users} />
                        <MetricRow label="Live Orgs" value={health.traffic.activeOrgs15m} icon={BarChart3} />
                    </div>
                </Card>

                {/* Hardware/Resources */}
                <Card title="Resource Usage" icon={HardDrive}>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-500">Heap Used</span>
                        <span className="text-sm font-bold text-indigo-600">{health.api.memory.heapUsed}MB</span>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase mb-1.5">
                                <span>Memory Heap</span>
                                <span>{((health.api.memory.heapUsed / health.api.memory.heapTotal) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(health.api.memory.heapUsed / health.api.memory.heapTotal) * 100}%` }}
                                    className="h-full bg-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-50 p-2.5 rounded-xl">
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Heap Total</p>
                                <p className="text-sm font-bold text-gray-700">{health.api.memory.heapTotal}MB</p>
                            </div>
                            <div className="bg-gray-50 p-2.5 rounded-xl">
                                <p className="text-[10px] text-gray-400 font-bold uppercase">RSS</p>
                                <p className="text-sm font-bold text-gray-700">{health.api.memory.rss}MB</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Error Monitoring & Activity Log Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Error Monitoring */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-rose-500" />
                            Error Monitoring (24h)
                        </h3>

                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="text-center">
                                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Total</p>
                                <p className="text-2xl font-black text-gray-900">{health.errors.total24h}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider mb-1">Critical</p>
                                <p className="text-2xl font-black text-rose-600">{health.errors.critical5xx}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider mb-1">Client</p>
                                <p className="text-2xl font-black text-amber-600">{health.errors.client4xx}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Top Error Messages</h4>
                            <div className="space-y-2">
                                {health.errors.topErrors.length > 0 ? (
                                    health.errors.topErrors.map((err, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group hover:bg-rose-50 transition-colors cursor-default">
                                            <p className="text-sm text-gray-700 font-medium truncate pr-4 group-hover:text-rose-700">{err.message}</p>
                                            <span className="text-xs font-bold bg-white px-2 py-1 rounded-lg border border-gray-200 group-hover:border-rose-200">{err.count}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6">
                                        <CheckCircle className="h-8 w-8 text-emerald-200 mx-auto mb-2" />
                                        <p className="text-gray-400 text-sm">No errors recorded today.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Activity Log */}
                <div className="lg:col-span-7">
                    <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 h-full overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                                    <Terminal className="h-4 w-4" /> Live System Activity
                                </h3>
                            </div>
                            <BarChart3 className="h-4 w-4 text-gray-600" />
                        </div>

                        <div className="flex-1 p-4 font-mono text-[13px] leading-relaxed overflow-y-auto max-h-[500px] custom-scrollbar">
                            {activity.length > 0 ? (
                                activity.map((log, i) => (
                                    <div key={i} className="mb-2 py-1 border-l-2 border-gray-800 pl-4 hover:border-indigo-500 transition-colors">
                                        <span className="text-gray-500 mr-3">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                                        <span className={`font-bold mr-2 ${log.action.includes('ERR') ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {log.action}
                                        </span>
                                        <span className="text-gray-300">{log.performed_by_name || 'System'}:</span>
                                        <span className="text-gray-400 ml-2">
                                            {log.details?.orgId ? `Org #${log.details.orgId.slice(0, 8)}` : ''}
                                            {log.details?.admin_id ? `Admin #${log.details.admin_id.slice(0, 8)}` : ''}
                                            {log.action === 'INVITE' ? ' sent invitation' : ''}
                                            {log.action === 'SUSPEND' ? ' account suspended' : ''}
                                            {log.action === 'ACTIVATE' ? ' account activated' : ''}
                                            {!log.details && ' performed a system action'}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 pointer-events-none py-12">
                                    <Terminal className="h-12 w-12 mb-4" />
                                    <p>Waiting for system events...</p>
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-gray-950/50 text-[10px] text-gray-600 border-t border-gray-800 text-center uppercase tracking-widest font-bold">
                            Live stream connected via PostgreSQL
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-components
const Card = ({ title, icon: Icon, children }) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-md">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gray-50 text-gray-400 rounded-xl">
                <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 tracking-tight uppercase tracking-wider">{title}</h3>
        </div>
        <div className="flex-1">{children}</div>
    </div>
);

const MetricRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-500">
            <Icon className="h-4 w-4 opacity-50" />
            <span>{label}</span>
        </div>
        <span className="font-bold text-gray-800">{value}</span>
    </div>
);

export default SystemHealth;
