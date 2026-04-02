import React, { useState, useEffect, useMemo, memo } from 'react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Calendar, CheckCircle, Clock, MapPin, ArrowRight, XCircle, Search, Activity, Users, Star,
    Building2, TrendingUp, Sparkles, Award, ChevronRight
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow, isValid, isToday, isTomorrow } from 'date-fns';
import { useQueueSocket } from '../../hooks/useQueueSocket';
import { useAuth } from '../../context/AuthContext';
import { formatWaitTime } from '../../utils/format';
import InfoTooltip from '../common/InfoTooltip';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import UserPayments from './UserPayments';
import NotifyMeTracker from './NotifyMeTracker';
import { LayoutDashboard, History, Bell } from 'lucide-react';

// ─── Memoized Sub-components ───
const Shimmer = memo(({ className }) => (
    <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
));
Shimmer.displayName = 'Shimmer';

const StatCard = memo(({ title, value, icon: Icon, color, bg, isLoading }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
    >
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                {isLoading ? (
                    <Shimmer className="h-8 w-16 mt-2" />
                ) : (
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
                )}
            </div>
            <div className={`p-3 rounded-xl ${bg}`}>
                <Icon className={`h-6 w-6 ${color}`} />
            </div>
        </div>
    </motion.div>
));
StatCard.displayName = 'StatCard';

