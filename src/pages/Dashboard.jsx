import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { LayoutDashboard, Calendar, Clock, List, Settings, LogOut, ChevronRight, User } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

// Sub-pages
import MyAppointments from './dashboard/MyAppointments';
import SlotView from './dashboard/SlotView';
// import QueueStatus from './dashboard/QueueStatus';
import ManageSlots from './dashboard/ManageSlots';
import AdminAppointments from './dashboard/AdminAppointments';

const SidebarLink = ({ to, icon: Icon, children }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
        >
            <div className={clsx(
                "p-2 rounded-lg transition-colors",
                isActive ? "bg-white text-indigo-600 shadow-sm" : "bg-gray-50 text-gray-400 group-hover:text-gray-600 group-hover:bg-white"
            )}>
                <Icon className="h-5 w-5" />
            </div>
            <span className="font-medium">{children}</span>
            {isActive && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />}
        </Link>
    );
};

const StatCard = ({ title, value, icon: Icon, color }) => (
    <motion.div
        whileHover={{ y: -4 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
    >
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
                <Icon className="h-6 w-6" />
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-${color}-50 text-${color}-600`}>
                +2.5%
            </span>
        </div>
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </motion.div>
);

const DashboardHome = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Welcome back, {user?.name}</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/organizations" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20">
                        Book Appointment
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Bookings" value="12" icon={Calendar} color="indigo" />
                <StatCard title="Upcoming" value="3" icon={Clock} color="blue" />
                <StatCard title="Organizations" value="4" icon={List} color="purple" />
            </div>

            {/* Quick Actions / Recent Activity Placeholder */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <Link to="/organizations" className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <span className="font-medium text-gray-900">Book New Slot</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
                        </Link>
                        <Link to="/dashboard/appointments" className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                                    <List className="h-5 w-5" />
                                </div>
                                <span className="font-medium text-gray-900">Manage Bookings</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
                        </Link>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-lg text-white p-6 relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-2">Upgrade to Pro</h3>
                        <p className="text-indigo-100 mb-6 max-w-sm">Get priority support, advanced analytics, and unlimited bookings.</p>
                        <button className="px-5 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                            View Plans
                        </button>
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -m-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />

            <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="w-full lg:w-72 flex-shrink-0">
                        <div className="sticky top-24 space-y-8">
                            {/* User Profile Card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 text-2xl font-bold">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">{user?.name}</h3>
                                <p className="text-sm text-gray-500 mb-6 capitalize">{user?.role}</p>
                                <button className="w-full py-2 px-4 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                                    Edit Profile
                                </button>
                            </div>

                            {/* Navigation */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                                <h4 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Menu</h4>
                                <nav className="space-y-1">
                                    <SidebarLink to="/dashboard" icon={LayoutDashboard}>Overview</SidebarLink>
                                    <SidebarLink to="/dashboard/appointments" icon={Calendar}>My Appointments</SidebarLink>
                                    {/* <SidebarLink to="/dashboard/queue" icon={Clock}>Queue Status</SidebarLink> */}

                                    {user?.role === 'admin' && (
                                        <>
                                            <div className="my-4 border-t border-gray-100" />
                                            <h4 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Admin</h4>
                                            <SidebarLink to="/dashboard/slots" icon={List}>Manage Slots</SidebarLink>
                                            <SidebarLink to="/dashboard/appointments-admin" icon={Calendar}>Manage Bookings</SidebarLink>
                                            <SidebarLink to="/organizations" icon={Settings}>Organization Settings</SidebarLink>
                                        </>
                                    )}
                                </nav>

                                <div className="my-4 border-t border-gray-100" />
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                                >
                                    <div className="p-2 rounded-lg bg-red-50 text-red-600 group-hover:bg-white">
                                        <LogOut className="h-5 w-5" />
                                    </div>
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        <Routes>
                            <Route path="/" element={<DashboardHome />} />
                            <Route path="/book" element={<SlotView />} />
                            <Route path="/slots" element={<ManageSlots />} />
                            <Route path="/appointments" element={<MyAppointments />} />
                            <Route path="/appointments-admin" element={<AdminAppointments />} />
                        </Routes>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
