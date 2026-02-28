import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
    LayoutDashboard,
    CalendarClock,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    Building2,
    BarChart3,
    ListVideo,
    Bell,
    User,
    ChevronDown,
    Search,
    Briefcase,
    Clock,
    ShieldOff,
    Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileModal from '../components/common/ProfileModal';
import GlobalSearch from '../components/admin/GlobalSearch';
import Logo from '../components/common/Logo';
import { formatDistanceToNow } from 'date-fns';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const notificationRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };

        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                setShowNotifications(false);
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscKey);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscKey);
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/admin/notifications');
            setNotifications(res.data);
            const unread = res.data.filter(n => !n.is_read).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.post('/admin/notifications/mark-read');
            setUnreadCount(0);
            // Refresh to show read status (optional, depends on UI)
            fetchNotifications();
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const menuItems = [
        { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
        { path: '/admin/services', icon: Briefcase, label: 'Service Management' },
        { path: '/admin/slots', icon: Clock, label: 'Manage Slots' },
        { path: '/admin/appointments', icon: Users, label: 'Appointments' },
        { path: '/admin/queue', icon: ListVideo, label: 'Live Queue' },
        { path: '/admin/reviews', icon: Star, label: 'Patient Reviews' },
        { path: '/admin/about', icon: Building2, label: 'About Organization' },
        { path: '/admin/settings', icon: Settings, label: 'Settings' },
    ];

    const getIndustryTerminology = (type) => {
        switch (type) {
            case 'Salon': return { action: 'Book Service', item: 'Service', dashboard: 'Salon Management' };
            case 'Bank': return { action: 'Reserve Slot', item: 'Meeting', dashboard: 'Branch Dashboard' };
            case 'Hospital':
            case 'Clinic': return { action: 'Book Appointment', item: 'Appointment', dashboard: 'Medical Dashboard' };
            case 'Government Office': return { action: 'Schedule Visit', item: 'Visit', dashboard: 'Office Control' };
            case 'Consultancy': return { action: 'Schedule Consultation', item: 'Consultation', dashboard: 'Client Portal' };
            case 'Coaching Institute': return { action: 'Join Class', item: 'Class', dashboard: 'Institute Panel' };
            default: return { action: 'Book Appointment', item: 'Appointment', dashboard: 'Admin Dashboard' };
        }
    };

    const getPageTitle = () => {
        const item = menuItems.find(i => i.path === location.pathname);
        if (location.pathname === '/admin/analytics') {
            return getIndustryTerminology(user?.org_type).dashboard;
        }
        return item ? item.label : 'Dashboard';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            {/* Sidebar */}
            <motion.aside
                initial={{ width: 260 }}
                animate={{ width: isSidebarOpen ? 260 : 80 }}
                className="bg-white border-r border-gray-200 fixed h-full z-30 hidden md:flex flex-col transition-all duration-300 shadow-sm"
            >
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <div className="flex items-center gap-3 text-indigo-600 font-bold text-xl overflow-hidden whitespace-nowrap">
                        <Logo iconSize="w-8 h-8" showText={false} />
                        {isSidebarOpen && (
                            <div className="flex flex-col">
                                <span className="transition-opacity duration-300 leading-none">Queuify</span>
                                {user?.org_type && <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">{user.org_type}</span>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 py-6 overflow-y-auto px-3">
                    <p className={`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3 ${!isSidebarOpen && 'text-center'}`}>
                        {isSidebarOpen ? 'Menu' : '...'}
                    </p>
                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    title={!isSidebarOpen ? item.label : ''}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${isActive
                                        ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <item.icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                    {isSidebarOpen && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-nowrap">{item.label}</motion.span>}
                                    {isSidebarOpen && isActive && (
                                        <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="flex items-center justify-center w-full py-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        {isSidebarOpen ? '« Collapse Sidebar' : '»'}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content Wrapper */}
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? 'md:ml-[260px]' : 'md:ml-[80px]'}`}>

                {/* Top Navbar */}
                <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-4 sticky top-0 z-20 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 text-gray-600">
                            <Menu className="h-6 w-6" />
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search Bar */}
                        <GlobalSearch />

                        {/* Notifications */}
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                                )}
                            </button>

                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 overflow-hidden z-50"
                                    >
                                        <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center">
                                            <h3 className="font-semibold text-gray-800">Notifications</h3>
                                            <button
                                                onClick={handleMarkAllRead}
                                                className="text-xs text-indigo-600 hover:text-indigo-800"
                                            >
                                                Mark all read
                                            </button>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="px-4 py-6 text-center text-gray-400 text-sm">
                                                    No new notifications
                                                </div>
                                            ) : (
                                                notifications.map((notif) => (
                                                    <div
                                                        key={notif.id}
                                                        onClick={() => {
                                                            if (notif.link) navigate(notif.link);
                                                            setShowNotifications(false);
                                                        }}
                                                        className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                                                    >
                                                        <div className="flex gap-3">
                                                            {!notif.is_read && <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>}
                                                            <div className={notif.is_read ? 'pl-5' : ''}>
                                                                <p className={`text-sm text-gray-800 ${!notif.is_read ? 'font-semibold' : 'font-medium'}`}>{notif.title}</p>
                                                                <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                                                                <p className="text-[10px] text-gray-400 mt-1">
                                                                    {formatDistanceToNow(new Date(notif.time), { addSuffix: true })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full hover:bg-gray-100 border border-gray-200 transition-all"
                            >
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                    {user?.name?.[0] || 'A'}
                                </div>
                                <span className="hidden md:block text-sm font-medium text-gray-700">{user?.name || 'Admin'}</span>
                                <ChevronDown className="h-3 w-3 text-gray-400" />
                            </button>

                            <AnimatePresence>
                                {showProfileMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden"
                                    >
                                        <div className="px-4 py-3 border-b border-gray-50">
                                            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIsProfileModalOpen(true);
                                                setShowProfileMenu(false);
                                            }}
                                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <User className="h-4 w-4" /> Profile
                                        </button>
                                        <Link
                                            to="/admin/settings"
                                            onClick={() => setShowProfileMenu(false)}
                                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <Settings className="h-4 w-4" /> Settings
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut className="h-4 w-4" /> Logout
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-6 md:p-8 w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Outlet context={{ openProfileModal: () => setIsProfileModalOpen(true) }} />
                    </motion.div>
                </main>
            </div>

            <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />

            {/* Impersonation Banner */}
            {localStorage.getItem('superadminToken') && (
                <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-sm font-semibold py-2 px-4 shadow-md z-50 flex justify-between items-center animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-2">
                        <ShieldOff className="h-4 w-4" />
                        <span>You are impersonating an Organization Admin.</span>
                    </div>
                    <button
                        onClick={() => {
                            // Restore Superadmin Session
                            localStorage.setItem('token', localStorage.getItem('superadminToken'));
                            localStorage.setItem('refreshToken', localStorage.getItem('superadminRefreshToken'));
                            localStorage.setItem('user', localStorage.getItem('superadminUser'));
                            localStorage.removeItem('superadminToken');
                            localStorage.removeItem('superadminRefreshToken');
                            localStorage.removeItem('superadminUser');

                            window.location.href = '/superadmin';
                        }}
                        className="bg-white text-amber-600 px-3 py-1 rounded-md text-xs font-bold hover:bg-gray-100 transition-colors uppercase tracking-wide"
                    >
                        Exit Impersonation
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminLayout;
