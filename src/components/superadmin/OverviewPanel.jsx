import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
    Loader2, Users, Building, Calendar, AlertTriangle, TrendingUp,
    DollarSign, Activity, CreditCard
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';

const OverviewPanel = () => {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [overviewRes, analyticsRes] = await Promise.all([
                    api.get('/superadmin/overview'),
                    api.get('/superadmin/analytics')
                ]);
                setStats({ ...overviewRes.data, ...analyticsRes.data });
            } catch (err) {
                console.error("Failed to load stats", err);
                setError(err.response?.data?.message || err.message || "Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-emerald-600" /></div>;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <AlertTriangle className="h-12 w-12 text-red-400 mb-3" />
                <p className="text-lg font-medium text-gray-900">Unable to load dashboard</p>
                <p className="text-sm">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!stats) return <div className="text-center py-12 text-gray-500">No dashboard data available.</div>;

    const kpiCards = [
        { title: 'Active Organizations', value: stats.activeOrganizations, icon: Building, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { title: 'Platform Fill Rate', value: `${stats.fillRate}%`, icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    const secondaryCards = [
        { title: 'Total Bookings', value: stats.totalBookings, sub: `+${stats.todayBookings} today` },
        { title: 'End Users', value: stats.totalUsers },
        { title: 'Org Admins', value: stats.totalAdmins },
        { title: 'Suspended Orgs', value: stats.suspendedOrganizations, alert: stats.suspendedOrganizations > 0 },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                <p className="text-gray-500">Platform performance and health metrics.</p>
            </div>

            {/* Primary KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiCards.map((card, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">{card.title}</p>
                            <h3 className="text-3xl font-bold text-gray-900">{card.value}</h3>
                        </div>
                        <div className={`p-4 rounded-xl ${card.bg} ${card.color}`}>
                            <card.icon className="h-6 w-6" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {secondaryCards.map((card, i) => (
                    <div key={i} className={`bg-white p-4 rounded-xl border ${card.alert ? 'border-red-100 bg-red-50' : 'border-gray-100'}`}>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{card.title}</p>
                        <p className={`text-xl font-bold mt-1 ${card.alert ? 'text-red-700' : 'text-gray-800'}`}>{card.value}</p>
                        {card.sub && <p className="text-xs text-emerald-600 font-medium mt-1">{card.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Organization Growth */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
                        <Building className="h-5 w-5 text-blue-600" /> Organization Growth
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.orgGrowth || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
                                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="orgs" name="New Organizations" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Industry Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-indigo-600" /> Industry Distribution
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.industryDistribution || []} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="type" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 500 }} width={120} />
                                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="count" name="Organizations" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Top Organizations Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800">Top Performing Organizations</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Organization</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(stats.topOrganizations || []).map((org, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{org.name}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Active</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OverviewPanel;