const RecentAppointmentItem = memo(({ apt, idx, t, getStatusColor }) => (
    <motion.div
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
                <p className="font-medium text-gray-900 text-sm">{apt.service_name || t('appointment.title', 'Appointment')}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="h-3 w-3" /> {apt.org_name || t('appointment.organization', 'Organization')}
                    {(() => {
                        const d = apt.start_time ? parseISO(apt.start_time) : null;
                        if (d && isValid(d)) {
                            return (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                    {format(d, 'dd MMM yyyy, hh:mm a')}
                                </>
                            );
                        }
                        return null;
                    })()}
                </p>
            </div>
        </div>
        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize ${getStatusColor(apt.status)}`}>
            {t(`status.${apt.status}`, apt.status)}
        </span>
    </motion.div>
));
RecentAppointmentItem.displayName = 'RecentAppointmentItem';

export default function UserDashboard() {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recentAppointments, setRecentAppointments] = useState([]);
    const [allAppointments, setAllAppointments] = useState([]);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'payments'
    const { user } = useAuth();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, appointmentsRes] = await Promise.all([
                api.get('/user/stats'),
                api.get('/appointments/my')
            ]);
            setStats(statsRes.data);
            setAllAppointments(appointmentsRes.data);
            setRecentAppointments(appointmentsRes.data.slice(0, 5));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // WebSocket Integration for real-time updates on dashboard
    const orgId = stats?.nextAppointment?.org_id;
    const { queueData } = useQueueSocket(orgId);

    useEffect(() => {
        if (queueData) {
            // Re-fetch everything on socket update to keep dashboard fresh
            fetchData();
        }
    }, [queueData]);


    const nextApt = stats?.nextAppointment;
    const isServing = nextApt?.status === 'serving';

    const getStatusColor = useMemo(() => (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-100 text-emerald-700';
            case 'confirmed': return 'bg-blue-100 text-blue-700';
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            case 'serving': return 'bg-purple-100 text-purple-700';
            case 'no_show': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }, []);

    const totalAppointments = useMemo(() => stats?.total || 0, [stats]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4 text-left">
                    {user?.profile_picture_url ? (
                        <div className="relative group">
                             <img 
                                src={user.profile_picture_url} 
                                alt={user.name} 
                                className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-xl shadow-indigo-100/50 group-hover:scale-105 transition-transform duration-300" 
                            />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"></div>
                        </div>
                    ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl font-black border-4 border-white shadow-xl shadow-indigo-100/50">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                            {t('dashboard.welcome', 'Welcome back')}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
                        </h1>
                        <p className="text-gray-500 font-medium">{t('dashboard.subtitle', "Here's what's happening with your appointments.")}</p>
                    </div>
                </div>

                {isServing && activeTab === 'overview' && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full flex items-center gap-2 font-bold animate-pulse text-sm"
                    >
                        <Activity className="h-4 w-4" />
                        {t('dashboard.your_turn', 'Its your turn!')}
                    </motion.div>
                )}
            </div>

            {/* Tabbed Navigation - Dedicated Row for Visibility */}
            <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-2xl border border-gray-200 w-fit backdrop-blur-sm">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={clsx(
                        "flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] rounded-xl transition-all duration-300",
                        activeTab === 'overview' 
                            ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5" 
                            : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
                    )}
                >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>{t('dashboard.overview_tab', 'Overview')}</span>
                </button>
                <button
                    onClick={() => setActiveTab('payments')}
                    className={clsx(
                        "flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] rounded-xl transition-all duration-300",
                        activeTab === 'payments' 
                            ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5" 
                            : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
                    )}
                >
                    <History className="h-4 w-4" />
                    <span>{t('dashboard.payments_tab', 'Payment History')}</span>
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={clsx(
                        "flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] rounded-xl transition-all duration-300",
                        activeTab === 'notifications' 
                            ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5" 
                            : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
                    )}
                >
                    <Bell className="h-4 w-4" />
                    <span>{t('dashboard.notify_tab', 'Notify Me')}</span>
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            title={t('dashboard.upcoming', 'Upcoming')}
                            value={stats?.upcoming || 0}
                            icon={Calendar}
                            color="text-indigo-600"
                            bg="bg-indigo-50"
                            isLoading={loading}
                        />
                        <StatCard
                            title={t('dashboard.completed', 'Completed')}
                            value={stats?.completed || 0}
                            icon={CheckCircle}
                            color="text-emerald-600"
                            bg="bg-emerald-50"
                            isLoading={loading}
                        />
                        <StatCard
                            title={t('dashboard.cancelled', 'Cancelled')}
                            value={stats?.cancelled || 0}
                            icon={XCircle}
                            color="text-red-600"
                            bg="bg-red-50"
                            isLoading={loading}
                        />
                        <StatCard
                            title={t('dashboard.total_visits', 'Total Visits')}
                            value={totalAppointments}
                            icon={TrendingUp}
                            color="text-blue-600"
                            bg="bg-blue-50"
                            isLoading={loading}
                        />
                    </div>

                    {/* Next Appointment Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-8"
                    >
                        <div className="flex items-center justify-between mb-6 px-2">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-indigo-500" />
                                {t('dashboard.next_appointment', 'Next Appointment')}
                            </h2>
                            {nextApt && (
                                <Link to="/appointments" className="text-indigo-600 text-sm font-black hover:underline px-4 py-2 bg-indigo-50 rounded-xl transition-colors">
                                    {t('common.view_all', 'View All')}
                                </Link>
                            )}
                        </div>

                        {loading ? (
                            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex gap-6 items-center">
                                <Shimmer className="h-40 w-full" />
                            </div>
                        ) : nextApt ? (
                            <div className="group relative">
                                <div className={`absolute -inset-0.5 bg-gradient-to-r ${isServing ? 'from-emerald-500 to-teal-500' : 'from-indigo-600 to-purple-600'} rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-tilt`}></div>
                                <div className="relative bg-white rounded-[2rem] p-1 shadow-2xl shadow-indigo-100 overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-indigo-200/50">
                                    <div className="rounded-[1.75rem] p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-900 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl opacity-50" />
                                        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl opacity-30" />
                                        <div className="relative z-10 flex-1 w-full space-y-6">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest">{nextApt.service_name}</span>
                                                    {isServing && (
                                                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest animate-pulse">Currently Serving</span>
                                                    )}
                                                </div>
                                                <h3 className="text-xl md:text-2xl font-black tracking-tight leading-tight group-hover:text-indigo-300 transition-colors">{nextApt.org_name}</h3>
                                                <div className="flex flex-wrap items-center gap-4 text-slate-400 text-[13px] font-bold">
                                                    <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-indigo-400" /><span>{new Date(nextApt.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span></div>
                                                    <div className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-indigo-400" /><span>{new Date(nextApt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                                                    <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-indigo-400" /><span className="truncate max-w-[150px]">{nextApt.org_address}</span></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10"><Users className="h-3.5 w-3.5 text-slate-400" /><span className="text-[10px] font-black text-white">{nextApt.people_ahead || 0} Ahead</span></div>
                                                <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10"><Sparkles className="h-3.5 w-3.5 text-indigo-400" /><span className="text-[10px] font-black text-white">Serving #{nextApt.current_serving_number || 0}</span></div>
                                            </div>
                                        </div>
                                        <div className="relative z-10 flex flex-col bg-white rounded-3xl text-slate-900 shadow-2xl min-w-[180px] overflow-hidden border border-white">
                                            <div className="p-5 text-center space-y-4">
                                                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t('dashboard.your_token', 'Your Token')}</p><span className="text-4xl font-black tracking-tighter text-indigo-600 block">#{nextApt.queue_number || '1'}</span></div>
                                                <div className="py-3 px-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 group-hover:bg-indigo-50 transition-colors">
                                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Check-in OTP</p>
                                                    <p className="text-xl font-black text-indigo-600 tracking-[0.2em] font-mono">{nextApt.otp_code || '****'}</p>
                                                </div>
                                            </div>
                                            <Link to="/appointments" className="w-full py-4 bg-indigo-600 text-white flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all font-black text-[10px] uppercase tracking-widest group/btn">
                                                {t('common.manage_booking', 'Manage Booking')}<ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem] p-16 text-center group hover:border-indigo-100 transition-colors">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner group-hover:bg-indigo-50 transition-colors"><Calendar className="h-10 w-10 text-gray-200 group-hover:text-indigo-200 transition-colors" /></div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3">{t('appointment.no_upcoming', 'No upcoming appointments')}</h3>
                                <p className="text-gray-500 font-medium max-w-sm mx-auto mb-10">{t('appointment.clear_schedule', 'Your schedule is currently clear. Explore professional services near you.')}</p>
                                <Link to="/organizations" className="inline-flex items-center gap-3 bg-indigo-600 text-white px-10 py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 font-black text-sm uppercase tracking-widest active:scale-95"><Search className="h-5 w-5" />{t('user.dashboard.find_and_book', 'Find & Book Appointment')}</Link>
                            </div>
                        )}
                    </motion.div>

                    {/* Bottom Grid: Recent Appointments + Quick Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="font-bold text-gray-900 flex items-center gap-2"><Clock className="h-5 w-5 text-indigo-500" />{t('user.dashboard.recent_appointments', 'Recent Appointments')}</h2>
                                <Link to="/appointments" className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1">{t('common.view_all', 'View All')} <ChevronRight className="h-4 w-4" /></Link>
                            </div>
                            {loading ? (
                                <div className="divide-y divide-gray-50">{[1, 2, 3].map(i => (<div key={i} className="px-5 py-4 flex items-center justify-between"><div className="flex items-center gap-4"><Shimmer className="w-10 h-10" /><div><Shimmer className="h-4 w-32" /><Shimmer className="h-3 w-48 mt-2" /></div></div><Shimmer className="w-16 h-6" /></div>))}</div>
                            ) : recentAppointments.length > 0 ? (
                                <div className="divide-y divide-gray-50">{recentAppointments.map((apt, idx) => (<RecentAppointmentItem key={apt.id} apt={apt} idx={idx} t={t} getStatusColor={getStatusColor} />))}</div>
                            ) : (
                                <div className="p-8 text-center"><Calendar className="h-10 w-10 text-gray-200 mx-auto mb-2" /><p className="text-gray-500 text-sm font-medium">{t('user.dashboard.no_history', 'No appointment history yet')}</p><p className="text-gray-400 text-xs mt-1">{t('user.dashboard.book_first', 'Book your first appointment to see it here!')}</p></div>
                            )}
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-6">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-500" />{t('user.dashboard.quick_actions', 'Quick Actions')}</h2>
                                <div className="space-y-2">
                                    <Link to="/organizations" className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-colors group">
                                        <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-200 transition-colors"><Search className="h-4 w-4" /></div>
                                        <div className="flex-1"><p className="text-sm font-medium text-gray-800">{t('navigation.find_organizations', 'Find Organizations')}</p><p className="text-[11px] text-gray-400">{t('user.dashboard.browse_book', 'Browse & book appointments')}</p></div>
                                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                                    </Link>
                                    <Link to="/appointments" className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-colors group">
                                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-200 transition-colors"><Calendar className="h-4 w-4" /></div>
                                        <div className="flex-1"><p className="text-sm font-medium text-gray-800">{t('navigation.my_appointments', 'My Appointments')}</p><p className="text-[11px] text-gray-400">{t('user.dashboard.view_all_bookings', 'View all your bookings')}</p></div>
                                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                                    </Link>
                                    <Link to="/profile" className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition-colors group">
                                        <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-200 transition-colors"><Users className="h-4 w-4" /></div>
                                        <div className="flex-1"><p className="text-sm font-medium text-gray-800">{t('navigation.profile', 'My Profile')}</p><p className="text-[11px] text-gray-400">{t('user.dashboard.update_info', 'Update your personal info')}</p></div>
                                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-purple-500 transition-colors" />
                                    </Link>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white">
                                <h2 className="font-bold flex items-center gap-2 mb-4"><Award className="h-5 w-5 text-amber-300" />{t('user.dashboard.your_activity', 'Your Activity')}</h2>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between"><span className="text-white/70 text-sm">{t('dashboard.total_visits', 'Total Visits')}</span><span className="font-bold">{totalAppointments}</span></div>
                                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: `${Math.min((stats?.completed || 0) / Math.max(totalAppointments, 1) * 100, 100)}%` }}></div></div>
                                    <div className="flex items-center justify-between text-xs text-white/50"><span>{t('user.dashboard.completed_count', '{{count}} completed', { count: stats?.completed || 0 })}</span><span>{t('user.dashboard.success_rate', '{{rate}}% success rate', { rate: Math.round((stats?.completed || 0) / Math.max(totalAppointments, 1) * 100) })}</span></div>
                                </div>
                                {user?.created_at && (<div className="mt-4 pt-4 border-t border-white/10 text-xs text-white/50"><span>{t('user.dashboard.member_since', 'Member since')} {isValid(parseISO(user.created_at)) ? format(parseISO(user.created_at), 'MMMM yyyy') : 'N/A'}</span></div>)}
                            </div>
                        </motion.div>
                    </div>
                </div>
            ) : activeTab === 'payments' ? (
                <div className="animate-in fade-in duration-500">
                    <UserPayments bookings={allAppointments} />
                </div>
            ) : (
                <div className="animate-in fade-in duration-500">
                    <NotifyMeTracker />
                </div>
            )}
        </div>
    );
}
