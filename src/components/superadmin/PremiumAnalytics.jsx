import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
    TrendingUp, Award, PieChart, Building, Users, Activity, 
    ArrowUpRight, ArrowDownRight, Loader2, Sparkles, Zap
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import { motion } from 'framer-motion';

const PremiumAnalytics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPremiumData = async () => {
        try {
            const [revRes, healthRes, basicRes] = await Promise.all([
                api.get('/superadmin/analytics/revenue'),
                api.get('/superadmin/analytics/health'),
                api.get('/superadmin/analytics')
            ]);
            setStats({
                ...revRes.data,
                health: healthRes.data,
                basic: basicRes.data
            });
        } catch (error) {
            console.error("Premium data failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPremiumData(); }, []);

    if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                    <div className="h-12 w-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                        <Sparkles className="h-7 w-7" />
                    </div>
                    Premium Intelligence
                </h1>
                <p className="text-slate-500 mt-2 font-medium">Advanced platform signals and financial projections</p>
            </div>

            {/* Revenue Area Chart */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm"
            >
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                             Revenue Growth Pulse
                        </h3>
                        <p className="text-slate-400 text-sm font-medium">Monthly Recurring Revenue (MRR) Trends</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-black">
                        <ArrowUpRight className="h-4 w-4" /> 12.4% GROWTH
                    </div>
                </div>

                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.mrrTrend}>
                            <defs>
                                <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} 
                                dy={15} 
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                                tickFormatter={(val) => `$${val/1000}k`}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontWeight: 'black', color: '#1e293b' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="mrr" 
                                stroke="#6366f1" 
                                strokeWidth={4}
                                fillOpacity={1} 
                                fill="url(#colorMrr)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {/* Health Leaderboard */}
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                        <Award className="h-6 w-6 text-orange-500" />
                        Infrastructure Health Score
                    </h3>
                    <div className="space-y-4">
                        {stats.health.slice(0, 5).map((org, i) => (
                            <div key={org.id} className="group flex items-center gap-4 p-4 rounded-[2rem] hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                                <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                                    #{i + 1}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-900">{org.name}</h4>
                                    <p className="text-xs text-slate-400 font-medium">{org.type}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-black text-slate-900">{org.health_score}</div>
                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${org.health_score > 80 ? 'bg-emerald-500' : org.health_score > 50 ? 'bg-orange-500' : 'bg-red-500'}`} 
                                            style={{ width: `${org.health_score}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Revenue by Plan Pie */}
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-8 self-start flex items-center gap-3">
                        <PieChart className="h-6 w-6 text-emerald-500" />
                        Revenue Distribution
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={stats.revenueByPlan}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.revenueByPlan.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 text-center">
                         <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Premium Mix</p>
                         <h4 className="text-2xl font-black text-slate-900">Enterprise Heavy</h4>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PremiumAnalytics;
