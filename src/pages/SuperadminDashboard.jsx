import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Settings, LogOut,
    CreditCard, Calendar, Activity, ShieldCheck, PieChart
} from 'lucide-react';
import Logo from '../components/common/Logo';
import OverviewPanel from '../components/superadmin/OverviewPanel';
import OrganizationManager from '../components/superadmin/OrganizationManager';
import AdminManager from '../components/superadmin/AdminManager';
import PlanManager from '../components/superadmin/PlanManager';
import GlobalAppointments from '../components/superadmin/GlobalAppointments';
import SystemHealth from '../components/superadmin/SystemHealth';
import GlobalMonitor from '../components/superadmin/GlobalMonitor';

const SuperadminDashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const navItems = [
        { id: '', label: 'Overview', icon: LayoutDashboard },
        { id: 'monitor', label: 'Live Monitor', icon: Activity },
        { id: 'organizations', label: 'Organizations', icon: Users },
        { id: 'plans', label: 'Plans & Billing', icon: CreditCard },
        { id: 'appointments', label: 'Global Bookings', icon: Calendar },
        { id: 'admins', label: 'System Admins', icon: ShieldCheck },
        { id: 'system', label: 'System Health', icon: PieChart },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full z-10 transition-all duration-300">
                <div className="p-6 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <Logo iconSize="w-8 h-8" showText={false} />
                        <span className="text-xl font-bold tracking-tight text-white">Control Center</span>
                    </div>
                    <p className="text-[10px] text-emerald-400 mt-2 uppercase font-black tracking-[0.2em]">Super Admin</p>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const isActive = location.pathname === `/superadmin/${item.id}` || (item.id === '' && location.pathname === '/superadmin');
                        return (
                            <Link
                                key={item.id}
                                to={`/superadmin/${item.id}`}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/20'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-emerald-400'}`} />
                                <span className={`font-bold text-sm ${isActive ? 'text-white' : 'text-gray-400'}`}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-500 hover:bg-red-950/30 hover:text-red-400 transition-all duration-300"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="font-bold text-sm">Logout</span>
                    </button>
                    <div className="mt-4 px-4 text-[10px] text-gray-600 font-bold uppercase tracking-widest italic opacity-50">
                        v2.5.0 SaaS Edition
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen bg-slate-50/50">
                <div className="max-w-7xl mx-auto">
                    <Routes>
                        <Route index element={<OverviewPanel />} />
                        <Route path="monitor" element={<GlobalMonitor />} />
                        <Route path="organizations" element={<OrganizationManager />} />
                        <Route path="plans" element={<PlanManager />} />
                        <Route path="appointments" element={<GlobalAppointments />} />
                        <Route path="admins" element={<AdminManager />} />
                        <Route path="system" element={<SystemHealth />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default SuperadminDashboard;
