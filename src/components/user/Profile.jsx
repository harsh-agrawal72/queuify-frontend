import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { User, Lock, Mail, Save, Shield, Bell, Calendar, CheckCircle, Award, Clock, Sparkles, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

export default function Profile() {
    const { user, updateUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [emailNotifications, setEmailNotifications] = useState(user?.email_notification_enabled ?? true);
    const [notificationAlerts, setNotificationAlerts] = useState(user?.notification_enabled ?? true);
    const [loading, setLoading] = useState(false);

    // Password change states
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/user/stats');
                setStats(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.patch('/user/profile', {
                name,
                email_notification_enabled: emailNotifications,
                notification_enabled: notificationAlerts
            });
            // Update user in AuthContext + localStorage so toggles persist
            updateUser({
                name,
                email_notification_enabled: emailNotifications,
                notification_enabled: notificationAlerts
            });
            toast.success('Profile updated successfully');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (!newPassword) {
            toast.error('Please enter a new password');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setPasswordLoading(true);
        try {
            await api.patch('/user/profile', { password: newPassword });
            toast.success('Password updated successfully');
            setNewPassword('');
            setConfirmPassword('');
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to update password');
        } finally {
            setPasswordLoading(false);
        }
    };

    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
    const totalAppointments = stats?.total || 0;
    const completedAppointments = stats?.completed || 0;
    const memberSince = user?.created_at ? format(parseISO(user.created_at), 'MMMM yyyy') : 'N/A';

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Profile Hero Card */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-3xl overflow-hidden"
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full -ml-12 -mb-12 blur-2xl" />

                <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center gap-6">
                    {/* Avatar */}
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center text-white font-black text-3xl border-2 border-white/20 shadow-2xl">
                        {initials}
                    </div>

                    {/* Info */}
                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-2xl md:text-3xl font-black text-white">{user?.name}</h1>
                        <p className="text-indigo-200 mt-1">{user?.email}</p>
                        <div className="flex items-center gap-4 mt-3 justify-center md:justify-start">
                            <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-semibold border border-white/10">
                                <Shield className="h-3.5 w-3.5 text-emerald-300" />
                                {user?.role === 'user' ? 'Verified Member' : user?.role}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-indigo-200 text-xs font-medium">
                                <Clock className="h-3.5 w-3.5" />
                                Member since {memberSince}
                            </span>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10 min-w-[80px]">
                            <p className="text-2xl font-black text-white">{totalAppointments}</p>
                            <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider mt-1">Visits</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10 min-w-[80px]">
                            <p className="text-2xl font-black text-emerald-300">{completedAppointments}</p>
                            <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider mt-1">Done</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Edit Form */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2"
                >
                    <form onSubmit={handleUpdate} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <User className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900">Personal Information</h2>
                                <p className="text-xs text-gray-400">Update your account details below</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Name Field */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Display Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-sm transition-all bg-gray-50 focus:bg-white"
                                        placeholder="Your full name"
                                    />
                                </div>
                            </div>

                            {/* Email Field */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        disabled
                                        className="w-full pl-11 pr-4 py-3 border border-gray-100 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed text-sm"
                                    />
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                                    <Lock className="h-3 w-3" /> Email address cannot be changed for security reasons
                                </p>
                            </div>

                        </div>

                        {/* Save Button */}
                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 active:scale-[0.98]"
                            >
                                <Save className="h-4 w-4" />
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>

                    {/* Separate Change Password Card */}
                    <form onSubmit={handlePasswordChange} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                                <Lock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900">Change Password</h2>
                                <p className="text-xs text-gray-400">Ensure your account stays secure</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* New Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-sm transition-all bg-gray-50 focus:bg-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {/* Password Strength Indicator */}
                                {newPassword && (
                                    <div className="mt-2">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`h-1 flex-1 rounded-full transition-colors ${newPassword.length >= level * 3
                                                        ? newPassword.length >= 12 ? 'bg-emerald-500'
                                                            : newPassword.length >= 8 ? 'bg-amber-500'
                                                                : 'bg-red-400'
                                                        : 'bg-gray-100'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className={`text-[11px] mt-1 font-medium ${newPassword.length >= 12 ? 'text-emerald-600'
                                            : newPassword.length >= 8 ? 'text-amber-600'
                                                : newPassword.length >= 6 ? 'text-red-500'
                                                    : 'text-red-400'
                                            }`}>
                                            {newPassword.length >= 12 ? 'Strong password ✓'
                                                : newPassword.length >= 8 ? 'Good password'
                                                    : newPassword.length >= 6 ? 'Weak — add more characters'
                                                        : 'Too short — minimum 6 characters'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Re-enter new password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className={`w-full pl-11 pr-12 py-3 border rounded-xl focus:ring-2 outline-none text-sm transition-all bg-gray-50 focus:bg-white ${confirmPassword && confirmPassword !== newPassword
                                            ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
                                            : confirmPassword && confirmPassword === newPassword
                                                ? 'border-emerald-300 focus:ring-emerald-100 focus:border-emerald-400'
                                                : 'border-gray-200 focus:ring-indigo-100 focus:border-indigo-400'
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {confirmPassword && confirmPassword !== newPassword && (
                                    <p className="text-[11px] text-red-500 mt-1.5 font-medium">Passwords do not match</p>
                                )}
                                {confirmPassword && confirmPassword === newPassword && newPassword.length >= 6 && (
                                    <p className="text-[11px] text-emerald-600 mt-1.5 font-medium flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" /> Passwords match
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Update Password Button */}
                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={passwordLoading || !newPassword || newPassword !== confirmPassword}
                                className="flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                            >
                                <Lock className="h-4 w-4" />
                                {passwordLoading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </motion.div>

                {/* Right Column: Preferences + Account Info */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    {/* Notification Preferences */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <Bell className="h-5 w-5 text-amber-500" />
                            Notifications
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">Email Alerts</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Booking confirmations & reminders via email</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEmailNotifications(!emailNotifications)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${emailNotifications ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">Push Notifications</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">In-app alerts for queue & status updates</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setNotificationAlerts(!notificationAlerts)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notificationAlerts ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${notificationAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Account Summary */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            Account Summary
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                                <Calendar className="h-4 w-4 text-indigo-500" />
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500">Total Appointments</p>
                                    <p className="text-sm font-bold text-gray-900">{totalAppointments}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500">Completed</p>
                                    <p className="text-sm font-bold text-gray-900">{completedAppointments}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100/50">
                                <Award className="h-4 w-4 text-purple-500" />
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500">Success Rate</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {totalAppointments > 0
                                            ? `${Math.round((completedAppointments / totalAppointments) * 100)}%`
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Info */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
                        <h3 className="font-bold flex items-center gap-2 mb-3">
                            <Shield className="h-5 w-5 text-emerald-400" />
                            Security
                        </h3>
                        <div className="space-y-2 text-sm text-slate-300">
                            <div className="flex items-center justify-between">
                                <span>Account Status</span>
                                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                                    Active
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Role</span>
                                <span className="font-semibold text-white capitalize">{user?.role}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Member Since</span>
                                <span className="font-semibold text-white">{memberSince}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
