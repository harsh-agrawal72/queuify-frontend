import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Calendar, CheckCircle, Clock, MapPin, ArrowRight, XCircle, Search, Activity, Users, Star,
    Building2, TrendingUp, Sparkles, Award, ChevronRight
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { useQueueSocket } from '../../hooks/useQueueSocket';
import { useAuth } from '../../context/AuthContext';

export default function UserDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recentAppointments, setRecentAppointments] = useState([]);
    const { user } = useAuth();

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/user/stats');
            setStats(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentAppointments = async () => {
        try {
            const { data } = await api.get('/appointments/my');
            setRecentAppointments(data.slice(0, 5));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchRecentAppointments();
    }, []);

    // WebSocket Integration for real-time updates on dashboard
    const orgId = stats?.nextAppointment?.org_id;
    const { queueData } = useQueueSocket(orgId);

    useEffect(() => {
        if (queueData) {
            fetchStats();
        }
    }, [queueData]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color, bg }) => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-gray-500 text-sm font-medium">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${bg}`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                </div>
            </div>
        </motion.div>
    );

    const nextApt = stats?.nextAppointment;
    const isServing = nextApt?.status === 'serving';

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-100 text-emerald-700';
            case 'confirmed': return 'bg-blue-100 text-blue-700';
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            case 'serving': return 'bg-purple-100 text-purple-700';
            case 'no_show': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const totalAppointments = stats?.total || 0;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome Back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋</h1>
                    <p className="text-gray-500 mt-1">Here's what's happening with your appointments.</p>
                </div>
                {isServing && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full flex items-center gap-2 font-bold animate-pulse text-sm"
                    >
                        <Activity className="h-4 w-4" />
                        Its your turn!
                    </motion.div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title="Upcoming"
                    value={stats?.upcoming || 0}
                    icon={Calendar}
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                />
                <StatCard
                    title="Completed"
                    value={stats?.completed || 0}
                    icon={CheckCircle}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                />
                <StatCard
                    title="Cancelled"
                    value={stats?.cancelled || 0}
                    icon={XCircle}
                    color="text-red-600"
                    bg="bg-red-50"
                />
                <StatCard
                    title="Total Visits"
                    value={totalAppointments}
                    icon={TrendingUp}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
            </div>

            {/* Next Appointment Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Next Appointment</h2>
                    {nextApt && (
                        <Link to="/appointments" className="text-indigo-600 text-sm font-medium hover:underline">
                            View All
                        </Link>
                    )}
                </div>

                {nextApt ? (
                    <div className={`bg-gradient-to-r ${isServing ? 'from-emerald-600 to-teal-600' : 'from-indigo-600 to-purple-600'} rounded-3xl p-1 shadow-lg text-white transition-all duration-500`}>
                        <div className="bg-white/10 backdrop-blur-sm rounded-[20px] p-6 sm:p-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-white/80 mb-2">
                                            <MapPin className="h-4 w-4" />
                                            <span className="text-sm font-bold uppercase tracking-widest">{nextApt.org_name}</span>
                                        </div>
                                        <h3 className="text-3xl font-black mb-1">{nextApt.service_name}</h3>
                                        <p className="text-white/60 text-xs font-mono">ID: {nextApt.token_number}</p>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="bg-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                            <Users className="h-3 w-3" />
                                            <span className="text-xs font-bold">{nextApt.people_ahead || 0} Ahead</span>
                                        </div>
                                        <div className="bg-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                            <Clock className="h-3 w-3" />
                                            <span className="text-xs font-bold">{nextApt.estimated_wait_time || 0} min wait</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 bg-white shadow-2xl shadow-indigo-900/20 p-6 rounded-[2rem] text-slate-900 min-w-[200px]">
                                    <div className="text-center flex-1 border-r border-slate-100 pr-4">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Your Token</p>
                                        <p className="text-4xl font-black text-indigo-600">#{nextApt.queue_number}</p>
                                    </div>
                                    <Link
                                        to={`/queue/${nextApt.id}`}
                                        className="h-14 w-14 bg-indigo-600 text-white rounded-[1.25rem] flex items-center justify-center hover:bg-slate-900 transition-all shadow-lg shadow-indigo-200"
                                    >
                                        <ArrowRight className="h-6 w-6" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border rounded-2xl p-10 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">No upcoming appointments</h3>
                        <p className="text-gray-500 mt-1 mb-6">Looks like your schedule is clear.</p>
                        <Link
                            to="/organizations"
                            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition font-medium"
                        >
                            <Search className="h-4 w-4" />
                            Find & Book Appointment
                        </Link>
                    </div>
                )}
            </motion.div>

            {/* Bottom Grid: Recent Appointments + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Recent Appointments */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-indigo-500" />
                            Recent Appointments
                        </h2>
                        <Link to="/appointments" className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1">
                            View All <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {recentAppointments.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                            {recentAppointments.map((apt, idx) => (
                                <motion.div
                                    key={apt.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="px-5 py-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">{apt.service_name || 'Appointment'}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                                <MapPin className="h-3 w-3" /> {apt.org_name || 'Organization'}
                                                {apt.start_time && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                        {format(parseISO(apt.start_time), 'dd MMM yyyy, hh:mm a')}
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize ${getStatusColor(apt.status)}`}>
                                        {apt.status}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <Calendar className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm font-medium">No appointment history yet</p>
                            <p className="text-gray-400 text-xs mt-1">Book your first appointment to see it here!</p>
                        </div>
                    )}
                </motion.div>

                {/* Quick Actions + Tips */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-6"
                >
                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                            Quick Actions
                        </h2>
                        <div className="space-y-2">
                            <Link
                                to="/organizations"
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-colors group"
                            >
                                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                                    <Search className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800">Find Organizations</p>
                                    <p className="text-[11px] text-gray-400">Browse & book appointments</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                            </Link>
                            <Link
                                to="/appointments"
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-colors group"
                            >
                                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800">My Appointments</p>
                                    <p className="text-[11px] text-gray-400">View all your bookings</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                            </Link>
                            <Link
                                to="/profile"
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition-colors group"
                            >
                                <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                    <Users className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800">My Profile</p>
                                    <p className="text-[11px] text-gray-400">Update your personal info</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-purple-500 transition-colors" />
                            </Link>
                        </div>
                    </div>

                    {/* Your Activity Summary */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white">
                        <h2 className="font-bold flex items-center gap-2 mb-4">
                            <Award className="h-5 w-5 text-amber-300" />
                            Your Activity
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-white/70 text-sm">Total Visits</span>
                                <span className="font-bold">{totalAppointments}</span>
                            </div>
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-amber-400 rounded-full transition-all duration-700"
                                    style={{ width: `${Math.min((stats?.completed || 0) / Math.max(totalAppointments, 1) * 100, 100)}%` }}
                                ></div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-white/50">
                                <span>{stats?.completed || 0} completed</span>
                                <span>{Math.round((stats?.completed || 0) / Math.max(totalAppointments, 1) * 100)}% success rate</span>
                            </div>
                        </div>
                        {user?.created_at && (
                            <div className="mt-4 pt-4 border-t border-white/10 text-xs text-white/50">
                                <span>Member since {format(parseISO(user.created_at), 'MMMM yyyy')}</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

