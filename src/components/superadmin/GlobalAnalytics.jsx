import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Loader2 } from 'lucide-react';

const GlobalAnalytics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/superadmin/analytics');
                setStats(res.data);
            } catch (error) {
                console.error("Failed");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <Loader2 className="animate-spin" />;
    if (!stats) return <div>No data</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Global Analytics</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold mb-4">Top Performing Organizations</h3>
                    <div className="space-y-4">
                        {stats.topOrganizations.map((org, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-700">{i + 1}. {org.name}</span>
                                <span className="font-bold text-emerald-600">{org.count} Bookings</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold mb-4">Daily Bookings (Last 7 Days)</h3>
                    <div className="flex items-end h-40 gap-2">
                        {stats.dailyBookings.map((day, i) => (
                            <div key={i} className="flex-1 bg-blue-100 hover:bg-blue-200 transition relative group rounded-t" style={{ height: `${Math.max(day.count * 10, 10)}%` }}>
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100">
                                    {day.count}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalAnalytics;
